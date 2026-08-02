-- 32: listagem de grupos de acesso com contadores (usuários e módulos liberados)
-- Alimenta a tela Sistema → Grupos (gestão de grupos + atalho p/ a matriz de permissões).
CREATE OR REPLACE FUNCTION public.erp_grupos_admin()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'Teste ERP','public'
AS $function$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', g.id, 'nome', g.nome, 'descricao', g.descricao, 'ativo', g.ativo,
      'qtd_usuarios', (SELECT count(*) FROM "Teste ERP".usuarios_grupos ug WHERE ug.id_grupo=g.id),
      'qtd_modulos', (SELECT count(*) FROM "Teste ERP".grupos_permissoes gp WHERE gp.id_grupo=g.id
           AND (gp.pode_visualizar OR gp.pode_incluir OR gp.pode_editar OR gp.pode_excluir
                OR gp.pode_aprovar OR gp.pode_exportar))
    ) ORDER BY lower(g.nome)), '[]'::jsonb)
  FROM "Teste ERP".grupos_acesso g;
$function$;
