// assist-resumo-ia — Gera, para um chamado de garantia, um RESUMO estruturado
// da reclamação (a partir das mensagens da Umbler: texto + imagem) e uma lista
// de SOLUÇÕES sugeridas casadas com o conhecimento do Notion (assist_kb_produto),
// incluindo qual vídeo do YouTube mandar ao cliente.
//
// v1: texto + imagem (o Claude lê imagem nativo). Áudio NÃO é transcrito aqui
// (o Claude não ingere áudio) — fica como fast-follow via Whisper. As URLs de
// imagem vêm do S3 público da Umbler (umbler_mensagens.arquivo->>'Url').
//
// Entrada:  POST { chamado_id }  ou  { id_conversa }
// Saída:    { ok, resumo, solucoes } e grava em assist_chamados.resumo_ia*
//
// Segredo necessário (Supabase → Edge Functions → Secrets): ANTHROPIC_API_KEY.

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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "falta o segredo ANTHROPIC_API_KEY" }, 500);

    const { chamado_id, id_conversa } = await req.json().catch(() => ({}));
    if (!chamado_id && !id_conversa) {
      return json({ error: "informe chamado_id ou id_conversa" }, 400);
    }

    // 1) Chamado
    let q = supabase
      .from("assist_chamados")
      .select("id, umbler_conversa_id, produto_nome, produto_codigo, descricao_inicial, nome_contato")
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
      .select("enviado_em, direcao, tipo_mensagem, conteudo, arquivo")
      .eq("id_conversa", conversaId)
      .order("enviado_em", { ascending: true });
    if (eMsg) return json({ error: `erro ao ler mensagens: ${eMsg.message}` }, 500);
    if (!msgs || msgs.length === 0) return json({ error: "conversa sem mensagens" }, 404);

    // Transcreve a conversa em texto e coleta URLs de imagem válidas.
    const linhas: string[] = [];
    const imagens: string[] = [];
    let audios = 0;
    for (const m of msgs) {
      const quem = m.direcao === "empresa" ? "EMPRESA" : "CLIENTE";
      const tipo = m.tipo_mensagem;
      const url = (m.arquivo as Record<string, unknown> | null)?.["Url"] as string | undefined;
      if (tipo === "Text" && m.conteudo) {
        linhas.push(`${quem}: ${m.conteudo}`);
      } else if (tipo === "Image") {
        if (url && imagens.length < MAX_IMAGENS) imagens.push(url);
        linhas.push(`${quem}: [imagem${url ? "" : " (sem url)"}]`);
      } else if (tipo === "Audio") {
        audios++;
        linhas.push(`${quem}: [áudio — não transcrito nesta versão]`);
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

    // 4) Prompt
    const sistema =
      "Você é um analista técnico de assistência/garantia do Grupo Bononi (produtos Stonni). " +
      "Leia a conversa de WhatsApp entre CLIENTE e EMPRESA (e as imagens anexas) e produza: " +
      "(1) um RESUMO estruturado da reclamação e (2) as SOLUÇÕES mais prováveis, casando com a " +
      "BASE DE CONHECIMENTO fornecida. Use SOMENTE soluções coerentes com a base; se sugerir vídeo, " +
      "use apenas os links presentes na base do produto correspondente. Responda SOMENTE com JSON válido, " +
      "sem texto fora do JSON, no formato: " +
      '{"resumo":{"produto":"","reclamacao":"","defeito_percebido":"","ja_tentado":"","urgencia":"","falta_info":""},' +
      '"solucoes":[{"solucao":"","video_url":null,"confianca":"alta|media|baixa"}]}. ' +
      "Escreva em português do Brasil, objetivo. Ranqueie as soluções da mais provável para a menos provável.";

    const contexto =
      `DADOS DO CHAMADO:\n- Produto (ERP): ${chamado.produto_nome || chamado.produto_codigo || "não informado"}\n` +
      `- Descrição inicial: ${chamado.descricao_inicial || "—"}\n` +
      `- Áudios não transcritos nesta conversa: ${audios}\n\n` +
      `CONVERSA:\n${linhas.join("\n")}\n\n` +
      `BASE DE CONHECIMENTO (Notion):\n${baseConhecimento}`;

    const content: unknown[] = [{ type: "text", text: contexto }];
    for (const u of imagens) {
      content.push({ type: "image", source: { type: "url", url: u } });
    }

    // 5) Claude
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

    let parsed: { resumo?: unknown; solucoes?: unknown } = {};
    try {
      const jstart = texto.indexOf("{");
      const jend = texto.lastIndexOf("}");
      parsed = JSON.parse(texto.slice(jstart, jend + 1));
    } catch (_e) {
      return json({ error: "resposta do modelo não veio em JSON", bruto: texto }, 502);
    }

    // 6) Grava no chamado
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

    return json({
      ok: true,
      chamado_id: chamado.id,
      imagens_lidas: imagens.length,
      audios_ignorados: audios,
      resumo: parsed.resumo,
      solucoes: parsed.solucoes,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
