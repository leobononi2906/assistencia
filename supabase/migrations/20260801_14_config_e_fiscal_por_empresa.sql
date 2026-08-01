-- ERP Bononi — Config por empresa (fallback global) + Fiscal do produto por empresa
-- Espelha o modelo do Firebird: identidade global (produtos) + dados/fiscal por empresa
-- (TBL_PRODUTO_DADOS por CHDADOS). configuracoes.id_empresa habilita config por empresa.

CREATE OR REPLACE FUNCTION "Teste ERP".fn_config(p_chave text, p_id_empresa int DEFAULT NULL)
RETURNS text LANGUAGE sql STABLE SET search_path="Teste ERP",public AS $$
  SELECT COALESCE(
    (SELECT valor FROM configuracoes WHERE chave=p_chave AND id_empresa=p_id_empresa LIMIT 1),
    (SELECT valor FROM configuracoes WHERE chave=p_chave AND id_empresa IS NULL LIMIT 1));
$$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_config(text,int) TO anon,authenticated,service_role;

CREATE TABLE IF NOT EXISTS "Teste ERP".produtos_fiscal_empresa (
  id serial PRIMARY KEY,
  id_produto integer NOT NULL REFERENCES "Teste ERP".produtos(id) ON DELETE CASCADE,
  id_empresa integer NOT NULL REFERENCES "Teste ERP".empresas(id) ON DELETE CASCADE,
  id_grupo_tributario integer REFERENCES "Teste ERP".grupos_tributarios(id),
  ncm varchar(10), cest varchar(10), cfop_padrao varchar(10),
  cst_csosn varchar(4), origem smallint DEFAULT 0, aliquota_icms numeric(7,4),
  ativo boolean NOT NULL DEFAULT true, atualizado_em timestamp DEFAULT now(),
  UNIQUE (id_produto, id_empresa)
);
CREATE INDEX IF NOT EXISTS idx_pfe_prod ON "Teste ERP".produtos_fiscal_empresa(id_produto);
CREATE INDEX IF NOT EXISTS idx_pfe_emp ON "Teste ERP".produtos_fiscal_empresa(id_empresa);
GRANT SELECT,INSERT,UPDATE,DELETE ON "Teste ERP".produtos_fiscal_empresa TO anon,authenticated,service_role;
GRANT USAGE,SELECT ON SEQUENCE "Teste ERP".produtos_fiscal_empresa_id_seq TO anon,authenticated,service_role;
ALTER TABLE "Teste ERP".produtos_fiscal_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_all ON "Teste ERP".produtos_fiscal_empresa FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION "Teste ERP".fn_grupo_trib_produto(p_id_produto int, p_id_empresa int)
RETURNS int LANGUAGE sql STABLE SET search_path="Teste ERP",public AS $$
  SELECT COALESCE(
    (SELECT id_grupo_tributario FROM produtos_fiscal_empresa WHERE id_produto=p_id_produto AND id_empresa=p_id_empresa AND ativo),
    (SELECT id_grupo_tributario FROM produtos WHERE id=p_id_produto));
$$;
CREATE OR REPLACE FUNCTION "Teste ERP".fn_ncm_produto(p_id_produto int, p_id_empresa int)
RETURNS text LANGUAGE sql STABLE SET search_path="Teste ERP",public AS $$
  SELECT COALESCE(
    (SELECT ncm FROM produtos_fiscal_empresa WHERE id_produto=p_id_produto AND id_empresa=p_id_empresa AND ativo),
    (SELECT ncm FROM produtos WHERE id=p_id_produto));
$$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_grupo_trib_produto(int,int) TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_ncm_produto(int,int) TO anon,authenticated,service_role;

INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('produtos_fiscal_empresa','Fiscal do Produto (por empresa)','Fiscal',40,'id','{ncm}',false)
ON CONFLICT (tabela) DO NOTHING;

-- fn_gerar_nfe passa a resolver grupo tributário / NCM / ambiente / série POR EMPRESA
-- (a definição completa e atualizada está aplicada; usa fn_grupo_trib_produto, fn_ncm_produto e fn_config).
