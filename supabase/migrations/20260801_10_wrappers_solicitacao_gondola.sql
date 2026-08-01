-- ERP Bononi — Wrappers public do fluxo de solicitação/gôndola + registro de views
CREATE OR REPLACE FUNCTION public.erp_solicitar_produto(
  p_origem text, p_id_origem int, p_id_produto int, p_qtd numeric, p_id_usuario int,
  p_id_unidade int DEFAULT NULL, p_valor_unitario numeric DEFAULT NULL, p_id_centro_estoque int DEFAULT NULL,
  p_prioridade int DEFAULT 3, p_observacao text DEFAULT NULL, p_reservar boolean DEFAULT false)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_solicitar_produto(p_origem,p_id_origem,p_id_produto,p_qtd,p_id_usuario,
    p_id_unidade,p_valor_unitario,p_id_centro_estoque,p_prioridade,p_observacao,p_reservar); $$;
CREATE OR REPLACE FUNCTION public.erp_atender_solicitacao(p_id_solicitacao int, p_qtd_atendida numeric, p_id_centro int, p_id_usuario int)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_atender_solicitacao(p_id_solicitacao,p_qtd_atendida,p_id_centro,p_id_usuario); $$;
CREATE OR REPLACE FUNCTION public.erp_cancelar_solicitacao(p_id int, p_id_usuario int DEFAULT NULL, p_motivo text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_cancelar_solicitacao(p_id,p_id_usuario,p_motivo); $$;
CREATE OR REPLACE FUNCTION public.erp_gondola_abastecer(p_id_produto int, p_id_centro_origem int, p_id_centro_gondola int, p_qtd numeric, p_id_usuario int)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_gondola_abastecer(p_id_produto,p_id_centro_origem,p_id_centro_gondola,p_qtd,p_id_usuario); $$;
CREATE OR REPLACE FUNCTION public.erp_lancar_produto_gondola(p_origem text, p_id_origem int, p_id_produto int, p_qtd numeric, p_id_centro_gondola int, p_id_usuario int, p_valor_unitario numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=public,"Teste ERP" AS $$
  SELECT "Teste ERP".fn_lancar_produto_gondola(p_origem,p_id_origem,p_id_produto,p_qtd,p_id_centro_gondola,p_id_usuario,p_valor_unitario); $$;
GRANT EXECUTE ON FUNCTION public.erp_solicitar_produto(text,int,int,numeric,int,int,numeric,int,int,text,boolean) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_atender_solicitacao(int,numeric,int,int) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_cancelar_solicitacao(int,int,text) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_gondola_abastecer(int,int,int,numeric,int) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.erp_lancar_produto_gondola(text,int,int,numeric,int,int,numeric) TO anon,authenticated,service_role;
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('vw_solicitacoes','Solicitações (fila)','Relatorios',50,'id','{produto,numero_doc}',true),
 ('vw_gondola_saldo','Gôndola — saldo','Relatorios',60,'id_produto','{produto}',true)
ON CONFLICT (tabela) DO NOTHING;
