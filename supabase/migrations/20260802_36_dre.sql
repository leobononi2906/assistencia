-- 36: DRE (Demonstração do Resultado) por competência
-- Receita e CMV vêm das vendas (operacional); despesas/outras receitas do financeiro (titulos + plano_contas)
-- p: { data_de, data_ate, id_empresa } -> { ok, linhas:[{classe,label,valor,obs?}], indicadores }
CREATE OR REPLACE FUNCTION public.erp_dre(p jsonb)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE
  v_de date := NULLIF(p->>'data_de','')::date;
  v_ate date := NULLIF(p->>'data_ate','')::date;
  v_emp int := NULLIF(p->>'id_empresa','')::int;
  v_bruta numeric:=0; v_dev numeric:=0; v_liq numeric:=0; v_cmv numeric:=0; v_lb numeric:=0;
  v_desp numeric:=0; v_outras numeric:=0; v_result numeric:=0; v_margem numeric:=0;
  v_desp_cat jsonb; v_out_cat jsonb; v_linhas jsonb;
BEGIN
  SELECT COALESCE(SUM(v.valor_total) FILTER (WHERE COALESCE(v.status,'')<>'DEVOLVIDA'),0),
         COALESCE(SUM(v.valor_total) FILTER (WHERE v.status='DEVOLVIDA'),0)
    INTO v_bruta, v_dev
    FROM "Teste ERP".vendas v
    WHERE COALESCE(v.cancelada,false)=false
      AND (v_de IS NULL OR v.data_venda>=v_de) AND (v_ate IS NULL OR v.data_venda<=v_ate)
      AND (v_emp IS NULL OR v.id_empresa=v_emp);

  SELECT COALESCE(SUM(i.quantidade*COALESCE(i.valor_custo,0)),0) INTO v_cmv
    FROM "Teste ERP".vendas v JOIN "Teste ERP".vendas_itens i ON i.id_venda=v.id
    WHERE i.tipo='PRODUTO' AND COALESCE(v.cancelada,false)=false AND COALESCE(v.status,'')<>'DEVOLVIDA'
      AND (v_de IS NULL OR v.data_venda>=v_de) AND (v_ate IS NULL OR v.data_venda<=v_ate)
      AND (v_emp IS NULL OR v.id_empresa=v_emp);

  SELECT COALESCE(jsonb_agg(jsonb_build_object('label',descricao,'valor',v) ORDER BY v DESC),'[]'), COALESCE(SUM(v),0)
    INTO v_desp_cat, v_desp FROM (
      SELECT pc.descricao, SUM(t.valor) v
      FROM "Teste ERP".titulos t JOIN "Teste ERP".plano_contas pc ON pc.id=t.id_plano_conta
      WHERE pc.tipo='DESPESA'
        AND (v_de IS NULL OR COALESCE(t.data_competencia,t.data_vencimento)>=v_de)
        AND (v_ate IS NULL OR COALESCE(t.data_competencia,t.data_vencimento)<=v_ate)
        AND (v_emp IS NULL OR t.id_empresa=v_emp)
      GROUP BY pc.descricao) x;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('label',descricao,'valor',v) ORDER BY v DESC),'[]'), COALESCE(SUM(v),0)
    INTO v_out_cat, v_outras FROM (
      SELECT pc.descricao, SUM(t.valor) v
      FROM "Teste ERP".titulos t JOIN "Teste ERP".plano_contas pc ON pc.id=t.id_plano_conta
      WHERE pc.tipo='RECEITA' AND COALESCE(t.origem,'') NOT IN ('VENDA','OS','ORCAMENTO')
        AND (v_de IS NULL OR COALESCE(t.data_competencia,t.data_vencimento)>=v_de)
        AND (v_ate IS NULL OR COALESCE(t.data_competencia,t.data_vencimento)<=v_ate)
        AND (v_emp IS NULL OR t.id_empresa=v_emp)
      GROUP BY pc.descricao) x;

  v_liq := v_bruta - v_dev;
  v_lb := v_liq - v_cmv;
  v_result := v_lb - v_desp + v_outras;
  v_margem := CASE WHEN v_liq<>0 THEN round(v_lb/v_liq*100,1) ELSE 0 END;

  v_linhas := jsonb_build_array(
    jsonb_build_object('classe','total','label','(=) RECEITA OPERACIONAL BRUTA','valor',v_bruta),
    jsonb_build_object('classe','item','label','Vendas de mercadorias e serviços','valor',v_bruta),
    jsonb_build_object('classe','grupo','label','(-) Deduções e devoluções','valor',-v_dev),
    jsonb_build_object('classe','item','label','Devoluções','valor',-v_dev),
    jsonb_build_object('classe','total','label','(=) RECEITA LÍQUIDA','valor',v_liq),
    jsonb_build_object('classe','grupo','label','(-) Custo das mercadorias vendidas (CMV)','valor',-v_cmv),
    jsonb_build_object('classe','total','label','(=) LUCRO BRUTO','valor',v_lb,'obs','Margem bruta '||to_char(v_margem,'FM990D0')||'%')
  );
  v_linhas := v_linhas || jsonb_build_array(jsonb_build_object('classe','grupo','label','(-) DESPESAS OPERACIONAIS','valor',-v_desp));
  v_linhas := v_linhas || (SELECT COALESCE(jsonb_agg(jsonb_build_object('classe','item','label',e->>'label','valor',-(e->>'valor')::numeric)),'[]') FROM jsonb_array_elements(v_desp_cat) e);
  IF v_outras<>0 THEN
    v_linhas := v_linhas || jsonb_build_array(jsonb_build_object('classe','grupo','label','(+) OUTRAS RECEITAS','valor',v_outras));
    v_linhas := v_linhas || (SELECT COALESCE(jsonb_agg(jsonb_build_object('classe','item','label',e->>'label','valor',(e->>'valor')::numeric)),'[]') FROM jsonb_array_elements(v_out_cat) e);
  END IF;
  v_linhas := v_linhas || jsonb_build_array(jsonb_build_object('classe','resultado','label','(=) RESULTADO LÍQUIDO','valor',v_result));

  RETURN jsonb_build_object('ok',true,'linhas',v_linhas,
    'indicadores',jsonb_build_object('receita_bruta',v_bruta,'receita_liquida',v_liq,'cmv',v_cmv,
      'lucro_bruto',v_lb,'margem_bruta',v_margem,'despesas',v_desp,'resultado',v_result));
END $function$;
