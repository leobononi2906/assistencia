// assist-material-pdf — Extrai o texto de um PDF dos Materiais Técnicos
// (prt_materiais) e gera, uma única vez, um RESUMO TÉCNICO compacto que a IA usa
// nas respostas. Dispara automaticamente por trigger quando um PDF é cadastrado.
//
// Entrada:  POST { id }   -> processa um material    |   POST {} -> todos os PDFs
//           ativos ainda sem resumo_tecnico.
// Grava:    prt_materiais.texto_extraido, .resumo_tecnico, .processado_em
// Segredo:  ANTHROPIC_API_KEY (obrigatório).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";

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
const MAX_TXT = 40000;   // teto de texto do PDF enviado ao modelo (custo)
const MAX_RESUMO = 2000; // teto do resumo guardado

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function extrairTextoPdf(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download PDF ${r.status}`);
  const ab = await r.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(ab));
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : String(text || "")).trim();
}

async function resumirTecnico(apiKey: string, titulo: string, linha: string, texto: string): Promise<string> {
  const sistema =
    "Você recebe o texto de um manual/documento técnico de um produto Stonni (assistência/garantia). " +
    "Faça um RESUMO TÉCNICO compacto em português do Brasil, útil para o atendente resolver problemas: " +
    "principais defeitos/sintomas e como resolver, códigos de erro e o que significam, e procedimentos de " +
    "instalação/configuração/manutenção. Só o que ajuda a resolver. Seja objetivo, em tópicos curtos. " +
    "NÃO invente nada que não esteja no texto. Máximo ~1500 caracteres.";
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: MODELO,
      max_tokens: 900,
      system: sistema,
      messages: [{ role: "user", content: [{ type: "text", text: `PRODUTO: ${linha} — ${titulo}\n\nTEXTO DO DOCUMENTO:\n${texto.slice(0, MAX_TXT)}` }] }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return (data?.content?.[0]?.text || "").trim().slice(0, MAX_RESUMO);
}

async function processar(row: any, apiKey: string) {
  const texto = await extrairTextoPdf(row.url);
  if (!texto || texto.length < 40) {
    // PDF sem camada de texto (provavelmente escaneado) — marca como processado sem resumo.
    await supabase.from("prt_materiais")
      .update({ texto_extraido: null, resumo_tecnico: "[PDF sem texto — provavelmente escaneado; precisaria de OCR]", processado_em: new Date().toISOString() })
      .eq("id", row.id);
    return { id: row.id, titulo: row.titulo, ok: false, motivo: "sem texto (escaneado?)" };
  }
  const resumo = await resumirTecnico(apiKey, row.titulo || "", row.linha_produto || "", texto);
  await supabase.from("prt_materiais")
    .update({ texto_extraido: texto.slice(0, 200000), resumo_tecnico: resumo, processado_em: new Date().toISOString() })
    .eq("id", row.id);
  return { id: row.id, titulo: row.titulo, ok: true, chars_texto: texto.length, chars_resumo: resumo.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "falta o segredo ANTHROPIC_API_KEY" }, 500);

    const { id } = await req.json().catch(() => ({}));

    let q = supabase.from("prt_materiais")
      .select("id, titulo, linha_produto, url, tipo, resumo_tecnico")
      .eq("ativo", true).ilike("tipo", "%pdf%");
    if (id) q = q.eq("id", id);
    else q = q.is("resumo_tecnico", null); // sem id: só os pendentes
    const { data: rows, error } = await q;
    if (error) return json({ error: error.message }, 500);
    if (!rows || !rows.length) return json({ ok: true, processados: [], nota: "nada a processar" });

    const processados: any[] = [];
    for (const row of rows) {
      if (!row.url) { processados.push({ id: row.id, ok: false, motivo: "sem url" }); continue; }
      try { processados.push(await processar(row, apiKey)); }
      catch (e) { processados.push({ id: row.id, ok: false, motivo: (e as Error).message }); }
    }
    return json({ ok: true, processados });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
