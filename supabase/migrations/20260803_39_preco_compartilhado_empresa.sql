-- 39: Preço de venda por empresa COM compartilhamento (grupo de preço)
-- Preço continua por empresa (produtos_precos.id_empresa), mas cada empresa pode
-- COMPARTILHAR os preços de outra: empresas.id_empresa_precos aponta para a empresa
-- "dona" do grupo de preço. NULL = preços próprios. Quem compartilha lê/grava os
-- preços da dona; a venda (erp_resolver_preco) resolve pelo dono.
-- Regra anti-cadeia: só se compartilha com uma empresa que tenha preços próprios.

ALTER TABLE "Teste ERP".empresas
  ADD COLUMN IF NOT EXISTS id_empresa_precos integer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='empresas_id_empresa_precos_fk') THEN
    ALTER TABLE "Teste ERP".empresas
      ADD CONSTRAINT empresas_id_empresa_precos_fk FOREIGN KEY (id_empresa_precos)
      REFERENCES "Teste ERP".empresas(id);
  END IF;
END $$;

-- dono do grupo de preço de uma empresa (ela mesma, se não compartilha)
CREATE OR REPLACE FUNCTION "Teste ERP".fn_preco_owner(p_id_empresa integer)
RETURNS integer LANGUAGE sql STABLE AS $function$
  SELECT COALESCE(
    (SELECT COALESCE(e.id_empresa_precos, e.id) FROM "Teste ERP".empresas e WHERE e.id=p_id_empresa),
    p_id_empresa);
$function$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_preco_owner(integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- erp_produto_full: carrega os preços do DONO + expõe o compartilhamento
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_produto_full(p_id_produto integer, p_id_empresa integer)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT jsonb_build_object(
    'produto', (SELECT to_jsonb(p) FROM "Teste ERP".produtos p WHERE p.id=p_id_produto),
    'fiscal',  (SELECT to_jsonb(f) FROM "Teste ERP".produtos_fiscal_empresa f
                 WHERE f.id_produto=p_id_produto AND f.id_empresa=p_id_empresa),
    'precos',  COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'id',pp.id,'id_tabela_preco',pp.id_tabela_preco,
                    'tabela',tp.descricao,'tipo_calculo',pp.tipo_calculo,
                    'margem_percentual',pp.margem_percentual,'preco_venda',pp.preco_venda)
                    ORDER BY tp.id)
                 FROM "Teste ERP".produtos_precos pp
                 JOIN "Teste ERP".tabelas_preco tp ON tp.id=pp.id_tabela_preco
                 WHERE pp.id_produto=p_id_produto
                   AND pp.id_empresa="Teste ERP".fn_preco_owner(p_id_empresa)), '[]'::jsonb),
    'preco_owner',        "Teste ERP".fn_preco_owner(p_id_empresa),
    'preco_compartilhado',("Teste ERP".fn_preco_owner(p_id_empresa) <> p_id_empresa),
    'preco_owner_nome',   (SELECT COALESCE(o.nome_fantasia,o.nome) FROM "Teste ERP".empresas o
                             WHERE o.id="Teste ERP".fn_preco_owner(p_id_empresa)),
    'preco_seguidores',   COALESCE((SELECT jsonb_agg(COALESCE(s.nome_fantasia,s.nome) ORDER BY s.nome)
                             FROM "Teste ERP".empresas s WHERE s.id_empresa_precos=p_id_empresa), '[]'::jsonb),
    'grupo_trib_efetivo', "Teste ERP".fn_grupo_trib_produto(p_id_produto,p_id_empresa),
    'ncm_efetivo',        "Teste ERP".fn_ncm_produto(p_id_produto,p_id_empresa)
  );
$function$;

-- ----------------------------------------------------------------------------
-- erp_preco_empresa_salvar: grava sob o DONO do grupo de preço
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_preco_empresa_salvar(p_id_produto integer, p_id_empresa integer, p_id_tabela integer, p jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
DECLARE v_id int; v_owner int;
BEGIN
  v_owner := "Teste ERP".fn_preco_owner(p_id_empresa);
  INSERT INTO "Teste ERP".produtos_precos
    (id_produto,id_empresa,id_tabela_preco,tipo_calculo,margem_percentual,preco_venda,atualizado_em)
  VALUES
    (p_id_produto,v_owner,p_id_tabela,COALESCE(p->>'tipo_calculo','FIXO'),
     NULLIF(p->>'margem_percentual','')::numeric,NULLIF(p->>'preco_venda','')::numeric,now())
  ON CONFLICT (id_produto,id_empresa,id_tabela_preco) DO UPDATE SET
     tipo_calculo=EXCLUDED.tipo_calculo, margem_percentual=EXCLUDED.margem_percentual,
     preco_venda=EXCLUDED.preco_venda, atualizado_em=now()
  RETURNING id INTO v_id;
  RETURN v_id;
END $function$;

-- ----------------------------------------------------------------------------
-- erp_resolver_preco: passo da tabela resolve pelo DONO (mantém fallback grupo/global)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_resolver_preco(p_id_cliente integer, p_id_produto integer, p_id_empresa integer DEFAULT NULL, p_id_tabela_preco integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_preco numeric; v_tab "Teste ERP".tabelas_preco; v_base numeric; v_owner integer;
BEGIN
  -- 1. Preço específico cliente+produto
  SELECT preco INTO v_preco FROM "Teste ERP".precos_cliente_produto
  WHERE id_cliente = p_id_cliente AND id_produto = p_id_produto AND ativo = true;
  IF v_preco IS NOT NULL THEN
    RETURN jsonb_build_object('preco', v_preco, 'origem', 'CLIENTE_PRODUTO');
  END IF;

  v_owner := "Teste ERP".fn_preco_owner(p_id_empresa);

  -- 2. Preço da tabela (do DONO do grupo de preço; cai para nível grupo id_empresa NULL)
  IF p_id_tabela_preco IS NOT NULL THEN
    SELECT preco_venda INTO v_preco FROM "Teste ERP".produtos_precos
    WHERE id_produto = p_id_produto AND id_tabela_preco = p_id_tabela_preco
      AND (p_id_empresa IS NULL OR id_empresa = v_owner OR id_empresa IS NULL)
    ORDER BY (id_empresa = v_owner) DESC NULLS LAST LIMIT 1;
    IF v_preco IS NOT NULL THEN
      RETURN jsonb_build_object('preco', v_preco, 'origem', 'TABELA');
    END IF;
    -- 2b. Tabela por percentual sobre o preço geral
    SELECT * INTO v_tab FROM "Teste ERP".tabelas_preco WHERE id = p_id_tabela_preco AND ativo = true;
    IF FOUND THEN
      SELECT preco_venda INTO v_base FROM "Teste ERP".produtos WHERE id = p_id_produto;
      v_preco := ROUND(COALESCE(v_base,0) * (1 + COALESCE(v_tab.percentual_acrescimo,0)/100.0 - COALESCE(v_tab.percentual_desconto,0)/100.0), 2);
      RETURN jsonb_build_object('preco', v_preco, 'origem', 'TABELA_PERC');
    END IF;
  END IF;

  -- 3. Preço geral
  SELECT preco_venda INTO v_preco FROM "Teste ERP".produtos WHERE id = p_id_produto;
  RETURN jsonb_build_object('preco', COALESCE(v_preco,0), 'origem', 'GERAL');
END $function$;

-- ----------------------------------------------------------------------------
-- Listar / definir o compartilhamento (tag por empresa)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.erp_empresas_precos_listar()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.nome), '[]'::jsonb) FROM (
    SELECT e.id, COALESCE(e.nome_fantasia,e.nome) AS nome, e.id_empresa_precos,
      (e.id_empresa_precos IS NULL) AS propria,
      (SELECT COALESCE(o.nome_fantasia,o.nome) FROM empresas o WHERE o.id=e.id_empresa_precos) AS dona_nome,
      (SELECT count(*) FROM empresas s WHERE s.id_empresa_precos=e.id) AS seguidores
    FROM empresas e
    WHERE e.ativa IS DISTINCT FROM false
  ) x;
$function$;
GRANT EXECUTE ON FUNCTION public.erp_empresas_precos_listar() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.erp_empresa_precos_definir(p_id_empresa integer, p_id_empresa_precos integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'Teste ERP','public'
AS $function$
BEGIN
  IF p_id_empresa IS NULL THEN RAISE EXCEPTION 'Empresa é obrigatória'; END IF;
  IF NOT EXISTS (SELECT 1 FROM empresas WHERE id=p_id_empresa) THEN RAISE EXCEPTION 'Empresa não encontrada'; END IF;

  IF p_id_empresa_precos IS NOT NULL THEN
    IF p_id_empresa_precos = p_id_empresa THEN
      RAISE EXCEPTION 'A empresa não pode compartilhar preços consigo mesma';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM empresas WHERE id=p_id_empresa_precos) THEN
      RAISE EXCEPTION 'Empresa dona dos preços não encontrada';
    END IF;
    IF (SELECT id_empresa_precos FROM empresas WHERE id=p_id_empresa_precos) IS NOT NULL THEN
      RAISE EXCEPTION 'A empresa escolhida já compartilha preços de outra; aponte para uma empresa com preços próprios';
    END IF;
    IF EXISTS (SELECT 1 FROM empresas WHERE id_empresa_precos=p_id_empresa) THEN
      RAISE EXCEPTION 'Outras empresas compartilham os preços desta; realoque-as antes de torná-la seguidora';
    END IF;
  END IF;

  UPDATE empresas SET id_empresa_precos=p_id_empresa_precos, atualizado_em=now() WHERE id=p_id_empresa;
  RETURN jsonb_build_object('ok',true,'id_empresa',p_id_empresa,'id_empresa_precos',p_id_empresa_precos);
END $function$;
GRANT EXECUTE ON FUNCTION public.erp_empresa_precos_definir(integer,integer) TO anon, authenticated, service_role;
