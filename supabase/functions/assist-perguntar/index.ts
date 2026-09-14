// assist-perguntar — Tira-dúvidas da assistência. O atendente faz uma PERGUNTA
// livre e a IA responde com base na base de conhecimento (assist_kb_produto) +
// regras + dicas (assist_ia_regras), num formato pronto para mandar ao cliente,
// com os links de vídeo pertinentes.
//
// Entrada:  POST { pergunta: string, produto?: string, email?: string }
// Saída:    { ok, resposta, videos:[url], confianca, cache }
//
// Segredo: ANTHROPIC_API_KEY (obrigatório).
//
// ---------------------------------------------------------------------------
// REGISTRO E CACHE (14/09/2026)
//
// Antes nada era gravado: nem a pergunta, nem a resposta. E cada pergunta
// mandava a base INTEIRA para a Anthropic (11 produtos, ~34 mil caracteres,
// ~12 mil tokens de entrada). Perguntar duas vezes a mesma coisa custava duas
// vezes.
//
// Agora a resposta fica em assist_ia_perguntas, com chave na pergunta
// NORMALIZADA + produto. Repetida, sai de lá e a IA não é chamada.
//
// O que impede o cache de mentir: fonte_versao. O prompt manda a IA priorizar
// a informação mais recente, então um cache cego serviria procedimento velho
// depois de uma correção -- e ninguém perceberia, porque a resposta continua
// parecendo boa. Cada linha guarda a impressão digital das fontes; se a base
// mudar, o cache deixa de valer e a pergunta vai para a IA de novo.
//
// A ordem aqui importa: a impressão digital é lida com uma consulta BARATA (só
// carimbos e contagens) ANTES de montar o prompt. Num acerto de cache os 34 mil
// caracteres nem chegam a ser lidos do banco.
// ---------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

const MODELO = "claude-haiku-4-5-20251001";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// "Como mudar o Ar-Condicionado para GRAUS?" e "como mudar o ar condicionado
// para graus" são a mesma pergunta. Sem isto o cache quase nunca acertaria.
function normalizar(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // tira acento
    .replace(/[^a-z0-9\s]/g, " ")                        // tira pontuação
    .replace(/\s+/g, " ")
    .trim();
}

// Impressão digital das fontes. Consulta barata de propósito: só carimbos e
// contagens, nunca o conteúdo. É o que permite decidir pelo cache sem ler os
// 34 mil caracteres da base.
async function fonteVersao(): Promise<string> {
  const [kb, mat, reg] = await Promise.all([
    supabase.from("assist_kb_produto").select("atualizado_em"),
    supabase.from("prt_materiais").select("criado_em, processado_em").eq("ativo", true),
    supabase.from("assist_ia_regras").select("atualizado_em").eq("id", 1).maybeSingle(),
  ]);
  const maior = (xs: (string | null)[]) => xs.filter(Boolean).sort().pop() || "0";
  const kbRows = kb.data || [];
  const matRows = mat.data || [];
  return [
    `kb:${maior(kbRows.map((r) => r.atualizado_em))}:${kbRows.length}`,
    `mat:${maior(matRows.flatMap((r) => [r.criado_em, r.processado_em]))}:${matRows.length}`,
    `reg:${(reg.data && reg.data.atualizado_em) || "0"}`,
  ].join("|");
}

// Busca a pergunta guardada. produto é opcional, e no banco a chave usa
// coalesce(produto,'') -- aqui o null precisa ser tratado com .is(), porque
// em SQL null não é igual a nada, nem a null.
async function buscarGuardada(norm: string, prod: string | null) {
  const q = supabase.from("assist_ia_perguntas")
    .select("id, resposta, fonte_versao, usos")
    .eq("pergunta_norm", norm);
  const { data } = await (prod === null ? q.is("produto", null) : q.eq("produto", prod)).maybeSingle();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "falta o segredo ANTHROPIC_API_KEY" }, 500);

    const { pergunta, produto, email } = await req.json().catch(() => ({}));
    if (!pergunta || !String(pergunta).trim()) {
      return json({ error: "informe a pergunta" }, 400);
    }

    const norm = normalizar(pergunta);
    const prod = produto ? String(produto) : null;
    const versao = await fonteVersao();
    const achada = await buscarGuardada(norm, prod);

    // --------------------------------------------- já perguntaram, e a base é a mesma
    if (achada && achada.fonte_versao === versao) {
      await supabase.from("assist_ia_perguntas")
        .update({ usos: (achada.usos || 1) + 1, ultimo_uso: new Date().toISOString() })
        .eq("id", achada.id);
      const r = achada.resposta || {};
      return json({
        ok: true,
        resposta: r.resposta || "",
        videos: Array.isArray(r.videos) ? r.videos : [],
        confianca: r.confianca || "media",
        cache: true,
      });
    }

    // ------------------------------ não tinha, ou a base mudou: pergunta à IA

    // Data curta DD/MM/AAAA (UTC) para carimbar recência das fontes.
    const fmtData = (ts: string | null) => {
      if (!ts) return "sem data";
      const d = new Date(ts);
      return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
    };

    const { data: kb } = await supabase
      .from("assist_kb_produto")
      .select("produto, conteudo_md, atualizado_em");
    const baseConhecimento = (kb || [])
      .map((k) => `### PRODUTO: ${k.produto} (atualizado em ${fmtData(k.atualizado_em)})\n${k.conteudo_md}`)
      .join("\n\n---\n\n") || "(base de conhecimento vazia)";

    // Materiais técnicos & vídeos (prt_materiais) — leitura ao vivo, do mais NOVO ao mais antigo.
    const { data: materiais } = await supabase
      .from("prt_materiais")
      .select("titulo, descricao, tipo, url, linha_produto, modelo, resumo_tecnico, criado_em")
      .eq("ativo", true)
      .order("criado_em", { ascending: false });
    const listaMateriais = (materiais || [])
      .filter((m) => m.url)
      .map((m) => {
        const cab = `- [${m.linha_produto || "?"}${m.modelo ? " / " + m.modelo : ""}] ${m.titulo} (${m.tipo}, doc de ${fmtData(m.criado_em)}): ${m.url}${m.descricao ? " — " + m.descricao : ""}`;
        return m.resumo_tecnico ? `${cab}\n  RESUMO DO DOCUMENTO: ${m.resumo_tecnico}` : cab;
      })
      .join("\n") || "(sem materiais)";

    const { data: regras } = await supabase
      .from("assist_ia_regras")
      .select("instrucoes, dicas")
      .eq("id", 1)
      .maybeSingle();
    const instrucoesEquipe = (regras?.instrucoes || "").trim();
    const dicasEquipe = (regras?.dicas || "").trim();

    const sistema =
      "Você é o tira-dúvidas da assistência técnica do Grupo Bononi (produtos Stonni). " +
      "Um ATENDENTE faz uma pergunta; responda com base SOMENTE na BASE DE CONHECIMENTO fornecida " +
      "(e nas regras/dicas). Produza uma resposta CORDIAL e OBJETIVA, pronta para o atendente copiar e " +
      "mandar ao cliente no WhatsApp (linguagem simples; passo a passo quando fizer sentido). " +
      "Se houver vídeo pertinente, inclua o link em 'videos' (use apenas links presentes na BASE ou nos MATERIAIS TÉCNICOS). " +
      "Se a base NÃO cobrir a dúvida, seja honesto: diga que precisa confirmar e peça o dado que falta " +
      "(ex.: código de erro no display). NÃO invente solução. Responda SOMENTE com JSON válido, sem texto fora do JSON, " +
      'no formato: {"resposta":"","videos":[],"confianca":"alta|media|baixa"}. Português do Brasil.' +
      "\n\nPRIORIDADE POR RECÊNCIA: quando duas fontes se contradisserem sobre o MESMO tema, vale SEMPRE a mais recente. " +
      "Ordem de prioridade: (1) DICAS DA EQUIPE — são as correções mais recentes e sempre prevalecem; " +
      "(2) DOCUMENTOS/MATERIAIS mais recentes — compare a data 'doc de DD/MM/AAAA'; " +
      "(3) BASE DE CONHECIMENTO do Notion — veja 'atualizado em DD/MM/AAAA'. " +
      "Uma informação mais nova sobre o mesmo assunto SUBSTITUI a mais antiga." +
      (instrucoesEquipe ? `\n\nREGRAS DA EQUIPE:\n${instrucoesEquipe}` : "") +
      (dicasEquipe ? `\n\nDICAS DA EQUIPE:\n${dicasEquipe}` : "");

    const contexto =
      `PERGUNTA DO ATENDENTE: ${String(pergunta).trim()}\n\n` +
      (produto ? `PRODUTO (dica do atendente): ${produto}\n\n` : "") +
      `BASE DE CONHECIMENTO (Notion):\n${baseConhecimento}\n\n` +
      `MATERIAIS TÉCNICOS & VÍDEOS DISPONÍVEIS (indique o link ao cliente quando ajudar):\n${listaMateriais}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1000,
        system: sistema,
        messages: [{ role: "user", content: [{ type: "text", text: contexto }] }],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return json({ error: `Anthropic ${resp.status}: ${t}` }, 502);
    }
    const data = await resp.json();
    const texto = (data?.content?.[0]?.text || "").trim();

    let parsed: { resposta?: string; videos?: string[]; confianca?: string } = {};
    try {
      const jstart = texto.indexOf("{");
      const jend = texto.lastIndexOf("}");
      parsed = JSON.parse(texto.slice(jstart, jend + 1));
    } catch (_e) {
      // se não vier JSON, devolve o texto puro como resposta
      parsed = { resposta: texto, videos: [], confianca: "media" };
    }

    const saida = {
      resposta: parsed.resposta || "",
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
      confianca: parsed.confianca || "media",
    };

    // ------------------------------------------------ guarda para a próxima vez
    // Falha aqui NÃO pode derrubar a resposta: a pessoa já esperou pela IA, e
    // não conseguir gravar o cache é problema nosso, não dela.
    try {
      if (achada) {
        // já existia, mas a base mudou: a resposta velha é substituída
        await supabase.from("assist_ia_perguntas")
          .update({ resposta: saida, fonte_versao: versao, ultimo_uso: new Date().toISOString() })
          .eq("id", achada.id);
      } else {
        await supabase.from("assist_ia_perguntas").insert({
          pergunta_norm: norm,
          produto: prod,
          pergunta: String(pergunta).trim(),
          resposta: saida,
          fonte_versao: versao,
          usuario_email: email || null,
        });
      }
    } catch (_e) { /* silencioso de propósito -- ver comentário acima */ }

    return json({ ok: true, ...saida, cache: false });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
