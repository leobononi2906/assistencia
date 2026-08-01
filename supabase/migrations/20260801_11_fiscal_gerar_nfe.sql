-- ERP Bononi — Fiscal / NF-e: geração a partir de Venda/OS + retorno + view
-- (independente do provedor; emissão real na Edge Function emitir-nfe)

INSERT INTO "Teste ERP".configuracoes (chave,valor)
SELECT * FROM (VALUES ('nfe_ambiente','HOMOLOGACAO'),('nfe_serie','1'),('nfe_provider','FOCUS')) v(chave,valor)
WHERE NOT EXISTS (SELECT 1 FROM "Teste ERP".configuracoes c WHERE c.chave=v.chave);

-- Corrige tamanho de nfe.ambiente (o check exige 'HOMOLOGACAO' = 11 chars)
DROP VIEW IF EXISTS "Teste ERP".vw_nfe;
ALTER TABLE "Teste ERP".nfe ALTER COLUMN ambiente TYPE varchar(12);

CREATE OR REPLACE FUNCTION "Teste ERP".fn_gerar_nfe(
  p_origem text, p_id_origem int, p_id_natureza_op int, p_id_usuario int DEFAULT NULL, p_serie text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path="Teste ERP",public AS $$
DECLARE
  v_emp int; v_cli int; v_cfop text; v_serie text; v_amb text; v_numero int; v_nfe int;
  v_item RECORD; v_i int := 0; v_gt RECORD; v_ncm text; v_bc numeric; v_bcst numeric;
  v_vicms numeric; v_vst numeric; v_vipi numeric; v_vpis numeric; v_vcof numeric;
  t_prod numeric:=0; t_ipi numeric:=0; t_st numeric:=0; t_pis numeric:=0; t_cof numeric:=0; t_desc numeric:=0;
BEGIN
  IF upper(p_origem) NOT IN ('VENDA','OS') THEN RAISE EXCEPTION 'Origem invalida'; END IF;
  SELECT cfop INTO v_cfop FROM naturezas_operacao WHERE id=p_id_natureza_op;
  IF v_cfop IS NULL THEN RAISE EXCEPTION 'Natureza de operacao invalida'; END IF;
  IF upper(p_origem)='VENDA' THEN SELECT id_empresa,id_cliente INTO v_emp,v_cli FROM vendas WHERE id=p_id_origem;
  ELSE SELECT id_empresa,id_cliente INTO v_emp,v_cli FROM ordens_servico WHERE id=p_id_origem; END IF;
  IF v_emp IS NULL THEN RAISE EXCEPTION '% % nao encontrada', p_origem,p_id_origem; END IF;
  v_serie := COALESCE(p_serie,(SELECT valor FROM configuracoes WHERE chave='nfe_serie'),'1');
  v_amb := COALESCE((SELECT valor FROM configuracoes WHERE chave='nfe_ambiente'),'HOMOLOGACAO');
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
    SELECT ncm INTO v_ncm FROM produtos WHERE id=v_item.id_produto;
    SELECT * INTO v_gt FROM grupos_tributarios WHERE id=(SELECT id_grupo_tributario FROM produtos WHERE id=v_item.id_produto);
    v_bc := v_item.valor_total * (1 - COALESCE(v_gt.red_bc_icms,0)/100.0);
    v_vicms := round(v_bc * COALESCE(v_gt.aliq_icms,0)/100.0, 2);
    v_bcst := CASE WHEN v_gt.aliq_icms_st IS NOT NULL AND v_gt.aliq_icms_st>0
                   THEN v_item.valor_total*(1+COALESCE(v_gt.mva_st,0)/100.0) ELSE 0 END;
    v_vst := CASE WHEN v_bcst>0 THEN GREATEST(round(v_bcst*COALESCE(v_gt.aliq_icms_st,0)/100.0,2)-v_vicms,0) ELSE 0 END;
    v_vipi := round(v_item.valor_total*COALESCE(v_gt.aliq_ipi,0)/100.0,2);
    v_vpis := round(v_item.valor_total*COALESCE(v_gt.aliq_pis,0)/100.0,2);
    v_vcof := round(v_item.valor_total*COALESCE(v_gt.aliq_cofins,0)/100.0,2);
    INSERT INTO nfe_itens (id_nfe,id_produto,id_grupo_tributario,id_natureza_op,numero_item,descricao,ncm,cfop,
        id_unidade,quantidade,valor_unitario,valor_total,valor_desconto,
        cst_icms,bc_icms,aliq_icms,valor_icms,bc_icms_st,aliq_icms_st,valor_icms_st,
        cst_ipi,aliq_ipi,valor_ipi,cst_pis,aliq_pis,valor_pis,cst_cofins,aliq_cofins,valor_cofins)
    VALUES (v_nfe,v_item.id_produto,v_gt.id,p_id_natureza_op,v_i,v_item.descricao,COALESCE(v_ncm,''),v_cfop,
        v_item.id_unidade,v_item.quantidade,v_item.valor_unitario,v_item.valor_total,v_item.valor_desconto,
        v_gt.cst_icms,v_bc,v_gt.aliq_icms,v_vicms,v_bcst,v_gt.aliq_icms_st,v_vst,
        v_gt.cst_ipi,v_gt.aliq_ipi,v_vipi,v_gt.cst_pis,v_gt.aliq_pis,v_vpis,v_gt.cst_cofins,v_gt.aliq_cofins,v_vcof);
    t_prod:=t_prod+v_item.valor_total; t_ipi:=t_ipi+v_vipi; t_st:=t_st+v_vst;
    t_pis:=t_pis+v_vpis; t_cof:=t_cof+v_vcof; t_desc:=t_desc+v_item.valor_desconto;
  END LOOP;
  IF v_i=0 THEN RAISE EXCEPTION 'Documento sem itens de produto para faturar'; END IF;
  UPDATE nfe SET valor_produtos=t_prod, valor_desconto=t_desc, valor_ipi=t_ipi, valor_icms_st=t_st,
                 valor_pis=t_pis, valor_cofins=t_cof, valor_total=t_prod - t_desc + t_ipi + t_st, atualizado_em=now()
   WHERE id=v_nfe;
  RETURN jsonb_build_object('ok',true,'id_nfe',v_nfe,'numero',v_numero,'serie',v_serie,
                            'itens',v_i,'valor_total',round(t_prod - t_desc + t_ipi + t_st,2),'ambiente',v_amb);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_gerar_nfe(text,int,int,int,text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION "Teste ERP".fn_registrar_retorno_nfe(
  p_id_nfe int, p_status text, p_chave text DEFAULT NULL, p_protocolo text DEFAULT NULL,
  p_xml_retorno text DEFAULT NULL, p_mensagem text DEFAULT NULL, p_status_sefaz text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SET search_path="Teste ERP",public AS $$
BEGIN
  UPDATE nfe SET status=p_status, chave_acesso=COALESCE(p_chave,chave_acesso),
     protocolo=COALESCE(p_protocolo,protocolo), xml_retorno=COALESCE(p_xml_retorno,xml_retorno),
     mensagem_sefaz=COALESCE(p_mensagem,mensagem_sefaz), status_sefaz=COALESCE(p_status_sefaz,status_sefaz),
     data_autorizacao=CASE WHEN p_status='AUTORIZADA' THEN now() ELSE data_autorizacao END, atualizado_em=now()
   WHERE id=p_id_nfe;
  RETURN jsonb_build_object('ok',true,'id_nfe',p_id_nfe,'status',p_status);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_registrar_retorno_nfe(int,text,text,text,text,text,text) TO anon,authenticated,service_role;

CREATE VIEW "Teste ERP".vw_nfe AS
SELECT n.id, n.id_empresa, e.nome AS empresa, n.numero, n.serie, n.modelo,
       n.id_cliente, c.nome AS cliente, no.descricao AS natureza, no.cfop,
       n.status, n.status_sefaz, n.ambiente, n.chave_acesso, n.protocolo,
       n.valor_produtos, n.valor_total, n.data_emissao, n.data_autorizacao, n.mensagem_sefaz, n.id_venda, n.id_os
  FROM "Teste ERP".nfe n
  LEFT JOIN "Teste ERP".empresas e ON e.id=n.id_empresa
  LEFT JOIN "Teste ERP".clientes c ON c.id=n.id_cliente
  LEFT JOIN "Teste ERP".naturezas_operacao no ON no.id=n.id_natureza_op;
GRANT SELECT ON "Teste ERP".vw_nfe TO anon,authenticated,service_role;
