-- 35: Relatórios unificados de Compras, Produtos e Clientes (mesmo molde de erp_rel_vendas)
-- Cada função recebe p jsonb com { agrupamento, filtros... } e retorna { ok, agrupamento, colunas, linhas, totais }

-- ===== COMPRAS ===== agrupamento: analitico | produto | fornecedor | mes
CREATE OR REPLACE FUNCTION public.erp_rel_compras(p jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE
  v_ag text := COALESCE(p->>'agrupamento','analitico');
  v_de date := NULLIF(p->>'data_de','')::date;
  v_ate date := NULLIF(p->>'data_ate','')::date;
  v_emp int := NULLIF(p->>'id_empresa','')::int;
  v_forn int := NULLIF(p->>'id_fornecedor','')::int;
  v_prod int := NULLIF(p->>'id_produto','')::int;
  v_status text := NULLIF(p->>'status','');
  v_linhas jsonb; v_col jsonb; v_qtd numeric:=0; v_val numeric:=0;
BEGIN
  DROP TABLE IF EXISTS _c;
  CREATE TEMP TABLE _c ON COMMIT DROP AS
    SELECT pc.* FROM "Teste ERP".pedidos_compra pc
    WHERE (v_de IS NULL OR pc.data_pedido>=v_de)
      AND (v_ate IS NULL OR pc.data_pedido<=v_ate)
      AND (v_emp IS NULL OR pc.id_empresa=v_emp)
      AND (v_forn IS NULL OR pc.id_fornecedor=v_forn)
      AND ((v_status IS NOT NULL AND pc.status=v_status) OR (v_status IS NULL AND COALESCE(pc.status,'')<>'CANCELADO'))
      AND (v_prod IS NULL OR EXISTS (SELECT 1 FROM "Teste ERP".pedidos_compra_itens i WHERE i.id_pedido=pc.id AND i.id_produto=v_prod));

  IF v_ag='produto' THEN
    v_col := '[{"key":"produto","label":"Produto","tipo":"texto"},{"key":"referencia","label":"Ref.","tipo":"texto"},{"key":"quantidade","label":"Qtd","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('produto',COALESCE(pr.nome,i.descricao),'referencia',COALESCE(pr.referencia,i.referencia_fornecedor),
               'quantidade',SUM(i.quantidade),'valor',SUM(i.valor_total)) t
        FROM _c c JOIN "Teste ERP".pedidos_compra_itens i ON i.id_pedido=c.id
        LEFT JOIN "Teste ERP".produtos pr ON pr.id=i.id_produto
        WHERE (v_prod IS NULL OR i.id_produto=v_prod)
        GROUP BY COALESCE(pr.nome,i.descricao), COALESCE(pr.referencia,i.referencia_fornecedor)) s;
  ELSIF v_ag='fornecedor' THEN
    v_col := '[{"key":"fornecedor","label":"Fornecedor","tipo":"texto"},{"key":"quantidade","label":"Nº pedidos","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('fornecedor',COALESCE(f.nome,'#'||c.id_fornecedor),'quantidade',COUNT(*),'valor',SUM(c.valor_total)) t
        FROM _c c LEFT JOIN "Teste ERP".fornecedores f ON f.id=c.id_fornecedor
        GROUP BY COALESCE(f.nome,'#'||c.id_fornecedor)) s;
  ELSIF v_ag='mes' THEN
    v_col := '[{"key":"periodo","label":"Mês","tipo":"texto"},{"key":"quantidade","label":"Nº pedidos","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY t->>'ord'),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('ord',to_char(date_trunc('month',c.data_pedido),'YYYY-MM'),'periodo',to_char(c.data_pedido,'MM/YYYY'),
               'quantidade',COUNT(*),'valor',SUM(c.valor_total)) t
        FROM _c c GROUP BY date_trunc('month',c.data_pedido), to_char(c.data_pedido,'MM/YYYY')) s;
  ELSE
    v_col := '[{"key":"data","label":"Data","tipo":"data"},{"key":"numero","label":"Nº","tipo":"texto"},{"key":"fornecedor","label":"Fornecedor","tipo":"texto"},{"key":"empresa","label":"Empresa","tipo":"texto"},{"key":"status","label":"Status","tipo":"texto"},{"key":"valor","label":"Total","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'data')),'[]'), COUNT(*), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('data',c.data_pedido,'numero',c.numero,'fornecedor',COALESCE(f.nome,'#'||c.id_fornecedor),
               'empresa',COALESCE(e.nome,''),'status',c.status,'valor',c.valor_total) t
        FROM _c c LEFT JOIN "Teste ERP".fornecedores f ON f.id=c.id_fornecedor
        LEFT JOIN "Teste ERP".empresas e ON e.id=c.id_empresa) s;
  END IF;
  RETURN jsonb_build_object('ok',true,'agrupamento',v_ag,'colunas',v_col,'linhas',v_linhas,'totais',jsonb_build_object('qtd',v_qtd,'valor',v_val));
END $function$;

-- ===== PRODUTOS ===== agrupamento: posicao | mais_vendidos | sem_giro | grupo (grupos_produto.descricao)
CREATE OR REPLACE FUNCTION public.erp_rel_produtos(p jsonb)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE
  v_ag text := COALESCE(p->>'agrupamento','posicao');
  v_de date := NULLIF(p->>'data_de','')::date;
  v_ate date := NULLIF(p->>'data_ate','')::date;
  v_emp int := NULLIF(p->>'id_empresa','')::int;
  v_grp int := NULLIF(p->>'id_grupo','')::int;
  v_sit text := NULLIF(p->>'situacao','');
  v_linhas jsonb; v_col jsonb; v_qtd numeric:=0; v_val numeric:=0;
BEGIN
  IF v_ag='mais_vendidos' THEN
    v_col := '[{"key":"produto","label":"Produto","tipo":"texto"},{"key":"referencia","label":"Ref.","tipo":"texto"},{"key":"quantidade","label":"Qtd vendida","tipo":"num"},{"key":"valor","label":"Valor","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'quantidade')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('produto',COALESCE(pr.nome,i.descricao),'referencia',COALESCE(pr.referencia,i.referencia),
               'quantidade',SUM(i.quantidade),'valor',SUM(i.valor_total)) t
        FROM "Teste ERP".vendas v JOIN "Teste ERP".vendas_itens i ON i.id_venda=v.id
        LEFT JOIN "Teste ERP".produtos pr ON pr.id=i.id_produto
        WHERE i.tipo='PRODUTO' AND COALESCE(v.cancelada,false)=false
          AND (v_de IS NULL OR v.data_venda>=v_de) AND (v_ate IS NULL OR v.data_venda<=v_ate)
          AND (v_emp IS NULL OR v.id_empresa=v_emp) AND (v_grp IS NULL OR pr.id_grupo=v_grp)
        GROUP BY COALESCE(pr.nome,i.descricao), COALESCE(pr.referencia,i.referencia)) s;
  ELSIF v_ag='sem_giro' THEN
    v_col := '[{"key":"produto","label":"Produto","tipo":"texto"},{"key":"referencia","label":"Ref.","tipo":"texto"},{"key":"grupo","label":"Grupo","tipo":"texto"},{"key":"quantidade","label":"Estoque","tipo":"num"},{"key":"valor","label":"Valor parado","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COUNT(*), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('produto',pr.nome,'referencia',pr.referencia,'grupo',COALESCE(g.descricao,''),
               'quantidade',pr.estoque_atual,'valor',COALESCE(pr.estoque_atual,0)*COALESCE(pr.preco_custo,0)) t
        FROM "Teste ERP".produtos pr LEFT JOIN "Teste ERP".grupos_produto g ON g.id=pr.id_grupo
        WHERE COALESCE(pr.controla_estoque,true) AND COALESCE(pr.estoque_atual,0)>0
          AND COALESCE(pr.situacao,'ATIVO')='ATIVO' AND (v_grp IS NULL OR pr.id_grupo=v_grp)
          AND NOT EXISTS (SELECT 1 FROM "Teste ERP".vendas_itens i JOIN "Teste ERP".vendas v ON v.id=i.id_venda
                          WHERE i.id_produto=pr.id AND COALESCE(v.cancelada,false)=false
                            AND (v_de IS NULL OR v.data_venda>=v_de) AND (v_ate IS NULL OR v.data_venda<=v_ate))) s;
  ELSIF v_ag='grupo' THEN
    v_col := '[{"key":"grupo","label":"Grupo","tipo":"texto"},{"key":"quantidade","label":"Nº produtos","tipo":"num"},{"key":"estoque","label":"Estoque","tipo":"num"},{"key":"valor","label":"Valor em estoque","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('grupo',COALESCE(g.descricao,'(sem grupo)'),'quantidade',COUNT(*),
               'estoque',SUM(COALESCE(pr.estoque_atual,0)),'valor',SUM(COALESCE(pr.estoque_atual,0)*COALESCE(pr.preco_custo,0))) t
        FROM "Teste ERP".produtos pr LEFT JOIN "Teste ERP".grupos_produto g ON g.id=pr.id_grupo
        WHERE (v_sit IS NULL OR pr.situacao=v_sit) GROUP BY COALESCE(g.descricao,'(sem grupo)')) s;
  ELSE
    v_col := '[{"key":"produto","label":"Produto","tipo":"texto"},{"key":"referencia","label":"Ref.","tipo":"texto"},{"key":"grupo","label":"Grupo","tipo":"texto"},{"key":"quantidade","label":"Estoque","tipo":"num"},{"key":"custo","label":"Custo un.","tipo":"money"},{"key":"valor","label":"Valor em estoque","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COUNT(*), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('produto',pr.nome,'referencia',pr.referencia,'grupo',COALESCE(g.descricao,''),
               'quantidade',pr.estoque_atual,'custo',pr.preco_custo,'valor',COALESCE(pr.estoque_atual,0)*COALESCE(pr.preco_custo,0)) t
        FROM "Teste ERP".produtos pr LEFT JOIN "Teste ERP".grupos_produto g ON g.id=pr.id_grupo
        WHERE COALESCE(pr.situacao,'ATIVO')=COALESCE(v_sit,'ATIVO') AND (v_grp IS NULL OR pr.id_grupo=v_grp)) s;
  END IF;
  RETURN jsonb_build_object('ok',true,'agrupamento',v_ag,'colunas',v_col,'linhas',v_linhas,'totais',jsonb_build_object('qtd',v_qtd,'valor',v_val));
END $function$;

-- ===== CLIENTES ===== agrupamento: ranking | inativos | novos | uf
CREATE OR REPLACE FUNCTION public.erp_rel_clientes(p jsonb)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE
  v_ag text := COALESCE(p->>'agrupamento','ranking');
  v_de date := NULLIF(p->>'data_de','')::date;
  v_ate date := NULLIF(p->>'data_ate','')::date;
  v_emp int := NULLIF(p->>'id_empresa','')::int;
  v_uf text := NULLIF(p->>'uf','');
  v_sit text := NULLIF(p->>'situacao','');
  v_linhas jsonb; v_col jsonb; v_qtd numeric:=0; v_val numeric:=0;
BEGIN
  IF v_ag='inativos' THEN
    v_col := '[{"key":"cliente","label":"Cliente","tipo":"texto"},{"key":"cidade","label":"Cidade","tipo":"texto"},{"key":"uf","label":"UF","tipo":"texto"},{"key":"ultima","label":"Última compra","tipo":"data"},{"key":"dias","label":"Dias sem comprar","tipo":"num"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'dias')::numeric DESC NULLS FIRST),'[]'), COUNT(*), 0
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('cliente',c.nome,'cidade',COALESCE(c.cidade,''),'uf',COALESCE(c.uf,''),
               'ultima',ult.d,'dias',CASE WHEN ult.d IS NULL THEN NULL ELSE (CURRENT_DATE-ult.d) END) t
        FROM "Teste ERP".clientes c
        LEFT JOIN LATERAL (SELECT MAX(v.data_venda)::date d FROM "Teste ERP".vendas v WHERE v.id_cliente=c.id AND COALESCE(v.cancelada,false)=false) ult ON true
        WHERE COALESCE(c.situacao,'ATIVO')=COALESCE(v_sit,'ATIVO') AND (v_emp IS NULL OR c.id_empresa=v_emp) AND (v_uf IS NULL OR c.uf=v_uf)
          AND (ult.d IS NULL OR v_de IS NULL OR ult.d < v_de)) s;
  ELSIF v_ag='novos' THEN
    v_col := '[{"key":"cliente","label":"Cliente","tipo":"texto"},{"key":"cadastro","label":"Cadastrado em","tipo":"data"},{"key":"cidade","label":"Cidade","tipo":"texto"},{"key":"uf","label":"UF","tipo":"texto"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY t->>'cadastro' DESC),'[]'), COUNT(*), 0
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('cliente',c.nome,'cadastro',c.criado_em::date,'cidade',COALESCE(c.cidade,''),'uf',COALESCE(c.uf,'')) t
        FROM "Teste ERP".clientes c
        WHERE (v_de IS NULL OR c.criado_em::date>=v_de) AND (v_ate IS NULL OR c.criado_em::date<=v_ate)
          AND (v_emp IS NULL OR c.id_empresa=v_emp) AND (v_uf IS NULL OR c.uf=v_uf) AND (v_sit IS NULL OR c.situacao=v_sit)) s;
  ELSIF v_ag='uf' THEN
    v_col := '[{"key":"uf","label":"UF","tipo":"texto"},{"key":"quantidade","label":"Nº clientes","tipo":"num"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'quantidade')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), 0
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('uf',COALESCE(NULLIF(c.uf,''),'(sem UF)'),'quantidade',COUNT(*)) t
        FROM "Teste ERP".clientes c
        WHERE COALESCE(c.situacao,'ATIVO')=COALESCE(v_sit,'ATIVO') AND (v_emp IS NULL OR c.id_empresa=v_emp)
        GROUP BY COALESCE(NULLIF(c.uf,''),'(sem UF)')) s;
  ELSE
    v_col := '[{"key":"cliente","label":"Cliente","tipo":"texto"},{"key":"cidade","label":"Cidade","tipo":"texto"},{"key":"quantidade","label":"Nº compras","tipo":"num"},{"key":"valor","label":"Valor comprado","tipo":"money"}]';
    SELECT COALESCE(jsonb_agg(t ORDER BY (t->>'valor')::numeric DESC),'[]'), COALESCE(SUM((t->>'quantidade')::numeric),0), COALESCE(SUM((t->>'valor')::numeric),0)
      INTO v_linhas,v_qtd,v_val FROM (
        SELECT jsonb_build_object('cliente',COALESCE(c.nome,'#'||v.id_cliente),'cidade',COALESCE(c.cidade,''),
               'quantidade',COUNT(*),'valor',SUM(v.valor_total)) t
        FROM "Teste ERP".vendas v LEFT JOIN "Teste ERP".clientes c ON c.id=v.id_cliente
        WHERE COALESCE(v.cancelada,false)=false
          AND (v_de IS NULL OR v.data_venda>=v_de) AND (v_ate IS NULL OR v.data_venda<=v_ate)
          AND (v_emp IS NULL OR v.id_empresa=v_emp) AND (v_uf IS NULL OR c.uf=v_uf)
        GROUP BY COALESCE(c.nome,'#'||v.id_cliente), COALESCE(c.cidade,'')) s;
  END IF;
  RETURN jsonb_build_object('ok',true,'agrupamento',v_ag,'colunas',v_col,'linhas',v_linhas,'totais',jsonb_build_object('qtd',v_qtd,'valor',v_val));
END $function$;
