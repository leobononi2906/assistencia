-- 29: Concorrência de numeração (50-100 usuários simultâneos)
-- Problema: numeração por MAX(numero)+1 / COUNT(*)+1 pode colidir quando dois
-- usuários salvam o mesmo tipo de documento na mesma empresa ao mesmo tempo.
-- OS e Venda já são seguros (número derivado do id/sequence). As demais funções
-- passam a serializar SÓ o passo de numeração com advisory lock transacional
-- (pg_advisory_xact_lock), liberado automaticamente no commit/rollback — barato,
-- sem mudar schema, preservando o número sequencial por empresa.
-- Backstop: UNIQUE(numero,empresa) onde ainda não havia (recebimento, transferência, acordo).

-- ===== Backstops UNIQUE (impedem duplicata silenciosa mesmo em caso extremo) =====
-- compras_recebimento e estoque_transferencias já possuem UNIQUE(numero,id_empresa).
-- Falta apenas cobranca_acordos (adicionado de forma idempotente).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cobranca_acordos_numero_key') THEN
    ALTER TABLE "Teste ERP".cobranca_acordos ADD CONSTRAINT cobranca_acordos_numero_key UNIQUE (numero);
  END IF;
END $$;

-- ===== Cliente (código global) =====
CREATE OR REPLACE FUNCTION public.erp_cliente_salvar(p jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p->>'id','')::int; v_cod int;
BEGIN
  IF v_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('erp_cliente_codigo'));
    SELECT COALESCE(MAX(codigo),0)+1 INTO v_cod FROM "Teste ERP".clientes;
    INSERT INTO "Teste ERP".clientes
      (codigo, tipo_pessoa, tipo, nome, nome_fantasia, cpf_cnpj, rg_ie, inscricao_municipal,
       indicador_ie, email, email_nfe, telefone, celular, whatsapp,
       endereco, numero, complemento, bairro, id_municipio, cidade, uf, cep,
       id_empresa, id_vendedor, id_condicao_pagamento, id_tabela_preco, id_transportadora,
       perc_desc_produto, perc_desc_servico, limite_credito, permite_prazo, situacao, observacao)
    VALUES
      (v_cod, COALESCE(p->>'tipo_pessoa','F'), p->>'tipo', p->>'nome', p->>'nome_fantasia',
       p->>'cpf_cnpj', p->>'rg_ie', p->>'inscricao_municipal', NULLIF(p->>'indicador_ie','')::smallint,
       p->>'email', p->>'email_nfe', p->>'telefone', p->>'celular', p->>'whatsapp',
       p->>'endereco', p->>'numero', p->>'complemento', p->>'bairro',
       NULLIF(p->>'id_municipio','')::int, p->>'cidade', p->>'uf', p->>'cep',
       NULLIF(p->>'id_empresa','')::int, NULLIF(p->>'id_vendedor','')::int,
       NULLIF(p->>'id_condicao_pagamento','')::int, NULLIF(p->>'id_tabela_preco','')::int,
       NULLIF(p->>'id_transportadora','')::int,
       NULLIF(p->>'perc_desc_produto','')::numeric, NULLIF(p->>'perc_desc_servico','')::numeric,
       NULLIF(p->>'limite_credito','')::numeric, COALESCE((p->>'permite_prazo')::boolean,false),
       COALESCE(p->>'situacao','ATIVO'), p->>'observacao')
    RETURNING id INTO v_id;
  ELSE
    UPDATE "Teste ERP".clientes SET
      tipo_pessoa=COALESCE(p->>'tipo_pessoa',tipo_pessoa), tipo=COALESCE(p->>'tipo',tipo),
      nome=COALESCE(p->>'nome',nome), nome_fantasia=COALESCE(p->>'nome_fantasia',nome_fantasia),
      cpf_cnpj=COALESCE(p->>'cpf_cnpj',cpf_cnpj), rg_ie=COALESCE(p->>'rg_ie',rg_ie),
      inscricao_municipal=COALESCE(p->>'inscricao_municipal',inscricao_municipal),
      indicador_ie=COALESCE(NULLIF(p->>'indicador_ie','')::smallint,indicador_ie),
      email=COALESCE(p->>'email',email), email_nfe=COALESCE(p->>'email_nfe',email_nfe),
      telefone=COALESCE(p->>'telefone',telefone), celular=COALESCE(p->>'celular',celular),
      whatsapp=COALESCE(p->>'whatsapp',whatsapp),
      endereco=COALESCE(p->>'endereco',endereco), numero=COALESCE(p->>'numero',numero),
      complemento=COALESCE(p->>'complemento',complemento), bairro=COALESCE(p->>'bairro',bairro),
      id_municipio=COALESCE(NULLIF(p->>'id_municipio','')::int,id_municipio),
      cidade=COALESCE(p->>'cidade',cidade), uf=COALESCE(p->>'uf',uf), cep=COALESCE(p->>'cep',cep),
      id_empresa=COALESCE(NULLIF(p->>'id_empresa','')::int,id_empresa),
      id_vendedor=COALESCE(NULLIF(p->>'id_vendedor','')::int,id_vendedor),
      id_condicao_pagamento=COALESCE(NULLIF(p->>'id_condicao_pagamento','')::int,id_condicao_pagamento),
      id_tabela_preco=COALESCE(NULLIF(p->>'id_tabela_preco','')::int,id_tabela_preco),
      id_transportadora=COALESCE(NULLIF(p->>'id_transportadora','')::int,id_transportadora),
      perc_desc_produto=COALESCE(NULLIF(p->>'perc_desc_produto','')::numeric,perc_desc_produto),
      perc_desc_servico=COALESCE(NULLIF(p->>'perc_desc_servico','')::numeric,perc_desc_servico),
      limite_credito=COALESCE(NULLIF(p->>'limite_credito','')::numeric,limite_credito),
      permite_prazo=COALESCE((p->>'permite_prazo')::boolean,permite_prazo),
      situacao=COALESCE(p->>'situacao',situacao), observacao=COALESCE(p->>'observacao',observacao),
      atualizado_em=now()
    WHERE id=v_id;
  END IF;
  RETURN v_id;
END $function$;

-- ===== Orçamento =====
CREATE OR REPLACE FUNCTION public.erp_orcamento_salvar(p_cab jsonb, p_itens jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int;
        v_num text; it jsonb; v_ord int:=0; v_prod numeric:=0; v_serv numeric:=0; v_tot numeric; v_st text;
BEGIN
  IF v_id IS NOT NULL THEN
    SELECT status INTO v_st FROM orcamentos_venda WHERE id=v_id;
    IF v_st IN ('CONVERTIDO') THEN RAISE EXCEPTION 'Orçamento % já convertido em venda', v_id; END IF;
  END IF;
  IF v_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('erp_orcamento:'||v_emp));
    SELECT 'ORC'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
      INTO v_num FROM orcamentos_venda WHERE id_empresa=v_emp;
    INSERT INTO orcamentos_venda (numero,id_empresa,id_cliente,id_contato,id_vendedor,id_tabela_preco,
        id_forma_pagamento,id_condicao_pagamento,status,data_emissao,data_validade,valor_frete,valor_desconto,
        observacao,observacao_interna,criado_em)
    VALUES (v_num,v_emp,(p_cab->>'id_cliente')::int,NULLIF(p_cab->>'id_contato','')::int,
        NULLIF(p_cab->>'id_vendedor','')::int,NULLIF(p_cab->>'id_tabela_preco','')::int,
        NULLIF(p_cab->>'id_forma_pagamento','')::int,NULLIF(p_cab->>'id_condicao_pagamento','')::int,
        'ABERTO',COALESCE(NULLIF(p_cab->>'data_emissao','')::date,CURRENT_DATE),
        NULLIF(p_cab->>'data_validade','')::date,NULLIF(p_cab->>'valor_frete','')::numeric,
        NULLIF(p_cab->>'valor_desconto','')::numeric,p_cab->>'observacao',p_cab->>'observacao_interna',now())
    RETURNING id INTO v_id;
  ELSE
    UPDATE orcamentos_venda SET id_cliente=(p_cab->>'id_cliente')::int,
        id_contato=NULLIF(p_cab->>'id_contato','')::int, id_vendedor=NULLIF(p_cab->>'id_vendedor','')::int,
        id_tabela_preco=NULLIF(p_cab->>'id_tabela_preco','')::int,
        id_forma_pagamento=NULLIF(p_cab->>'id_forma_pagamento','')::int,
        id_condicao_pagamento=NULLIF(p_cab->>'id_condicao_pagamento','')::int,
        data_validade=NULLIF(p_cab->>'data_validade','')::date, valor_frete=NULLIF(p_cab->>'valor_frete','')::numeric,
        valor_desconto=NULLIF(p_cab->>'valor_desconto','')::numeric, observacao=p_cab->>'observacao',
        observacao_interna=p_cab->>'observacao_interna', atualizado_em=now()
    WHERE id=v_id;
    DELETE FROM orcamentos_venda_itens WHERE id_orcamento=v_id;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens,'[]'::jsonb)) LOOP
    v_ord := v_ord + 1;
    v_tot := COALESCE(NULLIF(it->>'valor_total','')::numeric,
             (it->>'quantidade')::numeric*(it->>'valor_unitario')::numeric-COALESCE(NULLIF(it->>'valor_desconto','')::numeric,0));
    INSERT INTO orcamentos_venda_itens (id_orcamento,tipo,id_produto,id_servico,descricao,referencia,quantidade,
        id_unidade,valor_unitario,percentual_desconto,valor_desconto,valor_total,ordem)
    VALUES (v_id,COALESCE(it->>'tipo','PRODUTO'),NULLIF(it->>'id_produto','')::int,NULLIF(it->>'id_servico','')::int,
        it->>'descricao',it->>'referencia',(it->>'quantidade')::numeric,NULLIF(it->>'id_unidade','')::int,
        (it->>'valor_unitario')::numeric,NULLIF(it->>'percentual_desconto','')::numeric,
        COALESCE(NULLIF(it->>'valor_desconto','')::numeric,0),v_tot,v_ord);
    IF COALESCE(it->>'tipo','PRODUTO')='SERVICO' THEN v_serv:=v_serv+v_tot; ELSE v_prod:=v_prod+v_tot; END IF;
  END LOOP;

  UPDATE orcamentos_venda SET valor_produtos=v_prod, valor_servicos=v_serv,
     valor_total=v_prod+v_serv+COALESCE(valor_frete,0)-COALESCE(valor_desconto,0)
   WHERE id=v_id;
  RETURN v_id;
END $function$;

-- ===== Pedido de compra =====
CREATE OR REPLACE FUNCTION public.erp_pedido_compra_salvar(p_cab jsonb, p_itens jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int;
        v_num text; it jsonb; v_prod numeric:=0;
BEGIN
  IF v_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('erp_pedido_compra:'||v_emp));
    SELECT 'PC'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
      INTO v_num FROM pedidos_compra WHERE id_empresa=v_emp;
    INSERT INTO pedidos_compra (numero,id_empresa,id_fornecedor,id_usuario,id_forma_pagamento,
        id_condicao_pagamento,status,data_pedido,data_previsao,valor_frete,valor_desconto,observacao,criado_em)
    VALUES (v_num,v_emp,(p_cab->>'id_fornecedor')::int,NULLIF(p_cab->>'id_usuario','')::int,
        NULLIF(p_cab->>'id_forma_pagamento','')::int,NULLIF(p_cab->>'id_condicao_pagamento','')::int,
        'PENDENTE',COALESCE(NULLIF(p_cab->>'data_pedido','')::date,CURRENT_DATE),
        NULLIF(p_cab->>'data_previsao','')::date,NULLIF(p_cab->>'valor_frete','')::numeric,
        NULLIF(p_cab->>'valor_desconto','')::numeric,p_cab->>'observacao',now())
    RETURNING id INTO v_id;
  ELSE
    UPDATE pedidos_compra SET id_fornecedor=(p_cab->>'id_fornecedor')::int,
        id_forma_pagamento=NULLIF(p_cab->>'id_forma_pagamento','')::int,
        id_condicao_pagamento=NULLIF(p_cab->>'id_condicao_pagamento','')::int,
        data_previsao=NULLIF(p_cab->>'data_previsao','')::date,
        valor_frete=NULLIF(p_cab->>'valor_frete','')::numeric,
        valor_desconto=NULLIF(p_cab->>'valor_desconto','')::numeric,
        observacao=p_cab->>'observacao', atualizado_em=now()
    WHERE id=v_id;
    IF EXISTS (SELECT 1 FROM pedidos_compra_itens WHERE id_pedido=v_id AND COALESCE(quantidade_recebida,0)>0) THEN
      RAISE EXCEPTION 'Pedido % ja possui recebimento; itens nao podem ser substituidos', v_id;
    END IF;
    DELETE FROM pedidos_compra_itens WHERE id_pedido=v_id;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens,'[]'::jsonb)) LOOP
    INSERT INTO pedidos_compra_itens (id_pedido,id_produto,descricao,referencia_fornecedor,quantidade,
        id_unidade,valor_unitario,valor_desconto,valor_total,quantidade_recebida,status)
    VALUES (v_id,NULLIF(it->>'id_produto','')::int,it->>'descricao',it->>'referencia_fornecedor',
        (it->>'quantidade')::numeric,NULLIF(it->>'id_unidade','')::int,(it->>'valor_unitario')::numeric,
        COALESCE(NULLIF(it->>'valor_desconto','')::numeric,0),
        COALESCE(NULLIF(it->>'valor_total','')::numeric,(it->>'quantidade')::numeric*(it->>'valor_unitario')::numeric-COALESCE(NULLIF(it->>'valor_desconto','')::numeric,0)),
        0,'PENDENTE');
    v_prod := v_prod + COALESCE(NULLIF(it->>'valor_total','')::numeric,(it->>'quantidade')::numeric*(it->>'valor_unitario')::numeric-COALESCE(NULLIF(it->>'valor_desconto','')::numeric,0));
  END LOOP;

  UPDATE pedidos_compra SET valor_produtos=v_prod,
     valor_total=v_prod + COALESCE(valor_frete,0) - COALESCE(valor_desconto,0)
   WHERE id=v_id;
  RETURN v_id;
END $function$;

-- ===== Recebimento (entrada) =====
CREATE OR REPLACE FUNCTION public.erp_recebimento_salvar(p_cab jsonb, p_itens jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int;
        v_num text; it jsonb; v_prod numeric:=0;
BEGIN
  IF v_id IS NOT NULL THEN
    IF (SELECT status FROM compras_recebimento WHERE id=v_id) <> 'DIGITACAO' THEN
      RAISE EXCEPTION 'Recebimento % nao esta em DIGITACAO', v_id;
    END IF;
  END IF;
  IF v_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('erp_recebimento:'||v_emp));
    SELECT 'RC'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
      INTO v_num FROM compras_recebimento WHERE id_empresa=v_emp;
    INSERT INTO compras_recebimento (numero,id_empresa,id_fornecedor,id_pedido,id_usuario,id_centro_estoque,
        id_tipo_entrada,numero_nf_fornecedor,serie_nf,data_emissao_nf,id_condicao_pagamento,id_centro_custo,
        valor_frete,valor_ipi,valor_icms_st,valor_outras,valor_desconto,observacao,status,criado_em)
    VALUES (v_num,v_emp,(p_cab->>'id_fornecedor')::int,NULLIF(p_cab->>'id_pedido','')::int,
        NULLIF(p_cab->>'id_usuario','')::int,NULLIF(p_cab->>'id_centro_estoque','')::int,
        COALESCE(NULLIF(p_cab->>'id_tipo_entrada','')::int,(SELECT id FROM tipos_entrada WHERE padrao AND ativo LIMIT 1)),
        p_cab->>'numero_nf_fornecedor',p_cab->>'serie_nf',NULLIF(p_cab->>'data_emissao_nf','')::date,
        NULLIF(p_cab->>'id_condicao_pagamento','')::int,NULLIF(p_cab->>'id_centro_custo','')::int,
        NULLIF(p_cab->>'valor_frete','')::numeric,NULLIF(p_cab->>'valor_ipi','')::numeric,
        NULLIF(p_cab->>'valor_icms_st','')::numeric,NULLIF(p_cab->>'valor_outras','')::numeric,
        NULLIF(p_cab->>'valor_desconto','')::numeric,p_cab->>'observacao','DIGITACAO',now())
    RETURNING id INTO v_id;
  ELSE
    UPDATE compras_recebimento SET id_fornecedor=(p_cab->>'id_fornecedor')::int,
        id_pedido=NULLIF(p_cab->>'id_pedido','')::int, id_centro_estoque=NULLIF(p_cab->>'id_centro_estoque','')::int,
        id_tipo_entrada=COALESCE(NULLIF(p_cab->>'id_tipo_entrada','')::int,id_tipo_entrada),
        numero_nf_fornecedor=p_cab->>'numero_nf_fornecedor', serie_nf=p_cab->>'serie_nf',
        data_emissao_nf=NULLIF(p_cab->>'data_emissao_nf','')::date,
        id_condicao_pagamento=NULLIF(p_cab->>'id_condicao_pagamento','')::int,
        id_centro_custo=NULLIF(p_cab->>'id_centro_custo','')::int,
        valor_frete=NULLIF(p_cab->>'valor_frete','')::numeric, valor_ipi=NULLIF(p_cab->>'valor_ipi','')::numeric,
        valor_icms_st=NULLIF(p_cab->>'valor_icms_st','')::numeric, valor_outras=NULLIF(p_cab->>'valor_outras','')::numeric,
        valor_desconto=NULLIF(p_cab->>'valor_desconto','')::numeric, observacao=p_cab->>'observacao'
    WHERE id=v_id;
    DELETE FROM compras_recebimento_itens WHERE id_recebimento=v_id;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens,'[]'::jsonb)) LOOP
    INSERT INTO compras_recebimento_itens (id_recebimento,id_produto,id_pedido_item,descricao,quantidade,
        valor_unitario,valor_ipi,valor_icms_st,valor_total,id_centro_estoque,custo_unitario_final,movimentou_estoque)
    VALUES (v_id,(it->>'id_produto')::int,NULLIF(it->>'id_pedido_item','')::int,it->>'descricao',
        (it->>'quantidade')::numeric,(it->>'valor_unitario')::numeric,
        COALESCE(NULLIF(it->>'valor_ipi','')::numeric,0),COALESCE(NULLIF(it->>'valor_icms_st','')::numeric,0),
        COALESCE(NULLIF(it->>'valor_total','')::numeric,(it->>'quantidade')::numeric*(it->>'valor_unitario')::numeric),
        NULLIF(it->>'id_centro_estoque','')::int,NULLIF(it->>'custo_unitario_final','')::numeric,false);
    v_prod := v_prod + COALESCE(NULLIF(it->>'valor_total','')::numeric,(it->>'quantidade')::numeric*(it->>'valor_unitario')::numeric);
  END LOOP;

  UPDATE compras_recebimento SET valor_produtos=v_prod,
     valor_total = v_prod + COALESCE(valor_frete,0) + COALESCE(valor_ipi,0) + COALESCE(valor_icms_st,0)
                   + COALESCE(valor_outras,0) - COALESCE(valor_desconto,0)
   WHERE id=v_id;
  RETURN v_id;
END $function$;

-- ===== Transferência de estoque =====
CREATE OR REPLACE FUNCTION public.erp_transferencia_salvar(p_cab jsonb, p_itens jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_org int := (p_cab->>'id_centro_origem')::int;
        v_dst int := (p_cab->>'id_centro_destino')::int; v_emp int; v_num text; it jsonb; v_st text;
BEGIN
  IF v_org IS NULL OR v_dst IS NULL THEN RAISE EXCEPTION 'Informe centro de origem e destino'; END IF;
  IF v_org = v_dst THEN RAISE EXCEPTION 'Origem e destino não podem ser o mesmo centro'; END IF;
  SELECT id_empresa INTO v_emp FROM centros_estoque WHERE id=v_org;
  IF v_id IS NOT NULL THEN
    SELECT status INTO v_st FROM estoque_transferencias WHERE id=v_id;
    IF v_st <> 'PENDENTE' THEN RAISE EXCEPTION 'Transferência % não está PENDENTE', v_id; END IF;
  END IF;
  IF v_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('erp_transferencia:'||v_emp));
    SELECT 'TR'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
      INTO v_num FROM estoque_transferencias WHERE id_empresa=v_emp;
    INSERT INTO estoque_transferencias (numero,id_empresa,id_centro_origem,id_centro_destino,id_usuario,status,observacao,criado_em)
    VALUES (v_num,v_emp,v_org,v_dst,NULLIF(p_cab->>'id_usuario','')::int,'PENDENTE',p_cab->>'observacao',now())
    RETURNING id INTO v_id;
  ELSE
    UPDATE estoque_transferencias SET id_centro_origem=v_org,id_centro_destino=v_dst,id_empresa=v_emp,
      observacao=p_cab->>'observacao' WHERE id=v_id;
    DELETE FROM estoque_transferencias_itens WHERE id_transferencia=v_id;
  END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(COALESCE(p_itens,'[]'::jsonb)) LOOP
    INSERT INTO estoque_transferencias_itens (id_transferencia,id_produto,quantidade_solicitada,observacao)
    VALUES (v_id,(it->>'id_produto')::int,(it->>'quantidade')::numeric,it->>'observacao');
  END LOOP;
  RETURN v_id;
END $function$;

-- ===== Inventário =====
CREATE OR REPLACE FUNCTION public.erp_inventario_criar(p_id_empresa integer, p_id_centro integer, p_id_usuario integer DEFAULT NULL::integer, p_todos boolean DEFAULT true)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int; v_num text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('erp_inventario:'||p_id_empresa));
  SELECT 'INV'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
    INTO v_num FROM inventarios WHERE id_empresa=p_id_empresa;
  INSERT INTO inventarios (numero,id_empresa,id_centro,id_usuario,status,data_inicio,criado_em)
  VALUES (v_num,p_id_empresa,p_id_centro,p_id_usuario,'ABERTO',now(),now()) RETURNING id INTO v_id;
  INSERT INTO inventarios_itens (id_inventario,id_produto,estoque_sistema,custo_unitario)
  SELECT v_id, s.id_produto, COALESCE(s.estoque_atual,0), s.custo_medio
    FROM estoque_saldos s WHERE s.id_centro=p_id_centro;
  RETURN v_id;
END $function$;

-- ===== Renegociação (número do acordo por empresa) =====
CREATE OR REPLACE FUNCTION public.erp_renegociar_titulos(p_ids integer[], p_id_usuario integer, p_qtd_parcelas integer, p_primeiro_venc date, p_valor_entrada numeric DEFAULT 0, p_valor_juros numeric DEFAULT 0, p_valor_multa numeric DEFAULT 0, p_id_forma integer DEFAULT NULL::integer, p_observacao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE
  v_emp int; v_cli int; v_saldo numeric; v_financiado numeric;
  v_juros numeric := COALESCE(p_valor_juros,0); v_multa numeric := COALESCE(p_valor_multa,0);
  v_entrada numeric := COALESCE(p_valor_entrada,0);
  v_id_acordo int; v_numero text; v_seq int;
  v_parc numeric; v_acum numeric := 0; v_venc date; i int; v_val numeric;
  v_id_tit int; v_ids int[] := '{}'; t RECORD;
BEGIN
  IF p_ids IS NULL OR array_length(p_ids,1) IS NULL THEN RAISE EXCEPTION 'Selecione ao menos um título'; END IF;
  IF COALESCE(p_qtd_parcelas,0) < 1 THEN RAISE EXCEPTION 'Quantidade de parcelas inválida'; END IF;

  IF (SELECT count(*) FROM titulos WHERE id = ANY(p_ids) AND tipo='CR'
        AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL') AND valor_saldo>0) <> array_length(p_ids,1) THEN
    RAISE EXCEPTION 'Um ou mais títulos não estão aptos para renegociação (verifique tipo, status e saldo)';
  END IF;
  IF (SELECT count(DISTINCT id_cliente) FROM titulos WHERE id=ANY(p_ids)) <> 1
     OR (SELECT count(DISTINCT id_empresa) FROM titulos WHERE id=ANY(p_ids)) <> 1 THEN
    RAISE EXCEPTION 'Todos os títulos devem ser do mesmo cliente e da mesma empresa';
  END IF;
  SELECT id_empresa, id_cliente, COALESCE(SUM(valor_saldo),0)
    INTO v_emp, v_cli, v_saldo FROM titulos WHERE id=ANY(p_ids) GROUP BY id_empresa, id_cliente;

  v_financiado := round(v_saldo + v_juros + v_multa - v_entrada, 2);
  IF v_financiado <= 0 THEN RAISE EXCEPTION 'Valor a financiar deve ser maior que zero (entrada não pode cobrir tudo — use baixa normal)'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext('erp_acordo:'||v_emp));
  v_seq := COALESCE((SELECT count(*) FROM cobranca_acordos WHERE id_empresa=v_emp),0) + 1;
  v_numero := 'ACD' || v_emp || '-' || lpad(v_seq::text, 5, '0');

  INSERT INTO cobranca_acordos (numero,id_empresa,id_cliente,id_usuario,valor_original,valor_juros,
        valor_multa,valor_entrada,valor_financiado,qtd_parcelas,observacao)
  VALUES (v_numero,v_emp,v_cli,p_id_usuario,v_saldo,v_juros,v_multa,v_entrada,v_financiado,p_qtd_parcelas,p_observacao)
  RETURNING id INTO v_id_acordo;

  FOR t IN SELECT id, valor_saldo FROM titulos WHERE id=ANY(p_ids) LOOP
    INSERT INTO cobranca_acordos_origem (id_acordo,id_titulo,valor_saldo) VALUES (v_id_acordo,t.id,t.valor_saldo);
  END LOOP;
  UPDATE titulos SET status='RENEGOCIADO',
      observacao = COALESCE(observacao||' | ','') || 'Renegociado no acordo ' || v_numero,
      atualizado_em = now()
   WHERE id = ANY(p_ids);

  v_parc := round(v_financiado / p_qtd_parcelas, 2);
  FOR i IN 1..p_qtd_parcelas LOOP
    IF i < p_qtd_parcelas THEN v_val := v_parc; v_acum := v_acum + v_parc;
    ELSE v_val := round(v_financiado - v_acum, 2); END IF;
    v_venc := (p_primeiro_venc + ((i-1) || ' month')::interval)::date;
    INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_cliente,id_forma_pagamento,origem,id_origem,
        numero_origem,data_emissao,data_vencimento,valor,status,modalidade,observacao)
    VALUES ('CR', v_numero, i || '/' || p_qtd_parcelas, v_emp, v_cli, p_id_forma, 'RENEGOCIACAO', v_id_acordo,
        v_numero, CURRENT_DATE, v_venc, v_val, 'ABERTO', 'RENEGOCIACAO',
        'Acordo ' || v_numero || ' — parcela ' || i || '/' || p_qtd_parcelas)
    RETURNING id INTO v_id_tit;
    v_ids := v_ids || v_id_tit;
  END LOOP;

  INSERT INTO log_acessos (id_usuario, tipo, modulo, acao, tabela_afetada, registro_id, mensagem, dados_novos, criado_em)
  VALUES (p_id_usuario, 'ACAO', 'FINANCEIRO_CR', 'RENEGOCIACAO', 'cobranca_acordos', v_id_acordo,
    'Acordo ' || v_numero || ' (' || p_qtd_parcelas || 'x) — financiado R$ ' || v_financiado,
    jsonb_build_object('numero',v_numero,'originais',p_ids,'saldo',v_saldo,'juros',v_juros,'multa',v_multa,
       'entrada',v_entrada,'financiado',v_financiado,'parcelas',p_qtd_parcelas,'titulos_gerados',v_ids), now());

  RETURN jsonb_build_object('ok',true,'id_acordo',v_id_acordo,'numero',v_numero,
     'valor_financiado',v_financiado,'qtd_parcelas',p_qtd_parcelas,'titulos_gerados',v_ids);
END $function$;
