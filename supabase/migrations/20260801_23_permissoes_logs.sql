-- ERP Bononi — Permissões (liberações de usuários) + Logs de auditoria
-- Modelo: usuarios_grupos (N:N) -> grupos_permissoes (grupo x modulo x ação) sobre modulos_sistema.
-- Regra de segurança pragmática (ambiente novo): ADMIN ou usuário SEM grupo => acesso total;
-- ao vincular o usuário a qualquer grupo, passam a valer as permissões dos grupos (OR entre eles).

-- Remover versões anteriores (assinaturas divergentes de uma etapa antiga)
DROP FUNCTION IF EXISTS public.erp_log(integer,text,text,text,integer,jsonb,jsonb,text,text,jsonb);
DROP FUNCTION IF EXISTS public.erp_usuario_salvar(jsonb);
DROP FUNCTION IF EXISTS "Teste ERP".erp_usuario_salvar(jsonb);

-- ---------- RESOLVERS ----------
CREATE OR REPLACE FUNCTION "Teste ERP".fn_is_admin(p_id_usuario int)
RETURNS boolean LANGUAGE sql STABLE SET search_path='Teste ERP',public AS $$
  SELECT COALESCE(
    (SELECT perfil ILIKE 'admin%' FROM usuarios WHERE id=p_id_usuario), false)
  OR EXISTS (SELECT 1 FROM usuarios_grupos ug JOIN grupos_acesso g ON g.id=ug.id_grupo
             WHERE ug.id_usuario=p_id_usuario AND g.nome ILIKE 'admin%');
$$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_is_admin(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION "Teste ERP".fn_pode(p_id_usuario int, p_codigo text, p_acao text DEFAULT 'ver')
RETURNS boolean LANGUAGE plpgsql STABLE SET search_path='Teste ERP',public AS $$
DECLARE v_col text; v_ok boolean;
BEGIN
  IF "Teste ERP".fn_is_admin(p_id_usuario) THEN RETURN true; END IF;
  -- usuário sem nenhum grupo: acesso total (até ser configurado)
  IF NOT EXISTS (SELECT 1 FROM usuarios_grupos WHERE id_usuario=p_id_usuario) THEN RETURN true; END IF;
  v_col := CASE lower(p_acao)
    WHEN 'ver' THEN 'pode_visualizar' WHEN 'incluir' THEN 'pode_incluir'
    WHEN 'editar' THEN 'pode_editar' WHEN 'excluir' THEN 'pode_excluir'
    WHEN 'aprovar' THEN 'pode_aprovar' WHEN 'exportar' THEN 'pode_exportar'
    WHEN 'ajustar_estoque' THEN 'pode_ajustar_estoque' WHEN 'dar_desconto' THEN 'pode_dar_desconto'
    ELSE 'pode_visualizar' END;
  EXECUTE format($q$
    SELECT EXISTS (SELECT 1 FROM grupos_permissoes gp
      JOIN usuarios_grupos ug ON ug.id_grupo=gp.id_grupo
      JOIN modulos_sistema m ON m.id=gp.id_modulo
      WHERE ug.id_usuario=%s AND m.codigo=%L AND COALESCE(gp.%I,false)=true)$q$,
    p_id_usuario, p_codigo, v_col) INTO v_ok;
  RETURN v_ok;
END $$;
GRANT EXECUTE ON FUNCTION "Teste ERP".fn_pode(int,text,text) TO anon,authenticated,service_role;

-- Mapa de permissões do usuário (para o front montar menu/botões)
CREATE OR REPLACE FUNCTION public.erp_permissoes_usuario(p_id_usuario int)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_admin boolean; v_semgrupo boolean; v_mods jsonb; v_emp jsonb;
BEGIN
  v_admin := "Teste ERP".fn_is_admin(p_id_usuario);
  v_semgrupo := NOT EXISTS (SELECT 1 FROM usuarios_grupos WHERE id_usuario=p_id_usuario);
  IF v_admin OR v_semgrupo THEN
    SELECT jsonb_object_agg(codigo, jsonb_build_object('ver',true,'incluir',true,'editar',true,
       'excluir',true,'aprovar',true,'exportar',true)) INTO v_mods FROM modulos_sistema WHERE COALESCE(ativo,true);
  ELSE
    SELECT jsonb_object_agg(codigo, obj) INTO v_mods FROM (
      SELECT m.codigo, jsonb_build_object(
         'ver',bool_or(COALESCE(gp.pode_visualizar,false)),'incluir',bool_or(COALESCE(gp.pode_incluir,false)),
         'editar',bool_or(COALESCE(gp.pode_editar,false)),'excluir',bool_or(COALESCE(gp.pode_excluir,false)),
         'aprovar',bool_or(COALESCE(gp.pode_aprovar,false)),'exportar',bool_or(COALESCE(gp.pode_exportar,false))) AS obj
        FROM grupos_permissoes gp
        JOIN usuarios_grupos ug ON ug.id_grupo=gp.id_grupo
        JOIN modulos_sistema m ON m.id=gp.id_modulo
        WHERE ug.id_usuario=p_id_usuario GROUP BY m.codigo) s;
  END IF;
  -- empresas: as vinculadas, ou todas se nenhuma vinculada
  IF EXISTS (SELECT 1 FROM usuarios_empresas WHERE id_usuario=p_id_usuario) THEN
    SELECT jsonb_agg(id_empresa) INTO v_emp FROM usuarios_empresas WHERE id_usuario=p_id_usuario;
  ELSE
    SELECT jsonb_agg(id) INTO v_emp FROM empresas;
  END IF;
  RETURN jsonb_build_object('is_admin',v_admin,'sem_grupo',v_semgrupo,
     'modulos',COALESCE(v_mods,'{}'::jsonb),'empresas',COALESCE(v_emp,'[]'::jsonb));
END $$;
GRANT EXECUTE ON FUNCTION public.erp_permissoes_usuario(int) TO anon,authenticated,service_role;

-- ---------- LOG ----------
CREATE OR REPLACE FUNCTION public.erp_log(p_id_usuario int, p_tipo text, p_modulo text, p_acao text,
  p_tabela text DEFAULT NULL, p_registro int DEFAULT NULL, p_mensagem text DEFAULT NULL, p_detalhes jsonb DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  INSERT INTO "Teste ERP".log_acessos (id_usuario,tipo,modulo,acao,tabela_afetada,registro_id,mensagem,detalhes,criado_em)
  VALUES (p_id_usuario,COALESCE(p_tipo,'INFO'),p_modulo,p_acao,p_tabela,p_registro,p_mensagem,p_detalhes,now());
$$;
GRANT EXECUTE ON FUNCTION public.erp_log(int,text,text,text,text,int,text,jsonb) TO anon,authenticated,service_role;

CREATE OR REPLACE VIEW "Teste ERP".vw_logs AS
  SELECT l.id, l.criado_em, l.id_usuario, u.nome AS usuario, l.tipo, l.modulo, l.acao,
         l.tabela_afetada, l.registro_id, l.mensagem, l.ip
    FROM "Teste ERP".log_acessos l LEFT JOIN "Teste ERP".usuarios u ON u.id=l.id_usuario;
GRANT SELECT ON "Teste ERP".vw_logs TO anon,authenticated,service_role;

INSERT INTO public.erp_admin_tabelas (tabela,label,grupo,ordem,pk_col,busca_cols,somente_leitura) VALUES
 ('grupos_acesso','Grupos de Acesso','Sistema',20,'id','{nome}',false),
 ('vw_logs','Logs de Auditoria','Sistema',90,'id','{usuario,modulo,acao,mensagem}',true)
ON CONFLICT (tabela) DO NOTHING;

-- ---------- LOGIN com permissões + registro de acesso ----------
CREATE OR REPLACE FUNCTION public.erp_login(p_login text, p_senha text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public','extensions','Teste ERP' AS $$
DECLARE v_u RECORD; v_ok boolean := false; v_perm jsonb;
BEGIN
  SELECT id,nome,login,senha_hash,email,perfil,ativo INTO v_u
    FROM "Teste ERP".usuarios WHERE lower(login)=lower(trim(p_login)) LIMIT 1;
  IF v_u.id IS NULL THEN RETURN jsonb_build_object('ok',false,'erro','Usuário não encontrado'); END IF;
  IF NOT COALESCE(v_u.ativo,false) THEN RETURN jsonb_build_object('ok',false,'erro','Usuário inativo'); END IF;
  IF v_u.senha_hash LIKE '$2%' THEN v_ok := (v_u.senha_hash = crypt(p_senha, v_u.senha_hash));
  ELSE v_ok := (v_u.senha_hash = p_senha); END IF;
  IF NOT v_ok THEN
    PERFORM public.erp_log(v_u.id,'ALERTA','USUARIOS','LOGIN_FALHA',NULL,NULL,'Senha inválida',NULL);
    RETURN jsonb_build_object('ok',false,'erro','Senha inválida');
  END IF;
  UPDATE "Teste ERP".usuarios SET ultimo_acesso = now() WHERE id = v_u.id;
  v_perm := public.erp_permissoes_usuario(v_u.id);
  PERFORM public.erp_log(v_u.id,'INFO','USUARIOS','LOGIN',NULL,NULL,'Login realizado',NULL);
  RETURN jsonb_build_object('ok',true,'usuario',
    jsonb_build_object('id',v_u.id,'nome',v_u.nome,'login',v_u.login,'email',v_u.email,'perfil',v_u.perfil),
    'permissoes',v_perm);
END $$;
GRANT EXECUTE ON FUNCTION public.erp_login(text,text) TO anon,authenticated,service_role;

-- ---------- ADMIN: matriz de permissões por grupo ----------
CREATE OR REPLACE FUNCTION public.erp_perm_matrix(p_id_grupo int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
     'id_modulo',m.id,'codigo',m.codigo,'nome',m.nome,
     'ver',COALESCE(gp.pode_visualizar,false),'incluir',COALESCE(gp.pode_incluir,false),
     'editar',COALESCE(gp.pode_editar,false),'excluir',COALESCE(gp.pode_excluir,false),
     'aprovar',COALESCE(gp.pode_aprovar,false),'exportar',COALESCE(gp.pode_exportar,false)) ORDER BY m.ordem,m.id),'[]'::jsonb)
  FROM "Teste ERP".modulos_sistema m
  LEFT JOIN "Teste ERP".grupos_permissoes gp ON gp.id_modulo=m.id AND gp.id_grupo=p_id_grupo
  WHERE COALESCE(m.ativo,true);
$$;
GRANT EXECUTE ON FUNCTION public.erp_perm_matrix(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_perm_set(p_id_grupo int, p_id_modulo int, p_acao text, p_valor boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
DECLARE v_col text;
BEGIN
  v_col := CASE lower(p_acao)
    WHEN 'ver' THEN 'pode_visualizar' WHEN 'incluir' THEN 'pode_incluir' WHEN 'editar' THEN 'pode_editar'
    WHEN 'excluir' THEN 'pode_excluir' WHEN 'aprovar' THEN 'pode_aprovar' WHEN 'exportar' THEN 'pode_exportar'
    WHEN 'ajustar_estoque' THEN 'pode_ajustar_estoque' WHEN 'dar_desconto' THEN 'pode_dar_desconto'
    ELSE NULL END;
  IF v_col IS NULL THEN RAISE EXCEPTION 'Ação inválida: %', p_acao; END IF;
  IF NOT EXISTS (SELECT 1 FROM grupos_permissoes WHERE id_grupo=p_id_grupo AND id_modulo=p_id_modulo) THEN
    INSERT INTO grupos_permissoes (id_grupo,id_modulo) VALUES (p_id_grupo,p_id_modulo);
  END IF;
  EXECUTE format('UPDATE grupos_permissoes SET %I=$1 WHERE id_grupo=$2 AND id_modulo=$3', v_col)
    USING p_valor, p_id_grupo, p_id_modulo;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_perm_set(int,int,text,boolean) TO anon,authenticated,service_role;

-- ---------- ADMIN: usuários, grupos e empresas do usuário ----------
CREATE OR REPLACE FUNCTION public.erp_usuarios_admin()
RETURNS TABLE(id int, nome text, login text, email text, perfil text, ativo boolean, ultimo_acesso timestamp)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT id, nome::text, login::text, email::text, perfil::text, ativo, ultimo_acesso
    FROM "Teste ERP".usuarios ORDER BY nome;
$$;
GRANT EXECUTE ON FUNCTION public.erp_usuarios_admin() TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_usuario_detalhe(p_id int)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='Teste ERP',public AS $$
  SELECT jsonb_build_object(
    'usuario', (SELECT jsonb_build_object('id',id,'nome',nome,'login',login,'email',email,'perfil',perfil,'ativo',ativo)
                FROM "Teste ERP".usuarios WHERE id=p_id),
    'grupos', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',g.id,'nome',g.nome,
                 'atribuido',EXISTS(SELECT 1 FROM "Teste ERP".usuarios_grupos ug WHERE ug.id_usuario=p_id AND ug.id_grupo=g.id))
                 ORDER BY g.nome) FROM "Teste ERP".grupos_acesso g WHERE COALESCE(g.ativo,true)),'[]'::jsonb),
    'empresas', COALESCE((SELECT jsonb_agg(jsonb_build_object('id',e.id,'nome',COALESCE(e.nome_fantasia,e.nome),
                 'atribuido',EXISTS(SELECT 1 FROM "Teste ERP".usuarios_empresas ue WHERE ue.id_usuario=p_id AND ue.id_empresa=e.id))
                 ORDER BY e.id) FROM "Teste ERP".empresas e),'[]'::jsonb));
$$;
GRANT EXECUTE ON FUNCTION public.erp_usuario_detalhe(int) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_usuario_grupo_set(p_id_usuario int, p_id_grupo int, p_incluir boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF p_incluir THEN
    INSERT INTO usuarios_grupos (id_usuario,id_grupo) SELECT p_id_usuario,p_id_grupo
     WHERE NOT EXISTS (SELECT 1 FROM usuarios_grupos WHERE id_usuario=p_id_usuario AND id_grupo=p_id_grupo);
  ELSE
    DELETE FROM usuarios_grupos WHERE id_usuario=p_id_usuario AND id_grupo=p_id_grupo;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_usuario_grupo_set(int,int,boolean) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_usuario_empresa_set(p_id_usuario int, p_id_empresa int, p_incluir boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP',public AS $$
BEGIN
  IF p_incluir THEN
    INSERT INTO usuarios_empresas (id_usuario,id_empresa) SELECT p_id_usuario,p_id_empresa
     WHERE NOT EXISTS (SELECT 1 FROM usuarios_empresas WHERE id_usuario=p_id_usuario AND id_empresa=p_id_empresa);
  ELSE
    DELETE FROM usuarios_empresas WHERE id_usuario=p_id_usuario AND id_empresa=p_id_empresa;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_usuario_empresa_set(int,int,boolean) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.erp_usuario_salvar(p jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path='Teste ERP','extensions',public AS $$
DECLARE v_id int := NULLIF(p->>'id','')::int; v_senha text := NULLIF(p->>'senha','');
BEGIN
  IF v_id IS NULL THEN
    INSERT INTO usuarios (nome,login,email,perfil,ativo,senha_hash,criado_em)
    VALUES (p->>'nome',p->>'login',p->>'email',COALESCE(p->>'perfil','OPERADOR'),
            COALESCE((p->>'ativo')::boolean,true),
            crypt(COALESCE(v_senha,'bononi123'), gen_salt('bf')), now())
    RETURNING id INTO v_id;
  ELSE
    UPDATE usuarios SET nome=COALESCE(p->>'nome',nome), login=COALESCE(p->>'login',login),
      email=COALESCE(p->>'email',email), perfil=COALESCE(p->>'perfil',perfil),
      ativo=COALESCE((p->>'ativo')::boolean,ativo),
      senha_hash=CASE WHEN v_senha IS NOT NULL THEN crypt(v_senha, gen_salt('bf')) ELSE senha_hash END,
      atualizado_em=now()
    WHERE id=v_id;
  END IF;
  RETURN v_id;
END $$;
GRANT EXECUTE ON FUNCTION public.erp_usuario_salvar(jsonb) TO anon,authenticated,service_role;
