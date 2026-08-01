-- ============================================================================
-- ERP Bononi — Financeiro / Taxas por forma+condição e Contas a Receber
--   TBL_TAXA_FORMA_PAG -> taxas_forma_pagamento
--   Contas a Receber: view vw_contas_receber + fn_baixar_titulo
-- Schema: "Teste ERP" (Supabase vishxwdxqiygbxmtpfoy) | Data: 2026-08-01
-- Convenções confirmadas no schema real:
--   titulos.tipo = 'CR'/'CP' | titulos.status IN
--     (ABERTO, PAGO_PARCIAL, PAGO, VENCIDO, CANCELADO, RENEGOCIADO)
--   titulos.valor_saldo = coluna gerada (valor - valor_pago)
--   contas_movimentos.tipo = 'C'/'D' (varchar 2, como TIPO_DC do Firebird)
-- ============================================================================

-- 1) Taxas por condição × forma × empresa (espelha TBL_TAXA_FORMA_PAG)
CREATE TABLE IF NOT EXISTS "Teste ERP".taxas_forma_pagamento (
  id                    serial PRIMARY KEY,
  id_empresa            integer NOT NULL REFERENCES "Teste ERP".empresas(id) ON DELETE CASCADE,
  id_condicao_pagamento integer NOT NULL REFERENCES "Teste ERP".condicoes_pagamento(id) ON DELETE CASCADE,
  id_forma_pagamento    integer NOT NULL REFERENCES "Teste ERP".formas_pagamento(id) ON DELETE CASCADE,
  tipo_taxa             char(1) NOT NULL DEFAULT 'P',   -- P=percentual, V=valor fixo
  perc_taxa             numeric(10,4) NOT NULL DEFAULT 0,
  valor_taxa            numeric(14,2) NOT NULL DEFAULT 0,
  ativo                 boolean NOT NULL DEFAULT true,
  UNIQUE (id_empresa, id_condicao_pagamento, id_forma_pagamento)
);
CREATE INDEX IF NOT EXISTS idx_txfp_emp ON "Teste ERP".taxas_forma_pagamento(id_empresa);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".taxas_forma_pagamento TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".taxas_forma_pagamento_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".taxas_forma_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_all ON "Teste ERP".taxas_forma_pagamento FOR ALL USING (true) WITH CHECK (true);

-- 2) View de Contas a Receber (saldo real + dias de atraso)
CREATE OR REPLACE VIEW "Teste ERP".vw_contas_receber AS
SELECT t.id, t.numero, t.parcela, t.id_empresa, e.nome AS empresa,
       t.id_cliente, c.nome AS cliente, c.cpf_cnpj,
       t.id_forma_pagamento, f.descricao AS forma_pagamento,
       t.origem, t.id_origem, t.data_emissao, t.data_vencimento,
       t.valor, COALESCE(t.valor_pago,0) AS valor_pago, t.valor_saldo, t.status,
       (t.status NOT IN ('PAGO','CANCELADO','RENEGOCIADO') AND t.data_vencimento < CURRENT_DATE) AS vencido,
       CASE WHEN t.status NOT IN ('PAGO','CANCELADO','RENEGOCIADO') AND t.data_vencimento < CURRENT_DATE
            THEN (CURRENT_DATE - t.data_vencimento) ELSE 0 END AS dias_atraso
  FROM "Teste ERP".titulos t
  LEFT JOIN "Teste ERP".clientes c ON c.id = t.id_cliente
  LEFT JOIN "Teste ERP".empresas e ON e.id = t.id_empresa
  LEFT JOIN "Teste ERP".formas_pagamento f ON f.id = t.id_forma_pagamento
 WHERE t.tipo = 'CR';
GRANT SELECT ON "Teste ERP".vw_contas_receber TO anon, authenticated, service_role;

-- 3) Baixa de título (gera titulos_baixas + contas_movimentos, atualiza saldos)
CREATE OR REPLACE FUNCTION "Teste ERP".fn_baixar_titulo(
  p_id_titulo integer, p_id_conta_financeira integer, p_valor_pago numeric,
  p_id_forma_pagamento integer DEFAULT NULL, p_id_usuario integer DEFAULT NULL,
  p_valor_desconto numeric DEFAULT 0, p_valor_juros numeric DEFAULT 0, p_valor_multa numeric DEFAULT 0,
  p_data_baixa date DEFAULT NULL, p_observacao text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = "Teste ERP", public
AS $$
DECLARE
  v_tipo text; v_saldo numeric; v_valor_pago_atual numeric; v_valor numeric;
  v_amortizado numeric; v_novo_pago numeric; v_novo_status text;
  v_id_baixa int; v_saldo_conta numeric; v_saldo_post numeric;
  v_tipo_mov text; v_data date; v_numero text; v_parcela text;
BEGIN
  v_data := COALESCE(p_data_baixa, CURRENT_DATE);
  SELECT tipo, valor, COALESCE(valor_pago,0), valor_saldo, numero, parcela
    INTO v_tipo, v_valor, v_valor_pago_atual, v_saldo, v_numero, v_parcela
    FROM titulos WHERE id = p_id_titulo FOR UPDATE;
  IF v_tipo IS NULL THEN RAISE EXCEPTION 'Titulo % nao encontrado', p_id_titulo; END IF;
  IF v_saldo <= 0 THEN RAISE EXCEPTION 'Titulo % ja esta quitado', p_id_titulo; END IF;
  IF COALESCE(p_valor_pago,0) <= 0 THEN RAISE EXCEPTION 'Valor pago invalido'; END IF;

  -- Principal amortizado = pago + desconto - juros - multa (juros/multa nao abatem principal)
  v_amortizado := p_valor_pago + COALESCE(p_valor_desconto,0) - COALESCE(p_valor_juros,0) - COALESCE(p_valor_multa,0);
  IF v_amortizado <= 0 THEN RAISE EXCEPTION 'Valor amortizado invalido'; END IF;
  IF round(v_amortizado,2) > round(v_saldo,2) THEN
    RAISE EXCEPTION 'Valor amortizado (R$ %) maior que o saldo (R$ %)', round(v_amortizado,2), round(v_saldo,2);
  END IF;

  v_novo_pago := v_valor_pago_atual + v_amortizado;
  v_novo_status := CASE WHEN round(v_novo_pago,2) >= round(v_valor,2) THEN 'PAGO'
                        WHEN v_novo_pago > 0 THEN 'PAGO_PARCIAL' ELSE 'ABERTO' END;

  INSERT INTO titulos_baixas (id_titulo,id_conta_financeira,id_forma_pagamento,id_usuario,
                              data_baixa,valor_pago,valor_desconto,valor_juros,valor_multa,observacao)
  VALUES (p_id_titulo,p_id_conta_financeira,p_id_forma_pagamento,p_id_usuario,
          v_data,p_valor_pago,COALESCE(p_valor_desconto,0),COALESCE(p_valor_juros,0),
          COALESCE(p_valor_multa,0),p_observacao)
  RETURNING id INTO v_id_baixa;

  UPDATE titulos
     SET valor_pago = v_novo_pago, status = v_novo_status,
         data_baixa = CASE WHEN v_novo_status = 'PAGO' THEN v_data ELSE data_baixa END,
         atualizado_em = now()
   WHERE id = p_id_titulo;

  -- Movimento na conta financeira: 'C' (CR entra) / 'D' (CP sai)
  v_tipo_mov := CASE WHEN v_tipo = 'CR' THEN 'C' ELSE 'D' END;
  SELECT COALESCE(saldo_atual,0) INTO v_saldo_conta FROM contas_financeiras WHERE id = p_id_conta_financeira FOR UPDATE;
  IF v_saldo_conta IS NULL THEN RAISE EXCEPTION 'Conta financeira % nao encontrada', p_id_conta_financeira; END IF;
  v_saldo_post := v_saldo_conta + CASE WHEN v_tipo = 'CR' THEN p_valor_pago ELSE -p_valor_pago END;

  INSERT INTO contas_movimentos (id_conta_financeira,id_titulo,id_titulo_baixa,id_usuario,tipo,origem,
                                 descricao,valor,saldo_anterior,saldo_posterior,data_movimento)
  VALUES (p_id_conta_financeira,p_id_titulo,v_id_baixa,p_id_usuario,v_tipo_mov,'BAIXA_TITULO',
          'Baixa titulo '||COALESCE(v_numero,'')||' parc '||COALESCE(v_parcela,''),
          p_valor_pago,v_saldo_conta,v_saldo_post,v_data);

  UPDATE contas_financeiras SET saldo_atual = v_saldo_post WHERE id = p_id_conta_financeira;

  RETURN jsonb_build_object('ok',true,'id_titulo',p_id_titulo,'id_baixa',v_id_baixa,
                            'amortizado',round(v_amortizado,2),'novo_status',v_novo_status,
                            'saldo_conta',round(v_saldo_post,2));
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_baixar_titulo(integer,integer,numeric,integer,integer,numeric,numeric,numeric,date,text)
  TO anon, authenticated, service_role;
