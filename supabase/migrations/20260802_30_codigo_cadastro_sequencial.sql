-- 30: Código de cadastro automático e sequencial (clientes e fornecedores)
-- Antes: cliente gerava por MAX(codigo)+1 na função; fornecedor era digitado no
-- CRUD genérico (Configurações). Agora ambos usam SEQUENCE real do Postgres +
-- trigger BEFORE INSERT — atômico, sem colisão, preenche sozinho em qualquer
-- caminho de inserção (função dedicada ou CRUD genérico). O usuário não digita código.

-- ===== Sequências (posicionadas após o maior código já existente) =====
CREATE SEQUENCE IF NOT EXISTS "Teste ERP".clientes_codigo_seq OWNED BY "Teste ERP".clientes.codigo;
CREATE SEQUENCE IF NOT EXISTS "Teste ERP".fornecedores_codigo_seq OWNED BY "Teste ERP".fornecedores.codigo;
SELECT setval('"Teste ERP".clientes_codigo_seq', GREATEST((SELECT COALESCE(MAX(codigo),0) FROM "Teste ERP".clientes),1), true);
SELECT setval('"Teste ERP".fornecedores_codigo_seq', GREATEST((SELECT COALESCE(MAX(codigo),0) FROM "Teste ERP".fornecedores),1), true);

-- Sem DEFAULT de propósito: a trigger BEFORE INSERT é a ÚNICA fonte do código.
-- (DEFAULT + trigger juntos gerariam dois nextval e código duplicado.)

-- Trigger genérica: preenche codigo quando vier NULL — cobre tanto a coluna omitida
-- quanto codigo=NULL explícito (caminho do CRUD genérico de Configurações)
CREATE OR REPLACE FUNCTION "Teste ERP".fn_auto_codigo()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := nextval(TG_ARGV[0]::regclass);
  END IF;
  RETURN NEW;
END $fn$;

DROP TRIGGER IF EXISTS trg_auto_codigo ON "Teste ERP".clientes;
CREATE TRIGGER trg_auto_codigo BEFORE INSERT ON "Teste ERP".clientes
  FOR EACH ROW EXECUTE FUNCTION "Teste ERP".fn_auto_codigo('"Teste ERP".clientes_codigo_seq');

DROP TRIGGER IF EXISTS trg_auto_codigo ON "Teste ERP".fornecedores;
CREATE TRIGGER trg_auto_codigo BEFORE INSERT ON "Teste ERP".fornecedores
  FOR EACH ROW EXECUTE FUNCTION "Teste ERP".fn_auto_codigo('"Teste ERP".fornecedores_codigo_seq');

-- ===== erp_cliente_salvar: passa a NÃO gerar código (a sequência/trigger cuida) =====
CREATE OR REPLACE FUNCTION public.erp_cliente_salvar(p jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'Teste ERP', 'public'
AS $function$
DECLARE v_id int := NULLIF(p->>'id','')::int;
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
    WHERE id=v_id;
  END IF;
  RETURN v_id;
END $function$;
