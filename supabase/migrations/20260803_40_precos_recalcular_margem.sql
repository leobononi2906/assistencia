-- 40: Recalcular preços de venda em modo MARGEM quando o custo muda
-- Preço fixo (tipo_calculo='FIXO') trava a venda. Preço por markup (tipo_calculo='MARGEM')
-- segue o custo: venda = custo * (1 + markup/100). Chamado após salvar a identidade do produto.
CREATE OR REPLACE FUNCTION public.erp_precos_recalcular_margem(p_id_produto integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_n int;
BEGIN
  UPDATE "Teste ERP".produtos_precos pp
     SET preco_venda = ROUND(COALESCE(p.preco_custo,0) * (1 + COALESCE(pp.margem_percentual,0)/100.0), 2),
         atualizado_em = now()
  FROM "Teste ERP".produtos p
  WHERE p.id = pp.id_produto
    AND pp.id_produto = p_id_produto
    AND pp.tipo_calculo = 'MARGEM'
    AND pp.margem_percentual IS NOT NULL
    AND COALESCE(p.preco_custo,0) > 0;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'atualizados', v_n);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_precos_recalcular_margem(integer) TO anon, authenticated, service_role;
