-- ERP Bononi — Históricos (cliente e produto) + Curva ABC mensal automática
-- Cliente: pagamentos (titulos_baixas) + movimentações (vendas/devoluções/remessas/retornos por tipo_saida, e OS).
-- Produto: histórico de estoque_movimentos + resumo. Curva ABC: tabela + geração mensal via pg_cron.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Histórico do cliente
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.erp_cliente_historico(p_id_cliente int, p_id_empresa int DEFAULT NULL, p_limit int DEFAULT 200)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'resumo', jsonb_build_object(
      'total_comprado', (SELECT COALESCE(SUM(valor_total),0) FROM "Teste ERP".vendas
          WHERE id_cliente=p_id_cliente AND COALESCE(cancelada,false)=false
            AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),
      'qtd_compras', (SELECT count(*) FROM "Teste ERP".vendas
          WHERE id_cliente=p_id_cliente AND COALESCE(cancelada,false)=false
            AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),
      'ultima_compra', (SELECT MAX(data_venda) FROM "Teste ERP".vendas
          WHERE id_cliente=p_id_cliente AND COALESCE(cancelada,false)=false
            AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),
      'total_pago', (SELECT COALESCE(SUM(b.valor_pago),0) FROM "Teste ERP".titulos_baixas b
          JOIN "Teste ERP".titulos t ON t.id=b.id_titulo
          WHERE t.id_cliente=p_id_cliente AND t.tipo='CR' AND COALESCE(b.estornado,false)=false
            AND (p_id_empresa IS NULL OR t.id_empresa=p_id_empresa)),
      'saldo_devedor', (SELECT COALESCE(SUM(valor_saldo),0) FROM "Teste ERP".titulos
          WHERE id_cliente=p_id_cliente AND tipo='CR' AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL')
            AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa))
    ),
    'pagamentos', COALESCE((SELECT jsonb_agg(row_to_json(p)) FROM (
        SELECT b.id, b.data_baixa AS data, b.valor_pago, b.valor_juros, b.valor_multa, b.valor_desconto,
               t.numero AS titulo, t.parcela, t.origem, fp.descricao AS forma, COALESCE(b.estornado,false) AS estornado
        FROM "Teste ERP".titulos_baixas b
        JOIN "Teste ERP".titulos t ON t.id=b.id_titulo
        LEFT JOIN "Teste ERP".formas_pagamento fp ON fp.id=b.id_forma_pagamento
        WHERE t.id_cliente=p_id_cliente AND t.tipo='CR'
          AND (p_id_empresa IS NULL OR t.id_empresa=p_id_empresa)
        ORDER BY b.data_baixa DESC NULLS LAST, b.id DESC LIMIT p_limit) p), '[]'::jsonb),
    'movimentacoes', COALESCE((SELECT jsonb_agg(row_to_json(m)) FROM (
        SELECT 'VENDA' AS doc, v.id, v.numero, v.data_venda AS data, v.valor_total AS valor, v.status,
               COALESCE(v.cancelada,false) AS cancelada, COALESCE(ts.descricao,'Venda') AS tipo,
               emp.nome_fantasia AS empresa
        FROM "Teste ERP".vendas v
        LEFT JOIN "Teste ERP".tipos_saida ts ON ts.id=v.id_tipo_saida
        LEFT JOIN "Teste ERP".empresas emp ON emp.id=v.id_empresa
        WHERE v.id_cliente=p_id_cliente AND (p_id_empresa IS NULL OR v.id_empresa=p_id_empresa)
        UNION ALL
        SELECT 'OS' AS doc, o.id, o.numero, o.data_entrada::date AS data, o.valor_total AS valor, o.status,
               COALESCE(o.cancelada,false) AS cancelada, 'Ordem de Serviço' AS tipo,
               emp.nome_fantasia AS empresa
        FROM "Teste ERP".ordens_servico o
        LEFT JOIN "Teste ERP".empresas emp ON emp.id=o.id_empresa
        WHERE o.id_cliente=p_id_cliente AND (p_id_empresa IS NULL OR o.id_empresa=p_id_empresa)
        ORDER BY data DESC NULLS LAST LIMIT p_limit) m), '[]'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.erp_cliente_historico(int,int,int) TO anon,authenticated,service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Histórico do produto (estoque)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.erp_produto_historico(p_id_produto int, p_id_empresa int DEFAULT NULL, p_limit int DEFAULT 300)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'resumo', jsonb_build_object(
      'saldo_atual', (SELECT COALESCE(SUM(estoque_atual),0) FROM "Teste ERP".estoque_saldos WHERE id_produto=p_id_produto),
      'entradas_12m', (SELECT COALESCE(SUM(quantidade),0) FROM "Teste ERP".estoque_movimentos
          WHERE id_produto=p_id_produto AND tipo='ENTRADA' AND criado_em >= now()-interval '12 months'
            AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),
      'saidas_12m', (SELECT COALESCE(SUM(quantidade),0) FROM "Teste ERP".estoque_movimentos
          WHERE id_produto=p_id_produto AND tipo='SAIDA' AND criado_em >= now()-interval '12 months'
            AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa))
    ),
    'movimentos', COALESCE((SELECT jsonb_agg(row_to_json(m)) FROM (
        SELECT em.id, em.criado_em AS data, em.tipo, em.origem, em.quantidade,
               em.custo_unitario, em.estoque_anterior, em.estoque_posterior,
               em.numero_referencia, em.observacao,
               emp.nome_fantasia AS empresa, ce.descricao AS centro,
               us.nome AS usuario
        FROM "Teste ERP".estoque_movimentos em
        LEFT JOIN "Teste ERP".empresas emp ON emp.id=em.id_empresa
        LEFT JOIN "Teste ERP".centros_estoque ce ON ce.id=em.id_centro
        LEFT JOIN "Teste ERP".usuarios us ON us.id=em.id_usuario
        WHERE em.id_produto=p_id_produto AND (p_id_empresa IS NULL OR em.id_empresa=p_id_empresa)
        ORDER BY em.criado_em DESC, em.id DESC LIMIT p_limit) m), '[]'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.erp_produto_historico(int,int,int) TO anon,authenticated,service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Curva ABC (tabela + geração + leitura + agendamento mensal)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Teste ERP".curva_abc (
  id serial PRIMARY KEY,
  ano int NOT NULL, mes int NOT NULL,
  id_empresa int REFERENCES "Teste ERP".empresas(id),   -- NULL = consolidado (todas)
  id_produto int NOT NULL REFERENCES "Teste ERP".produtos(id),
  faturamento numeric(14,2) NOT NULL DEFAULT 0,
  quantidade  numeric(14,3) NOT NULL DEFAULT 0,
  custo       numeric(14,2) NOT NULL DEFAULT 0,
  margem      numeric(14,2) NOT NULL DEFAULT 0,
  participacao      numeric(7,4) NOT NULL DEFAULT 0,
  participacao_acum numeric(7,4) NOT NULL DEFAULT 0,
  classe char(1) NOT NULL DEFAULT 'C',
  posicao int,
  gerado_em timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_curva_abc ON "Teste ERP".curva_abc (ano,mes,COALESCE(id_empresa,0),id_produto);
CREATE INDEX IF NOT EXISTS ix_curva_abc_prod ON "Teste ERP".curva_abc (id_produto);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".curva_abc TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".curva_abc_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".curva_abc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_all ON "Teste ERP".curva_abc;
CREATE POLICY p_all ON "Teste ERP".curva_abc FOR ALL USING (true) WITH CHECK (true);

-- gera a curva ABC de um mês (classe A<=80%, B<=95%, C resto do faturamento)
CREATE OR REPLACE FUNCTION public.erp_gerar_curva_abc(p_ano int, p_mes int, p_id_empresa int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_n int; v_fat numeric;
BEGIN
  DELETE FROM curva_abc WHERE ano=p_ano AND mes=p_mes AND COALESCE(id_empresa,0)=COALESCE(p_id_empresa,0);

  WITH base AS (
    SELECT vi.id_produto,
           SUM(vi.valor_total) AS fat,
           SUM(vi.quantidade)  AS qtd,
           SUM(vi.quantidade * COALESCE(vi.valor_custo,0)) AS custo
    FROM vendas v JOIN vendas_itens vi ON vi.id_venda=v.id
    WHERE vi.tipo='PRODUTO' AND vi.id_produto IS NOT NULL
      AND COALESCE(v.cancelada,false)=false
      AND EXTRACT(YEAR FROM v.data_venda)=p_ano AND EXTRACT(MONTH FROM v.data_venda)=p_mes
      AND (p_id_empresa IS NULL OR v.id_empresa=p_id_empresa)
    GROUP BY vi.id_produto
    HAVING SUM(vi.valor_total) > 0
  ), tot AS ( SELECT COALESCE(SUM(fat),0) AS tf FROM base ),
  rk AS (
    SELECT b.*, t.tf,
           SUM(b.fat) OVER (ORDER BY b.fat DESC, b.id_produto) AS acum,
           ROW_NUMBER() OVER (ORDER BY b.fat DESC, b.id_produto) AS pos
    FROM base b CROSS JOIN tot t WHERE t.tf > 0
  )
  INSERT INTO curva_abc (ano,mes,id_empresa,id_produto,faturamento,quantidade,custo,margem,participacao,participacao_acum,classe,posicao)
  SELECT p_ano, p_mes, p_id_empresa, id_produto, ROUND(fat,2), qtd, ROUND(custo,2), ROUND(fat-custo,2),
         ROUND(fat/tf*100,4), ROUND(acum/tf*100,4),
         CASE WHEN acum/tf <= 0.80 THEN 'A' WHEN acum/tf <= 0.95 THEN 'B' ELSE 'C' END,
         pos
  FROM rk;

  SELECT count(*), COALESCE(SUM(faturamento),0) INTO v_n, v_fat FROM curva_abc
    WHERE ano=p_ano AND mes=p_mes AND COALESCE(id_empresa,0)=COALESCE(p_id_empresa,0);
  RETURN jsonb_build_object('ok',true,'ano',p_ano,'mes',p_mes,'id_empresa',p_id_empresa,'produtos',v_n,'faturamento',v_fat);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_gerar_curva_abc(int,int,int) TO anon,authenticated,service_role;

-- gera o mês anterior para consolidado + cada empresa (chamado pelo cron)
CREATE OR REPLACE FUNCTION public.erp_gerar_curva_abc_mes_anterior()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE d date := (date_trunc('month', CURRENT_DATE) - interval '1 month')::date; e RECORD; v_n int:=0;
BEGIN
  PERFORM public.erp_gerar_curva_abc(EXTRACT(YEAR FROM d)::int, EXTRACT(MONTH FROM d)::int, NULL);
  FOR e IN SELECT id FROM empresas WHERE COALESCE(ativa,true)=true LOOP
    PERFORM public.erp_gerar_curva_abc(EXTRACT(YEAR FROM d)::int, EXTRACT(MONTH FROM d)::int, e.id);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok',true,'mes',to_char(d,'YYYY-MM'),'empresas',v_n);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_gerar_curva_abc_mes_anterior() TO anon,authenticated,service_role;

-- leitura: ranking de um mês (por empresa/consolidado, filtro de classe opcional)
CREATE OR REPLACE FUNCTION public.erp_curva_abc(p_ano int, p_mes int, p_id_empresa int DEFAULT NULL, p_classe text DEFAULT NULL, p_limit int DEFAULT 1000)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'resumo', (SELECT jsonb_build_object(
        'produtos', count(*), 'faturamento', COALESCE(SUM(faturamento),0),
        'A', count(*) FILTER (WHERE classe='A'), 'B', count(*) FILTER (WHERE classe='B'), 'C', count(*) FILTER (WHERE classe='C'))
      FROM curva_abc WHERE ano=p_ano AND mes=p_mes AND COALESCE(id_empresa,0)=COALESCE(p_id_empresa,0)),
    'itens', COALESCE((SELECT jsonb_agg(row_to_json(x)) FROM (
        SELECT c.posicao, c.id_produto, p.nome AS produto, p.referencia,
               c.faturamento, c.quantidade, c.margem, c.participacao, c.participacao_acum, c.classe
        FROM curva_abc c JOIN produtos p ON p.id=c.id_produto
        WHERE c.ano=p_ano AND c.mes=p_mes AND COALESCE(c.id_empresa,0)=COALESCE(p_id_empresa,0)
          AND (p_classe IS NULL OR c.classe=p_classe)
        ORDER BY c.posicao LIMIT p_limit) x), '[]'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.erp_curva_abc(int,int,int,text,int) TO anon,authenticated,service_role;

-- histórico ABC de um produto (classe mês a mês) — para a tela de produto
CREATE OR REPLACE FUNCTION public.erp_produto_curva_abc(p_id_produto int, p_id_empresa int DEFAULT NULL, p_meses int DEFAULT 12)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::jsonb) FROM (
    SELECT ano, mes, faturamento, quantidade, participacao, posicao, classe
    FROM "Teste ERP".curva_abc
    WHERE id_produto=p_id_produto AND COALESCE(id_empresa,0)=COALESCE(p_id_empresa,0)
    ORDER BY ano DESC, mes DESC LIMIT p_meses) x;
$$;
GRANT EXECUTE ON FUNCTION public.erp_produto_curva_abc(int,int,int) TO anon,authenticated,service_role;

-- agendamento mensal (dia 1, 03:00) — pg_cron
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='curva_abc_mensal') THEN
      PERFORM cron.unschedule('curva_abc_mensal');
    END IF;
    PERFORM cron.schedule('curva_abc_mensal', '0 3 1 * *', $$SELECT public.erp_gerar_curva_abc_mes_anterior();$$);
  END IF;
END $cron$;
