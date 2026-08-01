-- ============================================================================
-- ERP Bononi — Financeiro / Condições de pagamento por cliente
-- Alinha o ERP novo ao modelo do Firebird (SGA_BONONI):
--   TBL_CONDPAG.LIBERA_LIMITE   -> condicoes_pagamento.libera_limite
--   TBL_ITENS_CONDPAG           -> condicoes_pagamento_parcelas (parcelas flexíveis)
--   TBL_CONDPAG_CLI             -> clientes_condicoes_pagamento (liberação N:N)
-- Schema: "Teste ERP" (Supabase vishxwdxqiygbxmtpfoy) | Data: 2026-08-01
-- ============================================================================

-- 1) libera_limite na condição (espelha TBL_CONDPAG.LIBERA_LIMITE)
ALTER TABLE "Teste ERP".condicoes_pagamento
  ADD COLUMN IF NOT EXISTS libera_limite boolean NOT NULL DEFAULT false;

-- 2) Parcelas flexíveis por condição (espelha TBL_ITENS_CONDPAG: PRAZO + PERCENTUAL)
--    Permite condições irregulares, ex.: entrada 50% + 40% em 30d + 10% em 60d.
CREATE TABLE IF NOT EXISTS "Teste ERP".condicoes_pagamento_parcelas (
  id                    serial PRIMARY KEY,
  id_condicao_pagamento integer NOT NULL REFERENCES "Teste ERP".condicoes_pagamento(id) ON DELETE CASCADE,
  numero_parcela        integer NOT NULL,
  prazo_dias            integer NOT NULL DEFAULT 0,
  percentual            numeric(10,6) NOT NULL DEFAULT 0,
  UNIQUE (id_condicao_pagamento, numero_parcela)
);
CREATE INDEX IF NOT EXISTS idx_cpp_cond ON "Teste ERP".condicoes_pagamento_parcelas(id_condicao_pagamento);

-- 3) Condições liberadas por cliente N:N (espelha TBL_CONDPAG_CLI)
CREATE TABLE IF NOT EXISTS "Teste ERP".clientes_condicoes_pagamento (
  id                    serial PRIMARY KEY,
  id_cliente            integer NOT NULL REFERENCES "Teste ERP".clientes(id) ON DELETE CASCADE,
  id_condicao_pagamento integer NOT NULL REFERENCES "Teste ERP".condicoes_pagamento(id) ON DELETE CASCADE,
  criado_em             timestamp DEFAULT now(),
  UNIQUE (id_cliente, id_condicao_pagamento)
);
CREATE INDEX IF NOT EXISTS idx_ccp_cliente ON "Teste ERP".clientes_condicoes_pagamento(id_cliente);

-- GRANTS + RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".condicoes_pagamento_parcelas TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".clientes_condicoes_pagamento TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".condicoes_pagamento_parcelas_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".clientes_condicoes_pagamento_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".condicoes_pagamento_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teste ERP".clientes_condicoes_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_all ON "Teste ERP".condicoes_pagamento_parcelas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY p_all ON "Teste ERP".clientes_condicoes_pagamento FOR ALL USING (true) WITH CHECK (true);

-- 4) Seeds
UPDATE "Teste ERP".condicoes_pagamento SET libera_limite = true WHERE id <> 1;

INSERT INTO "Teste ERP".clientes_condicoes_pagamento (id_cliente, id_condicao_pagamento)
SELECT id, id_condicao_pagamento FROM "Teste ERP".clientes
 WHERE id_condicao_pagamento IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "Teste ERP".clientes_condicoes_pagamento (id_cliente, id_condicao_pagamento)
SELECT id, 1 FROM "Teste ERP".clientes
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5) Função: condições liberadas para um cliente (a tela mostra só o permitido)
-- ============================================================================
CREATE OR REPLACE FUNCTION "Teste ERP".fn_condicoes_liberadas_cliente(p_id_cliente integer)
RETURNS TABLE (
  id integer, descricao varchar, num_parcelas integer, intervalo_dias integer,
  entrada boolean, libera_limite boolean, a_vista boolean, liberada boolean
)
LANGUAGE sql
SET search_path = "Teste ERP", public
AS $$
  SELECT c.id, c.descricao, c.num_parcelas, c.intervalo_dias, c.entrada, c.libera_limite,
         (c.num_parcelas = 1 AND COALESCE(c.intervalo_dias,0) = 0) AS a_vista,
         ( (c.num_parcelas = 1 AND COALESCE(c.intervalo_dias,0) = 0)
           OR EXISTS (SELECT 1 FROM clientes_condicoes_pagamento l
                       WHERE l.id_cliente = p_id_cliente AND l.id_condicao_pagamento = c.id) ) AS liberada
    FROM condicoes_pagamento c
   WHERE c.ativo = true
   ORDER BY c.id;
$$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_condicoes_liberadas_cliente(integer) TO anon, authenticated, service_role;

-- ============================================================================
-- 6) fn_gerar_titulos_receber v2 — respeita liberação N:N + parcelas flexíveis
-- ============================================================================
CREATE OR REPLACE FUNCTION "Teste ERP".fn_gerar_titulos_receber(
  p_origem       text,
  p_id_origem    integer,
  p_id_usuario   integer DEFAULT NULL,
  p_reprocessar  boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = "Teste ERP", public
AS $$
DECLARE
  v_id_cliente int; v_id_empresa int; v_valor numeric; v_forma int;
  v_cond int; v_cc int; v_numero text;
  v_modalidade text; v_usa_limite boolean;
  v_permite boolean; v_limite numeric; v_devedor numeric; v_disp numeric;
  v_np int; v_intervalo int; v_entrada boolean;
  v_i int; v_offset int; v_valor_parc numeric; v_soma numeric := 0;
  v_venc date; v_ids int[] := '{}'; v_novo int;
  v_tem_liberacao boolean; v_tem_parcelas boolean;
  r RECORD;
BEGIN
  IF upper(p_origem) NOT IN ('VENDA','OS') THEN
    RAISE EXCEPTION 'Origem invalida: %', p_origem;
  END IF;

  IF upper(p_origem) = 'VENDA' THEN
    SELECT id_cliente,id_empresa,valor_total,id_forma_pagamento,id_condicao_pagamento,id_centro_custo,numero
      INTO v_id_cliente,v_id_empresa,v_valor,v_forma,v_cond,v_cc,v_numero
      FROM vendas WHERE id = p_id_origem AND cancelada = false;
  ELSE
    SELECT id_cliente,id_empresa,valor_total,id_forma_pagamento,id_condicao_pagamento,id_centro_custo,numero
      INTO v_id_cliente,v_id_empresa,v_valor,v_forma,v_cond,v_cc,v_numero
      FROM ordens_servico WHERE id = p_id_origem AND cancelada = false;
  END IF;
  IF v_id_cliente IS NULL THEN
    RAISE EXCEPTION '% % nao encontrada ou cancelada', p_origem, p_id_origem;
  END IF;
  IF COALESCE(v_valor,0) <= 0 THEN
    RAISE EXCEPTION 'Valor total invalido para gerar titulo';
  END IF;

  IF EXISTS (SELECT 1 FROM titulos WHERE origem = upper(p_origem) AND id_origem = p_id_origem) THEN
    IF NOT p_reprocessar THEN
      RAISE EXCEPTION 'Titulos ja gerados para % %', p_origem, p_id_origem;
    END IF;
    DELETE FROM titulos
     WHERE origem = upper(p_origem) AND id_origem = p_id_origem
       AND NOT EXISTS (SELECT 1 FROM titulos_baixas b WHERE b.id_titulo = titulos.id);
  END IF;

  SELECT modalidade, usa_limite_credito INTO v_modalidade, v_usa_limite
    FROM formas_pagamento WHERE id = v_forma;

  -- A_PRAZO: permite_prazo (mestre) + condicao liberada (TBL_CONDPAG_CLI) + limite
  IF v_modalidade = 'A_PRAZO' OR v_usa_limite THEN
    SELECT permite_prazo, COALESCE(limite_credito,0) INTO v_permite, v_limite
      FROM clientes WHERE id = v_id_cliente;
    IF NOT COALESCE(v_permite,false) THEN
      RAISE EXCEPTION 'Cliente % nao esta liberado para venda a prazo', v_id_cliente;
    END IF;

    SELECT EXISTS (SELECT 1 FROM clientes_condicoes_pagamento WHERE id_cliente = v_id_cliente)
      INTO v_tem_liberacao;
    IF v_tem_liberacao AND v_cond IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM clientes_condicoes_pagamento
                        WHERE id_cliente = v_id_cliente AND id_condicao_pagamento = v_cond) THEN
      RAISE EXCEPTION 'Condicao de pagamento % nao liberada para o cliente %', v_cond, v_id_cliente;
    END IF;

    SELECT COALESCE(SUM(COALESCE(valor_saldo, valor - COALESCE(valor_pago,0))),0)
      INTO v_devedor
      FROM titulos
     WHERE id_cliente = v_id_cliente AND tipo = 'CR' AND status <> 'CANCELADO';
    v_disp := v_limite - v_devedor;
    IF v_valor > v_disp THEN
      RAISE EXCEPTION 'Limite insuficiente: disponivel R$ %, venda R$ %', round(v_disp,2), round(v_valor,2);
    END IF;
  END IF;

  -- Parcelas flexiveis (TBL_ITENS_CONDPAG) tem prioridade
  SELECT EXISTS (SELECT 1 FROM condicoes_pagamento_parcelas WHERE id_condicao_pagamento = v_cond)
    INTO v_tem_parcelas;

  IF v_tem_parcelas THEN
    SELECT count(*) INTO v_np FROM condicoes_pagamento_parcelas WHERE id_condicao_pagamento = v_cond;
    FOR r IN SELECT numero_parcela, prazo_dias, percentual
               FROM condicoes_pagamento_parcelas
              WHERE id_condicao_pagamento = v_cond ORDER BY numero_parcela LOOP
      v_valor_parc := round(v_valor * r.percentual / 100.0, 2);
      IF r.numero_parcela = v_np THEN v_valor_parc := v_valor - v_soma; END IF;
      v_soma := v_soma + v_valor_parc;
      INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_cliente,id_forma_pagamento,
                           origem,id_origem,numero_origem,data_emissao,data_vencimento,
                           valor,status,id_centro_custo)
      VALUES ('CR',v_numero,r.numero_parcela||'/'||v_np,v_id_empresa,v_id_cliente,v_forma,
              upper(p_origem),p_id_origem,v_numero,CURRENT_DATE,CURRENT_DATE + r.prazo_dias,
              v_valor_parc,'ABERTO',v_cc)
      RETURNING id INTO v_novo;
      v_ids := array_append(v_ids, v_novo);
    END LOOP;
  ELSE
    SELECT COALESCE(num_parcelas,1), COALESCE(intervalo_dias,0), COALESCE(entrada,false)
      INTO v_np, v_intervalo, v_entrada
      FROM condicoes_pagamento WHERE id = v_cond;
    IF v_np IS NULL THEN v_np := 1; v_intervalo := 0; v_entrada := false; END IF;
    v_valor_parc := round(v_valor / v_np, 2);
    FOR v_i IN 1..v_np LOOP
      IF v_entrada THEN v_offset := v_intervalo * (v_i - 1);
                   ELSE v_offset := v_intervalo * v_i; END IF;
      v_venc := CURRENT_DATE + v_offset;
      IF v_i = v_np THEN v_valor_parc := v_valor - v_soma; END IF;
      v_soma := v_soma + v_valor_parc;
      INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_cliente,id_forma_pagamento,
                           origem,id_origem,numero_origem,data_emissao,data_vencimento,
                           valor,status,id_centro_custo)
      VALUES ('CR',v_numero,v_i||'/'||v_np,v_id_empresa,v_id_cliente,v_forma,
              upper(p_origem),p_id_origem,v_numero,CURRENT_DATE,v_venc,
              v_valor_parc,'ABERTO',v_cc)
      RETURNING id INTO v_novo;
      v_ids := array_append(v_ids, v_novo);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ok',true,'origem',upper(p_origem),'id_origem',p_id_origem,
                            'parcelas',v_np,'valor_total',v_valor,'titulos',v_ids);
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_gerar_titulos_receber(text,integer,integer,boolean)
  TO anon, authenticated, service_role;
