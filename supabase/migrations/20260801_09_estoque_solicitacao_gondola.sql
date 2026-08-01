-- ERP Bononi — Estoque / Solicitação de produto (vendas pede, estoque lança) + Gôndola
-- Gôndola = centro de estoque marcado (gondola=true) com saldo próprio; lançamento
-- direto só até a quantidade disponível na gôndola (bloqueia negativo).

INSERT INTO "Teste ERP".configuracoes (chave,valor)
SELECT 'exige_solicitacao_produto','S'
WHERE NOT EXISTS (SELECT 1 FROM "Teste ERP".configuracoes WHERE chave='exige_solicitacao_produto');

ALTER TABLE "Teste ERP".centros_estoque ADD COLUMN IF NOT EXISTS gondola boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Teste ERP".solicitacoes_produto (
  id serial PRIMARY KEY,
  id_empresa integer REFERENCES "Teste ERP".empresas(id),
  origem varchar(6) NOT NULL CHECK (origem IN ('OS','VENDA')),
  id_origem integer NOT NULL,
  id_produto integer NOT NULL REFERENCES "Teste ERP".produtos(id),
  id_unidade integer,
  qtd_solicitada numeric(14,3) NOT NULL,
  qtd_atendida numeric(14,3) NOT NULL DEFAULT 0,
  valor_unitario numeric(14,2),
  id_centro_estoque integer,
  prioridade smallint NOT NULL DEFAULT 3,
  status varchar(12) NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE','SEPARANDO','PARCIAL','ATENDIDA','CANCELADA')),
  observacao text,
  id_usuario_solicitante integer,
  id_usuario_atendente integer,
  reservou boolean NOT NULL DEFAULT false,
  data_solicitacao timestamp DEFAULT now(),
  data_atendimento timestamp,
  criado_em timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_solic_origem ON "Teste ERP".solicitacoes_produto(origem,id_origem);
CREATE INDEX IF NOT EXISTS idx_solic_status ON "Teste ERP".solicitacoes_produto(status);
GRANT SELECT,INSERT,UPDATE,DELETE ON "Teste ERP".solicitacoes_produto TO anon,authenticated,service_role;
GRANT USAGE,SELECT ON SEQUENCE "Teste ERP".solicitacoes_produto_id_seq TO anon,authenticated,service_role;
ALTER TABLE "Teste ERP".solicitacoes_produto ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_all ON "Teste ERP".solicitacoes_produto FOR ALL USING (true) WITH CHECK (true);

-- Ver funções aplicadas na migração "estoque_solicitacao_e_gondola":
--   fn_estoque_saida(...,p_bloqueia_negativo) / fn_estoque_entrada(...)
--   fn_recalc_totais / fn_solicitar_produto / fn_atender_solicitacao / fn_cancelar_solicitacao
--   fn_gondola_abastecer / fn_lancar_produto_gondola
--   views vw_solicitacoes / vw_gondola_saldo
-- (definições completas na migração aplicada via MCP; este arquivo documenta o schema base)
