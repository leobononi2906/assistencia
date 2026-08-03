-- 41: Centro de estoque "não contabiliza" + Posição de estoque
-- Alguns centros (ex.: Garantia) guardam produto que está fisicamente na empresa mas
-- NÃO é estoque vendável/contábil. Marca-se o centro com contabiliza=false e ele deixa
-- de somar no saldo contábil/disponível (posição, demanda). Gôndola continua contando.

ALTER TABLE "Teste ERP".centros_estoque
  ADD COLUMN IF NOT EXISTS contabiliza boolean NOT NULL DEFAULT true;

-- ----------------------------------------------------------------------------
-- Posição de estoque (consolidada por produto OU detalhada por centro)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_estoque_posicao(
  p_id_empresa integer DEFAULT NULL,
  p_id_centro  integer DEFAULT NULL,
  p_id_grupo   integer DEFAULT NULL,
  p_busca      text    DEFAULT NULL,
  p_somente_com_saldo boolean DEFAULT true,
  p_detalhado  boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_itens jsonb; v_tot jsonb;
BEGIN
  IF p_detalhado THEN
    SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.nome, x.centro),'[]'::jsonb) INTO v_itens FROM (
      SELECT p.id AS id_produto, p.referencia, p.nome, g.descricao AS grupo,
        ce.id AS id_centro, ce.descricao AS centro, e.nome AS empresa,
        COALESCE(ce.contabiliza,true) AS contabiliza,
        COALESCE(s.estoque_atual,0) AS estoque_atual,
        COALESCE(s.estoque_reservado,0) AS reservado,
        (COALESCE(s.estoque_atual,0)-COALESCE(s.estoque_reservado,0)) AS disponivel,
        s.custo_medio, ROUND(COALESCE(s.estoque_atual,0)*COALESCE(s.custo_medio,0),2) AS valor
      FROM estoque_saldos s
      JOIN produtos p ON p.id=s.id_produto
      JOIN centros_estoque ce ON ce.id=s.id_centro
      LEFT JOIN empresas e ON e.id=ce.id_empresa
      LEFT JOIN grupos_produto g ON g.id=p.id_grupo
      WHERE (p_id_empresa IS NULL OR ce.id_empresa=p_id_empresa)
        AND (p_id_centro  IS NULL OR ce.id=p_id_centro)
        AND (p_id_grupo   IS NULL OR p.id_grupo=p_id_grupo)
        AND (p_busca IS NULL OR p.nome ILIKE '%'||p_busca||'%' OR p.referencia ILIKE '%'||p_busca||'%')
        AND (NOT p_somente_com_saldo OR COALESCE(s.estoque_atual,0) <> 0)
    ) x;
    RETURN jsonb_build_object('detalhado',true,'itens',v_itens);
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.nome),'[]'::jsonb),
         jsonb_build_object(
           'produtos', COUNT(*),
           'valor_contabil', COALESCE(SUM(x.valor_contabil),0),
           'valor_nao_contabil', COALESCE(SUM(x.valor_nao_contabil),0),
           'itens_nao_contabil', COUNT(*) FILTER (WHERE x.estoque_nao_contabil <> 0))
    INTO v_itens, v_tot
  FROM (
    SELECT p.id AS id_produto, p.referencia, p.nome, g.descricao AS grupo,
      SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0) ELSE 0 END) AS estoque_contabil,
      SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_reservado,0) ELSE 0 END) AS reservado,
      SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0)-COALESCE(s.estoque_reservado,0) ELSE 0 END) AS disponivel,
      SUM(CASE WHEN NOT COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0) ELSE 0 END) AS estoque_nao_contabil,
      ROUND(SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0)*COALESCE(s.custo_medio,0) ELSE 0 END),2) AS valor_contabil,
      ROUND(SUM(CASE WHEN NOT COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0)*COALESCE(s.custo_medio,0) ELSE 0 END),2) AS valor_nao_contabil,
      ROUND(CASE WHEN SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0) ELSE 0 END) > 0
             THEN SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0)*COALESCE(s.custo_medio,0) ELSE 0 END)
                / NULLIF(SUM(CASE WHEN COALESCE(ce.contabiliza,true) THEN COALESCE(s.estoque_atual,0) ELSE 0 END),0)
             ELSE 0 END,4) AS custo_medio
    FROM produtos p
    JOIN estoque_saldos s ON s.id_produto=p.id
    JOIN centros_estoque ce ON ce.id=s.id_centro
    LEFT JOIN grupos_produto g ON g.id=p.id_grupo
    WHERE (p_id_empresa IS NULL OR ce.id_empresa=p_id_empresa)
      AND (p_id_centro  IS NULL OR ce.id=p_id_centro)
      AND (p_id_grupo   IS NULL OR p.id_grupo=p_id_grupo)
      AND (p_busca IS NULL OR p.nome ILIKE '%'||p_busca||'%' OR p.referencia ILIKE '%'||p_busca||'%')
    GROUP BY p.id, p.referencia, p.nome, g.descricao
    HAVING NOT p_somente_com_saldo OR SUM(COALESCE(s.estoque_atual,0)) <> 0
  ) x;
  RETURN jsonb_build_object('detalhado',false,'itens',v_itens,'totais',v_tot);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_estoque_posicao(integer,integer,integer,text,boolean,boolean)
  TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Demanda: o saldo disponível ignora centros que NÃO contabilizam (ex.: garantia)
-- (recria erp_demanda_listar da migration 37 com o filtro ce.contabiliza no saldo)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_demanda_listar(
  p_id_empresa      integer DEFAULT NULL,
  p_dias            integer DEFAULT 90,
  p_modo            text    DEFAULT 'ambos',
  p_id_grupo        integer DEFAULT NULL,
  p_id_subgrupo     integer DEFAULT NULL,
  p_id_fornecedor   integer DEFAULT NULL,
  p_busca           text    DEFAULT NULL,
  p_urgencia        text    DEFAULT NULL,
  p_cobertura_alvo  integer DEFAULT 30,
  p_lead_time       integer DEFAULT 15,
  p_somente_demanda boolean DEFAULT true
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
          AND ce.contabiliza IS DISTINCT FROM false
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
      forn AS (
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
