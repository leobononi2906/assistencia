-- ERP Bononi — Reforma Tributária (IBS / CBS / IS)
-- Acrescenta os tributos da reforma (LC 214/2025) ao modelo fiscal:
--   IBS  = IBS-UF + IBS-Município (substitui ICMS/ISS)
--   CBS  = Contribuição sobre Bens e Serviços (substitui PIS/COFINS)
--   IS   = Imposto Seletivo
-- Convivem com os tributos atuais durante o período de transição.

-- 1) Alíquotas/CST no grupo tributário (parametrização padrão do produto)
ALTER TABLE "Teste ERP".grupos_tributarios
  ADD COLUMN IF NOT EXISTS cst_ibscbs  varchar(4),
  ADD COLUMN IF NOT EXISTS cclasstrib  varchar(6),
  ADD COLUMN IF NOT EXISTS aliq_ibs_uf  numeric(7,4),
  ADD COLUMN IF NOT EXISTS aliq_ibs_mun numeric(7,4),
  ADD COLUMN IF NOT EXISTS aliq_cbs     numeric(7,4),
  ADD COLUMN IF NOT EXISTS red_ibs      numeric(7,4),
  ADD COLUMN IF NOT EXISTS red_cbs      numeric(7,4),
  ADD COLUMN IF NOT EXISTS cst_is       varchar(3),
  ADD COLUMN IF NOT EXISTS aliq_is      numeric(7,4);

-- 2) Override fiscal por empresa (CST/cClassTrib específicos)
ALTER TABLE "Teste ERP".produtos_fiscal_empresa
  ADD COLUMN IF NOT EXISTS cst_ibscbs varchar(4),
  ADD COLUMN IF NOT EXISTS cclasstrib varchar(6);

-- 3) Valores calculados no item da NF-e
ALTER TABLE "Teste ERP".nfe_itens
  ADD COLUMN IF NOT EXISTS cst_ibscbs   varchar(4),
  ADD COLUMN IF NOT EXISTS cclasstrib   varchar(6),
  ADD COLUMN IF NOT EXISTS bc_ibs_cbs   numeric(14,2),
  ADD COLUMN IF NOT EXISTS aliq_ibs_uf  numeric(7,4),
  ADD COLUMN IF NOT EXISTS valor_ibs_uf numeric(14,2),
  ADD COLUMN IF NOT EXISTS aliq_ibs_mun numeric(7,4),
  ADD COLUMN IF NOT EXISTS valor_ibs_mun numeric(14,2),
  ADD COLUMN IF NOT EXISTS aliq_cbs     numeric(7,4),
  ADD COLUMN IF NOT EXISTS valor_cbs    numeric(14,2),
  ADD COLUMN IF NOT EXISTS cst_is       varchar(3),
  ADD COLUMN IF NOT EXISTS aliq_is      numeric(7,4),
  ADD COLUMN IF NOT EXISTS valor_is     numeric(14,2);

-- 4) Totais na NF-e
ALTER TABLE "Teste ERP".nfe
  ADD COLUMN IF NOT EXISTS valor_ibs_uf  numeric(14,2),
  ADD COLUMN IF NOT EXISTS valor_ibs_mun numeric(14,2),
  ADD COLUMN IF NOT EXISTS valor_cbs     numeric(14,2),
  ADD COLUMN IF NOT EXISTS valor_is      numeric(14,2);

-- 5) Tabelas de referência (SEFAZ) — CST IBS/CBS, cClassTrib, CST do IS
CREATE TABLE IF NOT EXISTS "Teste ERP".cst_ibscbs (
  id serial PRIMARY KEY, codigo varchar(3) NOT NULL, descricao varchar(200)
);
CREATE TABLE IF NOT EXISTS "Teste ERP".cclasstrib (
  id serial PRIMARY KEY, codigo varchar(6) NOT NULL, descricao varchar(200), cst_ibscbs varchar(3)
);
CREATE TABLE IF NOT EXISTS "Teste ERP".cst_is (
  id serial PRIMARY KEY, codigo varchar(3) NOT NULL, descricao varchar(200)
);

DO $grants$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cst_ibscbs','cclasstrib','cst_is'] LOOP
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON "Teste ERP".%I TO anon,authenticated,service_role', t);
    EXECUTE format('GRANT USAGE,SELECT ON SEQUENCE "Teste ERP".%I_id_seq TO anon,authenticated,service_role', t);
    EXECUTE format('ALTER TABLE "Teste ERP".%I ENABLE ROW LEVEL SECURITY', t);
    BEGIN
      EXECUTE format('CREATE POLICY p_all ON "Teste ERP".%I FOR ALL USING (true) WITH CHECK (true)', t);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END LOOP;
END $grants$;

-- 6) Registrar no CRUD genérico (grupo Fiscal)
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('cst_ibscbs','CST IBS/CBS (reforma)','Fiscal',50,'id','{codigo,descricao}',false),
 ('cclasstrib','cClassTrib (reforma)','Fiscal',51,'id','{codigo,descricao}',false),
 ('cst_is','CST Imposto Seletivo','Fiscal',52,'id','{codigo,descricao}',false)
ON CONFLICT (tabela) DO NOTHING;
