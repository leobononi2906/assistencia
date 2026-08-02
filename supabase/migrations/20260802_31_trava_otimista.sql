-- 31: Trava otimista (edição simultânea do mesmo cadastro)
-- Sem bloquear ninguém: ao salvar, confere se o registro mudou desde que foi aberto
-- (compara atualizado_em com o valor carregado). Se outro usuário salvou no meio,
-- levanta CONFLITO_EDICAO em vez de sobrescrever silenciosamente.
-- Compatível: se atualizado_em_ref não vier (null), não checa (não quebra chamadas antigas).

CREATE OR REPLACE FUNCTION public.erp_cliente_salvar(p jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p->>'id','')::int;
        v_ref timestamp := NULLIF(p->>'atualizado_em_ref','')::timestamp;
        v_n int;
BEGIN
  IF v_id IS NULL THEN
    INSERT INTO "Teste ERP".clientes
      (tipo_pessoa, tipo, nome, nome_fantasia, cpf_cnpj, rg_ie, inscricao_municipal,
       indicador_ie, email, email_nfe, telefone, celular, whatsapp,
       endereco, numero, complemento, bairro, id_municipio, cidade, uf, cep,
       id_empresa, id_vendedor, id_condicao_pagamento, id_tabela_preco, id_transportadora,
       perc_desc_produto, perc_desc_servico, limite_credito, permite_prazo, situacao, observacao)
    VALUES
      (COALESCE(p->>'tipo_pessoa','F'), p->>'tipo', p->>'nome', p->>'nome_fantasia',
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
    WHERE id=v_id AND (v_ref IS NULL OR atualizado_em IS NOT DISTINCT FROM v_ref);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n = 0 THEN
      IF EXISTS (SELECT 1 FROM "Teste ERP".clientes WHERE id=v_id) THEN
        RAISE EXCEPTION 'CONFLITO_EDICAO: este cliente foi alterado por outro usuário. Recarregue antes de salvar.';
      ELSE
        RAISE EXCEPTION 'Cliente % não encontrado', v_id;
      END IF;
    END IF;
  END IF;
  RETURN v_id;
END $function$;

CREATE OR REPLACE FUNCTION public.erp_produto_salvar(p jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p->>'id','')::int;
        v_ref timestamp := NULLIF(p->>'atualizado_em_ref','')::timestamp;
        v_n int;
BEGIN
  IF v_id IS NULL THEN
    INSERT INTO "Teste ERP".produtos
      (nome, referencia, descricao, codigo_barras, id_grupo, id_subgrupo, id_marca, id_unidade,
       id_grupo_tributario, ncm, cest, cfop_padrao, cst_csosn, origem, situacao,
       controla_estoque, preco_custo, preco_venda, estoque_minimo, estoque_maximo)
    VALUES
      (p->>'nome', p->>'referencia', p->>'descricao', p->>'codigo_barras',
       NULLIF(p->>'id_grupo','')::int, NULLIF(p->>'id_subgrupo','')::int, NULLIF(p->>'id_marca','')::int,
       NULLIF(p->>'id_unidade','')::int, NULLIF(p->>'id_grupo_tributario','')::int,
       p->>'ncm', p->>'cest', p->>'cfop_padrao', p->>'cst_csosn',
       COALESCE(NULLIF(p->>'origem','')::smallint,0), COALESCE(p->>'situacao','ATIVO'),
       COALESCE((p->>'controla_estoque')::boolean,true),
       NULLIF(p->>'preco_custo','')::numeric, NULLIF(p->>'preco_venda','')::numeric,
       NULLIF(p->>'estoque_minimo','')::numeric, NULLIF(p->>'estoque_maximo','')::numeric)
    RETURNING id INTO v_id;
  ELSE
    UPDATE "Teste ERP".produtos SET
       nome=COALESCE(p->>'nome',nome),
       referencia=COALESCE(p->>'referencia',referencia),
       descricao=COALESCE(p->>'descricao',descricao),
       codigo_barras=COALESCE(p->>'codigo_barras',codigo_barras),
       id_grupo=COALESCE(NULLIF(p->>'id_grupo','')::int,id_grupo),
       id_subgrupo=COALESCE(NULLIF(p->>'id_subgrupo','')::int,id_subgrupo),
       id_marca=COALESCE(NULLIF(p->>'id_marca','')::int,id_marca),
       id_unidade=COALESCE(NULLIF(p->>'id_unidade','')::int,id_unidade),
       id_grupo_tributario=COALESCE(NULLIF(p->>'id_grupo_tributario','')::int,id_grupo_tributario),
       ncm=COALESCE(p->>'ncm',ncm),
       cest=COALESCE(p->>'cest',cest),
       cfop_padrao=COALESCE(p->>'cfop_padrao',cfop_padrao),
       cst_csosn=COALESCE(p->>'cst_csosn',cst_csosn),
       origem=COALESCE(NULLIF(p->>'origem','')::smallint,origem),
       situacao=COALESCE(p->>'situacao',situacao),
       controla_estoque=COALESCE((p->>'controla_estoque')::boolean,controla_estoque),
       preco_custo=COALESCE(NULLIF(p->>'preco_custo','')::numeric,preco_custo),
       preco_venda=COALESCE(NULLIF(p->>'preco_venda','')::numeric,preco_venda),
       estoque_minimo=COALESCE(NULLIF(p->>'estoque_minimo','')::numeric,estoque_minimo),
       estoque_maximo=COALESCE(NULLIF(p->>'estoque_maximo','')::numeric,estoque_maximo),
       atualizado_em=now()
     WHERE id=v_id AND (v_ref IS NULL OR atualizado_em IS NOT DISTINCT FROM v_ref);
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n = 0 THEN
      IF EXISTS (SELECT 1 FROM "Teste ERP".produtos WHERE id=v_id) THEN
        RAISE EXCEPTION 'CONFLITO_EDICAO: este produto foi alterado por outro usuário. Recarregue antes de salvar.';
      ELSE
        RAISE EXCEPTION 'Produto % não encontrado', v_id;
      END IF;
    END IF;
  END IF;
  RETURN v_id;
END $function$;
