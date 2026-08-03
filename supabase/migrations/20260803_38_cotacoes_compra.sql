-- 38: Cotações de Compra (mapa comparativo -> pedido)
-- Fluxo: cotação (itens = produtos a cotar) -> registra as respostas de N fornecedores
--        (preço/prazo/condição por item) -> seleciona a melhor por item -> gera o(s)
--        Pedido(s) de Compra agrupando por fornecedor (reusa erp_pedido_compra_salvar).
-- As tabelas cotacoes / cotacoes_itens / cotacoes_respostas já existem; aqui vão as funções + backstops.

-- Backstops de integridade (idempotentes)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cotacoes_numero_empresa_uk') THEN
    ALTER TABLE "Teste ERP".cotacoes ADD CONSTRAINT cotacoes_numero_empresa_uk UNIQUE (numero, id_empresa);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS ix_cotacoes_itens_cotacao    ON "Teste ERP".cotacoes_itens(id_cotacao);
CREATE INDEX IF NOT EXISTS ix_cotacoes_respostas_cotacao ON "Teste ERP".cotacoes_respostas(id_cotacao);

-- ----------------------------------------------------------------------------
-- 1) Listagem
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_listar(p_id_empresa integer DEFAULT NULL, p_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.id DESC), '[]'::jsonb)
  FROM (
    SELECT c.id, c.numero, c.id_empresa, c.status, c.data_emissao, c.data_validade, c.observacao,
      (SELECT count(*) FROM cotacoes_itens i WHERE i.id_cotacao=c.id) AS qtd_itens,
      (SELECT count(DISTINCT r.id_fornecedor) FROM cotacoes_respostas r WHERE r.id_cotacao=c.id) AS qtd_fornecedores,
      (SELECT count(*) FROM cotacoes_respostas r WHERE r.id_cotacao=c.id AND r.selecionado) AS qtd_selecionados
    FROM cotacoes c
    WHERE (p_id_empresa IS NULL OR c.id_empresa=p_id_empresa)
      AND (p_status IS NULL OR c.status=p_status)
  ) x;
$function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_listar(integer,text) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2) Detalhe (cabeçalho + itens + respostas + fornecedores que responderam)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_detalhe(p_id integer)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT jsonb_build_object(
    'cab', (SELECT to_jsonb(c) FROM cotacoes c WHERE c.id=p_id),
    'itens', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (
        SELECT i.id, i.id_produto, p.referencia, p.nome, i.quantidade, i.observacao
        FROM cotacoes_itens i JOIN produtos p ON p.id=i.id_produto
        WHERE i.id_cotacao=p_id ORDER BY p.nome) t),
    'respostas', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (
        SELECT r.id, r.id_fornecedor, f.nome AS fornecedor, r.id_produto, r.preco_unitario,
               r.prazo_entrega_dias, r.condicao_pagamento, r.selecionado, r.observacao
        FROM cotacoes_respostas r JOIN fornecedores f ON f.id=r.id_fornecedor
        WHERE r.id_cotacao=p_id) t),
    'fornecedores', (SELECT COALESCE(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM (
        SELECT DISTINCT r.id_fornecedor, f.nome AS fornecedor
        FROM cotacoes_respostas r JOIN fornecedores f ON f.id=r.id_fornecedor
        WHERE r.id_cotacao=p_id ORDER BY f.nome) t)
  );
$function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_detalhe(integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3) Salvar cabeçalho + itens (numeração COT###### com advisory lock)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_salvar(p_cab jsonb, p_itens jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int; v_num text; it jsonb;
BEGIN
  IF v_emp IS NULL THEN RAISE EXCEPTION 'Empresa é obrigatória'; END IF;
  IF v_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('erp_cotacao:'||v_emp));
    SELECT 'COT'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
      INTO v_num FROM cotacoes WHERE id_empresa=v_emp;
    INSERT INTO cotacoes(numero,id_empresa,id_usuario,status,data_emissao,data_validade,observacao,criado_em)
    VALUES(v_num,v_emp,NULLIF(p_cab->>'id_usuario','')::int,'ABERTA',CURRENT_DATE,
           NULLIF(p_cab->>'data_validade','')::date,NULLIF(p_cab->>'observacao',''),now())
    RETURNING id INTO v_id;
  ELSE
    IF (SELECT status FROM cotacoes WHERE id=v_id) IN ('FINALIZADA','CANCELADA') THEN
      RAISE EXCEPTION 'Cotação já processada; não pode ser editada';
    END IF;
    UPDATE cotacoes SET data_validade=NULLIF(p_cab->>'data_validade','')::date,
        observacao=NULLIF(p_cab->>'observacao','') WHERE id=v_id;
    -- remove itens e respostas de produtos que saírem da lista é feito recriando itens;
    -- respostas órfãs (produto removido) são ignoradas pelo comparativo (join por item).
    DELETE FROM cotacoes_itens WHERE id_cotacao=v_id;
  END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens,'[]'::jsonb)) LOOP
    IF NULLIF(it->>'id_produto','') IS NULL THEN CONTINUE; END IF;
    INSERT INTO cotacoes_itens(id_cotacao,id_produto,quantidade,observacao)
    VALUES(v_id,(it->>'id_produto')::int,COALESCE(NULLIF(it->>'quantidade','')::numeric,1),NULLIF(it->>'observacao',''));
  END LOOP;
  RETURN v_id;
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_salvar(jsonb,jsonb) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4) Registrar/atualizar a resposta de UM fornecedor (preço/prazo/condição por item)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_resposta_salvar(
  p_id_cotacao integer, p_id_fornecedor integer, p_itens jsonb, p_id_usuario integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_n int;
BEGIN
  IF (SELECT status FROM cotacoes WHERE id=p_id_cotacao) IN ('FINALIZADA','CANCELADA') THEN
    RAISE EXCEPTION 'Cotação já processada; não aceita novas respostas';
  END IF;
  IF p_id_fornecedor IS NULL THEN RAISE EXCEPTION 'Fornecedor é obrigatório'; END IF;
  DELETE FROM cotacoes_respostas WHERE id_cotacao=p_id_cotacao AND id_fornecedor=p_id_fornecedor;
  INSERT INTO cotacoes_respostas(id_cotacao,id_fornecedor,id_produto,preco_unitario,
      prazo_entrega_dias,condicao_pagamento,observacao,selecionado)
  SELECT p_id_cotacao, p_id_fornecedor, (e->>'id_produto')::int,
      COALESCE(NULLIF(e->>'preco_unitario','')::numeric,0),
      COALESCE(NULLIF(e->>'prazo_entrega_dias','')::int,0),
      NULLIF(e->>'condicao_pagamento',''), NULLIF(e->>'observacao',''), false
  FROM jsonb_array_elements(COALESCE(p_itens,'[]'::jsonb)) e
  WHERE NULLIF(e->>'id_produto','') IS NOT NULL
    AND COALESCE(NULLIF(e->>'preco_unitario','')::numeric,0) > 0;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'itens',v_n);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_resposta_salvar(integer,integer,jsonb,integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5) Selecionar o fornecedor vencedor de um item (exclusivo por item)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_selecionar(
  p_id_cotacao integer, p_id_produto integer, p_id_fornecedor integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
BEGIN
  UPDATE cotacoes_respostas SET selecionado=false
   WHERE id_cotacao=p_id_cotacao AND id_produto=p_id_produto;
  IF p_id_fornecedor IS NOT NULL THEN
    UPDATE cotacoes_respostas SET selecionado=true
     WHERE id_cotacao=p_id_cotacao AND id_produto=p_id_produto AND id_fornecedor=p_id_fornecedor;
  END IF;
  RETURN jsonb_build_object('ok',true);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_selecionar(integer,integer,integer) TO anon, authenticated, service_role;

-- Auto-selecionar o menor preço por item (empate: menor prazo, depois menor id_fornecedor)
CREATE OR REPLACE FUNCTION public.erp_cotacao_selecionar_menor(p_id_cotacao integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_n int;
BEGIN
  UPDATE cotacoes_respostas SET selecionado=false WHERE id_cotacao=p_id_cotacao;
  WITH melhor AS (
    SELECT DISTINCT ON (r.id_produto) r.id
    FROM cotacoes_respostas r
    WHERE r.id_cotacao=p_id_cotacao AND COALESCE(r.preco_unitario,0) > 0
    ORDER BY r.id_produto, r.preco_unitario ASC, COALESCE(r.prazo_entrega_dias,999) ASC, r.id_fornecedor
  )
  UPDATE cotacoes_respostas r SET selecionado=true FROM melhor m WHERE r.id=m.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok',true,'selecionados',v_n);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_selecionar_menor(integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 6) Gerar Pedido(s) de Compra dos itens selecionados (1 por fornecedor)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_gerar_pedidos(p_id_cotacao integer, p_id_usuario integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_emp int; v_num_cot text; v_forn int; v_itens jsonb; v_id int; v_num text; v_out jsonb := '[]'::jsonb;
BEGIN
  SELECT id_empresa, numero INTO v_emp, v_num_cot FROM cotacoes WHERE id=p_id_cotacao;
  IF v_emp IS NULL THEN RAISE EXCEPTION 'Cotação não encontrada'; END IF;
  IF NOT EXISTS (SELECT 1 FROM cotacoes_respostas WHERE id_cotacao=p_id_cotacao AND selecionado) THEN
    RAISE EXCEPTION 'Selecione ao menos um fornecedor por item antes de gerar o pedido';
  END IF;
  FOR v_forn IN SELECT DISTINCT id_fornecedor FROM cotacoes_respostas
                WHERE id_cotacao=p_id_cotacao AND selecionado ORDER BY 1 LOOP
    SELECT jsonb_agg(jsonb_build_object(
        'id_produto', r.id_produto, 'descricao', p.nome,
        'quantidade', COALESCE(i.quantidade,1), 'valor_unitario', r.preco_unitario))
      INTO v_itens
      FROM cotacoes_respostas r
      JOIN produtos p ON p.id=r.id_produto
      LEFT JOIN cotacoes_itens i ON i.id_cotacao=r.id_cotacao AND i.id_produto=r.id_produto
     WHERE r.id_cotacao=p_id_cotacao AND r.selecionado AND r.id_fornecedor=v_forn;
    IF v_itens IS NULL THEN CONTINUE; END IF;
    v_id := public.erp_pedido_compra_salvar(
      jsonb_build_object('id_empresa',v_emp,'id_fornecedor',v_forn,'id_usuario',p_id_usuario,
        'observacao','Gerado da cotação '||v_num_cot),
      v_itens);
    SELECT numero INTO v_num FROM pedidos_compra WHERE id=v_id;
    v_out := v_out || jsonb_build_object('id_fornecedor',v_forn,'id_pedido',v_id,'numero',v_num,'itens',jsonb_array_length(v_itens));
  END LOOP;
  UPDATE cotacoes SET status='FINALIZADA' WHERE id=p_id_cotacao;
  RETURN jsonb_build_object('ok',true,'pedidos',v_out);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_gerar_pedidos(integer,integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 7) Status (cancelar / reabrir)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_cotacao_status(p_id integer, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
BEGIN
  IF p_status NOT IN ('ABERTA','ENVIADA','RESPONDIDA','FINALIZADA','CANCELADA') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  UPDATE cotacoes SET status=p_status WHERE id=p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cotação não encontrada'; END IF;
  RETURN jsonb_build_object('ok',true,'status',p_status);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_cotacao_status(integer,text) TO anon, authenticated, service_role;
