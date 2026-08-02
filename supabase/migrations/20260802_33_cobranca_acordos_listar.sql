-- 33: acompanhamento de acordos de renegociação (lista com progresso + parcelas)
CREATE OR REPLACE FUNCTION public.erp_cobranca_acordos_listar(p_id_empresa integer DEFAULT NULL)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',a.id,'numero',a.numero,'data_acordo',a.data_acordo,
    'empresa',(SELECT nome FROM "Teste ERP".empresas e WHERE e.id=a.id_empresa),
    'id_cliente',a.id_cliente,
    'cliente',(SELECT nome FROM "Teste ERP".clientes c WHERE c.id=a.id_cliente),
    'valor_financiado',a.valor_financiado,'qtd_parcelas',a.qtd_parcelas,
    'valor_entrada',a.valor_entrada,'valor_juros',a.valor_juros,'valor_multa',a.valor_multa,'status',a.status,
    'parcelas_pagas',(SELECT count(*) FROM "Teste ERP".titulos t WHERE t.origem='RENEGOCIACAO' AND t.id_origem=a.id AND t.status='PAGO'),
    'valor_pago',(SELECT COALESCE(SUM(t.valor_pago),0) FROM "Teste ERP".titulos t WHERE t.origem='RENEGOCIACAO' AND t.id_origem=a.id),
    'saldo',(SELECT COALESCE(SUM(t.valor_saldo),0) FROM "Teste ERP".titulos t WHERE t.origem='RENEGOCIACAO' AND t.id_origem=a.id AND t.status IN ('ABERTO','VENCIDO','PAGO_PARCIAL'))
  ) ORDER BY a.id DESC), '[]'::jsonb)
  FROM "Teste ERP".cobranca_acordos a
  WHERE (p_id_empresa IS NULL OR a.id_empresa=p_id_empresa);
$function$;

CREATE OR REPLACE FUNCTION public.erp_cobranca_acordo_parcelas(p_id integer)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',t.id,'parcela',t.parcela,'vencimento',t.data_vencimento,'valor',t.valor,
    'valor_pago',t.valor_pago,'valor_saldo',t.valor_saldo,'status',t.status,
    'dias_atraso',GREATEST(CURRENT_DATE - t.data_vencimento,0)) ORDER BY t.data_vencimento),'[]'::jsonb)
  FROM "Teste ERP".titulos t WHERE t.origem='RENEGOCIACAO' AND t.id_origem=p_id;
$function$;
