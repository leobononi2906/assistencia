-- ERP Bononi — Backend da tela de Clientes
-- Identidade + endereço + crédito + contatos + condições de pagamento liberadas.
-- Reaproveita clientes.permite_prazo / limite_credito e fn_condicoes_liberadas_cliente.

-- municípios disponíveis para lookup (somente leitura)
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('municipios','Municípios (IBGE)','Cadastros',60,'id','{nome,uf}',true)
ON CONFLICT (tabela) DO NOTHING;

-- lista enxuta de vendedores (usuarios) sem expor senha_hash
CREATE OR REPLACE FUNCTION public.erp_vendedores()
RETURNS TABLE(id int, nome text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT id, nome::text FROM "Teste ERP".usuarios WHERE COALESCE(ativo,true) ORDER BY nome;
$$;
GRANT EXECUTE ON FUNCTION public.erp_vendedores() TO anon,authenticated,service_role;

-- crédito usado = títulos a receber em aberto do cliente
CREATE OR REPLACE FUNCTION "Teste ERP".fn_credito_usado_cliente(p_id_cliente int)
RETURNS numeric LANGUAGE sql STABLE SET search_path='Teste ERP',public AS $$
  SELECT COALESCE(SUM(valor_saldo),0) FROM titulos
   WHERE id_cliente=p_id_cliente AND tipo='CR'
     AND status IN ('ABERTO','PAGO_PARCIAL','VENCIDO');
$$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_credito_usado_cliente(int) TO anon,authenticated,service_role;

-- carregar cliente completo
CREATE OR REPLACE FUNCTION public.erp_cliente_full(p_id_cliente int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'cliente', (SELECT to_jsonb(c) FROM "Teste ERP".clientes c WHERE c.id=p_id_cliente),
    'contatos', COALESCE((SELECT jsonb_agg(to_jsonb(ct) ORDER BY ct.principal DESC, ct.id)
                  FROM "Teste ERP".clientes_contatos ct WHERE ct.id_cliente=p_id_cliente), '[]'::jsonb),
    'condicoes', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.descricao)
                  FROM "Teste ERP".fn_condicoes_liberadas_cliente(p_id_cliente) x), '[]'::jsonb),
    'credito', jsonb_build_object(
        'limite', COALESCE((SELECT limite_credito FROM "Teste ERP".clientes WHERE id=p_id_cliente),0),
        'usado', "Teste ERP".fn_credito_usado_cliente(p_id_cliente),
        'permite_prazo', COALESCE((SELECT permite_prazo FROM "Teste ERP".clientes WHERE id=p_id_cliente),false))
  );
$$;
GRANT EXECUTE ON FUNCTION public.erp_cliente_full(int) TO anon,authenticated,service_role;

-- salvar identidade/endereço/crédito
CREATE OR REPLACE FUNCTION public.erp_cliente_salvar(p jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int := NULLIF(p->>'id','')::int; v_cod int;
BEGIN
  IF v_id IS NULL THEN
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
END $$;
GRANT EXECUTE ON FUNCTION public.erp_cliente_salvar(jsonb) TO anon,authenticated,service_role;

-- contatos (insert/update)
CREATE OR REPLACE FUNCTION public.erp_cliente_contato_salvar(p_id_cliente int, p jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int := NULLIF(p->>'id','')::int;
BEGIN
  IF v_id IS NULL THEN
    INSERT INTO "Teste ERP".clientes_contatos (id_cliente,nome,cargo,email,telefone,celular,cpf,data_nascimento,principal,ativo)
    VALUES (p_id_cliente,p->>'nome',p->>'cargo',p->>'email',p->>'telefone',p->>'celular',p->>'cpf',
            NULLIF(p->>'data_nascimento','')::date,COALESCE((p->>'principal')::boolean,false),COALESCE((p->>'ativo')::boolean,true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE "Teste ERP".clientes_contatos SET
      nome=p->>'nome',cargo=p->>'cargo',email=p->>'email',telefone=p->>'telefone',celular=p->>'celular',
      cpf=p->>'cpf',data_nascimento=NULLIF(p->>'data_nascimento','')::date,
      principal=COALESCE((p->>'principal')::boolean,principal),ativo=COALESCE((p->>'ativo')::boolean,ativo)
    WHERE id=v_id AND id_cliente=p_id_cliente;
  END IF;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_cliente_contato_salvar(int,jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_cliente_contato_excluir(p_id int)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  DELETE FROM "Teste ERP".clientes_contatos WHERE id=p_id;
$$;
GRANT EXECUTE ON FUNCTION public.erp_cliente_contato_excluir(int) TO anon,authenticated,service_role;

-- liberar/bloquear condição de pagamento para o cliente
CREATE OR REPLACE FUNCTION public.erp_cliente_condicao_set(p_id_cliente int, p_id_condicao int, p_liberar boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF p_liberar THEN
    INSERT INTO "Teste ERP".clientes_condicoes_pagamento (id_cliente,id_condicao_pagamento)
    SELECT p_id_cliente,p_id_condicao
    WHERE NOT EXISTS (SELECT 1 FROM "Teste ERP".clientes_condicoes_pagamento
                       WHERE id_cliente=p_id_cliente AND id_condicao_pagamento=p_id_condicao);
  ELSE
    DELETE FROM "Teste ERP".clientes_condicoes_pagamento
     WHERE id_cliente=p_id_cliente AND id_condicao_pagamento=p_id_condicao;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_cliente_condicao_set(int,int,boolean) TO anon,authenticated,service_role;
