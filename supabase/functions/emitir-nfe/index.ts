// ERP Bononi — Edge Function: emitir NF-e (adaptador plugável Focus NF-e / NFe.io)
// A emissão real depende do provedor escolhido + certificado. As credenciais vêm de
// variáveis de ambiente (secrets), NUNCA hardcoded.
//
// Secrets esperados (configurar no Supabase antes de usar):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   NFE_PROVIDER = 'FOCUS' | 'NFEIO'   (default FOCUS)
//   FOCUS_NFE_TOKEN, FOCUS_NFE_BASE    (ex.: https://homologacao.focusnfe.com.br)
//   NFEIO_API_KEY, NFEIO_BASE, NFEIO_EMPRESA_ID   (quando provider=NFEIO)
//
// Fluxo: recebe { id_nfe } -> lê payload (RPC erp_nfe_payload) -> monta o request do
// provedor -> envia -> grava o retorno (RPC erp_registrar_retorno_nfe).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { id_nfe } = await req.json();
    if (!id_nfe) throw new Error("id_nfe obrigatório");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) payload completo da NF
    const { data: payload, error: pErr } = await sb.rpc("erp_nfe_payload", { p_id_nfe: id_nfe });
    if (pErr) throw pErr;
    if (!payload || !payload.nfe) throw new Error("NF-e não encontrada");

    // marca como ENVIANDO
    await sb.rpc("erp_registrar_retorno_nfe", { p_id_nfe: id_nfe, p_status: "ENVIANDO" });

    const provider = (Deno.env.get("NFE_PROVIDER") || "FOCUS").toUpperCase();
    let result: { status: string; chave?: string; protocolo?: string; mensagem?: string; xml?: string; status_sefaz?: string };

    if (provider === "FOCUS") {
      result = await emitirFocus(payload);
    } else if (provider === "NFEIO") {
      result = await emitirNfeio(payload);
    } else {
      throw new Error("Provedor NF-e não configurado: " + provider);
    }

    // 2) grava retorno
    await sb.rpc("erp_registrar_retorno_nfe", {
      p_id_nfe: id_nfe, p_status: result.status, p_chave: result.chave ?? null,
      p_protocolo: result.protocolo ?? null, p_xml_retorno: result.xml ?? null,
      p_mensagem: result.mensagem ?? null, p_status_sefaz: result.status_sefaz ?? null,
    });

    return new Response(JSON.stringify({ ok: true, id_nfe, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

// ---------- Adaptador Focus NF-e ----------
async function emitirFocus(p: any) {
  const token = Deno.env.get("FOCUS_NFE_TOKEN");
  const base = Deno.env.get("FOCUS_NFE_BASE") || "https://homologacao.focusnfe.com.br";
  if (!token) throw new Error("FOCUS_NFE_TOKEN não configurado");
  const n = p.nfe, emp = p.empresa || {}, cli = p.cliente || {}, nat = p.natureza || {};
  const ref = `nfe-${n.id}`;

  // Monta o corpo no formato Focus NF-e (campos principais; ajustar conforme contrato)
  const body = {
    natureza_operacao: nat.descricao,
    data_emissao: new Date().toISOString(),
    tipo_documento: 1,
    finalidade_emissao: 1,
    cnpj_emitente: onlyDigits(emp.cnpj),
    nome_emitente: emp.nome,
    nome_destinatario: cli.nome,
    cpf_cnpj_destinatario: onlyDigits(cli.cpf_cnpj),
    logradouro_destinatario: cli.endereco,
    numero_destinatario: cli.numero,
    bairro_destinatario: cli.bairro,
    municipio_destinatario: cli.cidade,
    uf_destinatario: cli.uf,
    cep_destinatario: onlyDigits(cli.cep),
    valor_produtos: n.valor_produtos,
    valor_frete: n.valor_frete ?? 0,
    valor_desconto: n.valor_desconto ?? 0,
    valor_total: n.valor_total,
    items: (p.itens || []).map((i: any, idx: number) => ({
      numero_item: idx + 1,
      codigo_produto: String(i.id_produto ?? idx + 1),
      descricao: i.descricao,
      cfop: i.cfop,
      codigo_ncm: i.ncm,
      unidade_comercial: "UN",
      quantidade_comercial: i.quantidade,
      valor_unitario_comercial: i.valor_unitario,
      valor_bruto: i.valor_total,
      icms_situacao_tributaria: i.cst_icms,
      icms_aliquota: i.aliq_icms,
      icms_base_calculo: i.bc_icms,
      icms_valor: i.valor_icms,
      pis_situacao_tributaria: i.cst_pis,
      cofins_situacao_tributaria: i.cst_cofins,
    })),
  };

  const resp = await fetch(`${base}/v2/nfe?ref=${encodeURIComponent(ref)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Basic " + btoa(token + ":") },
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  // Focus é assíncrono: normalmente retorna "processando_autorizacao"; a autorização final
  // vem por consulta/webhook. Mapeamos o status inicial aqui.
  const st = json.status;
  if (st === "autorizado") {
    return { status: "AUTORIZADA", chave: json.chave_nfe, protocolo: json.protocolo,
             mensagem: json.mensagem_sefaz, xml: json.caminho_xml_nota_fiscal, status_sefaz: String(json.status_sefaz ?? "") };
  }
  if (st === "erro_autorizacao" || st === "rejeitado") {
    return { status: "REJEITADA", mensagem: json.mensagem_sefaz || JSON.stringify(json), status_sefaz: String(json.status_sefaz ?? "") };
  }
  // processando_autorizacao / outros
  return { status: "ENVIANDO", protocolo: ref, mensagem: json.mensagem || "Em processamento na SEFAZ (consultar retorno)" };
}

// ---------- Adaptador NFe.io (a completar quando escolhido) ----------
async function emitirNfeio(_p: any) {
  const key = Deno.env.get("NFEIO_API_KEY");
  if (!key) throw new Error("NFEIO_API_KEY não configurado");
  // TODO: implementar mapeamento para a API da NFe.io quando o provedor for definido.
  throw new Error("Adaptador NFe.io ainda não implementado (definir provedor)");
}

function onlyDigits(s: any) { return s ? String(s).replace(/\D/g, "") : ""; }
