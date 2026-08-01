-- ERP Bononi — Seed dos CST IBS/CBS da reforma tributária (LC 214/2025)
-- Lista estável dos CST; o catálogo completo de cClassTrib (centenas de códigos) é
-- cadastrado/importado pelo usuário em Configurações → Fiscal → cClassTrib.

INSERT INTO "Teste ERP".cst_ibscbs (codigo, descricao)
SELECT v.codigo, v.descricao FROM (VALUES
  ('000','Tributação integral'),
  ('200','Alíquota reduzida'),
  ('210','Redução de base de cálculo'),
  ('400','Isenção'),
  ('410','Imunidade e não incidência'),
  ('510','Diferimento'),
  ('550','Suspensão'),
  ('620','Tributação monofásica'),
  ('800','Transferência de crédito / demais operações')
) AS v(codigo,descricao)
WHERE NOT EXISTS (SELECT 1 FROM "Teste ERP".cst_ibscbs c WHERE c.codigo=v.codigo);

-- cClassTrib mais comum (tributação integral); demais códigos ficam a cargo do usuário
INSERT INTO "Teste ERP".cclasstrib (codigo, descricao, cst_ibscbs)
SELECT '000001','Situações tributadas integralmente pelo IBS e CBS','000'
WHERE NOT EXISTS (SELECT 1 FROM "Teste ERP".cclasstrib c WHERE c.codigo='000001');
