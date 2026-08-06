// assist-resumo-ia — Gera, para um chamado de garantia, um RESUMO estruturado
// da reclamação (a partir das mensagens da Umbler: texto + imagem) e uma lista
// de SOLUÇÕES sugeridas casadas com o conhecimento do Notion (assist_kb_produto),
// incluindo qual vídeo do YouTube mandar ao cliente.
//
// Multimodal: texto + imagem (Claude lê imagem nativo) + ÁUDIO transcrito via
// Whisper (OpenAI) — o Claude não ingere áudio direto. A transcrição fica em
// cache em umbler_mensagens.arquivo.Transcription (não re-transcreve). As URLs
// de mídia vêm do S3 público da Umbler (umbler_mensagens.arquivo->>'Url').
//
// Entrada:  POST { chamado_id }  ou  { id_conversa }
// Saída:    { ok, resumo, solucoes } e grava em assist_chamados.resumo_ia*
//
// Segredos (Supabase → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY (obrigatório) — resumo/soluções.
//   OPENAI_API_KEY    (opcional)    — transcrição de áudio (Whisper); sem ele,
//                                     áudio entra como "[não transcrito]".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const MODELO = "claude-haiku-4-5-20251001"; // barato e com visão; suficiente p/ o resumo
const MAX_IMAGENS = 6;                       // teto de imagens por chamado (custo)
const MAX_AUDIOS = 15;                       // teto de áudios transcritos por chamado (custo)

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Transcreve mídia (áudio OU vídeo) via Whisper — o Whisper extrai o áudio do
// mp4 sozinho, sem ffmpeg. Limite prático da API: 25MB. Retorna texto ou null.
async function transcreverMidia(
  url: string, openaiKey: string, filename: string, mime: string,
): Promise<string | null> {
  try {
    const a = await fetch(url);
    if (!a.ok) return null;
    const buf = await a.arrayBuffer();
    if (buf.byteLength > 25 * 1024 * 1024) return null; // acima do limite do Whisper
    const fd = new FormData();
    fd.append("file", new File([buf], filename, { type: mime }));
    fd.append("model", "whisper-1");
    fd.append("language", "pt");
    fd.append("response_format", "text");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + openaiKey },
      body: fd,
    });
    if (!r.ok) return null;
    return (await r.text()).trim() || null;
  } catch (_e) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "falta o segredo ANTHROPIC_API_KEY" }, 500);
    const openaiKey = Deno.env.get("OPENAI_API_KEY"); // opcional — habilita transcrição de áudio

    const { chamado_id, id_conversa } = await req.json().catch(() => ({}));
    if (!chamado_id && !id_conversa) {
      return json({ error: "informe chamado_id ou id_conversa" }, 400);
    }

    // 1) Chamado
    let q = supabase
      .from("assist_chamados")
      .select("id, umbler_conversa_id, produto_nome, produto_codigo, descricao_inicial, nome_contato, status_id, setor_responsavel_id")
      .limit(1);
    q = chamado_id ? q.eq("id", chamado_id) : q.eq("umbler_conversa_id", id_conversa);
    const { data: chamado, error: eCh } = await q.maybeSingle();
    if (eCh) return json({ error: `erro ao ler chamado: ${eCh.message}` }, 500);
    if (!chamado) return json({ error: "chamado não encontrado" }, 404);

    const conversaId = chamado.umbler_conversa_id || id_conversa;
    if (!conversaId) return json({ error: "chamado sem umbler_conversa_id" }, 400);

    // 2) Mensagens da conversa (ordem cronológica)
    const { data: msgs, error: eMsg } = await supabase
      .from("umbler_mensagens")
      .select("event_id, id_mensagem, enviado_em, direcao, tipo_mensagem, conteudo, arquivo")
      .eq("id_conversa", conversaId)
      .order("enviado_em", { ascending: true });
    if (eMsg) return json({ error: `erro ao ler mensagens: ${eMsg.message}` }, 500);
    if (!msgs || msgs.length === 0) return json({ error: "conversa sem mensagens" }, 404);

    // Dedup por id_mensagem: a URL da mídia costuma chegar num evento POSTERIOR
    // (outra linha do mesmo id_mensagem). Consolida preferindo a linha que já
    // tem Url/Transcription, sem perder as mensagens sem id.
    const scoreRow = (x: any) =>
      ((x?.arquivo?.Url) ? 2 : 0) + ((x?.arquivo?.Transcription) ? 1 : 0);
    const byId = new Map<string, any>();
    const soltas: any[] = [];
    for (const m of msgs) {
      if (!m.id_mensagem) { soltas.push(m); continue; }
      const prev = byId.get(m.id_mensagem);
      if (!prev || scoreRow(m) > scoreRow(prev)) byId.set(m.id_mensagem, m);
    }
    const msgsDedup = [...byId.values(), ...soltas]
      .sort((a, b) => String(a.enviado_em).localeCompare(String(b.enviado_em)));

    // Monta o histórico. Áudio/Vídeo: usa cache (arquivo.Transcription) ou
    // transcreve via Whisper se OPENAI_API_KEY existir; imagem: URL p/ a visão.
    const linhas: string[] = [];
    const imagens: string[] = [];
    let audiosTranscritos = 0;
    let midiaSemUrl = 0;   // áudio/vídeo sem URL de mídia (evento da Umbler não capturado)
    let midiaFalha = 0;    // tinha URL mas falhou (download/API/limite 25MB)
    let midiaSemChave = 0; // sem OPENAI_API_KEY configurada

    for (const m of msgsDedup) {
      const quem = m.direcao === "empresa" ? "EMPRESA" : "CLIENTE";
      const tipo = m.tipo_mensagem;
      const arq = (m.arquivo as Record<string, any> | null) || null;
      const url = arq?.["Url"] as string | undefined;

      if (tipo === "Text" && m.conteudo) {
        linhas.push(`${quem}: ${m.conteudo}`);
      } else if (tipo === "Image") {
        if (url && imagens.length < MAX_IMAGENS) imagens.push(url);
        linhas.push(`${quem}: [imagem${url ? "" : " (sem url)"}]`);
      } else if (tipo === "Audio" || tipo === "Video") {
        const label = tipo === "Video" ? "vídeo" : "áudio";
        const cache = (arq?.["Transcription"] as string | null) || null;
        if (cache) {
          audiosTranscritos++;
          linhas.push(`${quem} (${label}): ${cache}`);
        } else if (!url) {
          // A URL da mídia chega num evento posterior da Umbler; se não veio, não há o que transcrever.
          midiaSemUrl++;
          linhas.push(`${quem}: [${label} — mídia indisponível (sem URL salva)]`);
        } else if (!openaiKey) {
          midiaSemChave++;
          linhas.push(`${quem}: [${label} — não transcrito (falta OPENAI_API_KEY)]`);
        } else if (audiosTranscritos < MAX_AUDIOS) {
          const fn = tipo === "Video" ? "media.mp4" : "audio.mp3";
          const mime = (arq?.["ContentType"] as string) || (tipo === "Video" ? "video/mp4" : "audio/mpeg");
          const tx = await transcreverMidia(url, openaiKey, fn, mime);
          if (tx) {
            audiosTranscritos++;
            linhas.push(`${quem} (${label}): ${tx}`);
            try {
              await supabase.from("umbler_mensagens")
                .update({ arquivo: { ...(arq || {}), Transcription: tx } })
                .eq("event_id", m.event_id); // cache best-effort
            } catch (_e) { /* ignora falha de cache */ }
          } else {
            midiaFalha++;
            linhas.push(`${quem}: [${label} — falha na transcrição (download/API ou > 25MB)]`);
          }
        } else {
          midiaFalha++;
          linhas.push(`${quem}: [${label} — não transcrito (limite de ${MAX_AUDIOS} por chamado)]`);
        }
      } else if (m.conteudo) {
        linhas.push(`${quem}: [${tipo}] ${m.conteudo}`);
      } else {
        linhas.push(`${quem}: [${tipo}]`);
      }
    }

    // 3) Conhecimento do Notion (base pequena → manda tudo; modelo escolhe o produto)
    const { data: kb } = await supabase
      .from("assist_kb_produto")
      .select("produto, conteudo_md");
    const baseConhecimento = (kb || [])
      .map((k) => `### PRODUTO: ${k.produto}\n${k.conteudo_md}`)
      .join("\n\n---\n\n") || "(base de conhecimento vazia)";

    // Materiais técnicos & vídeos (prt_materiais) — mesma base, leitura ao vivo.
    // Vídeos com o link pronto pra mandar ao cliente; PDFs/manuais de apoio.
    const { data: materiais } = await supabase
      .from("prt_materiais")
      .select("titulo, descricao, tipo, url, linha_produto, modelo, resumo_tecnico")
      .eq("ativo", true);
    const listaMateriais = (materiais || [])
      .filter((m) => m.url)
      .map((m) => {
        const cab = `- [${m.linha_produto || "?"}${m.modelo ? " / " + m.modelo : ""}] ${m.titulo} (${m.tipo}): ${m.url}${m.descricao ? " — " + m.descricao : ""}`;
        return m.resumo_tecnico ? `${cab}\n  RESUMO DO DOCUMENTO: ${m.resumo_tecnico}` : cab;
      })
      .join("\n") || "(sem materiais)";

    // 3b) Regras/instruções da equipe (editáveis em assist_ia_regras) — como a
    // equipe vai "otimizando" as respostas ao longo do tempo.
    const { data: regras } = await supabase
      .from("assist_ia_regras")
      .select("instrucoes, dicas")
      .eq("id", 1)
      .maybeSingle();
    const instrucoesEquipe = (regras?.instrucoes || "").trim();
    const dicasEquipe = (regras?.dicas || "").trim();

    // 4) Prompt
    const sistema =
      "Você é um analista técnico de assistência/garantia do Grupo Bononi (produtos Stonni). " +
      "Leia a conversa de WhatsApp entre CLIENTE e EMPRESA (e as imagens anexas) e produza: " +
      "(1) um RESUMO estruturado da reclamação e (2) as SOLUÇÕES mais prováveis, casando com a " +
      "BASE DE CONHECIMENTO fornecida. Use SOMENTE soluções coerentes com a base; se sugerir vídeo, " +
      "use apenas links presentes na BASE DE CONHECIMENTO ou na lista de MATERIAIS TÉCNICOS & VÍDEOS. Responda SOMENTE com JSON válido, " +
      "sem texto fora do JSON, no formato: " +
      '{"resumo":{"produto":"","categoria":"","setor":"","reclamacao":"","defeito_percebido":"","ja_tentado":"","urgencia":"","falta_info":""},' +
      '"solucoes":[{"solucao":"","video_url":null,"confianca":"alta|media|baixa"}]}. ' +
      'O campo "categoria" DEVE ser exatamente um destes valores (classifique pela linha do produto reclamado): ' +
      '"Ar Condicionado", "Geladeira", "Gerador" ou "Outros". Use "Outros" quando não for nenhuma das três linhas ou quando não der para saber. ' +
      'O campo "setor" DEVE ser exatamente "Garantia" ou "Operacoes". REGRA: o padrão é "Garantia". ' +
      'Use "Operacoes" SOMENTE quando a demanda PRINCIPAL for exclusivamente administrativa/logística, SEM nenhum defeito técnico a resolver: ' +
      'emissão de nota fiscal (NF), devolução de mercadoria, troca/reenvio/entrega de produto já acordada, faturamento ou cobrança. ' +
      'Se houver QUALQUER defeito, mau funcionamento, reclamação técnica ou pedido de conserto/garantia — mesmo que NF, reembolso ou logística ' +
      'também sejam citados — o setor é "Garantia". Dúvidas de USO, MANUTENÇÃO ou COMO-FAZER (ex.: como limpar/higienizar, troca de filtro, como instalar/usar) ' +
      'SEM defeito e SEM pedido administrativo também são "Garantia" (atendimento técnico), NÃO "Operacoes". Se a conversa não tiver informação suficiente para ' +
      'decidir (ex.: áudios/vídeos não transcritos, sem texto útil), use "Garantia". ' +
      "Escreva em português do Brasil, objetivo. Ranqueie as soluções da mais provável para a menos provável." +
      (instrucoesEquipe ? `\n\nREGRAS DA EQUIPE (têm prioridade; editadas em assist_ia_regras):\n${instrucoesEquipe}` : "") +
      (dicasEquipe ? `\n\nDICAS DA EQUIPE (conhecimento de solução em texto livre; use quando fizer sentido, sem contrariar a base do produto):\n${dicasEquipe}` : "");

    const contexto =
      `DADOS DO CHAMADO:\n- Produto (ERP): ${chamado.produto_nome || chamado.produto_codigo || "não informado"}\n` +
      `- Descrição inicial: ${chamado.descricao_inicial || "—"}\n` +
      `- Áudios/vídeos transcritos: ${audiosTranscritos}; não transcritos: ${midiaSemUrl + midiaFalha + midiaSemChave}\n\n` +
      `CONVERSA:\n${linhas.join("\n")}\n\n` +
      `BASE DE CONHECIMENTO (Notion):\n${baseConhecimento}\n\n` +
      `MATERIAIS TÉCNICOS & VÍDEOS DISPONÍVEIS (indique o link ao cliente quando ajudar):\n${listaMateriais}`;

    const content: unknown[] = [{ type: "text", text: contexto }];
    for (const u of imagens) {
      content.push({ type: "image", source: { type: "url", url: u } });
    }

    // 5) Claude — até 2 tentativas (o Haiku às vezes devolve texto fora do JSON).
    let parsed: { resumo?: unknown; solucoes?: unknown } | null = null;
    let ultimoBruto = "";
    for (let tentativa = 1; tentativa <= 2 && !parsed; tentativa++) {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODELO,
          max_tokens: 1200,
          system: sistema,
          messages: [{ role: "user", content }],
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        return json({ error: `Anthropic ${resp.status}: ${t}` }, 502);
      }
      const data = await resp.json();
      const texto = (data?.content?.[0]?.text || "").trim();
      ultimoBruto = texto;
      try {
        const jstart = texto.indexOf("{");
        const jend = texto.lastIndexOf("}");
        parsed = JSON.parse(texto.slice(jstart, jend + 1));
      } catch (_e) { parsed = null; }
    }
    if (!parsed) {
      // Falhou nas 2 tentativas: carimba resumo_ia_em (sem resumo) para o cron
      // NÃO re-tentar em loop; só volta a tentar quando houver mensagem nova.
      // O botão manual continua funcionando (passa chamado_id direto).
      await supabase.from("assist_chamados")
        .update({ resumo_ia_em: new Date().toISOString(), resumo_ia_modelo: MODELO })
        .eq("id", chamado.id);
      return json({ error: "resposta do modelo não veio em JSON", bruto: ultimoBruto }, 502);
    }

    // Anexa o status de transcrição das mídias ao resumo (o drawer mostra o aviso).
    const midiaNaoTranscrita = midiaSemUrl + midiaFalha + midiaSemChave;
    if (parsed.resumo && typeof parsed.resumo === "object") {
      (parsed.resumo as any).midias = {
        transcritas: audiosTranscritos,
        sem_url: midiaSemUrl,
        falha: midiaFalha,
        sem_chave: midiaSemChave,
        nao_transcritas: midiaNaoTranscrita,
      };
    }

    // 6) Grava o resumo
    const setorIA = String((parsed.resumo as any)?.setor || "");
    const { error: eUp } = await supabase
      .from("assist_chamados")
      .update({
        resumo_ia: parsed.resumo ?? null,
        resumo_ia_solucoes: parsed.solucoes ?? null,
        resumo_ia_em: new Date().toISOString(),
        resumo_ia_modelo: MODELO,
      })
      .eq("id", chamado.id);
    if (eUp) return json({ error: `erro ao gravar resumo: ${eUp.message}` }, 500);

    // 7) Precedência de setor (MANUAL > ETIQUETA "Operação" > IA) — fonte única no banco.
    // A função respeita override manual e etiqueta consumida; a IA só roteia no "Novo".
    try {
      await supabase.rpc("assist_resolver_setor", { p_chamado_id: chamado.id, p_ia_setor: setorIA });
    } catch (_e) { /* não bloqueia o resumo se a resolução de setor falhar */ }

    return json({
      ok: true,
      chamado_id: chamado.id,
      setor_ia: (parsed.resumo as any)?.setor ?? null,
      imagens_lidas: imagens.length,
      midias_transcritas: audiosTranscritos,
      midias_sem_transcricao: midiaNaoTranscrita,
      midias_sem_url: midiaSemUrl,
      midias_falha: midiaFalha,
      midias_sem_chave: midiaSemChave,
      resumo: parsed.resumo,
      solucoes: parsed.solucoes,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
