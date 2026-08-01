-- ERP Bononi — fn_gerar_nfe passa a calcular IBS / CBS / IS (reforma tributária)
-- Convive com ICMS/ST/IPI/PIS/COFINS no período de transição. Resolve CST IBS/CBS e
-- cClassTrib por empresa (produtos_fiscal_empresa) com fallback no grupo tributário.

CREATE OR REPLACE FUNCTION "Teste ERP".fn_gerar_nfe(
  p_origem text, p_id_origem integer, p_id_natureza_op integer,
  p_id_usuario integer DEFAULT NULL, p_serie text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path TO 'Teste ERP','public' AS $function$
DECLARE
  v_emp int; v_cli int; v_cfop text; v_serie text; v_amb text; v_numero int; v_nfe int;
  v_item RECORD; v_i int := 0; v_gt RECORD; v_ncm text; v_idgt int;
  v_cstibs text; v_cclass text; v_bc numeric; v_bcst numeric;
  v_vicms numeric; v_vst numeric; v_vipi numeric; v_vpis numeric; v_vcof numeric;
  v_ibsuf numeric; v_ibsmun numeric; v_cbs numeric; v_is numeric;
  t_prod numeric:=0; t_ipi numeric:=0; t_st numeric:=0; t_pis numeric:=0; t_cof numeric:=0; t_desc numeric:=0;
  t_ibsuf numeric:=0; t_ibsmun numeric:=0; t_cbs numeric:=0; t_is numeric:=0;
BEGIN
  IF upper(p_origem) NOT IN ('VENDA','OS') THEN RAISE EXCEPTION 'Origem invalida'; END IF;
  SELECT cfop INTO v_cfop FROM naturezas_operacao WHERE id=p_id_natureza_op;
  IF v_cfop IS NULL THEN RAISE EXCEPTION 'Natureza de operacao invalida'; END IF;
  IF upper(p_origem)='VENDA' THEN SELECT id_empresa,id_cliente INTO v_emp,v_cli FROM vendas WHERE id=p_id_origem;
  ELSE SELECT id_empresa,id_cliente INTO v_emp,v_cli FROM ordens_servico WHERE id=p_id_origem; END IF;
  IF v_emp IS NULL THEN RAISE EXCEPTION '% % nao encontrada', p_origem,p_id_origem; END IF;
  v_serie := COALESCE(p_serie, "Teste ERP".fn_config('nfe_serie', v_emp), '1');
  v_amb := COALESCE("Teste ERP".fn_config('nfe_ambiente', v_emp), 'HOMOLOGACAO');
  SELECT COALESCE(MAX(numero),0)+1 INTO v_numero FROM nfe WHERE id_empresa=v_emp AND serie=v_serie;
  INSERT INTO nfe (id_empresa,id_venda,id_os,id_natureza_op,numero,serie,modelo,id_cliente,status,ambiente,data_emissao)
  VALUES (v_emp, CASE WHEN upper(p_origem)='VENDA' THEN p_id_origem END,
                CASE WHEN upper(p_origem)='OS' THEN p_id_origem END,
          p_id_natureza_op,v_numero,v_serie,'55',v_cli,'PENDENTE',v_amb,now())
  RETURNING id INTO v_nfe;

  FOR v_item IN
    SELECT * FROM (
      SELECT id_produto, descricao, quantidade, valor_unitario, COALESCE(valor_total,quantidade*valor_unitario) AS valor_total,
             COALESCE(valor_desconto,0) AS valor_desconto, id_unidade
        FROM vendas_itens WHERE upper(p_origem)='VENDA' AND id_venda=p_id_origem AND tipo='PRODUTO' AND id_produto IS NOT NULL
      UNION ALL
      SELECT id_produto, descricao, quantidade, valor_unitario, COALESCE(valor_total,quantidade*valor_unitario),
             COALESCE(valor_desconto,0), id_unidade
        FROM os_pecas WHERE upper(p_origem)='OS' AND id_os=p_id_origem AND id_produto IS NOT NULL
    ) x
  LOOP
    v_i := v_i + 1;
    v_idgt := "Teste ERP".fn_grupo_trib_produto(v_item.id_produto, v_emp);
    v_ncm  := "Teste ERP".fn_ncm_produto(v_item.id_produto, v_emp);
    SELECT * INTO v_gt FROM grupos_tributarios WHERE id=v_idgt;
    -- CST/cClassTrib da reforma: override por empresa, senão do grupo
    v_cstibs := COALESCE((SELECT cst_ibscbs FROM produtos_fiscal_empresa WHERE id_produto=v_item.id_produto AND id_empresa=v_emp AND ativo), v_gt.cst_ibscbs);
    v_cclass := COALESCE((SELECT cclasstrib FROM produtos_fiscal_empresa WHERE id_produto=v_item.id_produto AND id_empresa=v_emp AND ativo), v_gt.cclasstrib);

    -- Tributos atuais (ICMS/ST/IPI/PIS/COFINS)
    v_bc := v_item.valor_total * (1 - COALESCE(v_gt.red_bc_icms,0)/100.0);
    v_vicms := round(v_bc * COALESCE(v_gt.aliq_icms,0)/100.0, 2);
    v_bcst := CASE WHEN v_gt.aliq_icms_st IS NOT NULL AND v_gt.aliq_icms_st>0 THEN v_item.valor_total*(1+COALESCE(v_gt.mva_st,0)/100.0) ELSE 0 END;
    v_vst := CASE WHEN v_bcst>0 THEN GREATEST(round(v_bcst*COALESCE(v_gt.aliq_icms_st,0)/100.0,2)-v_vicms,0) ELSE 0 END;
    v_vipi := round(v_item.valor_total*COALESCE(v_gt.aliq_ipi,0)/100.0,2);
    v_vpis := round(v_item.valor_total*COALESCE(v_gt.aliq_pis,0)/100.0,2);
    v_vcof := round(v_item.valor_total*COALESCE(v_gt.aliq_cofins,0)/100.0,2);
    -- Reforma (IBS/CBS/IS)
    v_ibsuf  := round(v_item.valor_total*(1-COALESCE(v_gt.red_ibs,0)/100.0)*COALESCE(v_gt.aliq_ibs_uf,0)/100.0,2);
    v_ibsmun := round(v_item.valor_total*(1-COALESCE(v_gt.red_ibs,0)/100.0)*COALESCE(v_gt.aliq_ibs_mun,0)/100.0,2);
    v_cbs    := round(v_item.valor_total*(1-COALESCE(v_gt.red_cbs,0)/100.0)*COALESCE(v_gt.aliq_cbs,0)/100.0,2);
    v_is     := round(v_item.valor_total*COALESCE(v_gt.aliq_is,0)/100.0,2);

    INSERT INTO nfe_itens (id_nfe,id_produto,id_grupo_tributario,id_natureza_op,numero_item,descricao,ncm,cfop,
        id_unidade,quantidade,valor_unitario,valor_total,valor_desconto,
        cst_icms,bc_icms,aliq_icms,valor_icms,bc_icms_st,aliq_icms_st,valor_icms_st,
        cst_ipi,aliq_ipi,valor_ipi,cst_pis,aliq_pis,valor_pis,cst_cofins,aliq_cofins,valor_cofins,
        cst_ibscbs,cclasstrib,bc_ibs_cbs,aliq_ibs_uf,valor_ibs_uf,aliq_ibs_mun,valor_ibs_mun,aliq_cbs,valor_cbs,cst_is,aliq_is,valor_is)
    VALUES (v_nfe,v_item.id_produto,v_gt.id,p_id_natureza_op,v_i,v_item.descricao,COALESCE(v_ncm,''),v_cfop,
        v_item.id_unidade,v_item.quantidade,v_item.valor_unitario,v_item.valor_total,v_item.valor_desconto,
        v_gt.cst_icms,v_bc,v_gt.aliq_icms,v_vicms,v_bcst,v_gt.aliq_icms_st,v_vst,
        v_gt.cst_ipi,v_gt.aliq_ipi,v_vipi,v_gt.cst_pis,v_gt.aliq_pis,v_vpis,v_gt.cst_cofins,v_gt.aliq_cofins,v_vcof,
        v_cstibs,v_cclass,v_item.valor_total,v_gt.aliq_ibs_uf,v_ibsuf,v_gt.aliq_ibs_mun,v_ibsmun,v_gt.aliq_cbs,v_cbs,v_gt.cst_is,v_gt.aliq_is,v_is);

    t_prod:=t_prod+v_item.valor_total; t_ipi:=t_ipi+v_vipi; t_st:=t_st+v_vst;
    t_pis:=t_pis+v_vpis; t_cof:=t_cof+v_vcof; t_desc:=t_desc+v_item.valor_desconto;
    t_ibsuf:=t_ibsuf+v_ibsuf; t_ibsmun:=t_ibsmun+v_ibsmun; t_cbs:=t_cbs+v_cbs; t_is:=t_is+v_is;
  END LOOP;
  IF v_i=0 THEN RAISE EXCEPTION 'Documento sem itens de produto para faturar'; END IF;
  UPDATE nfe SET valor_produtos=t_prod, valor_desconto=t_desc, valor_ipi=t_ipi, valor_icms_st=t_st,
                 valor_pis=t_pis, valor_cofins=t_cof, valor_ibs_uf=t_ibsuf, valor_ibs_mun=t_ibsmun,
                 valor_cbs=t_cbs, valor_is=t_is,
                 valor_total=t_prod - t_desc + t_ipi + t_st + t_is, atualizado_em=now()
   WHERE id=v_nfe;
  RETURN jsonb_build_object('ok',true,'id_nfe',v_nfe,'numero',v_numero,'itens',v_i,
                            'valor_total',round(t_prod - t_desc + t_ipi + t_st + t_is,2),
                            'ibs',round(t_ibsuf+t_ibsmun,2),'cbs',round(t_cbs,2),'is',round(t_is,2),'ambiente',v_amb);
END $function$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_gerar_nfe(text,int,int,int,text) TO anon,authenticated,service_role;
