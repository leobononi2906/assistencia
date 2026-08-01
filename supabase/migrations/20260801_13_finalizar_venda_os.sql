-- ERP Bononi — Finalização de pedido = gera SÓ o movimento financeiro (título).
-- NF-e é acessório e INDEPENDENTE: não é gerada nem exigida na finalização.
-- Status de fechamento: 'FATURADA' (= financeiro gerado; NADA a ver com NF emitida).

CREATE OR REPLACE FUNCTION "Teste ERP".fn_finalizar_venda(p_id_venda int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path="Teste ERP",public AS $$
DECLARE v_status text; v_canc boolean; v_forma int; v_total numeric; r jsonb;
BEGIN
  SELECT status,cancelada,id_forma_pagamento,valor_total INTO v_status,v_canc,v_forma,v_total
    FROM vendas WHERE id=p_id_venda FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Venda % nao encontrada', p_id_venda; END IF;
  IF v_canc THEN RAISE EXCEPTION 'Venda cancelada'; END IF;
  IF v_status='FATURADA' THEN RAISE EXCEPTION 'Venda ja finalizada'; END IF;
  IF v_forma IS NULL THEN RAISE EXCEPTION 'Defina a forma de pagamento antes de finalizar'; END IF;
  PERFORM "Teste ERP".fn_recalc_totais('VENDA',p_id_venda);
  SELECT valor_total INTO v_total FROM vendas WHERE id=p_id_venda;
  IF COALESCE(v_total,0)<=0 THEN RAISE EXCEPTION 'Venda sem valor para finalizar'; END IF;
  r := "Teste ERP".fn_gerar_titulos_receber('VENDA',p_id_venda,p_id_usuario,false);
  UPDATE vendas SET status='FATURADA', data_faturamento=now(), atualizado_em=now() WHERE id=p_id_venda;
  RETURN jsonb_build_object('ok',true,'id_venda',p_id_venda,'status','FATURADA','financeiro',r);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_finalizar_venda(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION "Teste ERP".fn_finalizar_os(p_id_os int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path="Teste ERP",public AS $$
DECLARE v_status text; v_canc boolean; v_forma int; v_total numeric; r jsonb;
BEGIN
  SELECT status,cancelada,id_forma_pagamento,valor_total INTO v_status,v_canc,v_forma,v_total
    FROM ordens_servico WHERE id=p_id_os FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'OS % nao encontrada', p_id_os; END IF;
  IF v_canc THEN RAISE EXCEPTION 'OS cancelada'; END IF;
  IF v_status='FATURADA' THEN RAISE EXCEPTION 'OS ja finalizada'; END IF;
  IF v_forma IS NULL THEN RAISE EXCEPTION 'Defina a forma de pagamento antes de finalizar'; END IF;
  PERFORM "Teste ERP".fn_recalc_totais('OS',p_id_os);
  SELECT valor_total INTO v_total FROM ordens_servico WHERE id=p_id_os;
  IF COALESCE(v_total,0)<=0 THEN RAISE EXCEPTION 'OS sem valor para finalizar'; END IF;
  r := "Teste ERP".fn_gerar_titulos_receber('OS',p_id_os,p_id_usuario,false);
  UPDATE ordens_servico SET status='FATURADA', data_saida=COALESCE(data_saida,now()), atualizado_em=now() WHERE id=p_id_os;
  RETURN jsonb_build_object('ok',true,'id_os',p_id_os,'status','FATURADA','financeiro',r);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_finalizar_os(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_finalizar_venda(p_id_venda int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_finalizar_venda(p_id_venda,p_id_usuario); $$;
CREATE OR REPLACE FUNCTION public.erp_finalizar_os(p_id_os int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_finalizar_os(p_id_os,p_id_usuario); $$;
GRANT EXECUTE ON FUNCTION public.erp_finalizar_venda(int,int) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_finalizar_os(int,int) TO anon,authenticated,service_role;
