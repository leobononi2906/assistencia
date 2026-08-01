-- ERP Bononi — Fiscal: wrappers public + payload da NF-e + registro no admin
CREATE OR REPLACE FUNCTION public.erp_gerar_nfe(p_origem text, p_id_origem int, p_id_natureza_op int, p_id_usuario int DEFAULT NULL, p_serie text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_gerar_nfe(p_origem,p_id_origem,p_id_natureza_op,p_id_usuario,p_serie); $$;
CREATE OR REPLACE FUNCTION public.erp_registrar_retorno_nfe(p_id_nfe int, p_status text, p_chave text DEFAULT NULL, p_protocolo text DEFAULT NULL, p_xml_retorno text DEFAULT NULL, p_mensagem text DEFAULT NULL, p_status_sefaz text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_registrar_retorno_nfe(p_id_nfe,p_status,p_chave,p_protocolo,p_xml_retorno,p_mensagem,p_status_sefaz); $$;
CREATE OR REPLACE FUNCTION public.erp_nfe_payload(p_id_nfe int)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT jsonb_build_object(
    'nfe', to_jsonb(n),
    'empresa', (SELECT to_jsonb(e) FROM "Teste ERP".empresas e WHERE e.id=n.id_empresa),
    'cliente', (SELECT to_jsonb(c) FROM "Teste ERP".clientes c WHERE c.id=n.id_cliente),
    'natureza', (SELECT to_jsonb(no) FROM "Teste ERP".naturezas_operacao no WHERE no.id=n.id_natureza_op),
    'itens', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.numero_item) FROM "Teste ERP".nfe_itens i WHERE i.id_nfe=n.id),'[]')
  ) FROM "Teste ERP".nfe n WHERE n.id=p_id_nfe;
$$;
GRANT EXECUTE ON FUNCTION public.erp_gerar_nfe(text,int,int,int,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_registrar_retorno_nfe(int,text,text,text,text,text,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_nfe_payload(int) TO anon,authenticated,service_role;
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('certificados_digital','Certificados Digitais','Fiscal',30,'id','{descricao,numero_serie}',false),
 ('vw_nfe','Notas Fiscais (NF-e)','Relatorios',70,'id','{cliente,numero,chave_acesso}',true)
ON CONFLICT (tabela) DO NOTHING;
