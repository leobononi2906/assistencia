/* ERP Bononi — Sistema: Usuários, Permissões por grupo, Logs de auditoria */

/* ================= USUÁRIOS ================= */
async function loadUsuarios(){
  try{
    const {data,error}=await sb.rpc('erp_usuarios_admin');
    if(error) throw error;
    const rows=data||[];
    let html='<div class="toolbar"><b style="font-size:13px">Usuários</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="usrForm(null)">+ Novo usuário</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Perfil</th>'+
      '<th>Ativo</th><th>Último acesso</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="7"><div class="empty">Nenhum usuário.</div></td></tr>';
    rows.forEach(u=>{ html+='<tr><td>'+esc(u.nome||'')+'</td><td class="mono">'+esc(u.login||'')+'</td><td>'+esc(u.email||'')+'</td>'+
      '<td>'+esc(u.perfil||'')+'</td><td>'+(u.ativo?'<span class="b-badge b-badge-ok">Sim</span>':'<span class="b-badge b-badge-muted">Não</span>')+'</td>'+
      '<td>'+(u.ultimo_acesso?fmtDate(u.ultimo_acesso):'—')+'</td>'+
      '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick=\'usrForm('+JSON.stringify(u)+')\'>Editar</button> '+
      '<button class="btn btn-ghost btn-sm" onclick="usrAcessos('+u.id+',\''+esc(String(u.nome||'')).replace(/'/g,"")+'\')">Grupos & Empresas</button></td></tr>'; });
    html+='</tbody></table></div>'+
      '<div style="font-size:11px;color:hsl(var(--text-muted));margin-top:8px">Dica: usuário sem grupo tem acesso total; ao vincular grupos, valem as permissões dos grupos.</div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os usuários.',e.message); }
}
window.loadUsuarios=loadUsuarios;

function usrForm(u){
  u=u||{};
  const b='<div class="form-grid">'+
    '<div class="field full"><label>Nome *</label><input type="text" id="us-nome" value="'+esc(u.nome||'')+'"></div>'+
    '<div class="field"><label>Login *</label><input type="text" id="us-login" value="'+esc(u.login||'')+'"></div>'+
    '<div class="field"><label>E-mail</label><input type="email" id="us-email" value="'+esc(u.email||'')+'"></div>'+
    '<div class="field"><label>Perfil</label><select id="us-perfil">'+
      ['ADMIN','GESTOR','OPERADOR'].map(p=>'<option value="'+p+'"'+(String(u.perfil||'OPERADOR')===p?' selected':'')+'>'+p+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>&nbsp;</label><div class="chk"><input type="checkbox" id="us-ativo" '+(u.ativo!==false?'checked':'')+'><span>Ativo</span></div></div>'+
    '<div class="field full"><label>'+(u.id?'Nova senha (deixe em branco p/ manter)':'Senha (padrão: bononi123)')+'</label><input type="password" id="us-senha" value=""></div>'+
    '</div>';
  openModal((u.id?'Editar ':'Novo ')+'usuário', b,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="usrSalvar('+(u.id||'null')+')">Salvar</button>');
}
window.usrForm=usrForm;
async function usrSalvar(id){
  try{
    const nome=$('#us-nome').value.trim(), login=$('#us-login').value.trim();
    if(!nome||!login){ toast('Nome e login são obrigatórios','err'); return; }
    const payload={ id:id||null, nome, login, email:$('#us-email').value, perfil:$('#us-perfil').value,
      ativo:$('#us-ativo').checked, senha:$('#us-senha').value||null };
    const {data,error}=await sb.rpc('erp_usuario_salvar',{p:payload});
    if(error) throw error;
    bononiLog('INFO', id?'USUARIO_EDIT':'USUARIO_NOVO', null, 'USUARIOS','usuarios',Number(data), (id?'Usuário editado: ':'Usuário criado: ')+nome);
    closeModal(); toast('Usuário salvo','ok'); loadUsuarios();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.usrSalvar=usrSalvar;

async function usrAcessos(id, nome){
  try{
    const {data,error}=await sb.rpc('erp_usuario_detalhe',{p_id:id});
    if(error) throw error;
    const grupos=(data&&data.grupos)||[], empresas=(data&&data.empresas)||[];
    let b='<div style="font-size:12px;color:hsl(var(--text-muted));margin-bottom:8px">Marque os grupos de acesso e as empresas liberadas para <b>'+esc(nome)+'</b>.</div>';
    b+='<b style="font-size:12px">Grupos de acesso</b><div style="margin:6px 0 14px">'+
      (grupos.length?grupos.map(g=>'<label class="chk" style="display:flex;gap:8px;padding:4px 0">'+
        '<input type="checkbox" '+(g.atribuido?'checked':'')+' onchange="usrGrupoSet('+id+','+g.id+',this.checked)"><span>'+esc(g.nome)+'</span></label>').join(''):'<i>Sem grupos cadastrados</i>')+'</div>';
    b+='<b style="font-size:12px">Empresas</b><div style="margin:6px 0">'+
      (empresas.length?empresas.map(e=>'<label class="chk" style="display:flex;gap:8px;padding:4px 0">'+
        '<input type="checkbox" '+(e.atribuido?'checked':'')+' onchange="usrEmpresaSet('+id+','+e.id+',this.checked)"><span>'+esc(e.nome)+'</span></label>').join(''):'<i>Sem empresas</i>')+
      '<div style="font-size:11px;color:hsl(var(--text-muted));margin-top:6px">Sem nenhuma empresa marcada = acesso a todas.</div></div>';
    openModal('Acessos de '+nome, b, '<button class="btn btn-ok" onclick="closeModal()">Concluir</button>');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.usrAcessos=usrAcessos;
async function usrGrupoSet(idu,idg,val){
  try{ const {error}=await sb.rpc('erp_usuario_grupo_set',{p_id_usuario:idu,p_id_grupo:idg,p_incluir:val}); if(error) throw error;
    bononiLog('INFO','PERMISSAO_GRUPO',{grupo:idg,incluir:val},'USUARIOS','usuarios_grupos',idu,'Alterou grupo do usuário');
    toast('Atualizado','ok');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.usrGrupoSet=usrGrupoSet;
async function usrEmpresaSet(idu,ide,val){
  try{ const {error}=await sb.rpc('erp_usuario_empresa_set',{p_id_usuario:idu,p_id_empresa:ide,p_incluir:val}); if(error) throw error; toast('Atualizado','ok');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.usrEmpresaSet=usrEmpresaSet;

/* ================= GRUPOS DE ACESSO ================= */
async function loadGrupos(){
  try{
    const {data,error}=await sb.rpc('erp_grupos_admin'); if(error) throw error;
    const rows=data||[];
    let html='<div class="toolbar"><b style="font-size:13px">Grupos de acesso</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="grpForm(null)">+ Novo grupo</button></div>'+
      '<div style="font-size:11px;color:hsl(var(--text-muted));margin-bottom:8px">Um grupo reúne as permissões por módulo. Depois vincule os usuários ao grupo em <b>Usuários → Grupos & Empresas</b>. Usuário sem grupo tem acesso total (ambiente de teste).</div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Grupo</th><th>Descrição</th><th>Usuários</th>'+
      '<th>Módulos liberados</th><th>Ativo</th><th></th></tr></thead><tbody>';
    if(!rows.length) html+='<tr><td colspan="6"><div class="empty">Nenhum grupo cadastrado.</div></td></tr>';
    rows.forEach(g=>{ html+='<tr><td><b>'+esc(g.nome||'')+'</b></td><td>'+esc(g.descricao||'')+'</td>'+
      '<td class="mono">'+(g.qtd_usuarios||0)+'</td><td class="mono">'+(g.qtd_modulos||0)+'</td>'+
      '<td>'+(g.ativo?'<span class="b-badge b-badge-ok">Sim</span>':'<span class="b-badge b-badge-muted">Não</span>')+'</td>'+
      '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick=\'grpForm('+JSON.stringify(g)+')\'>Editar</button> '+
      '<button class="btn btn-sm" onclick="grpPermissoes('+g.id+')">Permissões</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os grupos.',e.message); }
}
window.loadGrupos=loadGrupos;
function grpForm(g){ g=g||{};
  const b='<div class="form-grid">'+
    '<div class="field full"><label>Nome *</label><input type="text" id="gr-nome" value="'+esc(g.nome||'')+'"></div>'+
    '<div class="field full"><label>Descrição</label><input type="text" id="gr-desc" value="'+esc(g.descricao||'')+'"></div>'+
    '<div class="field"><label>&nbsp;</label><div class="chk"><input type="checkbox" id="gr-ativo" '+(g.ativo!==false?'checked':'')+'><span>Ativo</span></div></div>'+
    '</div>';
  openModal((g.id?'Editar ':'Novo ')+'grupo', b,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="grpSalvar('+(g.id||'null')+')">Salvar</button>');
}
window.grpForm=grpForm;
async function grpSalvar(id){
  try{ const nome=$('#gr-nome').value.trim(); if(!nome){ toast('Informe o nome do grupo','err'); return; }
    const {data,error}=await sb.rpc('erp_grupo_salvar',{p:{id:id||null,nome:nome,descricao:$('#gr-desc').value,ativo:$('#gr-ativo').checked}});
    if(error) throw error;
    bononiLog('INFO', id?'GRUPO_EDIT':'GRUPO_NOVO', null, 'USUARIOS','grupos_acesso',(data&&data.id)||null,(id?'Grupo editado: ':'Grupo criado: ')+nome);
    if(typeof lookupCache!=='undefined') lookupCache['grupos_acesso']=null;
    closeModal(); toast('Grupo salvo','ok'); loadGrupos();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.grpSalvar=grpSalvar;
function grpPermissoes(idg){ window.__permGrupoInit=idg; nav('permissoes'); }
window.grpPermissoes=grpPermissoes;

/* ================= PERMISSÕES POR GRUPO ================= */
let permGrupo=null;
async function loadPermissoes(){
  try{
    const grupos=await lookup('grupos_acesso');
    let html='<div class="toolbar"><label style="font-size:12px;color:hsl(var(--text-muted));margin-right:6px">Grupo:</label>'+
      '<select id="pm-grupo" onchange="permCarregar(this.value)"><option value="">— selecione —</option>'+
      grupos.map(g=>'<option value="'+g.id+'">'+esc(g.nome)+'</option>').join('')+'</select>'+
      '<div class="spacer"></div><span style="font-size:12px;color:hsl(var(--text-muted))">Marque o que cada grupo pode fazer por módulo.</span></div>'+
      '<div id="pm-body"><div class="empty">Selecione um grupo para editar as permissões.</div></div>';
    $('#screen').innerHTML=html;
    const init=window.__permGrupoInit; window.__permGrupoInit=null;
    const sel=init||(grupos[0]&&grupos[0].id);
    if(sel){ $('#pm-grupo').value=sel; permCarregar(sel); }
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as permissões.',e.message); }
}
window.loadPermissoes=loadPermissoes;
async function permCarregar(idg){
  permGrupo=Number(idg); const body=$('#pm-body'); if(!idg){ body.innerHTML='<div class="empty">Selecione um grupo.</div>'; return; }
  body.innerHTML=skeletonTable();
  try{
    const {data,error}=await sb.rpc('erp_perm_matrix',{p_id_grupo:permGrupo});
    if(error) throw error;
    const mods=data||[]; const acoes=[['ver','Ver'],['incluir','Incluir'],['editar','Editar'],['excluir','Excluir'],['aprovar','Aprovar'],['exportar','Exportar']];
    let h='<div class="tbl-wrap"><table class="data"><thead><tr><th>Módulo</th>'+acoes.map(a=>'<th style="text-align:center">'+a[1]+'</th>').join('')+'</tr></thead><tbody>';
    mods.forEach(m=>{ h+='<tr><td>'+esc(m.nome)+' <span style="color:hsl(var(--text-muted));font-size:11px">'+esc(m.codigo)+'</span></td>'+
      acoes.map(a=>'<td style="text-align:center"><input type="checkbox" '+(m[a[0]]?'checked':'')+
        ' onchange="permSet('+m.id_modulo+',\''+a[0]+'\',this.checked)"></td>').join('')+'</tr>'; });
    h+='</tbody></table></div>';
    body.innerHTML=h;
  }catch(e){ body.innerHTML=errBox('Erro ao carregar a matriz.',e.message); }
}
window.permCarregar=permCarregar;
async function permSet(idmod, acao, val){
  try{ const {error}=await sb.rpc('erp_perm_set',{p_id_grupo:permGrupo,p_id_modulo:idmod,p_acao:acao,p_valor:val}); if(error) throw error;
    bononiLog('INFO','PERMISSAO_SET',{grupo:permGrupo,modulo:idmod,acao:acao,valor:val},'USUARIOS','grupos_permissoes',permGrupo,'Alterou permissão de grupo');
    toast('Permissão atualizada','ok');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); permCarregar(permGrupo); }
}
window.permSet=permSet;

/* ================= LOGS / AUDITORIA ================= */
async function loadLogs(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_logs',p_limit:400});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>(b.id||0)-(a.id||0));
    let html='<div class="toolbar"><input type="search" id="lg-busca" placeholder="Filtrar (usuário, módulo, ação, mensagem)..." onkeyup="logFiltrar()">'+
      '<select id="lg-tipo" onchange="logFiltrar()"><option value="">Todos os tipos</option>'+
      ['INFO','ALERTA','ERRO'].map(t=>'<option value="'+t+'">'+t+'</option>').join('')+'</select>'+
      '<div class="spacer"></div><span style="font-size:12px;color:hsl(var(--text-muted))">Últimos 400 eventos</span></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Quando</th><th>Usuário</th><th>Tipo</th><th>Módulo</th>'+
      '<th>Ação</th><th>Tabela</th><th>Mensagem</th></tr></thead><tbody id="lg-body"></tbody></table></div>';
    $('#screen').innerHTML=html;
    window.__logs=rows; logFiltrar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os logs.',e.message); }
}
window.loadLogs=loadLogs;
function logFiltrar(){
  const rows=window.__logs||[]; const q=($('#lg-busca')?$('#lg-busca').value:'').toLowerCase(); const tp=$('#lg-tipo')?$('#lg-tipo').value:'';
  const badge={INFO:'info',ALERTA:'warn',ERRO:'err'};
  let f=rows.filter(r=>(!tp||r.tipo===tp)&&(String(r.usuario||'')+r.modulo+r.acao+(r.mensagem||'')).toLowerCase().includes(q));
  const body=$('#lg-body'); if(!body) return;
  if(f.length===0){ body.innerHTML='<tr><td colspan="7"><div class="empty">Nenhum evento.</div></td></tr>'; return; }
  body.innerHTML=f.slice(0,400).map(r=>{
    const dt=r.criado_em?new Date(r.criado_em).toLocaleString('pt-BR'):'';
    return '<tr><td style="white-space:nowrap">'+esc(dt)+'</td><td>'+esc(r.usuario||('#'+(r.id_usuario||'')))+'</td>'+
      '<td><span class="b-badge b-badge-'+(badge[r.tipo]||'muted')+'">'+esc(r.tipo||'')+'</span></td>'+
      '<td>'+esc(r.modulo||'')+'</td><td>'+esc(r.acao||'')+'</td><td>'+esc(r.tabela_afetada||'')+'</td>'+
      '<td>'+esc(r.mensagem||'')+'</td></tr>';
  }).join('');
}
window.logFiltrar=logFiltrar;
