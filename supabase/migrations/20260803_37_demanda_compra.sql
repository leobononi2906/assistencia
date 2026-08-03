-- 37: Demanda de Compra (análise + formação do pedido)
-- Fecha o ciclo "analisar demanda -> formar pedido de compra" que faltava:
--  - erp_demanda_listar: análise de reposição/giro com filtros por empresa, grupo,
--    subgrupo, fornecedor e busca; devolve saldo, consumo, cobertura, urgência e
--    quantidade sugerida (modo reposição = mín/máx, giro = consumo, ou ambos).
--  - erp_demanda_filtros: grupos e subgrupos para os seletores da tela.
--  - erp_produto_estoque_limites: altera mínimo/máximo direto na tela de demanda.
--  - erp_demanda_gerar_pedidos: agrupa os itens marcados por fornecedor e cria
--    um Pedido de Compra (PENDENTE) para cada, reusando erp_pedido_compra_salvar.
-- Saída de estoque = tipo 'SAIDA' (a origem indica a fonte); transferências não contam como consumo.

-- ----------------------------------------------------------------------------
-- 1) Análise de demanda com filtros
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_demanda_listar(
  p_id_empresa      integer DEFAULT NULL,
  p_dias            integer DEFAULT 90,        -- janela de consumo analisada
  p_modo            text    DEFAULT 'ambos',   -- 'reposicao' | 'giro' | 'ambos'
  p_id_grupo        integer DEFAULT NULL,
  p_id_subgrupo     integer DEFAULT NULL,
  p_id_fornecedor   integer DEFAULT NULL,
  p_busca           text    DEFAULT NULL,
  p_urgencia        text    DEFAULT NULL,      -- 'CRITICO' | 'ALERTA' | 'OK' | NULL(todas)
  p_cobertura_alvo  integer DEFAULT 30,        -- dias de estoque desejados (giro)
  p_lead_time       integer DEFAULT 15,        -- prazo de reposição (dias)
  p_somente_demanda boolean DEFAULT true       -- true = só o que precisa comprar
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(x) ORDER BY
             CASE x.urgencia WHEN 'CRITICO' THEN 0 WHEN 'ALERTA' THEN 1 ELSE 2 END,
             x.cobertura_dias, x.nome)
    FROM (
      WITH base AS (
        SELECT p.id, p.referencia, p.nome, p.id_grupo, p.id_subgrupo, p.curva_abc,
               COALESCE(p.estoque_minimo,0) AS emin, COALESCE(p.estoque_maximo,0) AS emax,
               p.preco_custo
        FROM produtos p
        WHERE p.situacao = 'ATIVO' AND p.controla_estoque = true
          AND (p_id_grupo    IS NULL OR p.id_grupo    = p_id_grupo)
          AND (p_id_subgrupo IS NULL OR p.id_subgrupo = p_id_subgrupo)
          AND (p_busca IS NULL OR p.nome ILIKE '%'||p_busca||'%' OR p.referencia ILIKE '%'||p_busca||'%')
      ),
      saldo AS (
        SELECT s.id_produto, SUM(s.estoque_atual) AS estoque_atual
        FROM estoque_saldos s
        JOIN centros_estoque ce ON ce.id = s.id_centro
        WHERE (p_id_empresa IS NULL OR ce.id_empresa = p_id_empresa)
        GROUP BY s.id_produto
      ),
      consumo AS (
        SELECT m.id_produto,
               SUM(ABS(m.quantidade)) AS saida_periodo,
               SUM(ABS(m.quantidade)) / NULLIF(p_dias,0)::numeric AS consumo_dia
        FROM estoque_movimentos m
        WHERE m.tipo = 'SAIDA' AND m.origem IS DISTINCT FROM 'TRANSFERENCIA'
          AND m.criado_em >= now() - make_interval(days => p_dias)
          AND (p_id_empresa IS NULL OR m.id_empresa = p_id_empresa)
        GROUP BY m.id_produto
      ),
      forn AS (   -- fornecedor principal (fallback: 1º ativo) por produto
        SELECT DISTINCT ON (pf.id_produto)
               pf.id_produto, pf.id_fornecedor, pf.referencia_fornecedor, pf.preco_custo
        FROM produto_fornecedores pf
        WHERE COALESCE(pf.ativo,true)
        ORDER BY pf.id_produto, pf.principal DESC NULLS LAST, pf.id
      ),
      calc AS (
        SELECT b.*,
               COALESCE(sa.estoque_atual,0) AS estoque_atual,
               COALESCE(c.saida_periodo,0)  AS saida_periodo,
               COALESCE(c.consumo_dia,0)    AS consumo_dia,
               fr.id_fornecedor, fr.referencia_fornecedor,
               ROUND(COALESCE(fr.preco_custo, b.preco_custo, 0),2) AS custo_ref
        FROM base b
        LEFT JOIN saldo   sa ON sa.id_produto = b.id
        LEFT JOIN consumo c  ON c.id_produto  = b.id
        LEFT JOIN forn    fr ON fr.id_produto  = b.id
      ),
      flags AS (
        SELECT k.*,
          CASE WHEN k.consumo_dia > 0 THEN ROUND(k.estoque_atual/k.consumo_dia,0) ELSE 999 END AS cobertura_dias,
          GREATEST(0, CEIL(COALESCE(NULLIF(k.emax,0), NULLIF(k.emin,0)*3, 0) - k.estoque_atual))::numeric AS sug_repo,
          GREATEST(0, CEIL(k.consumo_dia*(p_lead_time + p_cobertura_alvo) - k.estoque_atual))::numeric   AS sug_giro
        FROM calc k
      )
      SELECT
        fl.id                AS id_produto,
        fl.referencia,
        fl.nome,
        fl.id_grupo,    g.descricao  AS grupo,
        fl.id_subgrupo, sg.descricao AS subgrupo,
        fl.emin              AS estoque_minimo,
        fl.emax              AS estoque_maximo,
        fl.estoque_atual,
        fl.saida_periodo,
        fl.consumo_dia,
        fl.cobertura_dias,
        fl.curva_abc,
        fl.id_fornecedor,    f.nome  AS fornecedor,
        fl.referencia_fornecedor,
        fl.custo_ref         AS preco_custo,
        fl.sug_repo          AS sugestao_reposicao,
        fl.sug_giro          AS sugestao_giro,
        CASE p_modo WHEN 'reposicao' THEN fl.sug_repo
                    WHEN 'giro'      THEN fl.sug_giro
                    ELSE GREATEST(fl.sug_repo, fl.sug_giro) END AS sugestao_qtd,
        CASE
          WHEN fl.estoque_atual <= 0 AND (fl.emin > 0 OR fl.consumo_dia > 0) THEN 'CRITICO'
          WHEN (fl.emin > 0 AND fl.estoque_atual <= fl.emin)
            OR (fl.consumo_dia > 0 AND fl.cobertura_dias < p_lead_time) THEN 'ALERTA'
          ELSE 'OK'
        END AS urgencia
      FROM flags fl
      LEFT JOIN grupos_produto    g  ON g.id  = fl.id_grupo
      LEFT JOIN subgrupos_produto sg ON sg.id = fl.id_subgrupo
      LEFT JOIN fornecedores      f  ON f.id  = fl.id_fornecedor
      WHERE (p_id_fornecedor IS NULL OR fl.id_fornecedor = p_id_fornecedor)
    ) x
    WHERE (p_urgencia IS NULL OR x.urgencia = p_urgencia)
      AND (
        NOT p_somente_demanda
        OR x.urgencia IN ('CRITICO','ALERTA')
        OR (p_modo IN ('giro','ambos') AND x.consumo_dia > 0
            AND x.cobertura_dias < (p_lead_time + p_cobertura_alvo))
      )
  ), '[]'::jsonb);
END $function$;

GRANT EXECUTE ON FUNCTION public.erp_demanda_listar(integer,integer,text,integer,integer,integer,text,text,integer,integer,boolean)
  TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2) Grupos e subgrupos para os seletores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_demanda_filtros()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT jsonb_build_object(
    'grupos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'descricao',descricao) ORDER BY descricao)
                        FROM grupos_produto WHERE COALESCE(ativo,true)),'[]'::jsonb),
    'subgrupos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'descricao',descricao,'id_grupo',id_grupo) ORDER BY descricao)
                        FROM subgrupos_produto WHERE COALESCE(ativo,true)),'[]'::jsonb)
  );
$function$;

GRANT EXECUTE ON FUNCTION public.erp_demanda_filtros() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3) Alterar mínimo/máximo direto na tela de demanda
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_produto_estoque_limites(
  p_id integer, p_min numeric DEFAULT NULL, p_max numeric DEFAULT NULL, p_id_usuario integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE r record;
BEGIN
  IF p_min IS NOT NULL AND p_min < 0 THEN RAISE EXCEPTION 'Estoque mínimo não pode ser negativo'; END IF;
  IF p_max IS NOT NULL AND p_max < 0 THEN RAISE EXCEPTION 'Estoque máximo não pode ser negativo'; END IF;
  IF p_min IS NOT NULL AND p_max IS NOT NULL AND p_max > 0 AND p_max < p_min THEN
    RAISE EXCEPTION 'Estoque máximo (%) não pode ser menor que o mínimo (%)', p_max, p_min;
  END IF;
  UPDATE produtos
     SET estoque_minimo = COALESCE(p_min, estoque_minimo),
         estoque_maximo = COALESCE(p_max, estoque_maximo),
         atualizado_em  = now()
   WHERE id = p_id
   RETURNING id, estoque_minimo, estoque_maximo INTO r;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto % não encontrado', p_id; END IF;
  RETURN jsonb_build_object('ok',true,'id',r.id,
    'estoque_minimo',r.estoque_minimo,'estoque_maximo',r.estoque_maximo);
END $function$;

GRANT EXECUTE ON FUNCTION public.erp_produto_estoque_limites(integer,numeric,numeric,integer)
  TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4) Gerar Pedidos de Compra a partir da demanda (1 pedido por fornecedor)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_demanda_gerar_pedidos(
  p_itens jsonb, p_id_empresa integer, p_id_usuario integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_forn int; v_id int; v_num text; v_itens jsonb; v_out jsonb := '[]'::jsonb;
BEGIN
  IF p_id_empresa IS NULL THEN RAISE EXCEPTION 'Empresa é obrigatória'; END IF;
  IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'Nenhum item selecionado';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_itens) e WHERE NULLIF(e->>'id_fornecedor','') IS NULL) THEN
    RAISE EXCEPTION 'Há itens sem fornecedor definido; informe um fornecedor para cada item.';
  END IF;

  FOR v_forn IN
    SELECT DISTINCT (e->>'id_fornecedor')::int
    FROM jsonb_array_elements(p_itens) e ORDER BY 1
  LOOP
    SELECT jsonb_agg(jsonb_build_object(
             'id_produto',            e->>'id_produto',
             'descricao',             e->>'descricao',
             'referencia_fornecedor', e->>'referencia_fornecedor',
             'quantidade',            e->>'quantidade',
             'valor_unitario',        e->>'valor_unitario'))
      INTO v_itens
      FROM jsonb_array_elements(p_itens) e
     WHERE (e->>'id_fornecedor')::int = v_forn
       AND COALESCE(NULLIF(e->>'quantidade','')::numeric,0) > 0;

    IF v_itens IS NULL THEN CONTINUE; END IF;

    v_id := public.erp_pedido_compra_salvar(
      jsonb_build_object(
        'id_empresa',   p_id_empresa,
        'id_fornecedor',v_forn,
        'id_usuario',   p_id_usuario,
        'observacao',   'Gerado pela análise de demanda'),
      v_itens);

    SELECT numero INTO v_num FROM pedidos_compra WHERE id = v_id;
    v_out := v_out || jsonb_build_object(
               'id_fornecedor', v_forn, 'id_pedido', v_id,
               'numero', v_num, 'itens', jsonb_array_length(v_itens));
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'pedidos', v_out);
END $function$;

GRANT EXECUTE ON FUNCTION public.erp_demanda_gerar_pedidos(jsonb,integer,integer)
  TO anon, authenticated, service_role;
