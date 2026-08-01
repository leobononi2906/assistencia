-- ERP Bononi — Orçamentos de Venda
-- Orçamento -> ao APROVAR vira Venda (pedido) e gera SOLICITAÇÕES de peças para o estoque
-- (equipe de vendas não lança produto direto; o estoque atende as solicitações).

-- vínculo orçamento -> venda gerada
ALTER TABLE "Teste ERP".vendas ADD COLUMN IF NOT EXISTS id_orcamento integer;

CREATE OR REPLACE VIEW "Teste ERP".vw_orcamentos AS
  SELECT o.id, o.numero, o.id_empresa, e.nome_fantasia AS empresa, o.id_cliente,
         c.nome AS cliente, o.id_vendedor, o.status, o.data_emissao, o.data_validade,
         o.data_aprovacao, o.valor_total, o.criado_em,
         (SELECT v.id FROM "Teste ERP".vendas v WHERE v.id_orcamento=o.id ORDER BY v.id DESC LIMIT 1) AS id_venda
    FROM "Teste ERP".orcamentos_venda o
    LEFT JOIN "Teste ERP".empresas e ON e.id=o.id_empresa
    LEFT JOIN "Teste ERP".clientes c ON c.id=o.id_cliente;
GRANT SELECT ON "Teste ERP".vw_orcamentos TO anon,authenticated,service_role;

INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('vw_orcamentos','Orçamentos de Venda','Comercial',5,'id','{numero,cliente}',true)
ON CONFLICT (tabela) DO NOTHING;

-- salvar cabeçalho + itens (substitui itens)
CREATE OR REPLACE FUNCTION public.erp_orcamento_salvar(p_cab jsonb, p_itens jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int;
        v_num text; it jsonb; v_ord int:=0; v_prod numeric:=0; v_serv numeric:=0; v_tot numeric; v_st text;
BEGIN
  IF v_id IS NOT NULL THEN
    SELECT status INTO v_st FROM orcamentos_venda WHERE id=v_id;
    IF v_st IN ('CONVERTIDO') THEN RAISE EXCEPTION 'Orçamento % já convertido em venda', v_id; END IF;
  END IF;
  IF v_id IS NULL THEN
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
END $$;
GRANT EXECUTE ON FUNCTION public.erp_orcamento_salvar(jsonb,jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_orcamento_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'orc', (SELECT to_jsonb(v) FROM "Teste ERP".vw_orcamentos v WHERE v.id=p_id),
    'cab', (SELECT to_jsonb(o) FROM "Teste ERP".orcamentos_venda o WHERE o.id=p_id),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',i.id,'tipo',i.tipo,'id_produto',i.id_produto,'id_servico',i.id_servico,'descricao',i.descricao,
        'referencia',i.referencia,'quantidade',i.quantidade,'id_unidade',i.id_unidade,'valor_unitario',i.valor_unitario,
        'percentual_desconto',i.percentual_desconto,'valor_desconto',i.valor_desconto,'valor_total',i.valor_total) ORDER BY i.ordem,i.id)
      FROM "Teste ERP".orcamentos_venda_itens i WHERE i.id_orcamento=p_id),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_orcamento_detalhe(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_orcamento_status(p_id int, p_status text, p_motivo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF p_status NOT IN ('ABERTO','ENVIADO','REPROVADO','EXPIRADO') THEN
    RAISE EXCEPTION 'Status invalido para orçamento (aprovação é feita em erp_orcamento_aprovar): %', p_status;
  END IF;
  UPDATE orcamentos_venda SET status=p_status,
     motivo_reprovacao=CASE WHEN p_status='REPROVADO' THEN p_motivo ELSE motivo_reprovacao END,
     atualizado_em=now()
   WHERE id=p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_orcamento_status(int,text,text) TO anon,authenticated,service_role;

-- APROVAR: cria a venda e gera solicitações de peças (produtos) para o estoque
CREATE OR REPLACE FUNCTION public.erp_orcamento_aprovar(p_id int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE o RECORD; it RECORD; v_venda jsonb; v_vid int; v_sol int:=0; v_serv int:=0;
BEGIN
  SELECT * INTO o FROM orcamentos_venda WHERE id=p_id;
  IF o.id IS NULL THEN RAISE EXCEPTION 'Orçamento % nao encontrado', p_id; END IF;
  IF o.status = 'CONVERTIDO' THEN RAISE EXCEPTION 'Orçamento % já convertido', p_id; END IF;
  IF o.status IN ('REPROVADO','EXPIRADO') THEN RAISE EXCEPTION 'Orçamento % está % e não pode ser aprovado', p_id, o.status; END IF;

  -- cria a venda (pedido)
  v_venda := public.erp_criar_venda(o.id_empresa, o.id_cliente, o.id_forma_pagamento,
                o.id_condicao_pagamento, o.id_vendedor, p_id_usuario);
  v_vid := (v_venda->>'id')::int;
  UPDATE vendas SET id_orcamento=p_id WHERE id=v_vid;

  -- gera solicitação de peça para cada PRODUTO (o estoque atende); serviços não vão para o estoque
  FOR it IN SELECT * FROM orcamentos_venda_itens WHERE id_orcamento=p_id ORDER BY ordem,id LOOP
    IF it.tipo='PRODUTO' AND it.id_produto IS NOT NULL THEN
      PERFORM fn_solicitar_produto('VENDA', v_vid, it.id_produto, it.quantidade, p_id_usuario,
              it.id_unidade, it.valor_unitario, NULL, 3,
              'Gerado do orçamento '||o.numero, false);
      v_sol := v_sol + 1;
    ELSIF it.tipo='SERVICO' THEN
      v_serv := v_serv + 1;
    END IF;
  END LOOP;

  UPDATE orcamentos_venda SET status='CONVERTIDO', data_aprovacao=CURRENT_DATE, atualizado_em=now() WHERE id=p_id;

  RETURN jsonb_build_object('ok',true,'id_orcamento',p_id,'id_venda',v_vid,
     'numero_venda',v_venda->>'numero','solicitacoes',v_sol,'servicos',v_serv);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_orcamento_aprovar(int,int) TO anon,authenticated,service_role;
