-- 42: "A chegar" — quantidade comprada em pedidos abertos + previsão de entrega
-- O vendedor, ao consultar o produto, vê o que está chegando (qtd pendente de compra
-- e a previsão de entrega). Pedido aberto = status PENDENTE/APROVADO/ENVIADO/RECEBIDO_PARCIAL
-- e item com saldo pendente (quantidade - quantidade_recebida) > 0.

CREATE OR REPLACE FUNCTION public.erp_produto_a_chegar(p_id_produto integer, p_id_empresa integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  WITH it AS (
    SELECT pc.id AS id_pedido, pc.numero, f.nome AS fornecedor, e.nome AS empresa,
           pc.data_previsao, pc.status,
           pci.quantidade, COALESCE(pci.quantidade_recebida,0) AS recebida,
           (pci.quantidade - COALESCE(pci.quantidade_recebida,0)) AS pendente
    FROM pedidos_compra_itens pci
    JOIN pedidos_compra pc ON pc.id=pci.id_pedido
    LEFT JOIN fornecedores f ON f.id=pc.id_fornecedor
    LEFT JOIN empresas e ON e.id=pc.id_empresa
    WHERE pci.id_produto=p_id_produto
      AND pc.status IN ('PENDENTE','APROVADO','ENVIADO','RECEBIDO_PARCIAL')
      AND (pci.quantidade - COALESCE(pci.quantidade_recebida,0)) > 0
      AND (p_id_empresa IS NULL OR pc.id_empresa=p_id_empresa)
  )
  SELECT jsonb_build_object(
    'total_pendente',  COALESCE((SELECT SUM(pendente) FROM it),0),
    'proxima_previsao',(SELECT MIN(data_previsao) FROM it WHERE data_previsao IS NOT NULL),
    'itens', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb)
              FROM (SELECT id_pedido,numero,fornecedor,empresa,data_previsao,status,quantidade,recebida,pendente
                    FROM it ORDER BY data_previsao NULLS LAST, numero) t)
  );
$function$;
GRANT EXECUTE ON FUNCTION public.erp_produto_a_chegar(integer,integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Posição de estoque: acrescenta "a_chegar" e "proxima_entrada" na visão consolidada
-- (recria a função da migration 41 com as duas colunas na consolidação)
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
           'itens_nao_contabil', COUNT(*) FILTER (WHERE x.estoque_nao_contabil <> 0),
           'a_chegar', COALESCE(SUM(x.a_chegar),0))
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
             ELSE 0 END,4) AS custo_medio,
      COALESCE((SELECT SUM(pci.quantidade - COALESCE(pci.quantidade_recebida,0))
                FROM pedidos_compra_itens pci JOIN pedidos_compra pc ON pc.id=pci.id_pedido
                WHERE pci.id_produto=p.id
                  AND pc.status IN ('PENDENTE','APROVADO','ENVIADO','RECEBIDO_PARCIAL')
                  AND (pci.quantidade - COALESCE(pci.quantidade_recebida,0)) > 0
                  AND (p_id_empresa IS NULL OR pc.id_empresa=p_id_empresa)),0) AS a_chegar,
      (SELECT MIN(pc.data_previsao)
                FROM pedidos_compra_itens pci JOIN pedidos_compra pc ON pc.id=pci.id_pedido
                WHERE pci.id_produto=p.id
                  AND pc.status IN ('PENDENTE','APROVADO','ENVIADO','RECEBIDO_PARCIAL')
                  AND (pci.quantidade - COALESCE(pci.quantidade_recebida,0)) > 0
                  AND pc.data_previsao IS NOT NULL
                  AND (p_id_empresa IS NULL OR pc.id_empresa=p_id_empresa)) AS proxima_entrada
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
