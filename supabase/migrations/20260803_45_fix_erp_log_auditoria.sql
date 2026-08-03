-- 45: Fix erp_log — recria a sobrecarga (7 args) que sumiu
-- Sem esta assinatura, venda_salvar / orçamento / encomenda quebravam ao auditar
-- ("não consigo adicionar campos"). Grava a auditoria em log_acessos com tipo AUDITORIA.
-- Reconstituída do banco (aplicada em sessão anterior sem commit; versão live em 20260803194901).
CREATE OR REPLACE FUNCTION public.erp_log(
  p_id_usuario integer,
  p_modulo text,
  p_acao text,
  p_tabela text,
  p_registro integer,
  p_dados_anteriores jsonb,
  p_dados_novos jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'Teste ERP','public','pg_temp' AS $function$
BEGIN
  INSERT INTO "Teste ERP".log_acessos
    (id_usuario, modulo, acao, tabela_afetada, registro_id, dados_anteriores, dados_novos, tipo, criado_em)
  VALUES
    (p_id_usuario, p_modulo, p_acao, p_tabela, p_registro, p_dados_anteriores, p_dados_novos, 'AUDITORIA', now());
END;
$function$;

GRANT EXECUTE ON FUNCTION public.erp_log(integer, text, text, text, integer, jsonb, jsonb) TO anon, authenticated, service_role;
