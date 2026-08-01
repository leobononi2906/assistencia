-- ============================================================================
-- ERP Bononi — Módulo Financeiro
-- Liberação de prazo por cliente + geração automática de títulos (CR)
-- Schema: "Teste ERP" (Supabase vishxwdxqiygbxmtpfoy)
-- Data: 2026-08-01
-- ============================================================================
-- Regras aplicadas (skill bononi-erp / regras-negocio):
--   * À vista e cartão NÃO consomem limite de crédito.
--   * À prazo (usa_limite_credito=true) só é permitido se o cliente estiver
--     liberado (clientes.permite_prazo) E couber no limite disponível
--     (limite_credito - saldo devedor real em aberto).
--   * Saldo do título é calculado (valor_saldo = valor - valor_pago, coluna
--     gerada) — nunca digitado.
-- ============================================================================

-- 1) Flag de liberação de prazo por cliente ---------------------------------
ALTER TABLE "Teste ERP".clientes
  ADD COLUMN IF NOT EXISTS permite_prazo boolean NOT NULL DEFAULT false;

-- Seed: quem já tinha uma condição a prazo atribuída começa liberado
UPDATE "Teste ERP".clientes
   SET permite_prazo = true
 WHERE id_condicao_pagamento IS NOT NULL AND id_condicao_pagamento <> 1;

-- 2) Geração automática de títulos a receber (VENDA ou OS) ------------------
CREATE OR REPLACE FUNCTION "Teste ERP".fn_gerar_titulos_receber(
  p_origem       text,      -- 'VENDA' ou 'OS'
  p_id_origem    integer,
  p_id_usuario   integer DEFAULT NULL,
  p_reprocessar  boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = "Teste ERP", public
AS $$
DECLARE
  v_id_cliente int; v_id_empresa int; v_valor numeric; v_forma int;
  v_cond int; v_cc int; v_numero text;
  v_modalidade text; v_usa_limite boolean;
  v_permite boolean; v_limite numeric; v_devedor numeric; v_disp numeric;
  v_np int; v_intervalo int; v_entrada boolean;
  v_i int; v_offset int; v_valor_parc numeric; v_soma numeric := 0;
  v_venc date; v_ids int[] := '{}'; v_novo int;
BEGIN
  IF upper(p_origem) NOT IN ('VENDA','OS') THEN
    RAISE EXCEPTION 'Origem invalida: %', p_origem;
  END IF;

  -- Lê o documento de origem
  IF upper(p_origem) = 'VENDA' THEN
    SELECT id_cliente,id_empresa,valor_total,id_forma_pagamento,id_condicao_pagamento,id_centro_custo,numero
      INTO v_id_cliente,v_id_empresa,v_valor,v_forma,v_cond,v_cc,v_numero
      FROM vendas WHERE id = p_id_origem AND cancelada = false;
  ELSE
    SELECT id_cliente,id_empresa,valor_total,id_forma_pagamento,id_condicao_pagamento,id_centro_custo,numero
      INTO v_id_cliente,v_id_empresa,v_valor,v_forma,v_cond,v_cc,v_numero
      FROM ordens_servico WHERE id = p_id_origem AND cancelada = false;
  END IF;
  IF v_id_cliente IS NULL THEN
    RAISE EXCEPTION '% % nao encontrada ou cancelada', p_origem, p_id_origem;
  END IF;
  IF COALESCE(v_valor,0) <= 0 THEN
    RAISE EXCEPTION 'Valor total invalido para gerar titulo';
  END IF;

  -- Idempotência: não duplica; com p_reprocessar refaz sem apagar parcela já baixada
  IF EXISTS (SELECT 1 FROM titulos WHERE origem = upper(p_origem) AND id_origem = p_id_origem) THEN
    IF NOT p_reprocessar THEN
      RAISE EXCEPTION 'Titulos ja gerados para % %', p_origem, p_id_origem;
    END IF;
    DELETE FROM titulos
     WHERE origem = upper(p_origem) AND id_origem = p_id_origem
       AND NOT EXISTS (SELECT 1 FROM titulos_baixas b WHERE b.id_titulo = titulos.id);
  END IF;

  -- Forma de pagamento -> modalidade
  SELECT modalidade, usa_limite_credito INTO v_modalidade, v_usa_limite
    FROM formas_pagamento WHERE id = v_forma;

  -- Trava de crédito só para A_PRAZO
  IF v_modalidade = 'A_PRAZO' OR v_usa_limite THEN
    SELECT permite_prazo, COALESCE(limite_credito,0) INTO v_permite, v_limite
      FROM clientes WHERE id = v_id_cliente;
    IF NOT COALESCE(v_permite,false) THEN
      RAISE EXCEPTION 'Cliente % nao esta liberado para venda a prazo', v_id_cliente;
    END IF;
    SELECT COALESCE(SUM(COALESCE(valor_saldo, valor - COALESCE(valor_pago,0))),0)
      INTO v_devedor
      FROM titulos
     WHERE id_cliente = v_id_cliente AND tipo = 'CR'
       AND status <> 'CANCELADO';
    v_disp := v_limite - v_devedor;
    IF v_valor > v_disp THEN
      RAISE EXCEPTION 'Limite insuficiente: disponivel R$ %, venda R$ %', round(v_disp,2), round(v_valor,2);
    END IF;
  END IF;

  -- Parcelamento a partir da condição
  SELECT COALESCE(num_parcelas,1), COALESCE(intervalo_dias,0), COALESCE(entrada,false)
    INTO v_np, v_intervalo, v_entrada
    FROM condicoes_pagamento WHERE id = v_cond;
  IF v_np IS NULL THEN v_np := 1; v_intervalo := 0; v_entrada := false; END IF;

  v_valor_parc := round(v_valor / v_np, 2);

  FOR v_i IN 1..v_np LOOP
    IF v_entrada THEN v_offset := v_intervalo * (v_i - 1);   -- 1ª parcela = entrada (hoje)
                 ELSE v_offset := v_intervalo * v_i; END IF;
    v_venc := CURRENT_DATE + v_offset;

    IF v_i = v_np THEN v_valor_parc := v_valor - v_soma; END IF;  -- ajuste de centavos na última
    v_soma := v_soma + v_valor_parc;

    INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_cliente,id_forma_pagamento,
                         origem,id_origem,numero_origem,data_emissao,data_vencimento,
                         valor,status,id_centro_custo)
    VALUES ('CR',v_numero,v_i||'/'||v_np,v_id_empresa,v_id_cliente,v_forma,
            upper(p_origem),p_id_origem,v_numero,CURRENT_DATE,v_venc,
            v_valor_parc,'ABERTO',v_cc)
    RETURNING id INTO v_novo;
    v_ids := array_append(v_ids, v_novo);
  END LOOP;

  RETURN jsonb_build_object('ok',true,'origem',upper(p_origem),'id_origem',p_id_origem,
                            'parcelas',v_np,'valor_total',v_valor,'titulos',v_ids);
END $$;

GRANT EXECUTE ON FUNCTION "Teste ERP".fn_gerar_titulos_receber(text,integer,integer,boolean)
  TO anon, authenticated, service_role;
