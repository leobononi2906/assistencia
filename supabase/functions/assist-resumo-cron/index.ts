// assist-resumo-cron — Roda periodicamente (pg_cron, a cada 30 min) e gera o
// resumo IA apenas dos chamados que PRECISAM: abertos, não bloqueados, com
// mensagem nova depois do último resumo (ou nunca resumidos) e cuja última
// mensagem já tem >= 5 min (deixa a conversa "assentar"). A elegibilidade fica
// na função SQL public.assist_resumo_pendentes(p_limit).
//
// Teto por rodada (LIMITE) para o backlog drenar aos poucos e o custo ficar
// diluído — nunca dispara centenas de resumos de uma vez.
//
// Áudio nunca é re-transcrito (cache por mensagem em assist-resumo-ia). O único
// custo repetido é o resumo (Haiku), e só de quem teve conversa nova.
//
// verify_jwt=false: é chamada pelo pg_cron sem Authorization. Ela mesma usa a
// service role (do ambiente) para chamar assist-resumo-ia.

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

const LIMITE_PADRAO = 20; // chamados por rodada (drena backlog aos poucos)

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SB_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const limite = Math.max(1, Math.min(Number(body?.limite) || LIMITE_PADRAO, 50));

    // 1) Quem precisa de resumo agora
    const { data: pend, error: ePend } = await supabase
      .rpc("assist_resumo_pendentes", { p_limit: limite });
    if (ePend) return json({ error: `erro ao listar pendentes: ${ePend.message}` }, 500);

    const ids: number[] = (pend || []).map((r: { id: number }) => r.id);
    if (!ids.length) return json({ ok: true, processados: 0, nota: "nada a resumir" });

    // 2) Gera o resumo de cada um (sequencial: limita concorrência/custo)
    const resultados: Array<Record<string, unknown>> = [];
    for (const id of ids) {
      try {
        const r = await fetch(`${SB_URL}/functions/v1/assist-resumo-ia`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ chamado_id: id }),
        });
        const j = await r.json().catch(() => ({}));
        resultados.push({ id, ok: r.ok, setor_ia: j?.setor_ia ?? null, roteado: j?.roteado ?? null, erro: r.ok ? null : (j?.error ?? r.status) });
      } catch (e) {
        resultados.push({ id, ok: false, erro: (e as Error).message });
      }
    }

    const okCount = resultados.filter((x) => x.ok).length;
    return json({ ok: true, processados: okCount, total: ids.length, limite, resultados });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
