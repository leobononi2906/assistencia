-- ERP Bononi — Cobrança avançada
-- Config por empresa (PIX estático + juros/multa + dados bancários p/ boleto futuro),
-- templates de mensagem por faixa da régua, e renegociação de títulos (acordos).
-- Sem dependência externa: PIX copia-e-cola é montado no front; WhatsApp/e-mail via link.
-- Boleto/CNAB, PIX dinâmico e disparo automático dependem de banco/PSP/provedor + Edge Function.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Configuração de cobrança por empresa
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Teste ERP".cobranca_config (
  id_empresa integer PRIMARY KEY REFERENCES "Teste ERP".empresas(id) ON DELETE CASCADE,
  beneficiario_nome   varchar(60),
  beneficiario_cidade varchar(30),
  pix_chave  varchar(120),
  pix_tipo   varchar(12),               -- EVP | CPF | CNPJ | EMAIL | TELEFONE
  juros_mes  numeric(6,3) NOT NULL DEFAULT 1.0,   -- % ao mês (mora)
  multa_pct  numeric(6,3) NOT NULL DEFAULT 2.0,   -- % sobre o saldo
  carencia_dias integer   NOT NULL DEFAULT 0,
  instrucoes text,
  -- dados bancários (para boleto/CNAB futuro)
  banco_codigo varchar(5), agencia varchar(10), conta varchar(15),
  convenio varchar(20), carteira varchar(5), cedente_codigo varchar(20),
  atualizado_em timestamp DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".cobranca_config TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".cobranca_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_all ON "Teste ERP".cobranca_config;
CREATE POLICY p_all ON "Teste ERP".cobranca_config FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Templates de mensagem (por faixa de atraso e canal)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Teste ERP".cobranca_templates (
  id serial PRIMARY KEY,
  id_empresa integer REFERENCES "Teste ERP".empresas(id),   -- NULL = vale para todas
  canal   varchar(12) NOT NULL DEFAULT 'WHATSAPP',          -- WHATSAPP | EMAIL
  descricao varchar(60) NOT NULL,
  faixa_de   integer NOT NULL DEFAULT -9999,
  faixa_ate  integer NOT NULL DEFAULT 9999,
  assunto  varchar(120),
  mensagem text NOT NULL,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".cobranca_templates TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".cobranca_templates_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".cobranca_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_all ON "Teste ERP".cobranca_templates;
CREATE POLICY p_all ON "Teste ERP".cobranca_templates FOR ALL USING (true) WITH CHECK (true);

-- Placeholders: {cliente} {empresa} {total} {qtd} {maior_atraso} {lista} {pix}
INSERT INTO "Teste ERP".cobranca_templates (canal,descricao,faixa_de,faixa_ate,assunto,mensagem) VALUES
 ('WHATSAPP','A vencer / vence hoje',-9999,0,NULL,
  'Olá {cliente}! Aqui é da {empresa}. Passando para lembrar do seu título no valor de {total} ({qtd} parcela(s)). Qualquer dúvida estamos à disposição. 🙂'),
 ('WHATSAPP','Atraso inicial',1,7,NULL,
  'Olá {cliente}, tudo bem? Consta em nosso sistema um valor em aberto de {total} com a {empresa} ({maior_atraso} dia(s) de atraso). Segue o PIX para regularizar:\n{pix}\nSe já efetuou, favor desconsiderar. Obrigado!'),
 ('WHATSAPP','Atraso médio/grave',8,9999,NULL,
  'Olá {cliente}. Identificamos pendências com a {empresa} totalizando {total}, com atraso de até {maior_atraso} dias:\n{lista}\nPodemos combinar a regularização? Se preferir, pague via PIX:\n{pix}'),
 ('EMAIL','Aviso de cobrança',-9999,9999,'Pendência financeira - {empresa}',
  'Prezado(a) {cliente},\n\nConsta em nosso sistema o valor de {total} em aberto com a {empresa}:\n\n{lista}\n\nPara sua comodidade, disponibilizamos o pagamento via PIX (copia e cola):\n{pix}\n\nCaso o pagamento já tenha sido realizado, por favor desconsidere este aviso.\n\nAtenciosamente,\n{empresa}')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Acordos de renegociação
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Teste ERP".cobranca_acordos (
  id serial PRIMARY KEY,
  numero varchar(20),
  id_empresa integer NOT NULL REFERENCES "Teste ERP".empresas(id),
  id_cliente integer NOT NULL REFERENCES "Teste ERP".clientes(id),
  id_usuario integer REFERENCES "Teste ERP".usuarios(id),
  data_acordo date NOT NULL DEFAULT CURRENT_DATE,
  valor_original numeric(14,2) NOT NULL,   -- soma dos saldos renegociados
  valor_juros    numeric(14,2) NOT NULL DEFAULT 0,
  valor_multa    numeric(14,2) NOT NULL DEFAULT 0,
  valor_entrada  numeric(14,2) NOT NULL DEFAULT 0,
  valor_financiado numeric(14,2) NOT NULL, -- o que foi parcelado
  qtd_parcelas integer NOT NULL,
  observacao text,
  status varchar(12) NOT NULL DEFAULT 'ATIVO',   -- ATIVO | QUITADO | CANCELADO
  criado_em timestamp DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".cobranca_acordos TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE "Teste ERP".cobranca_acordos_id_seq TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".cobranca_acordos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_all ON "Teste ERP".cobranca_acordos;
CREATE POLICY p_all ON "Teste ERP".cobranca_acordos FOR ALL USING (true) WITH CHECK (true);

-- títulos originais que entraram no acordo
CREATE TABLE IF NOT EXISTS "Teste ERP".cobranca_acordos_origem (
  id_acordo integer NOT NULL REFERENCES "Teste ERP".cobranca_acordos(id) ON DELETE CASCADE,
  id_titulo integer NOT NULL REFERENCES "Teste ERP".titulos(id),
  valor_saldo numeric(14,2),
  PRIMARY KEY (id_acordo, id_titulo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Teste ERP".cobranca_acordos_origem TO anon, authenticated, service_role;
ALTER TABLE "Teste ERP".cobranca_acordos_origem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_all ON "Teste ERP".cobranca_acordos_origem;
CREATE POLICY p_all ON "Teste ERP".cobranca_acordos_origem FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Registro no admin CRUD (templates editáveis em Configurações)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,busca_cols) VALUES
 ('cobranca_templates','Templates de Cobrança','Financeiro',75,'{descricao,canal}')
ON CONFLICT (tabela) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Funções
-- ─────────────────────────────────────────────────────────────────────────────

-- Config: get (com fallback nos dados da empresa) e salvar
CREATE OR REPLACE FUNCTION public.erp_cobranca_config_get(p_id_empresa int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'id_empresa', e.id,
    'empresa', COALESCE(e.nome_fantasia, e.nome),
    'beneficiario_nome', COALESCE(c.beneficiario_nome, e.nome),
    'beneficiario_cidade', COALESCE(c.beneficiario_cidade, e.cidade),
    'pix_chave', c.pix_chave, 'pix_tipo', c.pix_tipo,
    'juros_mes', COALESCE(c.juros_mes, 1.0), 'multa_pct', COALESCE(c.multa_pct, 2.0),
    'carencia_dias', COALESCE(c.carencia_dias, 0), 'instrucoes', c.instrucoes,
    'banco_codigo', c.banco_codigo, 'agencia', c.agencia, 'conta', c.conta,
    'convenio', c.convenio, 'carteira', c.carteira, 'cedente_codigo', c.cedente_codigo,
    'configurado', (c.id_empresa IS NOT NULL)
  )
  FROM "Teste ERP".empresas e
  LEFT JOIN "Teste ERP".cobranca_config c ON c.id_empresa = e.id
  WHERE e.id = p_id_empresa;
$$;
GRANT EXECUTE ON FUNCTION public.erp_cobranca_config_get(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_cobranca_config_salvar(p_dados jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_emp int;
BEGIN
  v_emp := (p_dados->>'id_empresa')::int;
  IF v_emp IS NULL THEN RAISE EXCEPTION 'id_empresa obrigatório'; END IF;
  INSERT INTO cobranca_config (id_empresa, beneficiario_nome, beneficiario_cidade, pix_chave, pix_tipo,
      juros_mes, multa_pct, carencia_dias, instrucoes, banco_codigo, agencia, conta, convenio, carteira, cedente_codigo, atualizado_em)
  VALUES (v_emp, p_dados->>'beneficiario_nome', p_dados->>'beneficiario_cidade', p_dados->>'pix_chave', p_dados->>'pix_tipo',
      COALESCE((p_dados->>'juros_mes')::numeric,1.0), COALESCE((p_dados->>'multa_pct')::numeric,2.0),
      COALESCE((p_dados->>'carencia_dias')::int,0), p_dados->>'instrucoes',
      p_dados->>'banco_codigo', p_dados->>'agencia', p_dados->>'conta', p_dados->>'convenio', p_dados->>'carteira', p_dados->>'cedente_codigo', now())
  ON CONFLICT (id_empresa) DO UPDATE SET
      beneficiario_nome=EXCLUDED.beneficiario_nome, beneficiario_cidade=EXCLUDED.beneficiario_cidade,
      pix_chave=EXCLUDED.pix_chave, pix_tipo=EXCLUDED.pix_tipo, juros_mes=EXCLUDED.juros_mes,
      multa_pct=EXCLUDED.multa_pct, carencia_dias=EXCLUDED.carencia_dias, instrucoes=EXCLUDED.instrucoes,
      banco_codigo=EXCLUDED.banco_codigo, agencia=EXCLUDED.agencia, conta=EXCLUDED.conta,
      convenio=EXCLUDED.convenio, carteira=EXCLUDED.carteira, cedente_codigo=EXCLUDED.cedente_codigo,
      atualizado_em=now();
  RETURN jsonb_build_object('ok', true, 'id_empresa', v_emp);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_cobranca_config_salvar(jsonb) TO anon,authenticated,service_role;

-- Títulos abertos de um cliente (para renegociação / PIX / mensagem)
CREATE OR REPLACE FUNCTION public.erp_cobranca_cliente_titulos(p_id_cliente int, p_id_empresa int DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'cliente', (SELECT jsonb_build_object('id',id,'nome',nome,'whatsapp',whatsapp,'celular',celular,
                   'telefone',telefone,'email',email) FROM "Teste ERP".clientes WHERE id=p_id_cliente),
    'titulos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',t.id,'numero',t.numero,'parcela',t.parcela,'id_empresa',t.id_empresa,
        'vencimento',t.data_vencimento,'valor',t.valor,'valor_saldo',t.valor_saldo,'status',t.status,
        'dias_atraso', GREATEST(CURRENT_DATE - t.data_vencimento, 0),
        'origem',t.origem,'numero_origem',t.numero_origem) ORDER BY t.data_vencimento)
      FROM "Teste ERP".titulos t
      WHERE t.id_cliente=p_id_cliente AND t.tipo='CR'
        AND t.status IN ('ABERTO','VENCIDO','PAGO_PARCIAL') AND t.valor_saldo > 0
        AND (p_id_empresa IS NULL OR t.id_empresa = p_id_empresa)), '[]'::jsonb),
    'total_saldo', COALESCE((SELECT SUM(valor_saldo) FROM "Teste ERP".titulos
        WHERE id_cliente=p_id_cliente AND tipo='CR' AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL')
          AND valor_saldo>0 AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),0),
    'maior_atraso', COALESCE((SELECT MAX(CURRENT_DATE - data_vencimento) FROM "Teste ERP".titulos
        WHERE id_cliente=p_id_cliente AND tipo='CR' AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL')
          AND valor_saldo>0 AND (p_id_empresa IS NULL OR id_empresa=p_id_empresa)),0)
  );
$$;
GRANT EXECUTE ON FUNCTION public.erp_cobranca_cliente_titulos(int,int) TO anon,authenticated,service_role;

-- Renegociação: marca originais RENEGOCIADO e gera novos títulos parcelados
DROP FUNCTION IF EXISTS public.erp_renegociar_titulos(int[],int,int,date,numeric,numeric,numeric,int,text);
CREATE OR REPLACE FUNCTION public.erp_renegociar_titulos(
  p_ids int[], p_id_usuario int, p_qtd_parcelas int, p_primeiro_venc date,
  p_valor_entrada numeric DEFAULT 0, p_valor_juros numeric DEFAULT 0, p_valor_multa numeric DEFAULT 0,
  p_id_forma int DEFAULT NULL, p_observacao text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE
  v_emp int; v_cli int; v_saldo numeric; v_n int; v_financiado numeric;
  v_juros numeric := COALESCE(p_valor_juros,0); v_multa numeric := COALESCE(p_valor_multa,0);
  v_entrada numeric := COALESCE(p_valor_entrada,0);
  v_id_acordo int; v_numero text; v_seq int;
  v_parc numeric; v_acum numeric := 0; v_venc date; i int; v_val numeric;
  v_id_tit int; v_ids int[] := '{}'; t RECORD;
BEGIN
  IF p_ids IS NULL OR array_length(p_ids,1) IS NULL THEN RAISE EXCEPTION 'Selecione ao menos um título'; END IF;
  IF COALESCE(p_qtd_parcelas,0) < 1 THEN RAISE EXCEPTION 'Quantidade de parcelas inválida'; END IF;

  -- valida aptidão (tipo/status/saldo) e homogeneidade (mesmo cliente e empresa)
  IF (SELECT count(*) FROM titulos WHERE id = ANY(p_ids) AND tipo='CR'
        AND status IN ('ABERTO','VENCIDO','PAGO_PARCIAL') AND valor_saldo>0) <> array_length(p_ids,1) THEN
    RAISE EXCEPTION 'Um ou mais títulos não estão aptos para renegociação (verifique tipo, status e saldo)';
  END IF;
  IF (SELECT count(DISTINCT id_cliente) FROM titulos WHERE id=ANY(p_ids)) <> 1
     OR (SELECT count(DISTINCT id_empresa) FROM titulos WHERE id=ANY(p_ids)) <> 1 THEN
    RAISE EXCEPTION 'Todos os títulos devem ser do mesmo cliente e da mesma empresa';
  END IF;
  SELECT id_empresa, id_cliente, COALESCE(SUM(valor_saldo),0)
    INTO v_emp, v_cli, v_saldo FROM titulos WHERE id=ANY(p_ids) GROUP BY id_empresa, id_cliente;

  v_financiado := round(v_saldo + v_juros + v_multa - v_entrada, 2);
  IF v_financiado <= 0 THEN RAISE EXCEPTION 'Valor a financiar deve ser maior que zero (entrada não pode cobrir tudo — use baixa normal)'; END IF;

  v_seq := COALESCE((SELECT count(*) FROM cobranca_acordos WHERE id_empresa=v_emp),0) + 1;
  v_numero := 'ACD' || v_emp || '-' || lpad(v_seq::text, 5, '0');

  INSERT INTO cobranca_acordos (numero,id_empresa,id_cliente,id_usuario,valor_original,valor_juros,
        valor_multa,valor_entrada,valor_financiado,qtd_parcelas,observacao)
  VALUES (v_numero,v_emp,v_cli,p_id_usuario,v_saldo,v_juros,v_multa,v_entrada,v_financiado,p_qtd_parcelas,p_observacao)
  RETURNING id INTO v_id_acordo;

  -- registra originais e marca como RENEGOCIADO
  FOR t IN SELECT id, valor_saldo FROM titulos WHERE id=ANY(p_ids) LOOP
    INSERT INTO cobranca_acordos_origem (id_acordo,id_titulo,valor_saldo) VALUES (v_id_acordo,t.id,t.valor_saldo);
  END LOOP;
  UPDATE titulos SET status='RENEGOCIADO',
      observacao = COALESCE(observacao||' | ','') || 'Renegociado no acordo ' || v_numero,
      atualizado_em = now()
   WHERE id = ANY(p_ids);

  -- gera parcelas do acordo
  v_parc := round(v_financiado / p_qtd_parcelas, 2);
  FOR i IN 1..p_qtd_parcelas LOOP
    IF i < p_qtd_parcelas THEN v_val := v_parc; v_acum := v_acum + v_parc;
    ELSE v_val := round(v_financiado - v_acum, 2); END IF;   -- última ajusta resto
    v_venc := (p_primeiro_venc + ((i-1) || ' month')::interval)::date;
    INSERT INTO titulos (tipo,numero,parcela,id_empresa,id_cliente,id_forma_pagamento,origem,id_origem,
        numero_origem,data_emissao,data_vencimento,valor,status,modalidade,observacao)
    VALUES ('CR', v_numero, i || '/' || p_qtd_parcelas, v_emp, v_cli, p_id_forma, 'RENEGOCIACAO', v_id_acordo,
        v_numero, CURRENT_DATE, v_venc, v_val, 'ABERTO', 'RENEGOCIACAO',
        'Acordo ' || v_numero || ' — parcela ' || i || '/' || p_qtd_parcelas)
    RETURNING id INTO v_id_tit;
    v_ids := v_ids || v_id_tit;
  END LOOP;

  INSERT INTO log_acessos (id_usuario, tipo, modulo, acao, tabela_afetada, registro_id, mensagem, dados_novos, criado_em)
  VALUES (p_id_usuario, 'ACAO', 'FINANCEIRO_CR', 'RENEGOCIACAO', 'cobranca_acordos', v_id_acordo,
    'Acordo ' || v_numero || ' (' || p_qtd_parcelas || 'x) — financiado R$ ' || v_financiado,
    jsonb_build_object('numero',v_numero,'originais',p_ids,'saldo',v_saldo,'juros',v_juros,'multa',v_multa,
       'entrada',v_entrada,'financiado',v_financiado,'parcelas',p_qtd_parcelas,'titulos_gerados',v_ids), now());

  RETURN jsonb_build_object('ok',true,'id_acordo',v_id_acordo,'numero',v_numero,
     'valor_financiado',v_financiado,'qtd_parcelas',p_qtd_parcelas,'titulos_gerados',v_ids);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_renegociar_titulos(int[],int,int,date,numeric,numeric,numeric,int,text) TO anon,authenticated,service_role;
