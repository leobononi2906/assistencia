-- ERP Bononi — Inventário: regra de dupla contagem
-- Um item encerra quando a contagem REPETE a referência: na 1ª contagem a referência é o saldo do
-- sistema; nas seguintes é a contagem anterior. Ex.: sistema 4, conto 4 -> encerra; conto 3 (≠4)
-- abre nova contagem, conto 3 de novo -> encerra em 3. Só itens ENCERRADOS entram no ajuste.

ALTER TABLE "Teste ERP".inventarios_itens
  ADD COLUMN IF NOT EXISTS num_contagens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS encerrado boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.erp_inventario_contar(int,numeric);
CREATE OR REPLACE FUNCTION public.erp_inventario_contar(p_id_item int, p_qtd numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE it RECORD; v_ref numeric; v_enc boolean;
BEGIN
  SELECT * INTO it FROM inventarios_itens WHERE id=p_id_item;
  IF it.id IS NULL THEN RAISE EXCEPTION 'Item % não encontrado', p_id_item; END IF;
  v_ref := CASE WHEN COALESCE(it.num_contagens,0)=0 THEN COALESCE(it.estoque_sistema,0) ELSE it.quantidade_contada END;
  v_enc := (p_qtd = v_ref);
  UPDATE inventarios_itens
     SET quantidade_contada=p_qtd, num_contagens=COALESCE(num_contagens,0)+1, encerrado=v_enc
   WHERE id=p_id_item;
  RETURN jsonb_build_object('ok',true,'encerrado',v_enc,'num_contagens',COALESCE(it.num_contagens,0)+1,
     'referencia',v_ref,'quantidade',p_qtd,
     'mensagem', CASE WHEN v_enc THEN 'Item encerrado (contagem confirmada)'
                      ELSE 'Diverge da referência — faça nova contagem para confirmar' END);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_contar(int,numeric) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'inv', (SELECT to_jsonb(v) FROM "Teste ERP".vw_inventarios v WHERE v.id=p_id),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'id_produto',i.id_produto,
        'produto',(SELECT nome FROM "Teste ERP".produtos WHERE id=i.id_produto),
        'referencia',(SELECT referencia FROM "Teste ERP".produtos WHERE id=i.id_produto),
        'saldo_sistema',i.estoque_sistema,'qtd_contada',i.quantidade_contada,'diferenca',i.diferenca,
        'num_contagens',i.num_contagens,'encerrado',i.encerrado,'ajustado',i.ajustado)
        ORDER BY (SELECT nome FROM "Teste ERP".produtos WHERE id=i.id_produto))
      FROM "Teste ERP".inventarios_itens i WHERE i.id_inventario=p_id),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_detalhe(int) TO anon,authenticated,service_role;

-- ajuste aplica só ENCERRADOS; bloqueia se houver contagem divergente aberta (salvo p_forcar)
DROP FUNCTION IF EXISTS public.erp_inventario_ajustar(int,int);
CREATE OR REPLACE FUNCTION public.erp_inventario_ajustar(p_id int, p_id_usuario int DEFAULT NULL, p_forcar boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE inv RECORD; it RECORD; n int:=0; v_dif numeric; v_pend int;
BEGIN
  SELECT * INTO inv FROM inventarios WHERE id=p_id;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'Inventário % não encontrado', p_id; END IF;
  IF inv.status NOT IN ('ABERTO','EM_CONTAGEM','CONFERENCIA') THEN RAISE EXCEPTION 'Inventário % já processado (status %)', p_id, inv.status; END IF;
  SELECT count(*) INTO v_pend FROM inventarios_itens
    WHERE id_inventario=p_id AND quantidade_contada IS NOT NULL AND COALESCE(encerrado,false)=false;
  IF v_pend > 0 AND NOT p_forcar THEN
    RAISE EXCEPTION '% item(ns) com contagem divergente ainda não encerrada. Reconte ou use forçar.', v_pend;
  END IF;
  FOR it IN SELECT * FROM inventarios_itens
     WHERE id_inventario=p_id AND quantidade_contada IS NOT NULL AND COALESCE(ajustado,false)=false
       AND (COALESCE(encerrado,false)=true OR p_forcar) LOOP
    v_dif := COALESCE(it.diferenca, it.quantidade_contada - COALESCE(it.estoque_sistema,0));
    IF v_dif > 0 THEN
      PERFORM fn_estoque_entrada(it.id_produto, inv.id_centro, inv.id_empresa, v_dif, 'INVENTARIO', p_id, inv.numero, p_id_usuario, NULL);
    ELSIF v_dif < 0 THEN
      PERFORM fn_estoque_saida(it.id_produto, inv.id_centro, inv.id_empresa, -v_dif, 'INVENTARIO', p_id, inv.numero, p_id_usuario, false);
    END IF;
    UPDATE inventarios_itens SET ajustado=true WHERE id=it.id;
    IF v_dif <> 0 THEN n := n+1; END IF;
  END LOOP;
  UPDATE inventarios SET status='FINALIZADO', data_finalizacao=now() WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'itens_ajustados',n,'pendentes_ignorados',CASE WHEN p_forcar THEN 0 ELSE v_pend END,'status','FINALIZADO');
END $$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_ajustar(int,int,boolean) TO anon,authenticated,service_role;
