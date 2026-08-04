-- 47: Serviços/Pátio — precificação por horas apontadas
-- Suporte às telas do novo grupo "Pátio / Serviços":
--   1) flag `faturavel` por apontamento (o precificador aprova quais horas entram na conta);
--   2) os_precificacao_dados: por OS/serviço, soma as horas apontadas (total e faturável),
--      tempo previsto e lista os apontamentos, pro precificador ver e digitar o valor;
--   3) os_apontamento_faturavel: liga/desliga o flag de um apontamento;
--   4) os_solicitacoes_listar: lista as solicitações de produto de OS (aba Solicitações).
-- Distribuição, apontamento (salvar) e solicitar produto já têm backend (reaproveitados).

-- 1) Flag de horas faturáveis (default true: conta até o precificador excluir)
ALTER TABLE "Teste ERP".os_apontamentos
  ADD COLUMN IF NOT EXISTS faturavel boolean NOT NULL DEFAULT true;

-- 2) Dados da precificação (uma linha por OS com serviços a precificar)
CREATE OR REPLACE FUNCTION "Teste ERP".os_precificacao_dados(p_id_empresa integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $function$
  SELECT jsonb_build_object(
    'ordens', COALESCE((
      SELECT jsonb_agg(o ORDER BY (o->>'data_entrada')) FROM (
        SELECT jsonb_build_object(
          'id_os', os.id, 'numero', os.numero, 'cliente', c.nome,
          'status', os.status, 'data_entrada', os.data_entrada,
          'valor_servicos', os.valor_servicos, 'valor_pecas', os.valor_pecas,
          'valor_total', os.valor_total,
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
          AND EXISTS (SELECT 1 FROM "Teste ERP".os_servicos s WHERE s.id_os = os.id)
      ) q
    ), '[]'::jsonb),
    'colaboradores', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome) ORDER BY nome)
      FROM "Teste ERP".usuarios WHERE ativo = true), '[]'::jsonb)
  );
$function$;

CREATE OR REPLACE FUNCTION public.os_precificacao_dados(p_id_empresa integer DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'Teste ERP','public','pg_temp'
AS $function$ SELECT "Teste ERP".os_precificacao_dados(p_id_empresa) $function$;
GRANT EXECUTE ON FUNCTION public.os_precificacao_dados(integer) TO anon, authenticated, service_role;

-- 3) Aprovar/desaprovar um apontamento (horas contam ou não)
CREATE OR REPLACE FUNCTION "Teste ERP".os_apontamento_faturavel(p_id integer, p_faturavel boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
BEGIN
  UPDATE "Teste ERP".os_apontamentos SET faturavel = p_faturavel WHERE id = p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'erro', 'Apontamento não encontrado.'); END IF;
  RETURN jsonb_build_object('ok', true);
END; $function$;

CREATE OR REPLACE FUNCTION public.os_apontamento_faturavel(p_id integer, p_faturavel boolean)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'Teste ERP','public','pg_temp'
AS $function$ SELECT "Teste ERP".os_apontamento_faturavel(p_id, p_faturavel) $function$;
GRANT EXECUTE ON FUNCTION public.os_apontamento_faturavel(integer, boolean) TO anon, authenticated, service_role;

-- 4) Lista de solicitações de produto originadas de OS (aba Solicitações)
CREATE OR REPLACE FUNCTION "Teste ERP".os_solicitacoes_listar(p_id_empresa integer DEFAULT NULL, p_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO '' AS $function$
  SELECT COALESCE(jsonb_agg(x ORDER BY (x->>'data_solicitacao') DESC), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', sp.id, 'id_os', sp.id_origem, 'numero_os', os.numero,
      'cliente', c.nome, 'produto', p.nome, 'referencia', p.referencia,
      'qtd_solicitada', sp.qtd_solicitada, 'qtd_atendida', sp.qtd_atendida,
      'status', sp.status, 'prioridade', sp.prioridade,
      'solicitante', u.nome, 'data_solicitacao', sp.data_solicitacao,
      'observacao', sp.observacao
    ) AS x
    FROM "Teste ERP".solicitacoes_produto sp
    LEFT JOIN "Teste ERP".produtos p ON p.id = sp.id_produto
    LEFT JOIN "Teste ERP".ordens_servico os ON os.id = sp.id_origem AND sp.origem = 'OS'
    LEFT JOIN "Teste ERP".clientes c ON c.id = os.id_cliente
    LEFT JOIN "Teste ERP".usuarios u ON u.id = sp.id_usuario_solicitante
    WHERE sp.origem = 'OS'
      AND (p_id_empresa IS NULL OR sp.id_empresa = p_id_empresa)
      AND (p_status IS NULL OR sp.status = p_status)
  ) q;
$function$;

CREATE OR REPLACE FUNCTION public.os_solicitacoes_listar(p_id_empresa integer DEFAULT NULL, p_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'Teste ERP','public','pg_temp'
AS $function$ SELECT "Teste ERP".os_solicitacoes_listar(p_id_empresa, p_status) $function$;
GRANT EXECUTE ON FUNCTION public.os_solicitacoes_listar(integer, text) TO anon, authenticated, service_role;
