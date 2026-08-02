-- 28: expõe id_origem em erp_cobranca_cliente_titulos para permitir
-- abrir a venda/OS de origem direto do modal de cobrança (navegação cruzada no front).
CREATE OR REPLACE FUNCTION public.erp_cobranca_cliente_titulos(p_id_cliente integer, p_id_empresa integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
  SELECT jsonb_build_object(
    'cliente', (SELECT jsonb_build_object('id',id,'nome',nome,'whatsapp',whatsapp,'celular',celular,
                   'telefone',telefone,'email',email) FROM "Teste ERP".clientes WHERE id=p_id_cliente),
    'titulos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',t.id,'numero',t.numero,'parcela',t.parcela,'id_empresa',t.id_empresa,
        'vencimento',t.data_vencimento,'valor',t.valor,'valor_saldo',t.valor_saldo,'status',t.status,
        'dias_atraso', GREATEST(CURRENT_DATE - t.data_vencimento, 0),
        'origem',t.origem,'id_origem',t.id_origem,'numero_origem',t.numero_origem) ORDER BY t.data_vencimento)
      FROM "Teste ERP".titulos t
      WHERE t.id_cliente=p_id_cliente AND t.tipo='CR'
        AND t.status IN ('ABERTO','VENCIDO','PAGO_PARCIAL') AND t.valor_saldo > 0
        AND (p_id_empresa IS NULL OR t.id_empresa = p_id_empresa)), '[]'::jsonb),
    'total_saldo', COALESCE((SELECT SUM(valor_saldo) FROM "Teste ERP".titulos
        WHERE id_cliente=p_id_cliente AND tipo='CR' AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL')
          AND valor_saldo>0 AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),0),
    'maior_atraso', COALESCE((SELECT MAX(CURRENT_DATE - data_vencimento) FROM "Teste ERP".titulos
        WHERE id_cliente=p_id_cliente AND tipo='CR' AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL')
          AND valor_saldo>0 AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),0)
  );
$function$;
