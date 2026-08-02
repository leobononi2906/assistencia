-- ERP Bononi — Inventário e Transferências de estoque (entre depósitos e entre empresas)
-- Saldo é por (produto, centro) e o centro pertence a uma empresa; logo transferir entre
-- centros de empresas diferentes já cobre "entre empresas". Reaproveita fn_estoque_saida/entrada.
-- Tabelas inventarios/inventarios_itens já existem: inventarios(data_inicio,data_finalizacao);
-- inventarios_itens(estoque_sistema, quantidade_contada, diferenca, custo_unitario, valor_diferenca, ajustado).

-- Remover overloads de uma etapa antiga (assinaturas divergentes que causam ambiguidade)
DROP FUNCTION IF EXISTS public.erp_transferencia_receber(integer,integer,jsonb);
DROP FUNCTION IF EXISTS "Teste ERP".erp_transferencia_receber(integer,integer,jsonb);
DROP FUNCTION IF EXISTS public.erp_transferencia_salvar(integer,integer,integer,integer,integer,text,jsonb);
DROP FUNCTION IF EXISTS "Teste ERP".erp_transferencia_salvar(integer,integer,integer,integer,integer,text,jsonb);
DROP FUNCTION IF EXISTS public.erp_inventario_criar(integer,integer,integer,boolean,text);
DROP FUNCTION IF EXISTS "Teste ERP".erp_inventario_criar(integer,integer,integer,boolean,text);

-- ============ TRANSFERÊNCIAS ============
CREATE OR REPLACE VIEW "Teste ERP".vw_transferencias AS
  SELECT t.id, t.numero, t.status, t.data_transferencia, t.data_recebimento, t.observacao, t.criado_em,
         t.id_centro_origem, co.descricao AS centro_origem, co.id_empresa AS id_empresa_origem,
         eo.nome_fantasia AS empresa_origem,
         t.id_centro_destino, cd.descricao AS centro_destino, cd.id_empresa AS id_empresa_destino,
         ed.nome_fantasia AS empresa_destino,
         (co.id_empresa <> cd.id_empresa) AS entre_empresas
    FROM "Teste ERP".estoque_transferencias t
    JOIN "Teste ERP".centros_estoque co ON co.id=t.id_centro_origem
    JOIN "Teste ERP".centros_estoque cd ON cd.id=t.id_centro_destino
    LEFT JOIN "Teste ERP".empresas eo ON eo.id=co.id_empresa
    LEFT JOIN "Teste ERP".empresas ed ON ed.id=cd.id_empresa;
GRANT SELECT ON "Teste ERP".vw_transferencias TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_transferencia_salvar(p_cab jsonb, p_itens jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
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
END $$;
GRANT EXECUTE ON FUNCTION public.erp_transferencia_salvar(jsonb,jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_transferencia_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'transf', (SELECT to_jsonb(v) FROM "Teste ERP".vw_transferencias v WHERE v.id=p_id),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'id_produto',i.id_produto,
        'produto',(SELECT nome FROM "Teste ERP".produtos WHERE id=i.id_produto),
        'quantidade_solicitada',i.quantidade_solicitada,'quantidade_enviada',i.quantidade_enviada,
        'quantidade_recebida',i.quantidade_recebida,
        'saldo_origem',(SELECT estoque_atual FROM "Teste ERP".estoque_saldos s
                        WHERE s.id_produto=i.id_produto AND s.id_centro=(SELECT id_centro_origem FROM "Teste ERP".estoque_transferencias WHERE id=p_id))) ORDER BY i.id)
      FROM "Teste ERP".estoque_transferencias_itens i WHERE i.id_transferencia=p_id),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_transferencia_detalhe(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_transferencia_enviar(p_id int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE t RECORD; it RECORD; v_emp_org int; n int:=0;
BEGIN
  SELECT * INTO t FROM estoque_transferencias WHERE id=p_id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Transferência % não encontrada', p_id; END IF;
  IF t.status <> 'PENDENTE' THEN RAISE EXCEPTION 'Transferência % não está PENDENTE (status %)', p_id, t.status; END IF;
  SELECT id_empresa INTO v_emp_org FROM centros_estoque WHERE id=t.id_centro_origem;
  FOR it IN SELECT * FROM estoque_transferencias_itens WHERE id_transferencia=p_id LOOP
    PERFORM fn_estoque_saida(it.id_produto, t.id_centro_origem, v_emp_org, it.quantidade_solicitada,
            'TRANSFERENCIA', p_id, t.numero, p_id_usuario, true);
    UPDATE estoque_transferencias_itens SET quantidade_enviada=it.quantidade_solicitada WHERE id=it.id;
    n := n+1;
  END LOOP;
  UPDATE estoque_transferencias SET status='ENVIADA', data_transferencia=now() WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'itens_enviados',n,'status','ENVIADA');
END $$;
GRANT EXECUTE ON FUNCTION public.erp_transferencia_enviar(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_transferencia_receber(p_id int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE t RECORD; it RECORD; v_emp_dst int; v_custo numeric; n int:=0;
BEGIN
  SELECT * INTO t FROM estoque_transferencias WHERE id=p_id;
  IF t.id IS NULL THEN RAISE EXCEPTION 'Transferência % não encontrada', p_id; END IF;
  IF t.status <> 'ENVIADA' THEN RAISE EXCEPTION 'Transferência % não está ENVIADA (status %)', p_id, t.status; END IF;
  SELECT id_empresa INTO v_emp_dst FROM centros_estoque WHERE id=t.id_centro_destino;
  FOR it IN SELECT * FROM estoque_transferencias_itens WHERE id_transferencia=p_id LOOP
    SELECT custo_medio INTO v_custo FROM estoque_saldos WHERE id_produto=it.id_produto AND id_centro=t.id_centro_origem;
    PERFORM fn_estoque_entrada(it.id_produto, t.id_centro_destino, v_emp_dst,
            COALESCE(it.quantidade_enviada,it.quantidade_solicitada),
            'TRANSFERENCIA', p_id, t.numero, p_id_usuario, v_custo);
    UPDATE estoque_transferencias_itens SET quantidade_recebida=COALESCE(quantidade_enviada,quantidade_solicitada) WHERE id=it.id;
    n := n+1;
  END LOOP;
  UPDATE estoque_transferencias SET status='RECEBIDA', data_recebimento=now() WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'itens_recebidos',n,'status','RECEBIDA');
END $$;
GRANT EXECUTE ON FUNCTION public.erp_transferencia_receber(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_transferencia_cancelar(p_id int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF (SELECT status FROM estoque_transferencias WHERE id=p_id) <> 'PENDENTE' THEN
    RAISE EXCEPTION 'Só é possível cancelar transferência PENDENTE (as enviadas já movimentaram estoque)';
  END IF;
  UPDATE estoque_transferencias SET status='CANCELADA' WHERE id=p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_transferencia_cancelar(int) TO anon,authenticated,service_role;

-- ============ INVENTÁRIO ============
CREATE OR REPLACE VIEW "Teste ERP".vw_inventarios AS
  SELECT i.id, i.numero, i.status, i.id_empresa, e.nome_fantasia AS empresa, i.id_centro,
         c.descricao AS centro, i.data_inicio, i.data_finalizacao, i.observacao, i.criado_em,
         (SELECT count(*) FROM "Teste ERP".inventarios_itens x WHERE x.id_inventario=i.id) AS itens,
         (SELECT count(*) FROM "Teste ERP".inventarios_itens x WHERE x.id_inventario=i.id AND x.quantidade_contada IS NOT NULL) AS contados
    FROM "Teste ERP".inventarios i
    LEFT JOIN "Teste ERP".empresas e ON e.id=i.id_empresa
    LEFT JOIN "Teste ERP".centros_estoque c ON c.id=i.id_centro;
GRANT SELECT ON "Teste ERP".vw_inventarios TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_criar(p_id_empresa int, p_id_centro int, p_id_usuario int DEFAULT NULL, p_todos boolean DEFAULT true)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int; v_num text;
BEGIN
  SELECT 'INV'||lpad((COALESCE(MAX(NULLIF(regexp_replace(numero,'\D','','g'),''))::int,0)+1)::text,6,'0')
    INTO v_num FROM inventarios WHERE id_empresa=p_id_empresa;
  INSERT INTO inventarios (numero,id_empresa,id_centro,id_usuario,status,data_inicio,criado_em)
  VALUES (v_num,p_id_empresa,p_id_centro,p_id_usuario,'ABERTO',now(),now()) RETURNING id INTO v_id;
  INSERT INTO inventarios_itens (id_inventario,id_produto,estoque_sistema,custo_unitario)
  SELECT v_id, s.id_produto, COALESCE(s.estoque_atual,0), s.custo_medio
    FROM estoque_saldos s WHERE s.id_centro=p_id_centro;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_criar(int,int,int,boolean) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'inv', (SELECT to_jsonb(v) FROM "Teste ERP".vw_inventarios v WHERE v.id=p_id),
    'itens', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',i.id,'id_produto',i.id_produto,
        'produto',(SELECT nome FROM "Teste ERP".produtos WHERE id=i.id_produto),
        'referencia',(SELECT referencia FROM "Teste ERP".produtos WHERE id=i.id_produto),
        'saldo_sistema',i.estoque_sistema,'qtd_contada',i.quantidade_contada,'diferenca',i.diferenca,'ajustado',i.ajustado)
        ORDER BY (SELECT nome FROM "Teste ERP".produtos WHERE id=i.id_produto))
      FROM "Teste ERP".inventarios_itens i WHERE i.id_inventario=p_id),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_detalhe(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_add_item(p_id_inventario int, p_id_produto int)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_saldo numeric; v_custo numeric; v_centro int; v_id int;
BEGIN
  SELECT id_centro INTO v_centro FROM inventarios WHERE id=p_id_inventario;
  SELECT COALESCE(estoque_atual,0), custo_medio INTO v_saldo, v_custo FROM estoque_saldos WHERE id_produto=p_id_produto AND id_centro=v_centro;
  INSERT INTO inventarios_itens (id_inventario,id_produto,estoque_sistema,custo_unitario) VALUES (p_id_inventario,p_id_produto,COALESCE(v_saldo,0),v_custo)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_add_item(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_contar(p_id_item int, p_qtd numeric)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  -- diferenca/valor_diferenca são colunas geradas (calculadas automaticamente)
  UPDATE "Teste ERP".inventarios_itens SET quantidade_contada=p_qtd WHERE id=p_id_item;
$$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_contar(int,numeric) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_ajustar(p_id int, p_id_usuario int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE inv RECORD; it RECORD; n int:=0; v_dif numeric;
BEGIN
  SELECT * INTO inv FROM inventarios WHERE id=p_id;
  IF inv.id IS NULL THEN RAISE EXCEPTION 'Inventário % não encontrado', p_id; END IF;
  IF inv.status NOT IN ('ABERTO','EM_CONTAGEM','CONFERENCIA') THEN RAISE EXCEPTION 'Inventário % já processado (status %)', p_id, inv.status; END IF;
  FOR it IN SELECT * FROM inventarios_itens WHERE id_inventario=p_id AND quantidade_contada IS NOT NULL AND COALESCE(ajustado,false)=false LOOP
    v_dif := COALESCE(it.diferenca, it.quantidade_contada - COALESCE(it.estoque_sistema,0));
    IF v_dif > 0 THEN
      PERFORM fn_estoque_entrada(it.id_produto, inv.id_centro, inv.id_empresa, v_dif, 'INVENTARIO', p_id, inv.numero, p_id_usuario, NULL);
    ELSIF v_dif < 0 THEN
      PERFORM fn_estoque_saida(it.id_produto, inv.id_centro, inv.id_empresa, -v_dif, 'INVENTARIO', p_id, inv.numero, p_id_usuario, false);
    END IF;
    UPDATE inventarios_itens SET ajustado=true WHERE id=it.id;
    IF v_dif <> 0 THEN n := n+1; END IF;
  END LOOP;
  UPDATE inventarios SET status='FINALIZADO', data_finalizacao=now() WHERE id=p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'itens_ajustados',n,'status','FINALIZADO');
END $$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_ajustar(int,int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_inventario_cancelar(p_id int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF (SELECT status FROM inventarios WHERE id=p_id) = 'FINALIZADO' THEN
    RAISE EXCEPTION 'Inventário já finalizado não pode ser cancelado';
  END IF;
  UPDATE inventarios SET status='CANCELADO' WHERE id=p_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_inventario_cancelar(int) TO anon,authenticated,service_role;

-- Registro no CRUD genérico (grupo Estoque)
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('vw_transferencias','Transferências','Estoque',30,'id','{numero,centro_origem,centro_destino}',true),
 ('vw_inventarios','Inventários','Estoque',31,'id','{numero,centro}',true)
ON CONFLICT (tabela) DO NOTHING;
