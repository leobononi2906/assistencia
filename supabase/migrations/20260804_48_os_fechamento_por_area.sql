-- 48: OS — apontamento por ÁREA (solto) e serviço criado no FECHAMENTO pelo boca
-- Processo fechado com o Leo: o vendedor abre a OS só com o defeito; o pátio aponta horas
-- na OS marcando a ÁREA (Elétrica, Instalação...), sem serviço; no fim o precificador ("boca")
-- vê os apontamentos soltos agrupados por área e CRIA a linha de serviço puxando aqueles
-- apontamentos — o serviço herda os profissionais (dos apontamentos) e as horas faturáveis,
-- e ele digita o valor. O elo profissional↔serviço nasce do agrupamento.

-- 1) apontamento pode existir sem serviço (vínculo vem depois) e carrega a área
ALTER TABLE "Teste ERP".os_apontamentos ALTER COLUMN id_servico_os DROP NOT NULL;
ALTER TABLE "Teste ERP".os_apontamentos ADD COLUMN IF NOT EXISTS id_area integer;
CREATE INDEX IF NOT EXISTS ix_os_apont_os_solto
  ON "Teste ERP".os_apontamentos (id_os) WHERE id_servico_os IS NULL;

-- 2) salvar apontamento: agora aceita id_area + observação e permite serviço nulo
DROP FUNCTION IF EXISTS public.os_apontamento_salvar(integer,integer,integer,integer,integer,date,text,text,numeric,numeric);
CREATE OR REPLACE FUNCTION public.os_apontamento_salvar(
  p_id integer DEFAULT NULL, p_id_os integer DEFAULT NULL, p_id_servico_os integer DEFAULT NULL,
  p_id_os_peca integer DEFAULT NULL, p_id_colaborador integer DEFAULT NULL,
  p_data_apontamento date DEFAULT NULL, p_hora_inicio text DEFAULT NULL, p_hora_termino text DEFAULT NULL,
  p_horas_trabalhadas numeric DEFAULT 0, p_fator numeric DEFAULT 1,
  p_id_area integer DEFAULT NULL, p_observacao text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE v_result "Teste ERP".os_apontamentos;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE "Teste ERP".os_apontamentos SET
      hora_inicio   = COALESCE(p_hora_inicio::time, hora_inicio),
      hora_termino  = p_hora_termino::time,
      horas_trabalhadas = p_horas_trabalhadas,
      fator = COALESCE(p_fator, 1),
      id_area = COALESCE(p_id_area, id_area),
      observacao = COALESCE(p_observacao, observacao),
      id_servico_os = COALESCE(p_id_servico_os, id_servico_os)
    WHERE id = p_id RETURNING * INTO v_result;
  ELSE
    INSERT INTO "Teste ERP".os_apontamentos (
      id_os, id_servico_os, id_os_peca, id_colaborador, id_area,
      data_apontamento, hora_inicio, hora_termino, horas_trabalhadas, fator, observacao
    ) VALUES (
      p_id_os, p_id_servico_os, p_id_os_peca, p_id_colaborador, p_id_area,
      p_data_apontamento, p_hora_inicio::time, p_hora_termino::time, p_horas_trabalhadas, COALESCE(p_fator,1), p_observacao
    ) RETURNING * INTO v_result;
  END IF;
  RETURN row_to_json(v_result);
END $function$;
GRANT EXECUTE ON FUNCTION public.os_apontamento_salvar(integer,integer,integer,integer,integer,date,text,text,numeric,numeric,integer,text) TO anon, authenticated, service_role;

-- 3) dados da tela de apontamento do colaborador (OS abertas + áreas + colaboradores)
CREATE OR REPLACE FUNCTION "Teste ERP".os_apontamento_dados(p_id_empresa integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $function$
  SELECT jsonb_build_object(
    'ordens', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', os.id, 'numero', os.numero, 'cliente', c.nome,
        'defeito', os.defeito_relatado, 'status', os.status) ORDER BY os.id DESC)
      FROM "Teste ERP".ordens_servico os
      JOIN "Teste ERP".clientes c ON c.id = os.id_cliente
      WHERE COALESCE(os.cancelada,false)=false AND os.status NOT IN ('FATURADA','CANCELADA')
        AND (p_id_empresa IS NULL OR os.id_empresa = p_id_empresa)), '[]'::jsonb),
    'areas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'descricao', descricao, 'codigo', codigo) ORDER BY descricao)
      FROM "Teste ERP".grupos_servico WHERE ativo = true), '[]'::jsonb),
    'colaboradores', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome) ORDER BY nome)
      FROM "Teste ERP".usuarios WHERE ativo = true), '[]'::jsonb)
  );
$function$;
CREATE OR REPLACE FUNCTION public.os_apontamento_dados(p_id_empresa integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'Teste ERP','public','pg_temp'
AS $function$ SELECT "Teste ERP".os_apontamento_dados(p_id_empresa) $function$;
GRANT EXECUTE ON FUNCTION public.os_apontamento_dados(integer) TO anon, authenticated, service_role;

-- 4) FECHAMENTO: cria uma linha de serviço a partir de um conjunto de apontamentos soltos
CREATE OR REPLACE FUNCTION "Teste ERP".os_servico_criar_de_apontamentos(
  p_id_os integer, p_descricao text, p_valor_total numeric,
  p_apontamentos integer[], p_id_area integer DEFAULT NULL,
  p_id_servico integer DEFAULT NULL, p_id_usuario integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_id integer; v_horas numeric; v_tec integer; v_n integer;
BEGIN
  IF p_apontamentos IS NULL OR array_length(p_apontamentos,1) IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Selecione ao menos um apontamento.');
  END IF;
  -- só apontamentos soltos desta OS entram
  SELECT COUNT(*) INTO v_n FROM "Teste ERP".os_apontamentos
   WHERE id = ANY(p_apontamentos) AND id_os = p_id_os AND id_servico_os IS NULL;
  IF v_n = 0 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Nenhum apontamento válido (já vinculado ou de outra OS).');
  END IF;

  -- horas faturáveis e profissional principal (mais horas)
  SELECT COALESCE(SUM(horas_trabalhadas) FILTER (WHERE faturavel), 0)
    INTO v_horas FROM "Teste ERP".os_apontamentos
   WHERE id = ANY(p_apontamentos) AND id_os = p_id_os AND id_servico_os IS NULL;
  SELECT id_colaborador INTO v_tec FROM "Teste ERP".os_apontamentos
   WHERE id = ANY(p_apontamentos) AND id_os = p_id_os AND id_servico_os IS NULL
   GROUP BY id_colaborador ORDER BY SUM(horas_trabalhadas) DESC NULLS LAST LIMIT 1;

  INSERT INTO "Teste ERP".os_servicos (
    id_os, id_servico, descricao, quantidade, valor_unitario, valor_total,
    id_area, id_tecnico, tempo_realizado, status, id_usuario_distribuiu
  ) VALUES (
    p_id_os, p_id_servico, p_descricao, 1,
    COALESCE(p_valor_total,0), COALESCE(p_valor_total,0),
    p_id_area, v_tec, v_horas, 'CONCLUIDO', p_id_usuario
  ) RETURNING id INTO v_id;

  -- vincula os apontamentos ao serviço recém-criado
  UPDATE "Teste ERP".os_apontamentos SET id_servico_os = v_id
   WHERE id = ANY(p_apontamentos) AND id_os = p_id_os AND id_servico_os IS NULL;

  -- recalcula os totais da OS (mesma regra do os_avaliar_servicos)
  UPDATE "Teste ERP".ordens_servico SET
    valor_servicos = COALESCE((SELECT SUM(valor_total) FROM "Teste ERP".os_servicos WHERE id_os = p_id_os), 0),
    valor_total = COALESCE((SELECT SUM(valor_total) FROM "Teste ERP".os_servicos WHERE id_os = p_id_os), 0)
      + COALESCE(valor_pecas,0) - COALESCE(valor_desconto,0),
    atualizado_em = now()
  WHERE id = p_id_os;

  RETURN jsonb_build_object('ok', true, 'id_servico', v_id, 'horas_faturaveis', v_horas, 'apontamentos', v_n);
END $function$;
CREATE OR REPLACE FUNCTION public.os_servico_criar_de_apontamentos(
  p_id_os integer, p_descricao text, p_valor_total numeric,
  p_apontamentos integer[], p_id_area integer DEFAULT NULL,
  p_id_servico integer DEFAULT NULL, p_id_usuario integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'Teste ERP','public','pg_temp'
AS $function$ SELECT "Teste ERP".os_servico_criar_de_apontamentos(p_id_os,p_descricao,p_valor_total,p_apontamentos,p_id_area,p_id_servico,p_id_usuario) $function$;
GRANT EXECUTE ON FUNCTION public.os_servico_criar_de_apontamentos(integer,text,numeric,integer[],integer,integer,integer) TO anon, authenticated, service_role;

-- 5) precificação passa a trazer também os apontamentos SOLTOS agrupados por área ('blocos'),
--    e a OS aparece se tiver serviço OU apontamento solto
CREATE OR REPLACE FUNCTION "Teste ERP".os_precificacao_dados(p_id_empresa integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $function$
  SELECT jsonb_build_object(
    'ordens', COALESCE((
      SELECT jsonb_agg(o ORDER BY (o->>'data_entrada')) FROM (
        SELECT jsonb_build_object(
          'id_os', os.id, 'numero', os.numero, 'cliente', c.nome,
          'status', os.status, 'data_entrada', os.data_entrada, 'defeito', os.defeito_relatado,
          'valor_servicos', os.valor_servicos, 'valor_pecas', os.valor_pecas,
          'valor_total', os.valor_total,
          'blocos', COALESCE((
            SELECT jsonb_agg(b ORDER BY (b->>'area')) FROM (
              SELECT jsonb_build_object(
                'id_area', a.id_area, 'area', COALESCE(gs.descricao, 'Sem área'),
                'horas_total', SUM(a.horas_trabalhadas),
                'horas_faturaveis', COALESCE(SUM(a.horas_trabalhadas) FILTER (WHERE a.faturavel), 0),
                'apontamentos', jsonb_agg(jsonb_build_object(
                  'id', a.id, 'colaborador', u.nome, 'data', a.data_apontamento,
                  'hora_inicio', a.hora_inicio, 'hora_termino', a.hora_termino,
                  'horas', a.horas_trabalhadas, 'faturavel', a.faturavel, 'observacao', a.observacao) ORDER BY a.id)
              ) AS b
              FROM "Teste ERP".os_apontamentos a
              LEFT JOIN "Teste ERP".usuarios u ON u.id = a.id_colaborador
              LEFT JOIN "Teste ERP".grupos_servico gs ON gs.id = a.id_area
              WHERE a.id_os = os.id AND a.id_servico_os IS NULL
              GROUP BY a.id_area, gs.descricao
            ) xb), '[]'::jsonb),
          'servicos', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', s.id, 'descricao', s.descricao, 'status', s.status,
              'quantidade', s.quantidade, 'valor_unitario', s.valor_unitario,
              'valor_total', s.valor_total, 'tempo_previsto', s.tempo_previsto,
              'tempo_realizado', s.tempo_realizado,
              'id_tecnico', s.id_tecnico, 'tecnico', ut.nome,
              'area', gs.descricao,
              'horas_total', (SELECT COALESCE(SUM(a.horas_trabalhadas),0)
                              FROM "Teste ERP".os_apontamentos a WHERE a.id_servico_os = s.id),
              'horas_faturaveis', (SELECT COALESCE(SUM(a.horas_trabalhadas),0)
                              FROM "Teste ERP".os_apontamentos a WHERE a.id_servico_os = s.id AND a.faturavel),
              'apontamentos', COALESCE((
                SELECT jsonb_agg(jsonb_build_object(
                  'id', a.id, 'colaborador', u.nome, 'data', a.data_apontamento,
                  'hora_inicio', a.hora_inicio, 'hora_termino', a.hora_termino,
                  'horas', a.horas_trabalhadas, 'faturavel', a.faturavel,
                  'observacao', a.observacao) ORDER BY a.data_apontamento, a.id)
                FROM "Teste ERP".os_apontamentos a
                LEFT JOIN "Teste ERP".usuarios u ON u.id = a.id_colaborador
                WHERE a.id_servico_os = s.id), '[]'::jsonb)
            ) ORDER BY s.id)
            FROM "Teste ERP".os_servicos s
            LEFT JOIN "Teste ERP".usuarios ut ON ut.id = s.id_tecnico
            LEFT JOIN "Teste ERP".grupos_servico gs ON gs.id = s.id_area
            WHERE s.id_os = os.id), '[]'::jsonb)
        ) AS o
        FROM "Teste ERP".ordens_servico os
        JOIN "Teste ERP".clientes c ON c.id = os.id_cliente
        WHERE COALESCE(os.cancelada, false) = false
          AND os.status NOT IN ('FATURADA', 'CANCELADA')
          AND (p_id_empresa IS NULL OR os.id_empresa = p_id_empresa)
          AND ( EXISTS (SELECT 1 FROM "Teste ERP".os_servicos s WHERE s.id_os = os.id)
             OR EXISTS (SELECT 1 FROM "Teste ERP".os_apontamentos a WHERE a.id_os = os.id AND a.id_servico_os IS NULL) )
      ) q
    ), '[]'::jsonb),
    'colaboradores', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome) ORDER BY nome)
      FROM "Teste ERP".usuarios WHERE ativo = true), '[]'::jsonb)
  );
$function$;
GRANT EXECUTE ON FUNCTION public.os_precificacao_dados(integer) TO anon, authenticated, service_role;
