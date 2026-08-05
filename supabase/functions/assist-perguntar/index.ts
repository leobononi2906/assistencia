// assist-perguntar — Tira-dúvidas da assistência. O atendente faz uma PERGUNTA
// livre e a IA responde com base na base de conhecimento (assist_kb_produto) +
// regras + dicas (assist_ia_regras), num formato pronto para mandar ao cliente,
// com os links de vídeo pertinentes. Stateless (não grava nada).
//
// Entrada:  POST { pergunta: string, produto?: string }
// Saída:    { ok, resposta, videos:[url], confianca }
//
// Segredo: ANTHROPIC_API_KEY (obrigatório).

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "falta o segredo ANTHROPIC_API_KEY" }, 500);

    const { pergunta, produto } = await req.json().catch(() => ({}));
    if (!pergunta || !String(pergunta).trim()) {
      return json({ error: "informe a pergunta" }, 400);
    }

    const { data: kb } = await supabase
      .from("assist_kb_produto")
      .select("produto, conteudo_md");
    const baseConhecimento = (kb || [])
      .map((k) => `### PRODUTO: ${k.produto}\n${k.conteudo_md}`)
      .join("\n\n---\n\n") || "(base de conhecimento vazia)";

    // Materiais técnicos & vídeos (prt_materiais) — leitura ao vivo.
    const { data: materiais } = await supabase
      .from("prt_materiais")
      .select("titulo, descricao, tipo, url, linha_produto, modelo")
      .eq("ativo", true);
    const listaMateriais = (materiais || [])
      .filter((m) => m.url)
      .map((m) => `- [${m.linha_produto || "?"}${m.modelo ? " / " + m.modelo : ""}] ${m.titulo} (${m.tipo}): ${m.url}${m.descricao ? " — " + m.descricao : ""}`)
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

    return json({
      ok: true,
      resposta: parsed.resposta || "",
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
      confianca: parsed.confianca || "media",
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
