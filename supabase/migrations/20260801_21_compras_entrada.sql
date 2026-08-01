-- ERP Bononi — Módulo Compras / Entrada
-- Pedido de compra -> Recebimento (entrada de NF do fornecedor) -> estoque + Contas a Pagar.
-- Reaproveita fn_estoque_entrada e fn_gerar_titulos_pagar. NF-e de compra fica fora (opcional).

-- Remover versões anteriores (assinaturas divergentes de uma etapa antiga)
DROP FUNCTION IF EXISTS public.erp_pedido_compra_salvar(int,int,int,int,int,int,date,numeric,numeric,text,jsonb);
DROP FUNCTION IF EXISTS "Teste ERP".erp_pedido_compra_salvar(int,int,int,int,int,int,date,numeric,numeric,text,jsonb);
DROP FUNCTION IF EXISTS public.erp_recebimento_confirmar(int,int);
DROP FUNCTION IF EXISTS public.erp_recebimento_cancelar(int,int,text);

-- Views de listagem
CREATE OR REPLACE VIEW "Teste ERP".vw_pedidos_compra AS
  SELECT pc.id, pc.numero, pc.id_empresa, e.nome_fantasia AS empresa, pc.id_fornecedor,
         f.nome AS fornecedor, pc.status, pc.data_pedido, pc.data_previsao,
         pc.valor_total, pc.criado_em
    FROM "Teste ERP".pedidos_compra pc
    LEFT JOIN "Teste ERP".empresas e ON e.id=pc.id_empresa
    LEFT JOIN "Teste ERP".fornecedores f ON f.id=pc.id_fornecedor;
GRANT SELECT ON "Teste ERP".vw_pedidos_compra TO anon,authenticated,service_role;

CREATE OR REPLACE VIEW "Teste ERP".vw_recebimentos AS
  SELECT r.id, r.numero, r.id_empresa, e.nome_fantasia AS empresa, r.id_fornecedor,
         f.nome AS fornecedor, r.id_pedido, r.numero_nf_fornecedor, r.serie_nf,
         r.status, r.data_emissao_nf, r.data_recebimento, r.valor_total, r.criado_em,
         te.descricao AS tipo_entrada
    FROM "Teste ERP".compras_recebimento r
    LEFT JOIN "Teste ERP".empresas e ON e.id=r.id_empresa
    LEFT JOIN "Teste ERP".fornecedores f ON f.id=r.id_fornecedor
    LEFT JOIN "Teste ERP".tipos_entrada te ON te.id=r.id_tipo_entrada;
GRANT SELECT ON "Teste ERP".vw_recebimentos TO anon,authenticated,service_role;

INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('vw_pedidos_compra','Pedidos de Compra','Compras',10,'id','{numero,fornecedor}',true),
 ('vw_recebimentos','Recebimentos (Entradas)','Compras',11,'id','{numero,fornecedor,numero_nf_fornecedor}',true)
ON CONFLICT (tabela) DO NOTHING;

-- ---------- PEDIDO DE COMPRA ----------
CREATE OR REPLACE FUNCTION public.erp_pedido_compra_salvar(p_cab jsonb, p_itens jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int;
        v_num text; it jsonb; v_prod numeric:=0; v_desc numeric:=0;
BEGIN
  IF v_id IS NULL THEN
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
END $$;
GRANT EXECUTE ON FUNCTION public.erp_pedido_compra_salvar(jsonb,jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_pedido_compra_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'pedido', (SELECT to_jsonb(v) FROM "Teste ERP".vw_pedidos_compra v WHERE v.id=p_id),
    'cab', (SELECT to_jsonb(pc) FROM "Teste ERP".pedidos_compra pc WHERE pc.id=p_id),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',i.id,'id_produto',i.id_produto,'descricao',i.descricao,'referencia_fornecedor',i.referencia_fornecedor,
        'quantidade',i.quantidade,'valor_unitario',i.valor_unitario,'valor_desconto',i.valor_desconto,
        'valor_total',i.valor_total,'quantidade_recebida',i.quantidade_recebida,'status',i.status) ORDER BY i.id)
      FROM "Teste ERP".pedidos_compra_itens i WHERE i.id_pedido=p_id),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_pedido_compra_detalhe(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_pedido_compra_status(p_id int, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF p_status NOT IN ('PENDENTE','APROVADO','ENVIADO','CANCELADO') THEN
    RAISE EXCEPTION 'Status invalido para pedido: %', p_status;
  END IF;
  UPDATE pedidos_compra SET status=p_status, atualizado_em=now() WHERE id=p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_pedido_compra_status(int,text) TO anon,authenticated,service_role;

-- ---------- RECEBIMENTO (ENTRADA) ----------
CREATE OR REPLACE FUNCTION public.erp_recebimento_salvar(p_cab jsonb, p_itens jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int := NULLIF(p_cab->>'id','')::int; v_emp int := (p_cab->>'id_empresa')::int;
        v_num text; it jsonb; v_prod numeric:=0;
BEGIN
  IF v_id IS NOT NULL THEN
    IF (SELECT status FROM compras_recebimento WHERE id=v_id) <> 'DIGITACAO' THEN
      RAISE EXCEPTION 'Recebimento % nao esta em DIGITACAO', v_id;
    END IF;
  END IF;
  IF v_id IS NULL THEN
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
END $$;
GRANT EXECUTE ON FUNCTION public.erp_recebimento_salvar(jsonb,jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_recebimento_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'receb', (SELECT to_jsonb(v) FROM "Teste ERP".vw_recebimentos v WHERE v.id=p_id),
    'cab', (SELECT to_jsonb(r) FROM "Teste ERP".compras_recebimento r WHERE r.id=p_id),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',i.id,'id_produto',i.id_produto,'id_pedido_item',i.id_pedido_item,'descricao',i.descricao,
        'quantidade',i.quantidade,'valor_unitario',i.valor_unitario,'valor_ipi',i.valor_ipi,
        'valor_icms_st',i.valor_icms_st,'valor_total',i.valor_total,'id_centro_estoque',i.id_centro_estoque,
        'custo_unitario_final',i.custo_unitario_final,'movimentou_estoque',i.movimentou_estoque) ORDER BY i.id)
      FROM "Teste ERP".compras_recebimento_itens i WHERE i.id_recebimento=p_id),'[]'::jsonb),
    'titulos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',t.id,'parcela',t.parcela,
        'vencimento',t.data_vencimento,'valor',t.valor,'status',t.status) ORDER BY t.data_vencimento)
      FROM "Teste ERP".titulos t WHERE t.origem='COMPRA' AND t.id_origem=p_id),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_recebimento_detalhe(int) TO anon,authenticated,service_role;

-- Confirmar entrada: move estoque, atualiza custo, gera Contas a Pagar, baixa pedido
CREATE OR REPLACE FUNCTION public.erp_recebimento_confirmar(p_id int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE r RECORD; it RECORD; v_centro int; v_custo numeric; v_mov boolean; v_atc boolean; v_fin boolean;
        v_te RECORD; v_result jsonb; v_qtd_mov int:=0; v_ped int;
BEGIN
  SELECT * INTO r FROM compras_recebimento WHERE id=p_id;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Recebimento % nao encontrado', p_id; END IF;
  IF r.status <> 'DIGITACAO' THEN RAISE EXCEPTION 'Recebimento % ja processado (status %)', p_id, r.status; END IF;
  IF COALESCE(r.valor_total,0) <= 0 THEN RAISE EXCEPTION 'Recebimento sem valor'; END IF;

  SELECT COALESCE(mov_estoque,true) mov, COALESCE(atualiza_custo,false) atc, COALESCE(mov_financeiro,true) fin
    INTO v_te FROM tipos_entrada WHERE id=r.id_tipo_entrada;
  v_mov := COALESCE(v_te.mov,true); v_atc := COALESCE(v_te.atc,false); v_fin := COALESCE(v_te.fin,true);

  FOR it IN SELECT * FROM compras_recebimento_itens WHERE id_recebimento=p_id LOOP
    v_centro := COALESCE(it.id_centro_estoque, r.id_centro_estoque);
    v_custo := COALESCE(it.custo_unitario_final, it.valor_unitario);
    IF v_mov THEN
      IF v_centro IS NULL THEN RAISE EXCEPTION 'Item % sem centro de estoque', it.descricao; END IF;
      PERFORM fn_estoque_entrada(it.id_produto, v_centro, r.id_empresa, it.quantidade,
              'COMPRA', p_id, r.numero, p_id_usuario, v_custo);
      UPDATE compras_recebimento_itens SET movimentou_estoque=true WHERE id=it.id;
      v_qtd_mov := v_qtd_mov + 1;
      IF v_atc THEN UPDATE produtos SET preco_custo=v_custo, atualizado_em=now() WHERE id=it.id_produto; END IF;
    END IF;
    -- baixa do pedido (recebimento parcial)
    IF it.id_pedido_item IS NOT NULL THEN
      UPDATE pedidos_compra_itens SET
        quantidade_recebida=COALESCE(quantidade_recebida,0)+it.quantidade,
        status=CASE WHEN COALESCE(quantidade_recebida,0)+it.quantidade >= quantidade THEN 'RECEBIDO' ELSE 'RECEBIDO_PARCIAL' END
      WHERE id=it.id_pedido_item;
    END IF;
  END LOOP;

  -- status do pedido de origem
  v_ped := r.id_pedido;
  IF v_ped IS NOT NULL THEN
    UPDATE pedidos_compra SET status=CASE
        WHEN NOT EXISTS (SELECT 1 FROM pedidos_compra_itens WHERE id_pedido=v_ped AND status<>'RECEBIDO' AND status<>'CANCELADO')
          THEN 'RECEBIDO' ELSE 'RECEBIDO_PARCIAL' END,
        data_recebimento=CURRENT_DATE, atualizado_em=now()
    WHERE id=v_ped;
  END IF;

  UPDATE compras_recebimento SET status='CONFIRMADO', data_recebimento=now() WHERE id=p_id;

  IF v_fin THEN
    IF r.id_condicao_pagamento IS NULL THEN RAISE EXCEPTION 'Informe a condicao de pagamento para gerar Contas a Pagar'; END IF;
    v_result := fn_gerar_titulos_pagar(p_id, p_id_usuario, false);
  END IF;

  RETURN jsonb_build_object('ok',true,'id_recebimento',p_id,'itens_estoque',v_qtd_mov,
     'financeiro', COALESCE(v_result,'null'::jsonb));
END $$;
GRANT EXECUTE ON FUNCTION public.erp_recebimento_confirmar(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_recebimento_cancelar(p_id int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF (SELECT status FROM compras_recebimento WHERE id=p_id) <> 'DIGITACAO' THEN
    RAISE EXCEPTION 'Só é possível cancelar recebimento em DIGITACAO (os confirmados movimentaram estoque/financeiro)';
  END IF;
  UPDATE compras_recebimento SET status='CANCELADO' WHERE id=p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_recebimento_cancelar(int) TO anon,authenticated,service_role;
