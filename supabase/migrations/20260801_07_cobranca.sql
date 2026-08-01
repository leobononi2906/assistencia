-- ERP Bononi — Financeiro / Cobrança (régua, ações, view agregada por cliente)
CREATE TABLE IF NOT EXISTS "Teste ERP".cobranca_regua (
  id serial PRIMARY KEY, descricao varchar(60) NOT NULL, dias_de integer NOT NULL,
  dias_ate integer NOT NULL, acao varchar(120), cor varchar(9), ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".cobranca_regua TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".cobranca_regua_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".cobranca_regua ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_all ON "Teste ERP".cobranca_regua FOR ALL USING (true) WITH CHECK (true);
INSERT INTO "Teste ERP".cobranca_regua (descricao,dias_de,dias_ate,acao,cor) VALUES
 ('A vencer',-9999,-1,'Acompanhar','#0077CC'),
 ('Vence hoje',0,0,'Lembrete amigavel','#00AAEE'),
 ('Atraso inicial',1,7,'Contato por WhatsApp','#E07B00'),
 ('Atraso medio',8,30,'Ligacao + cobranca formal','#E07B00'),
 ('Atraso grave',31,60,'Negativacao / renegociacao','#D93025'),
 ('Atraso critico',61,9999,'Protesto / juridico','#D93025')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "Teste ERP".cobranca_acoes (
  id serial PRIMARY KEY,
  id_empresa integer REFERENCES "Teste ERP".empresas(id),
  id_cliente integer NOT NULL REFERENCES "Teste ERP".clientes(id) ON DELETE CASCADE,
  id_titulo integer REFERENCES "Teste ERP".titulos(id),
  id_usuario integer REFERENCES "Teste ERP".usuarios(id),
  tipo varchar(20) NOT NULL DEFAULT 'CONTATO',
  canal varchar(20), descricao text, data_promessa date, valor_promessa numeric(14,2),
  data_acao timestamp DEFAULT now(), criado_em timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cob_acoes_cli ON "Teste ERP".cobranca_acoes(id_cliente);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".cobranca_acoes TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".cobranca_acoes_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".cobranca_acoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_all ON "Teste ERP".cobranca_acoes FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE VIEW "Teste ERP".vw_cobranca_clientes AS
SELECT t.id_empresa, e.nome AS empresa, t.id_cliente, c.nome AS cliente,
       c.telefone, c.celular, c.whatsapp, c.limite_credito,
       count(*) FILTER (WHERE t.data_vencimento < CURRENT_DATE) AS titulos_vencidos,
       COALESCE(SUM(t.valor_saldo) FILTER (WHERE t.data_vencimento < CURRENT_DATE),0) AS total_vencido,
       COALESCE(SUM(t.valor_saldo) FILTER (WHERE t.data_vencimento >= CURRENT_DATE),0) AS total_a_vencer,
       COALESCE(SUM(t.valor_saldo),0) AS saldo_devedor,
       COALESCE(MAX(CURRENT_DATE - t.data_vencimento) FILTER (WHERE t.data_vencimento < CURRENT_DATE),0) AS maior_atraso,
       MIN(t.data_vencimento) FILTER (WHERE t.data_vencimento < CURRENT_DATE) AS vencimento_mais_antigo
  FROM "Teste ERP".titulos t
  LEFT JOIN "Teste ERP".clientes c ON c.id = t.id_cliente
  LEFT JOIN "Teste ERP".empresas e ON e.id = t.id_empresa
 WHERE t.tipo = 'CR' AND t.status NOT IN ('PAGO','CANCELADO','RENEGOCIADO')
 GROUP BY t.id_empresa, e.nome, t.id_cliente, c.nome, c.telefone, c.celular, c.whatsapp, c.limite_credito
 HAVING COALESCE(SUM(t.valor_saldo),0) > 0;
GRANT SELECT ON "Teste ERP".vw_cobranca_clientes TO anon, authenticated, service_role;
