-- ERP Bononi — Financeiro / Caixa (abertura, movimento, fechamento)
-- caixas_movimentos.tipo IN (RECEBIMENTO, PAGAMENTO, SUPRIMENTO, SANGRIA)
-- caixas_sessoes.status IN (ABERTO, FECHADO); valor de abertura fica na sessão.
CREATE OR REPLACE FUNCTION "Teste ERP".fn_abrir_caixa(
  p_id_empresa integer, p_id_conta_financeira integer, p_id_usuario integer, p_valor_abertura numeric DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = "Teste ERP", public
AS $$
DECLARE v_id int;
BEGIN
  IF EXISTS (SELECT 1 FROM caixas_sessoes WHERE id_conta_financeira = p_id_conta_financeira AND status = 'ABERTO') THEN
    RAISE EXCEPTION 'Ja existe caixa aberto para esta conta';
  END IF;
  INSERT INTO caixas_sessoes (id_empresa,id_conta_financeira,id_usuario_abertura,valor_abertura,status)
  VALUES (p_id_empresa,p_id_conta_financeira,p_id_usuario,COALESCE(p_valor_abertura,0),'ABERTO')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok',true,'id_sessao',v_id);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_abrir_caixa(integer,integer,integer,numeric) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION "Teste ERP".fn_movimento_caixa(
  p_id_sessao integer, p_tipo text, p_valor numeric, p_descricao text DEFAULT NULL,
  p_id_usuario integer DEFAULT NULL, p_id_forma_pagamento integer DEFAULT NULL,
  p_id_plano_conta integer DEFAULT NULL, p_id_centro_custo integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = "Teste ERP", public
AS $$
DECLARE v_id int; v_status text;
BEGIN
  IF upper(p_tipo) NOT IN ('SUPRIMENTO','SANGRIA','RECEBIMENTO','PAGAMENTO') THEN
    RAISE EXCEPTION 'Tipo de movimento invalido: %', p_tipo;
  END IF;
  SELECT status INTO v_status FROM caixas_sessoes WHERE id = p_id_sessao;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Sessao % nao encontrada', p_id_sessao; END IF;
  IF v_status <> 'ABERTO' THEN RAISE EXCEPTION 'Caixa % nao esta aberto', p_id_sessao; END IF;
  IF COALESCE(p_valor,0) <= 0 THEN RAISE EXCEPTION 'Valor invalido'; END IF;
  INSERT INTO caixas_movimentos (id_sessao,tipo,valor,descricao,id_usuario,id_forma_pagamento,id_plano_conta,id_centro_custo)
  VALUES (p_id_sessao,upper(p_tipo),p_valor,p_descricao,p_id_usuario,p_id_forma_pagamento,p_id_plano_conta,p_id_centro_custo)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok',true,'id_movimento',v_id);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_movimento_caixa(integer,text,numeric,text,integer,integer,integer,integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION "Teste ERP".fn_fechar_caixa(
  p_id_sessao integer, p_valor_contado numeric, p_id_usuario integer DEFAULT NULL, p_observacao text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = "Teste ERP", public
AS $$
DECLARE v_status text; v_abertura numeric; v_mov numeric; v_sistema numeric; v_dif numeric;
BEGIN
  SELECT status, COALESCE(valor_abertura,0) INTO v_status, v_abertura
    FROM caixas_sessoes WHERE id = p_id_sessao FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Sessao % nao encontrada', p_id_sessao; END IF;
  IF v_status <> 'ABERTO' THEN RAISE EXCEPTION 'Caixa % ja esta fechado', p_id_sessao; END IF;
  SELECT COALESCE(SUM(CASE WHEN tipo IN ('SUPRIMENTO','RECEBIMENTO') THEN valor ELSE -valor END),0)
    INTO v_mov FROM caixas_movimentos WHERE id_sessao = p_id_sessao;
  v_sistema := v_abertura + v_mov;
  v_dif := COALESCE(p_valor_contado,0) - v_sistema;
  UPDATE caixas_sessoes
     SET status='FECHADO', id_usuario_fechamento=p_id_usuario, data_fechamento=now(),
         valor_sistema=v_sistema, valor_contado=COALESCE(p_valor_contado,0), diferenca=v_dif, observacao=p_observacao
   WHERE id = p_id_sessao;
  RETURN jsonb_build_object('ok',true,'id_sessao',p_id_sessao,'valor_sistema',round(v_sistema,2),
                            'valor_contado',round(COALESCE(p_valor_contado,0),2),'diferenca',round(v_dif,2));
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_fechar_caixa(integer,numeric,integer,text) TO anon, authenticated, service_role;
