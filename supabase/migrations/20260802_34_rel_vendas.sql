-- 34: Relatório de Vendas unificado (um relatório, vários modelos/agrupamentos + filtros)
-- p (jsonb): { agrupamento, data_de, data_ate, id_empresa, id_cliente, id_vendedor, id_produto, status }
-- agrupamento: analitico | produto | cliente | vendedor | dia | mes
-- retorna { ok, agrupamento, colunas:[{key,label,tipo}], linhas:[...], totais:{qtd,valor} }
CREATE OR REPLACE FUNCTION public.erp_rel_vendas(p jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE
  v_ag text := COALESCE(p->>'agrupamento','analitico');
  v_de date := NULLIF(p->>'data_de','')::date;
  v_ate date := NULLIF(p->>'data_ate','')::date;
  v_emp int := NULLIF(p->>'id_empresa','')::int;
  v_cli int := NULLIF(p->>'id_cliente','')::int;
  v_vend int := NULLIF(p->>'id_vendedor','')::int;
  v_prod int := NULLIF(p->>'id_produto','')::int;
  v_status text := NULLIF(p->>'status','');
  v_trunc text := CASE WHEN v_ag='dia' THEN 'day' ELSE 'month' END;
  v_linhas jsonb; v_col jsonb; v_qtd numeric:=0; v_val numeric:=0;
BEGIN
  DROP TABLE IF EXISTS _v;
  CREATE TEMP TABLE _v ON COMMIT DROP AS
    SELECT v.* FROM "Teste ERP".vendas v
    WHERE (v_de IS NULL OR v.data_venda>=v_de)
      AND (v_ate IS NULL OR v.data_venda<=v_ate)
      AND (v_emp IS NULL OR v.id_empresa=v_emp)
      AND (v_cli IS NULL OR v.id_cliente=v_cli)
      AND (v_vend IS NULL OR v.id_vendedor=v_vend)
      AND ( (v_status IS NOT NULL AND v.status=v_status)
            OR (v_status IS NULL AND COALESCE(v.cancelada,false)=false) )
      AND (v_prod IS NULL OR EXISTS (SELECT 1 FROM "Teste ERP".vendas_itens i WHERE i.id_venda=v.id AND i.id_produto=v_prod));

  IF v_ag='produto' THEN
    v_col := '[{"key":"produto","label":"Produto","tipo":"texto"},{"key":"referencia","label":"Ref.","tipo":"texto"},{"key":"quantidade","label":"Qtd","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas, v_qtd, v_val FROM (
        SELECT jsonb_build_object('produto',COALESCE(pr.nome,i.descricao),'referencia',COALESCE(pr.referencia,i.referencia),
               'quantidade',SUM(i.quantidade),'valor',SUM(i.valor_total)) AS t
        FROM _v v JOIN "Teste ERP".vendas_itens i ON i.id_venda=v.id
        LEFT JOIN "Teste ERP".produtos pr ON pr.id=i.id_produto
        WHERE i.tipo='PRODUTO' AND (v_prod IS NULL OR i.id_produto=v_prod)
        GROUP BY COALESCE(pr.nome,i.descricao), COALESCE(pr.referencia,i.referencia)) s;

  ELSIF v_ag='cliente' THEN
    v_col := '[{"key":"cliente","label":"Cliente","tipo":"texto"},{"key":"quantidade","label":"Nº vendas","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas, v_qtd, v_val FROM (
        SELECT jsonb_build_object('cliente',COALESCE(c.nome,'#'||v.id_cliente),'quantidade',COUNT(*),'valor',SUM(v.valor_total)) AS t
        FROM _v v LEFT JOIN "Teste ERP".clientes c ON c.id=v.id_cliente
        GROUP BY COALESCE(c.nome,'#'||v.id_cliente)) s;

  ELSIF v_ag='vendedor' THEN
    v_col := '[{"key":"vendedor","label":"Vendedor","tipo":"texto"},{"key":"quantidade","label":"Nº vendas","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas, v_qtd, v_val FROM (
        SELECT jsonb_build_object('vendedor',COALESCE(u.nome,'—'),'quantidade',COUNT(*),'valor',SUM(v.valor_total)) AS t
        FROM _v v LEFT JOIN "Teste ERP".usuarios u ON u.id=v.id_vendedor
        GROUP BY COALESCE(u.nome,'—')) s;

  ELSIF v_ag IN ('dia','mes') THEN
    v_col := ('[{"key":"periodo","label":"'||(CASE WHEN v_ag='dia' THEN 'Dia' ELSE 'Mês' END)||'","tipo":"texto"},{"key":"quantidade","label":"Nº vendas","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]')::jsonb;
    SELECT COALESCE(jsonb_agg(t ORDER BY t->>'ord'),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas, v_qtd, v_val FROM (
        SELECT jsonb_build_object('ord',to_char(date_trunc(v_trunc, v.data_venda),'YYYY-MM-DD'),
               'periodo', CASE WHEN v_ag='dia' THEN to_char(v.data_venda,'DD/MM/YYYY') ELSE to_char(v.data_venda,'MM/YYYY') END,
               'quantidade',COUNT(*),'valor',SUM(v.valor_total)) AS t
        FROM _v v
        GROUP BY date_trunc(v_trunc, v.data_venda),
                 CASE WHEN v_ag='dia' THEN to_char(v.data_venda,'DD/MM/YYYY') ELSE to_char(v.data_venda,'MM/YYYY') END) s;

  ELSE
    v_col := '[{"key":"data","label":"Data","tipo":"data"},{"key":"numero","label":"Nº","tipo":"texto"},{"key":"cliente","label":"Cliente","tipo":"texto"},{"key":"vendedor","label":"Vendedor","tipo":"texto"},{"key":"empresa","label":"Empresa","tipo":"texto"},{"key":"status","label":"Status","tipo":"texto"},{"key":"valor","label":"Total","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'data')),'[]'), COUNT(*), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas, v_qtd, v_val FROM (
        SELECT jsonb_build_object('id',v.id,'data',v.data_venda,'numero',v.numero,
               'cliente',COALESCE(c.nome,'#'||v.id_cliente),'vendedor',COALESCE(u.nome,'—'),
               'empresa',COALESCE(e.nome,''),'status',v.status,'valor',v.valor_total) AS t
        FROM _v v LEFT JOIN "Teste ERP".clientes c ON c.id=v.id_cliente
        LEFT JOIN "Teste ERP".usuarios u ON u.id=v.id_vendedor
        LEFT JOIN "Teste ERP".empresas e ON e.id=v.id_empresa) s;
  END IF;

  RETURN jsonb_build_object('ok',true,'agrupamento',v_ag,'colunas',v_col,'linhas',v_linhas,
    'totais',jsonb_build_object('qtd',v_qtd,'valor',v_val));
END $function$;
