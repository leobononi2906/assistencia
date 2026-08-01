-- ERP Bononi — Comercial: views + criação + detalhe de Venda/OS
CREATE OR REPLACE VIEW "Teste ERP".vw_vendas AS
SELECT v.id, v.numero, v.id_empresa, e.nome AS empresa, v.id_cliente, c.nome AS cliente,
       v.status, v.cancelada, v.data_venda, v.valor_produtos, v.valor_total,
       v.id_forma_pagamento, f.descricao AS forma_pagamento, v.id_condicao_pagamento
  FROM "Teste ERP".vendas v
  LEFT JOIN "Teste ERP".empresas e ON e.id=v.id_empresa
  LEFT JOIN "Teste ERP".clientes c ON c.id=v.id_cliente
  LEFT JOIN "Teste ERP".formas_pagamento f ON f.id=v.id_forma_pagamento;
GRANT SELECT ON "Teste ERP".vw_vendas TO anon,authenticated,service_role;

CREATE OR REPLACE VIEW "Teste ERP".vw_os AS
SELECT o.id, o.numero, o.id_empresa, e.nome AS empresa, o.id_cliente, c.nome AS cliente,
       o.id_veiculo, o.status, o.cancelada, o.data_entrada, o.valor_pecas, o.valor_servicos, o.valor_total,
       o.id_forma_pagamento, f.descricao AS forma_pagamento, o.id_condicao_pagamento
  FROM "Teste ERP".ordens_servico o
  LEFT JOIN "Teste ERP".empresas e ON e.id=o.id_empresa
  LEFT JOIN "Teste ERP".clientes c ON c.id=o.id_cliente
  LEFT JOIN "Teste ERP".formas_pagamento f ON f.id=o.id_forma_pagamento;
GRANT SELECT ON "Teste ERP".vw_os TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_criar_venda(p_id_empresa int, p_id_cliente int, p_id_forma int DEFAULT NULL, p_id_condicao int DEFAULT NULL, p_id_vendedor int DEFAULT NULL, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $FN$
DECLARE v_id int; v_num text;
BEGIN
  INSERT INTO "Teste ERP".vendas (numero,id_empresa,id_cliente,id_forma_pagamento,id_condicao_pagamento,id_vendedor,id_usuario_lancamento,status)
  VALUES ('TMP',p_id_empresa,p_id_cliente,p_id_forma,p_id_condicao,p_id_vendedor,p_id_usuario,'ABERTA') RETURNING id INTO v_id;
  v_num := 'V'||lpad(v_id::text,6,'0'); UPDATE "Teste ERP".vendas SET numero=v_num WHERE id=v_id;
  RETURN jsonb_build_object('ok',true,'id',v_id,'numero',v_num);
END $FN$;
GRANT EXECUTE ON FUNCTION public.erp_criar_venda(int,int,int,int,int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_criar_os(p_id_empresa int, p_id_cliente int, p_id_veiculo int DEFAULT NULL, p_id_tipo_os int DEFAULT NULL, p_id_forma int DEFAULT NULL, p_id_condicao int DEFAULT NULL, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $FN$
DECLARE v_id int; v_num text;
BEGIN
  INSERT INTO "Teste ERP".ordens_servico (numero,id_empresa,id_cliente,id_veiculo,id_tipo_os,id_forma_pagamento,id_condicao_pagamento,id_usuario_abertura,status)
  VALUES ('TMP',p_id_empresa,p_id_cliente,p_id_veiculo,p_id_tipo_os,p_id_forma,p_id_condicao,p_id_usuario,'ABERTA') RETURNING id INTO v_id;
  v_num := 'OS'||lpad(v_id::text,6,'0'); UPDATE "Teste ERP".ordens_servico SET numero=v_num WHERE id=v_id;
  RETURN jsonb_build_object('ok',true,'id',v_id,'numero',v_num);
END $FN$;
GRANT EXECUTE ON FUNCTION public.erp_criar_os(int,int,int,int,int,int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_venda_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $FN$
  SELECT jsonb_build_object(
    'venda',(SELECT to_jsonb(x) FROM "Teste ERP".vw_vendas x WHERE x.id=p_id),
    'itens',COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.id) FROM "Teste ERP".vendas_itens i WHERE i.id_venda=p_id),'[]'),
    'solicitacoes',COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM "Teste ERP".vw_solicitacoes s WHERE s.origem='VENDA' AND s.id_origem=p_id),'[]'));
$FN$;
GRANT EXECUTE ON FUNCTION public.erp_venda_detalhe(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_os_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $FN$
  SELECT jsonb_build_object(
    'os',(SELECT to_jsonb(x) FROM "Teste ERP".vw_os x WHERE x.id=p_id),
    'pecas',COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.id) FROM "Teste ERP".os_pecas i WHERE i.id_os=p_id),'[]'),
    'servicos',COALESCE((SELECT jsonb_agg(to_jsonb(sv) ORDER BY sv.id) FROM "Teste ERP".os_servicos sv WHERE sv.id_os=p_id),'[]'),
    'solicitacoes',COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM "Teste ERP".vw_solicitacoes s WHERE s.origem='OS' AND s.id_origem=p_id),'[]'));
$FN$;
GRANT EXECUTE ON FUNCTION public.erp_os_detalhe(int) TO anon,authenticated,service_role;

INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('vw_vendas','Vendas','Relatorios',5,'id','{cliente,numero}',true),
 ('vw_os','Ordens de Serviço','Relatorios',6,'id','{cliente,numero}',true)
ON CONFLICT (tabela) DO NOTHING;
