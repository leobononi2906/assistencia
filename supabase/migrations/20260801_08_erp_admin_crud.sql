-- ERP Bononi — Admin genérico de CRUD (schema public) consumido pelo front de Configurações.
-- Registro (whitelist) + funções list/colunas/upsert/delete via dynamic SQL validado.
CREATE TABLE IF NOT EXISTS public.erp_admin_tabelas (
  id serial PRIMARY KEY, esquema text NOT NULL DEFAULT 'Teste ERP', tabela text NOT NULL UNIQUE,
  label text NOT NULL, grupo text NOT NULL DEFAULT 'Geral', ordem integer NOT NULL DEFAULT 100,
  pk_col text NOT NULL DEFAULT 'id', busca_cols text[] NOT NULL DEFAULT '{}',
  somente_leitura boolean NOT NULL DEFAULT false, ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.erp_admin_tabelas TO anon, authenticated, service_role;

INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,busca_cols) VALUES
 ('empresas','Empresas','Cadastros',10,'{nome,nome_fantasia,cnpj}'),
 ('clientes','Clientes','Cadastros',20,'{nome,nome_fantasia,cpf_cnpj}'),
 ('fornecedores','Fornecedores','Cadastros',30,'{nome,nome_fantasia,cpf_cnpj}'),
 ('produtos','Produtos','Cadastros',40,'{nome,referencia,codbarra}'),
 ('servicos','Serviços','Cadastros',50,'{nome}'),
 ('usuarios','Usuários','Cadastros',60,'{nome,login,email}'),
 ('transportadoras','Transportadoras','Cadastros',70,'{nome}'),
 ('veiculos','Veículos','Cadastros',80,'{placa}'),
 ('grupos_produto','Grupos de Produto','Produtos',10,'{descricao}'),
 ('subgrupos_produto','Subgrupos de Produto','Produtos',20,'{descricao}'),
 ('marcas','Marcas','Produtos',30,'{descricao}'),
 ('unidades','Unidades','Produtos',40,'{descricao,sigla}'),
 ('grupos_servico','Grupos de Serviço','Produtos',50,'{descricao}'),
 ('tabelas_preco','Tabelas de Preço','Produtos',60,'{descricao}'),
 ('formas_pagamento','Formas de Pagamento','Financeiro',10,'{descricao}'),
 ('condicoes_pagamento','Condições de Pagamento','Financeiro',20,'{descricao}'),
 ('condicoes_pagamento_parcelas','Parcelas de Condição','Financeiro',25,'{}'),
 ('taxas_forma_pagamento','Taxas por Forma/Condição','Financeiro',30,'{}'),
 ('contas_financeiras','Contas Financeiras','Financeiro',40,'{descricao,banco}'),
 ('plano_contas','Plano de Contas','Financeiro',50,'{codigo,descricao}'),
 ('centros_custo','Centros de Custo','Financeiro',60,'{codigo,descricao}'),
 ('cobranca_regua','Régua de Cobrança','Financeiro',70,'{descricao}'),
 ('naturezas_operacao','Naturezas de Operação','Fiscal',10,'{descricao,cfop}'),
 ('grupos_tributarios','Grupos Tributários','Fiscal',20,'{descricao}'),
 ('tipos_os','Tipos de OS','OS',10,'{descricao}'),
 ('os_defeitos','Defeitos de OS','OS',20,'{descricao}'),
 ('fabricantes_veiculo','Fabricantes de Veículo','OS',30,'{descricao}'),
 ('modelos_veiculo','Modelos de Veículo','OS',40,'{descricao}'),
 ('tipos_saida','Tipos de Saída','Estoque',10,'{descricao}'),
 ('tipos_entrada','Tipos de Entrada','Estoque',20,'{descricao}'),
 ('centros_estoque','Centros de Estoque','Estoque',30,'{descricao}'),
 ('cargos','Cargos','Sistema',10,'{descricao}'),
 ('departamentos','Departamentos','Sistema',20,'{descricao}'),
 ('grupos_acesso','Grupos de Acesso','Sistema',30,'{descricao,nome}'),
 ('segmentos','Segmentos','Sistema',40,'{descricao,nome}'),
 ('cores','Cores','Sistema',50,'{descricao,nome}'),
 ('funil_fases','Fases do Funil','CRM',10,'{descricao,nome}')
ON CONFLICT (tabela) DO NOTHING;

CREATE OR REPLACE FUNCTION public.erp_reg(p_tabela text)
RETURNS public.erp_admin_tabelas LANGUAGE sql STABLE AS $$
  SELECT * FROM public.erp_admin_tabelas WHERE tabela = p_tabela AND ativo = true;
$$;

CREATE OR REPLACE FUNCTION public.erp_colunas(p_tabela text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reg public.erp_admin_tabelas; v_out jsonb;
BEGIN
  v_reg := public.erp_reg(p_tabela);
  IF v_reg.tabela IS NULL THEN RAISE EXCEPTION 'Tabela % nao habilitada', p_tabela; END IF;
  SELECT jsonb_agg(jsonb_build_object(
           'coluna', c.column_name, 'tipo', c.data_type, 'nulo', (c.is_nullable='YES'),
           'default', c.column_default, 'gerada', (c.is_generated<>'NEVER'),
           'identidade', (c.identity_generation IS NOT NULL),
           'tamanho', c.character_maximum_length, 'ordem', c.ordinal_position,
           'fk_tabela', fk.foreign_table, 'fk_col', fk.foreign_column) ORDER BY c.ordinal_position)
    INTO v_out
  FROM information_schema.columns c
  LEFT JOIN (
    SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema=v_reg.esquema AND tc.table_name=p_tabela
  ) fk ON fk.column_name = c.column_name
  WHERE c.table_schema = v_reg.esquema AND c.table_name = p_tabela;
  RETURN jsonb_build_object('tabela',p_tabela,'label',v_reg.label,'pk',v_reg.pk_col,
                            'somente_leitura',v_reg.somente_leitura,'colunas',COALESCE(v_out,'[]'));
END $$;
GRANT EXECUTE ON FUNCTION public.erp_colunas(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.erp_list(
  p_tabela text, p_busca text DEFAULT NULL, p_limit int DEFAULT 1000, p_offset int DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reg public.erp_admin_tabelas; v_where text := ''; v_sql text; v_out jsonb; v_col text;
BEGIN
  v_reg := public.erp_reg(p_tabela);
  IF v_reg.tabela IS NULL THEN RAISE EXCEPTION 'Tabela % nao habilitada', p_tabela; END IF;
  IF p_busca IS NOT NULL AND length(trim(p_busca))>0 AND array_length(v_reg.busca_cols,1) IS NOT NULL THEN
    v_where := ' WHERE ';
    FOREACH v_col IN ARRAY v_reg.busca_cols LOOP
      v_where := v_where || format('%I::text ILIKE %L OR ', v_col, '%'||p_busca||'%');
    END LOOP;
    v_where := left(v_where, length(v_where)-4);
  END IF;
  v_sql := format('SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.%I), ''[]'') FROM (SELECT * FROM %I.%I %s ORDER BY %I LIMIT %s OFFSET %s) t',
                  v_reg.pk_col, v_reg.esquema, p_tabela, v_where, v_reg.pk_col, p_limit::text, p_offset::text);
  EXECUTE v_sql INTO v_out;
  RETURN COALESCE(v_out,'[]');
END $$;
GRANT EXECUTE ON FUNCTION public.erp_list(text,text,int,int) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.erp_upsert(
  p_tabela text, p_dados jsonb, p_id text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reg public.erp_admin_tabelas; v_cols text; v_sql text; v_out jsonb;
BEGIN
  v_reg := public.erp_reg(p_tabela);
  IF v_reg.tabela IS NULL THEN RAISE EXCEPTION 'Tabela % nao habilitada', p_tabela; END IF;
  IF v_reg.somente_leitura THEN RAISE EXCEPTION 'Tabela % e somente leitura', p_tabela; END IF;
  SELECT string_agg(quote_ident(k),',') INTO v_cols
  FROM jsonb_object_keys(p_dados) k
  WHERE EXISTS (SELECT 1 FROM information_schema.columns c
                 WHERE c.table_schema=v_reg.esquema AND c.table_name=p_tabela AND c.column_name=k
                   AND c.is_generated='NEVER' AND c.identity_generation IS NULL);
  IF v_cols IS NULL THEN RAISE EXCEPTION 'Nenhuma coluna valida enviada'; END IF;
  IF p_id IS NULL THEN
    v_sql := format('WITH ins AS (INSERT INTO %I.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::%I.%I,$1) RETURNING *) SELECT to_jsonb(ins) FROM ins',
                    v_reg.esquema,p_tabela,v_cols,v_cols,v_reg.esquema,p_tabela);
    EXECUTE v_sql INTO v_out USING p_dados;
  ELSE
    v_sql := format('WITH upd AS (UPDATE %I.%I SET (%s)=(SELECT %s FROM jsonb_populate_record(NULL::%I.%I,$1)) WHERE %I::text=$2 RETURNING *) SELECT to_jsonb(upd) FROM upd',
                    v_reg.esquema,p_tabela,v_cols,v_cols,v_reg.esquema,p_tabela,v_reg.pk_col);
    EXECUTE v_sql INTO v_out USING p_dados, p_id;
  END IF;
  RETURN jsonb_build_object('ok',true,'registro',v_out);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_upsert(text,jsonb,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.erp_delete(p_tabela text, p_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reg public.erp_admin_tabelas; v_n int;
BEGIN
  v_reg := public.erp_reg(p_tabela);
  IF v_reg.tabela IS NULL THEN RAISE EXCEPTION 'Tabela % nao habilitada', p_tabela; END IF;
  IF v_reg.somente_leitura THEN RAISE EXCEPTION 'Tabela % e somente leitura', p_tabela; END IF;
  EXECUTE format('WITH d AS (DELETE FROM %I.%I WHERE %I::text=$1 RETURNING 1) SELECT count(*) FROM d',
                 v_reg.esquema,p_tabela,v_reg.pk_col) INTO v_n USING p_id;
  RETURN jsonb_build_object('ok',true,'excluidos',v_n);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_delete(text,text) TO anon, authenticated, service_role;
