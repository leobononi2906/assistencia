-- ERP Bononi — Tela única de Produtos
-- Identidade GLOBAL (produtos) + Preço POR EMPRESA (produtos_precos, por tabela de preço)
-- + Fiscal POR EMPRESA (produtos_fiscal_empresa, incl. reforma IBS/CBS/IS).
-- Wrappers públicos (SECURITY DEFINER) para a tela operar em um só lugar.

-- Registrar preços no CRUD genérico (grupo Cadastros)
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('produtos_precos','Preços por empresa','Cadastros',41,'id','{}',false)
ON CONFLICT (tabela) DO NOTHING;

-- 1) Carregar o produto completo (identidade + fiscal da empresa + preços da empresa)
CREATE OR REPLACE FUNCTION public.erp_produto_full(p_id_produto int, p_id_empresa int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
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
                 WHERE pp.id_produto=p_id_produto AND pp.id_empresa=p_id_empresa), '[]'::jsonb),
    'grupo_trib_efetivo', "Teste ERP".fn_grupo_trib_produto(p_id_produto,p_id_empresa),
    'ncm_efetivo',        "Teste ERP".fn_ncm_produto(p_id_produto,p_id_empresa)
  );
$$;
GRANT EXECUTE ON FUNCTION public.erp_produto_full(int,int) TO anon,authenticated,service_role;

-- 2) Salvar identidade global (insert quando id nulo, senão update dos campos enviados)
CREATE OR REPLACE FUNCTION public.erp_produto_salvar(p jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int := NULLIF(p->>'id','')::int;
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
     WHERE id=v_id;
  END IF;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_produto_salvar(jsonb) TO anon,authenticated,service_role;

-- 3) Salvar fiscal por empresa (upsert)
CREATE OR REPLACE FUNCTION public.erp_fiscal_empresa_salvar(p_id_produto int, p_id_empresa int, p jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int;
BEGIN
  INSERT INTO "Teste ERP".produtos_fiscal_empresa
    (id_produto,id_empresa,id_grupo_tributario,ncm,cest,cfop_padrao,cst_csosn,origem,aliquota_icms,
     cst_ibscbs,cclasstrib,ativo,atualizado_em)
  VALUES
    (p_id_produto,p_id_empresa,NULLIF(p->>'id_grupo_tributario','')::int,p->>'ncm',p->>'cest',
     p->>'cfop_padrao',p->>'cst_csosn',COALESCE(NULLIF(p->>'origem','')::smallint,0),
     NULLIF(p->>'aliquota_icms','')::numeric,p->>'cst_ibscbs',p->>'cclasstrib',
     COALESCE((p->>'ativo')::boolean,true),now())
  ON CONFLICT (id_produto,id_empresa) DO UPDATE SET
     id_grupo_tributario=NULLIF(EXCLUDED.id_grupo_tributario::text,'')::int,
     ncm=EXCLUDED.ncm, cest=EXCLUDED.cest, cfop_padrao=EXCLUDED.cfop_padrao,
     cst_csosn=EXCLUDED.cst_csosn, origem=EXCLUDED.origem, aliquota_icms=EXCLUDED.aliquota_icms,
     cst_ibscbs=EXCLUDED.cst_ibscbs, cclasstrib=EXCLUDED.cclasstrib, ativo=EXCLUDED.ativo,
     atualizado_em=now()
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_fiscal_empresa_salvar(int,int,jsonb) TO anon,authenticated,service_role;

-- 4) Salvar preço por empresa/tabela (upsert)
CREATE OR REPLACE FUNCTION public.erp_preco_empresa_salvar(p_id_produto int, p_id_empresa int, p_id_tabela int, p jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_id int;
BEGIN
  INSERT INTO "Teste ERP".produtos_precos
    (id_produto,id_empresa,id_tabela_preco,tipo_calculo,margem_percentual,preco_venda,atualizado_em)
  VALUES
    (p_id_produto,p_id_empresa,p_id_tabela,COALESCE(p->>'tipo_calculo','FIXO'),
     NULLIF(p->>'margem_percentual','')::numeric,NULLIF(p->>'preco_venda','')::numeric,now())
  ON CONFLICT (id_produto,id_empresa,id_tabela_preco) DO UPDATE SET
     tipo_calculo=EXCLUDED.tipo_calculo, margem_percentual=EXCLUDED.margem_percentual,
     preco_venda=EXCLUDED.preco_venda, atualizado_em=now()
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_preco_empresa_salvar(int,int,int,jsonb) TO anon,authenticated,service_role;
