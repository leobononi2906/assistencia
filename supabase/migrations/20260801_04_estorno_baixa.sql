-- ERP Bononi — Financeiro / Estorno de baixa de título
-- Reverte titulos_baixas + contas_movimentos e recompõe status/valor_pago do título.
CREATE OR REPLACE FUNCTION "Teste ERP".fn_estornar_baixa(
  p_id_baixa integer, p_id_usuario integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = "Teste ERP", public
AS $$
DECLARE
  v_id_titulo int; v_conta int; v_pago numeric; v_desc numeric; v_juros numeric; v_multa numeric;
  v_estornado boolean; v_amortizado numeric;
  v_tipo text; v_valor numeric; v_valor_pago numeric; v_novo_pago numeric; v_novo_status text;
  v_saldo_conta numeric; v_saldo_post numeric; v_tipo_mov text; v_mov RECORD;
BEGIN
  SELECT id_titulo,id_conta_financeira,valor_pago,valor_desconto,valor_juros,valor_multa,estornado
    INTO v_id_titulo,v_conta,v_pago,v_desc,v_juros,v_multa,v_estornado
    FROM titulos_baixas WHERE id = p_id_baixa FOR UPDATE;
  IF v_id_titulo IS NULL THEN RAISE EXCEPTION 'Baixa % nao encontrada', p_id_baixa; END IF;
  IF v_estornado THEN RAISE EXCEPTION 'Baixa % ja estornada', p_id_baixa; END IF;

  v_amortizado := v_pago + COALESCE(v_desc,0) - COALESCE(v_juros,0) - COALESCE(v_multa,0);

  SELECT tipo, valor, COALESCE(valor_pago,0) INTO v_tipo, v_valor, v_valor_pago
    FROM titulos WHERE id = v_id_titulo FOR UPDATE;
  v_novo_pago := GREATEST(v_valor_pago - v_amortizado, 0);
  v_novo_status := CASE WHEN round(v_novo_pago,2) >= round(v_valor,2) THEN 'PAGO'
                        WHEN v_novo_pago > 0 THEN 'PAGO_PARCIAL' ELSE 'ABERTO' END;
  UPDATE titulos
     SET valor_pago = v_novo_pago, status = v_novo_status,
         data_baixa = CASE WHEN v_novo_status = 'PAGO' THEN data_baixa ELSE NULL END,
         atualizado_em = now()
   WHERE id = v_id_titulo;

  UPDATE titulos_baixas
     SET estornado = true, estornado_em = now(), id_usuario_estorno = p_id_usuario
   WHERE id = p_id_baixa;

  FOR v_mov IN SELECT * FROM contas_movimentos
                WHERE id_titulo_baixa = p_id_baixa AND COALESCE(estornado,false) = false LOOP
    UPDATE contas_movimentos SET estornado = true WHERE id = v_mov.id;
    v_tipo_mov := CASE WHEN v_mov.tipo = 'C' THEN 'D' ELSE 'C' END;
    SELECT COALESCE(saldo_atual,0) INTO v_saldo_conta FROM contas_financeiras WHERE id = v_mov.id_conta_financeira FOR UPDATE;
    v_saldo_post := v_saldo_conta + CASE WHEN v_tipo_mov = 'C' THEN v_mov.valor ELSE -v_mov.valor END;
    INSERT INTO contas_movimentos (id_conta_financeira,id_titulo,id_titulo_baixa,id_usuario,tipo,origem,
                                   descricao,valor,saldo_anterior,saldo_posterior,data_movimento,estornado)
    VALUES (v_mov.id_conta_financeira,v_id_titulo,p_id_baixa,p_id_usuario,v_tipo_mov,'ESTORNO_BAIXA',
            'Estorno da baixa '||p_id_baixa,v_mov.valor,v_saldo_conta,v_saldo_post,CURRENT_DATE,true);
    UPDATE contas_financeiras SET saldo_atual = v_saldo_post WHERE id = v_mov.id_conta_financeira;
  END LOOP;

  RETURN jsonb_build_object('ok',true,'id_baixa',p_id_baixa,'id_titulo',v_id_titulo,
                            'novo_status',v_novo_status,'estornado',round(v_amortizado,2));
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_estornar_baixa(integer,integer) TO anon, authenticated, service_role;
