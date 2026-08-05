// assist-kb-sync — Sincroniza a base de conhecimento da IA (assist_kb_produto)
// a partir das páginas do Notion. Cada linha de assist_kb_produto tem um
// notion_id; a função lê a página (títulos, toggles, tabela de erros, links do
// YouTube) e regrava conteudo_md. Conversão FIEL — não inventa nem resume;
// vídeos internos do Notion (anexos file://) são ignorados (não servem ao
// cliente), só links http/YouTube entram.
//
// Entrada:  POST {}                      -> sincroniza TODOS os produtos
//           POST { notion_id }           -> sincroniza só um
//           POST { produto }             -> sincroniza só um (pelo nome)
// Saída:    { ok, sincronizados:[{produto, chars}], erros:[{produto, erro}] }
//
// Segredos (Supabase → Edge Functions → Secrets):
//   NOTION_API_KEY (obrigatório) — token de uma integração interna do Notion,
//     com as páginas de produto compartilhadas com ela.

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

const NOTION_VERSION = "2022-06-28";
const MAX_BLOCKS = 600;         // teto de blocos lidos por página (segurança)

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ── Notion API ────────────────────────────────────────────────────────────
async function notionChildren(blockId: string, token: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set("page_size", "100");
    if (cursor) url.searchParams.set("start_cursor", cursor);
    const r = await fetch(url.toString(), {
      headers: { "Authorization": `Bearer ${token}`, "Notion-Version": NOTION_VERSION },
    });
    if (!r.ok) throw new Error(`Notion ${r.status}: ${await r.text()}`);
    const j = await r.json();
    out.push(...(j.results || []));
    cursor = j.has_more ? j.next_cursor : undefined;
  } while (cursor);
  return out;
}

// Lê os blocos da página recursivamente (toggles/tabela têm filhos), com teto.
async function fetchTree(blockId: string, token: string, counter: { n: number }): Promise<any[]> {
  if (counter.n >= MAX_BLOCKS) return [];
  const blocks = await notionChildren(blockId, token);
  for (const b of blocks) {
    counter.n++;
    if (counter.n >= MAX_BLOCKS) break;
    if (b.has_children) {
      try { b.__children = await fetchTree(b.id, token, counter); }
      catch { b.__children = []; }
    }
  }
  return blocks;
}

// ── Conversão bloco → markdown ─────────────────────────────────────────────
function rt(arr: any[] | undefined): string {
  if (!arr || !arr.length) return "";
  return arr.map((t: any) => {
    const txt = t.plain_text ?? t.text?.content ?? "";
    const href = t.href;
    return href && !href.startsWith("/") ? `${txt} (${href})` : txt;
  }).join("").trim();
}

function isHttp(u: string | undefined): u is string {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

function blocksToMd(blocks: any[], depth = 0): string {
  const lines: string[] = [];
  const pad = "  ".repeat(depth);
  const table = (b: any) => {
    const rows: any[] = (b.__children || []).filter((c: any) => c.type === "table_row");
    const md: string[] = [];
    rows.forEach((row: any, i: number) => {
      const cells = (row.table_row?.cells || []).map((cell: any[]) => (rt(cell).split("\n").join(" ").split("|").join("/")) || " ");
      md.push(`| ${cells.join(" | ")} |`);
      if (i === 0) md.push(`| ${cells.map(() => "---").join(" | ")} |`);
    });
    return md.join("\n");
  };

  for (const b of blocks) {
    const t = b.type;
    const kids = b.__children as any[] | undefined;
    switch (t) {
      case "heading_1": lines.push(`\n# ${rt(b.heading_1?.rich_text)}`); if (kids) lines.push(blocksToMd(kids, depth)); break;
      case "heading_2": lines.push(`\n## ${rt(b.heading_2?.rich_text)}`); if (kids) lines.push(blocksToMd(kids, depth)); break;
      case "heading_3": lines.push(`\n### ${rt(b.heading_3?.rich_text)}`); if (kids) lines.push(blocksToMd(kids, depth)); break;
      case "toggle": {
        const head = rt(b.toggle?.rich_text);
        if (head) lines.push(`\n**${head}**`);
        if (kids) lines.push(blocksToMd(kids, depth));
        break;
      }
      case "paragraph": {
        const txt = rt(b.paragraph?.rich_text);
        if (txt) lines.push(`${pad}${txt}`);
        if (kids) lines.push(blocksToMd(kids, depth + 1));
        break;
      }
      case "bulleted_list_item": {
        lines.push(`${pad}- ${rt(b.bulleted_list_item?.rich_text)}`);
        if (kids) lines.push(blocksToMd(kids, depth + 1));
        break;
      }
      case "numbered_list_item": {
        lines.push(`${pad}- ${rt(b.numbered_list_item?.rich_text)}`);
        if (kids) lines.push(blocksToMd(kids, depth + 1));
        break;
      }
      case "to_do": {
        const c = b.to_do?.checked ? "x" : " ";
        lines.push(`${pad}- [${c}] ${rt(b.to_do?.rich_text)}`);
        if (kids) lines.push(blocksToMd(kids, depth + 1));
        break;
      }
      case "quote": lines.push(`${pad}> ${rt(b.quote?.rich_text)}`); break;
      case "callout": lines.push(`${pad}> ${rt(b.callout?.rich_text)}`); break;
      case "code": { const c = rt(b.code?.rich_text); if (c) lines.push(`\n${pad}    ${c.split("\n").join("\n" + pad + "    ")}`); break; }
      case "table": lines.push(`\n${table(b)}`); break;
      case "video": {
        const v = b.video;
        const url = v?.type === "external" ? v.external?.url : undefined; // ignora file:// interno
        if (isHttp(url)) lines.push(`${pad}- vídeo: ${url}`);
        break;
      }
      case "bookmark": if (isHttp(b.bookmark?.url)) lines.push(`${pad}- ${b.bookmark.url}`); break;
      case "embed": if (isHttp(b.embed?.url)) lines.push(`${pad}- ${b.embed.url}`); break;
      case "link_preview": if (isHttp(b.link_preview?.url)) lines.push(`${pad}- ${b.link_preview.url}`); break;
      case "divider": lines.push(""); break;
      case "child_page": case "child_database": case "unsupported": break; // ignora
      default: {
        // tenta extrair rich_text de tipos não mapeados
        const anyRt = b[t]?.rich_text;
        if (Array.isArray(anyRt)) { const s = rt(anyRt); if (s) lines.push(`${pad}${s}`); }
        if (kids) lines.push(blocksToMd(kids, depth));
      }
    }
  }
  return lines.join("\n");
}

function limpar(md: string): string {
  let s = md.trim();
  while (s.indexOf("\n\n\n") !== -1) s = s.split("\n\n\n").join("\n\n");
  return s;
}

// ── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const token = Deno.env.get("NOTION_API_KEY");
    if (!token) {
      return json({
        error: "falta o segredo NOTION_API_KEY",
        ajuda: "Crie uma integração interna em notion.so/my-integrations, compartilhe as páginas de produto com ela e adicione o token em Supabase → Edge Functions → Secrets como NOTION_API_KEY.",
      }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const { notion_id, produto } = body || {};

    let q = supabase.from("assist_kb_produto").select("id, produto, notion_id");
    if (notion_id) q = q.eq("notion_id", notion_id);
    else if (produto) q = q.eq("produto", produto);
    const { data: rows, error: eRows } = await q;
    if (eRows) return json({ error: `erro ao ler assist_kb_produto: ${eRows.message}` }, 500);
    if (!rows || !rows.length) return json({ error: "nenhum produto para sincronizar" }, 404);

    const sincronizados: any[] = [];
    const erros: any[] = [];

    for (const row of rows) {
      if (!row.notion_id) { erros.push({ produto: row.produto, erro: "sem notion_id" }); continue; }
      try {
        const counter = { n: 0 };
        const tree = await fetchTree(row.notion_id, token, counter);
        const corpo = limpar(blocksToMd(tree));
        const conteudo = `# ${row.produto}\n\n${corpo}`.trim();
        if (corpo.length < 20) { erros.push({ produto: row.produto, erro: "página vazia ou sem acesso da integração" }); continue; }
        const { error: eUp } = await supabase
          .from("assist_kb_produto")
          .update({ conteudo_md: conteudo, atualizado_em: new Date().toISOString() })
          .eq("id", row.id);
        if (eUp) { erros.push({ produto: row.produto, erro: eUp.message }); continue; }
        sincronizados.push({ produto: row.produto, chars: conteudo.length, blocos: counter.n });
      } catch (e) {
        erros.push({ produto: row.produto, erro: (e as Error).message });
      }
    }

    return json({ ok: erros.length === 0, sincronizados, erros });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
