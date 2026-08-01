-- ERP Bononi — Financeiro / Contas a Pagar
-- titulos.id_fornecedor + geração de CP a partir de compras_recebimento + view.
ALTER TABLE "Teste ERP".titulos
  ADD COLUMN IF NOT EXISTS id_fornecedor integer REFERENCES "Teste ERP".fornecedores(id);
CREATE INDEX IF NOT EXISTS idx_titulos_fornecedor ON "Teste ERP".titulos(id_fornecedor);

CREATE OR REPLACE FUNCTION "Teste ERP".fn_gerar_titulos_pagar(
  p_id_compra integer, p_id_usuario integer DEFAULT NULL, p_reprocessar boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = "Teste ERP", public
AS $$
DECLARE
  v_forn int; v_emp int; v_valor numeric; v_cond int; v_cc int; v_numero text;
  v_np int; v_intervalo int; v_entrada boolean; v_tem_parcelas boolean;
  v_i int; v_offset int; v_valor_parc numeric; v_soma numeric := 0;
  v_venc date; v_ids int[] := '{}'; v_novo int; r RECORD;
BEGIN
  SELECT id_fornecedor,id_empresa,valor_total,id_condicao_pagamento,id_centro_custo,numero
    INTO v_forn,v_emp,v_valor,v_cond,v_cc,v_numero
    FROM compras_recebimento WHERE id = p_id_compra;
  IF v_emp IS NULL THEN RAISE EXCEPTION 'Compra % nao encontrada', p_id_compra; END IF;
  IF COALESCE(v_valor,0) <= 0 THEN RAISE EXCEPTION 'Valor total invalido'; END IF;

  IF EXISTS (SELECT 1 FROM titulos WHERE origem='COMPRA' AND id_origem=p_id_compra) THEN
    IF NOT p_reprocessar THEN RAISE EXCEPTION 'Titulos ja gerados para compra %', p_id_compra; END IF;
    DELETE FROM titulos WHERE origem='COMPRA' AND id_origem=p_id_compra
      AND NOT EXISTS (SELECT 1 FROM titulos_baixas b WHERE b.id_titulo = titulos.id);
  END IF;

  SELECT EXISTS (SELECT 1 FROM condicoes_pagamento_parcelas WHERE id_condicao_pagamento=v_cond) INTO v_tem_parcelas;

  IF v_tem_parcelas THEN
    SELECT count(*) INTO v_np FROM condicoes_pagamento_parcelas WHERE id_condicao_pagamento=v_cond;
    FOR r IN SELECT numero_parcela,prazo_dias,percentual FROM condicoes_pagamento_parcelas
              WHERE id_condicao_pagamento=v_cond ORDER BY numero_parcela LOOP
      v_valor_parc := round(v_valor * r.percentual/100.0, 2);
      IF r.numero_parcela = v_np THEN v_valor_parc := v_valor - v_soma; END IF;
      v_soma := v_soma + v_valor_parc;
      INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_fornecedor,origem,id_origem,numero_origem,
                           data_emissao,data_vencimento,valor,status,id_centro_custo)
      VALUES ('CP',v_numero,r.numero_parcela||'/'||v_np,v_emp,v_forn,'COMPRA',p_id_compra,v_numero,
              CURRENT_DATE,CURRENT_DATE + r.prazo_dias,v_valor_parc,'ABERTO',v_cc)
      RETURNING id INTO v_novo; v_ids := array_append(v_ids,v_novo);
    END LOOP;
  ELSE
    SELECT COALESCE(num_parcelas,1),COALESCE(intervalo_dias,0),COALESCE(entrada,false)
      INTO v_np,v_intervalo,v_entrada FROM condicoes_pagamento WHERE id=v_cond;
    IF v_np IS NULL THEN v_np:=1; v_intervalo:=0; v_entrada:=false; END IF;
    v_valor_parc := round(v_valor/v_np,2);
    FOR v_i IN 1..v_np LOOP
      IF v_entrada THEN v_offset := v_intervalo*(v_i-1); ELSE v_offset := v_intervalo*v_i; END IF;
      v_venc := CURRENT_DATE + v_offset;
      IF v_i = v_np THEN v_valor_parc := v_valor - v_soma; END IF;
      v_soma := v_soma + v_valor_parc;
      INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_fornecedor,origem,id_origem,numero_origem,
                           data_emissao,data_vencimento,valor,status,id_centro_custo)
      VALUES ('CP',v_numero,v_i||'/'||v_np,v_emp,v_forn,'COMPRA',p_id_compra,v_numero,
              CURRENT_DATE,v_venc,v_valor_parc,'ABERTO',v_cc)
      RETURNING id INTO v_novo; v_ids := array_append(v_ids,v_novo);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok',true,'origem','COMPRA','id_origem',p_id_compra,
                            'parcelas',v_np,'valor_total',v_valor,'titulos',v_ids);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_gerar_titulos_pagar(integer,integer,boolean) TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW "Teste ERP".vw_contas_pagar AS
SELECT t.id, t.numero, t.parcela, t.id_empresa, e.nome AS empresa,
       t.id_fornecedor, fo.nome AS fornecedor, fo.cpf_cnpj,
       t.id_plano_conta, t.id_centro_custo,
       t.origem, t.id_origem, t.data_emissao, t.data_vencimento,
       t.valor, COALESCE(t.valor_pago,0) AS valor_pago, t.valor_saldo, t.status,
       (t.status NOT IN ('PAGO','CANCELADO','RENEGOCIADO') AND t.data_vencimento < CURRENT_DATE) AS vencido,
       CASE WHEN t.status NOT IN ('PAGO','CANCELADO','RENEGOCIADO') AND t.data_vencimento < CURRENT_DATE
            THEN (CURRENT_DATE - t.data_vencimento) ELSE 0 END AS dias_atraso
  FROM "Teste ERP".titulos t
  LEFT JOIN "Teste ERP".fornecedores fo ON fo.id = t.id_fornecedor
  LEFT JOIN "Teste ERP".empresas e ON e.id = t.id_empresa
 WHERE t.tipo = 'CP';
GRANT SELECT ON "Teste ERP".vw_contas_pagar TO anon, authenticated, service_role;
