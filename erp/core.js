/* ERP Bononi — núcleo: client Supabase, auth, helpers, navegação */
const SUPA_URL = 'https://vishxwdxqiygbxmtpfoy.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc2h4d2R4cWl5Z2J4bXRwZm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njg2MjIsImV4cCI6MjA4ODA0NDYyMn0.J647m3ieDHahNQYBWMRESl0aPFXsT_zt_7ZcDvyB-SA';
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);
window.usuarioAtual = null;

/* ---------- helpers ---------- */
function $(sel){ return document.querySelector(sel); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmtFull(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0); }
function fmtNum(v){ return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0); }
function parseLocalDate(s){ if(!s) return null; const p=String(s).slice(0,10).split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
function fmtDate(s){ const d=parseLocalDate(s); return d?d.toLocaleDateString('pt-BR'):''; }
function fmtDateTime(s){ if(!s) return ''; const d=new Date(s); return isNaN(d)?fmtDate(s):d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function toast(msg,tipo){ const t=document.createElement('div'); t.className='toast '+(tipo||''); t.textContent=msg;
  $('#toast').appendChild(t); setTimeout(()=>t.remove(),2600); }
function skeletonTable(){ return '<div class="tbl-wrap card-pad"><div class="skel" style="width:40%;margin-bottom:14px"></div>'+
  Array.from({length:6}).map(()=>'<div class="skel" style="width:100%;height:30px;margin-bottom:8px"></div>').join('')+'</div>'; }
function errBox(msg,det){ return '<div class="err">'+esc(msg)+(det?'<div style="font-size:11px;font-weight:400;margin-top:4px">'+esc(det)+'</div>':'')+'</div>'; }
async function bononiLog(tipo, acao, detalhes, modulo, tabela, registro, mensagem){
  try{ await sb.rpc('erp_log',{p_id_usuario:(window.usuarioAtual&&window.usuarioAtual.id)||null,
    p_tipo:tipo||'INFO', p_modulo:modulo||null, p_acao:acao||null, p_tabela:tabela||null,
    p_registro:registro||null, p_mensagem:mensagem||null, p_detalhes:detalhes||null}); }catch(e){}
}
window.bononiLog=bononiLog;
window.onerror=(m,s,l,c,e)=>bononiLog('ERRO','ERRO_JS',{erro:e&&e.message});
window.onunhandledrejection=(e)=>bononiLog('ERRO','ERRO_PROMISE',{erro:e&&e.reason});

/* ---------- modal empilhável (stack) ----------
   Cada openModal preenche a camada do TOPO (comportamento de sempre).
   Para abrir uma consulta SOBRE outra (ex.: da cobrança abrir a venda),
   empilhe uma camada nova com pushLayer()/abrirDoc() — ao fechar, volta pra onde estava. */
window.__modalStack=[];
function _topLayer(){ const s=window.__modalStack; return s.length?s[s.length-1]:null; }
function pushLayer(opts){
  opts=opts||{};
  const root=$('#modal-root'); if(!root) return null;
  const depth=window.__modalStack.length;
  const layer=document.createElement('div');
  layer.className='modal-layer';
  layer.style.zIndex=String(60+depth*2);
  layer.innerHTML='<div class="modal'+(opts.wide?' modal-wide':'')+'">'+
    '<div class="head">'+
      (depth>0?'<button type="button" class="btn btn-ghost btn-sm modal-back" title="Voltar">‹ Voltar</button>':'<span></span>')+
      '<h3></h3><button type="button" class="btn btn-ghost btn-sm modal-x" title="Fechar">✕</button></div>'+
    '<div class="body"></div><div class="foot"></div></div>';
  root.appendChild(layer);
  window.__modalStack.push(layer);
  document.body.classList.add('modal-open');
  layer.addEventListener('mousedown',function(e){ if(e.target===layer) closeModal(); });
  const bk=layer.querySelector('.modal-back'); if(bk) bk.addEventListener('click',closeModal);
  layer.querySelector('.modal-x').addEventListener('click',closeModal);
  return layer;
}
window.pushLayer=pushLayer;
function openModal(title, bodyHTML, footHTML, opts){
  opts=opts||{};
  let layer=_topLayer();
  if(!layer || opts.push) layer=pushLayer(opts);
  if(opts.wide) layer.querySelector('.modal').classList.add('modal-wide');
  layer.querySelector('.head h3').textContent=title||'';
  layer.querySelector('.body').innerHTML=bodyHTML||'';
  layer.querySelector('.foot').innerHTML=footHTML||'';
  // foco automático no 1º campo editável
  setTimeout(function(){
    const el=layer.querySelector('.body input:not([type=hidden]):not([readonly]):not([disabled]), .body select, .body textarea');
    if(el) try{ el.focus(); }catch(e){}
  },30);
  return layer;
}
window.openModal=openModal;
/* Enter dispara o botão primário do modal (exceto em textarea/combo aberto) */
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter') return;
  const layer=_topLayer(); if(!layer) return;
  const t=e.target;
  if(!layer.contains(t)) return;
  if(t.tagName==='TEXTAREA') return;
  if(t.classList&&t.classList.contains('combo-in')) return;   // combo trata seu próprio Enter
  const btn=layer.querySelector('.foot .btn-ok')||layer.querySelector('.foot .btn:last-child');
  if(btn && !btn.disabled){ e.preventDefault(); btn.click(); }
});
/* trava de duplo-clique: após acionar um botão do rodapé do modal, desabilita por ~1s
   (o handler já disparou; bloqueia apenas o 2º clique acidental). Reabilita p/ permitir retry após erro. */
document.addEventListener('click',function(e){
  const btn=e.target&&e.target.closest?e.target.closest('.modal .foot .btn'):null;
  if(!btn||btn.disabled) return;
  setTimeout(function(){ if(btn.isConnected){ btn.disabled=true; setTimeout(function(){ btn.disabled=false; },1100); } },0);
});
function closeModal(){
  const layer=window.__modalStack.pop();
  if(layer) layer.remove();
  if(!window.__modalStack.length) document.body.classList.remove('modal-open');
}
window.closeModal=closeModal;
function closeAllModals(){ while(window.__modalStack.length){ window.__modalStack.pop().remove(); } document.body.classList.remove('modal-open'); }
window.closeAllModals=closeAllModals;
document.addEventListener('keydown',function(e){ if(e.key==='Escape' && window.__modalStack.length) closeModal(); });
/* corpo e título da camada de topo (usado por editores que renderizam dentro do modal) */
function modalBody(){ const l=_topLayer(); return l?l.querySelector('.body'):null; }
function modalSetTitle(t){ const l=_topLayer(); if(l) l.querySelector('.head h3').textContent=t||''; }
window.modalBody=modalBody; window.modalSetTitle=modalSetTitle;

/* ---------- combobox com busca + bipagem (código/EAN) ----------
   items: [{v, label, busca}]  (busca = texto extra p/ filtrar: referência, EAN, código)
   comboHTML(id, items, value, ph, cb) → HTML; comboVal(id) → valor selecionado (string, '' se nenhum). */
window.__combo={};
function comboHTML(id, items, value, ph, cb){
  items=items||[]; window.__combo[id]={items:items, cb:cb||null, active:0, shown:items};
  const sel=items.find(function(it){return String(it.v)===String(value);});
  return '<div class="combo" id="'+id+'_w">'+
    '<input type="text" class="combo-in" id="'+id+'_in" autocomplete="off" placeholder="'+esc(ph||'Digite para buscar…')+'" '+
      'value="'+esc(sel?sel.label:'')+'" oninput="comboFilter(\''+id+'\')" onfocus="comboFilter(\''+id+'\')" '+
      'onkeydown="comboKey(\''+id+'\',event)" onblur="comboBlur(\''+id+'\')">'+
    '<input type="hidden" id="'+id+'" value="'+esc(value==null?'':value)+'">'+
    '<div class="combo-list" id="'+id+'_list"></div></div>';
}
window.comboHTML=comboHTML;
function comboVal(id){ const el=$('#'+id); return el?el.value:''; }
window.comboVal=comboVal;
function comboSet(id, v){ const st=window.__combo[id]; if(!st) return; const it=st.items.find(function(x){return String(x.v)===String(v);});
  const hid=$('#'+id), inp=$('#'+id+'_in'); if(hid) hid.value=it?it.v:''; if(inp) inp.value=it?it.label:''; }
window.comboSet=comboSet;
function _comboRender(id){
  const st=window.__combo[id]; if(!st) return; const list=$('#'+id+'_list'); const inp=$('#'+id+'_in'); if(!list||!inp) return;
  const q=inp.value.toLowerCase().trim(); const hid=$('#'+id);
  // se o texto não bate com o item selecionado, invalida a seleção
  const cur=st.items.find(function(x){return String(x.v)===String(hid&&hid.value);});
  if(cur && inp.value!==cur.label && hid) hid.value='';
  const f = q ? st.items.filter(function(it){ return (it.label+' '+(it.busca||'')).toLowerCase().indexOf(q)>=0; }) : st.items;
  st.shown=f.slice(0,60); st.active=0;
  list.innerHTML = st.shown.length
    ? st.shown.map(function(it,i){ return '<div class="combo-opt'+(i===0?' active':'')+'" data-v="'+esc(it.v)+'" '+
        'onmousedown="comboPick(\''+id+'\',this.dataset.v)">'+esc(it.label)+(it.busca?' <small>'+esc(it.busca)+'</small>':'')+'</div>'; }).join('')
    : '<div class="combo-opt combo-empty">Nada encontrado</div>';
  list.classList.add('open');
}
function comboFilter(id){ _comboRender(id); }
window.comboFilter=comboFilter;
function _comboHi(id){ const st=window.__combo[id]; const list=$('#'+id+'_list'); if(!st||!list) return;
  Array.prototype.forEach.call(list.querySelectorAll('.combo-opt'),function(o,i){ o.classList.toggle('active',i===st.active); });
  const act=list.querySelector('.combo-opt.active'); if(act&&act.scrollIntoView) act.scrollIntoView({block:'nearest'}); }
function comboPick(id, v){
  const st=window.__combo[id]; if(!st) return; const it=st.items.find(function(x){return String(x.v)===String(v);});
  const hid=$('#'+id), inp=$('#'+id+'_in'), list=$('#'+id+'_list');
  if(hid) hid.value=it?it.v:''; if(inp) inp.value=it?it.label:''; if(list) list.classList.remove('open');
  if(st.cb) try{ st.cb(it?it.v:'', it); }catch(e){}
}
window.comboPick=comboPick;
function comboKey(id, e){
  const st=window.__combo[id]; if(!st) return; const list=$('#'+id+'_list');
  if(e.key==='ArrowDown'){ e.preventDefault(); st.active=Math.min((st.shown.length-1),st.active+1); _comboHi(id); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); st.active=Math.max(0,st.active-1); _comboHi(id); }
  else if(e.key==='Enter'){
    if(list&&list.classList.contains('open')&&st.shown.length){ e.preventDefault(); e.stopPropagation(); comboPick(id, st.shown[st.active].v); }
  }
  else if(e.key==='Escape'){ if(list&&list.classList.contains('open')){ e.stopPropagation(); list.classList.remove('open'); } }
}
window.comboKey=comboKey;
function comboBlur(id){ setTimeout(function(){ const list=$('#'+id+'_list'); if(list) list.classList.remove('open'); },160); }
window.comboBlur=comboBlur;
/* construtores de itens p/ combos de produto e cliente (bipagem por ref/EAN/código/CPF) */
function comboProdItems(rows){ return (rows||[]).map(function(p){
  return {v:p.id, label:(p.nome||('#'+p.id)), busca:[p.referencia,p.codigo_barras].filter(Boolean).join(' ')}; }); }
function comboCliItems(rows){ return (rows||[]).map(function(c){
  return {v:c.id, label:(c.nome||('#'+c.id)), busca:[c.cpf_cnpj,c.codigo].filter(Boolean).join(' ')}; }); }
window.comboProdItems=comboProdItems; window.comboCliItems=comboCliItems;

/* abre um documento numa NOVA camada por cima (consulta empilhada) */
function abrirDoc(tipo, id, extra){
  if(!id) return;
  tipo=String(tipo||'').toUpperCase();
  const map={VENDA:function(){return typeof vdAbrir==='function'&&vdAbrir(id);},
             OS:function(){return typeof osAbrir==='function'&&osAbrir(id);},
             CLIENTE:function(){return typeof clEditor==='function'&&clEditor(id,extra||'dados',{modal:true});},
             PRODUTO:function(){return typeof pdEditor==='function'&&pdEditor(id,{modal:true});}};
  if(!map[tipo]) return;
  pushLayer({wide:true});
  _topLayer().querySelector('.body').innerHTML=skeletonTable();
  try{ map[tipo](); }catch(e){ toast('Erro ao abrir: '+(e.message||e),'err'); closeModal(); }
}
window.abrirDoc=abrirDoc;
function confirmAsync(msg){ return new Promise(res=>{
  pushLayer();
  openModal('Confirmar','<p style="font-size:14px">'+esc(msg)+'</p>',
    '<button class="btn btn-ghost" onclick="closeModal();window.__cfr(false)">Cancelar</button>'+
    '<button class="btn btn-danger" onclick="closeModal();window.__cfr(true)">Confirmar</button>');
  window.__cfr=res;
}); }

/* ---------- auth ---------- */
async function doLogin(ev){
  ev.preventDefault();
  const login=$('#li-login').value.trim(), senha=$('#li-senha').value;
  $('#li-err').classList.add('hidden');
  try{
    const {data,error}=await sb.rpc('erp_login',{p_login:login,p_senha:senha});
    if(error) throw error;
    if(!data||!data.ok){ $('#li-err').textContent=(data&&data.erro)||'Falha no login'; $('#li-err').classList.remove('hidden'); return false; }
    window.usuarioAtual=data.usuario;
    window.perm=data.permissoes||null;
    sessionStorage.setItem('erp_user',JSON.stringify(data.usuario));
    sessionStorage.setItem('erp_perm',JSON.stringify(window.perm));
    entrarApp();
  }catch(e){ $('#li-err').textContent='Erro: '+(e.message||e); $('#li-err').classList.remove('hidden'); }
  return false;
}
window.doLogin=doLogin;
function logout(){ sessionStorage.removeItem('erp_user'); sessionStorage.removeItem('erp_perm'); location.reload(); }
window.logout=logout;

/* ---------- permissões ---------- */
window.perm=null;
function can(codigo, acao){
  const p=window.perm;
  if(!p) return true;                 // sem info => não bloqueia (fallback)
  if(p.is_admin || p.sem_grupo) return true;
  const m=p.modulos&&p.modulos[codigo];
  return !!(m && m[acao||'ver']);
}
window.can=can;

function entrarApp(){
  $('#login-screen').classList.add('hidden');
  $('#app').style.display='block';
  $('#user-name').textContent=window.usuarioAtual.nome+' · '+(window.usuarioAtual.perfil||'');
  buildMenu();
  nav('dashboard');
}

/* ---------- menu / navegação ---------- */
const MENU=[
  {grupo:'Principal',itens:[{id:'dashboard',label:'Dashboard',mod:'DASHBOARD'}]},
  {grupo:'Comercial',itens:[
    {id:'clientes',label:'Clientes',mod:'CLIENTES'},
    {id:'produtos',label:'Produtos',mod:'PRODUTOS'},
    {id:'orcamentos',label:'Orçamentos',mod:'ORCAMENTOS'},
    {id:'vendas',label:'Vendas',mod:'VENDAS'},
    {id:'os',label:'Ordens de Serviço',mod:'OS'},
  ]},
  {grupo:'Financeiro',itens:[
    {id:'cr',label:'Contas a Receber',mod:'FINANCEIRO_CR'},
    {id:'cp',label:'Contas a Pagar',mod:'FINANCEIRO_CP'},
    {id:'caixa',label:'Caixa',mod:'CAIXA'},
    {id:'cobranca',label:'Cobrança',mod:'FINANCEIRO_CR'},
  ]},
  {grupo:'Compras',itens:[
    {id:'pedidos_compra',label:'Pedidos de Compra',mod:'COMPRAS'},
    {id:'recebimentos',label:'Recebimentos (Entradas)',mod:'COMPRAS'},
  ]},
  {grupo:'Estoque',itens:[
    {id:'solicitacoes',label:'Solicitações',mod:'ESTOQUE'},
    {id:'gondola',label:'Gôndola',mod:'ESTOQUE'},
    {id:'transferencias',label:'Transferências',mod:'ESTOQUE'},
    {id:'inventarios',label:'Inventário',mod:'ESTOQUE'},
  ]},
  {grupo:'Relatórios',itens:[
    {id:'curva_abc',label:'Curva ABC',mod:'RELATORIOS'},
  ]},
  {grupo:'Fiscal',itens:[{id:'nfe',label:'NF-e',mod:'FISCAL'}]},
  {grupo:'Sistema',itens:[
    {id:'usuarios',label:'Usuários',mod:'USUARIOS'},
    {id:'permissoes',label:'Permissões',mod:'USUARIOS'},
    {id:'logs',label:'Logs / Auditoria',mod:'CONFIG'},
    {id:'config',label:'Configurações',mod:'CONFIG'},
  ]},
];
function buildMenu(){
  $('#menu').innerHTML=MENU.map(g=>{
    const itens=g.itens.filter(i=>can(i.mod,'ver'));
    if(itens.length===0) return '';
    return '<div class="grp">'+esc(g.grupo)+'</div>'+
      itens.map(i=>'<a data-nav="'+i.id+'" onclick="nav(\''+i.id+'\')"><span>'+esc(i.label)+'</span></a>').join('');
  }).join('');
}
function modDaTela(id){ for(const g of MENU){ const it=g.itens.find(x=>x.id===id); if(it) return it.mod; } return null; }
const SCREENS={
  dashboard:{title:'Dashboard',load:loadDashboard},
  clientes:{title:'Clientes',load:()=>loadClientes()},
  produtos:{title:'Produtos',load:()=>loadProdutos()},
  orcamentos:{title:'Orçamentos de Venda',load:()=>loadOrcamentos()},
  vendas:{title:'Vendas',load:()=>loadVendas()},
  os:{title:'Ordens de Serviço',load:()=>loadOS()},
  cr:{title:'Contas a Receber',load:()=>loadCR()},
  cp:{title:'Contas a Pagar',load:()=>loadCP()},
  caixa:{title:'Caixa',load:()=>loadCaixa()},
  cobranca:{title:'Cobrança',load:()=>loadCobranca()},
  pedidos_compra:{title:'Pedidos de Compra',load:()=>loadPedidosCompra()},
  recebimentos:{title:'Recebimentos (Entradas)',load:()=>loadRecebimentos()},
  solicitacoes:{title:'Solicitações de Produto',load:()=>loadSolicitacoes()},
  gondola:{title:'Gôndola',load:()=>loadGondola()},
  transferencias:{title:'Transferências de Estoque',load:()=>loadTransferencias()},
  inventarios:{title:'Inventário',load:()=>loadInventarios()},
  curva_abc:{title:'Curva ABC',load:()=>loadCurvaABC()},
  nfe:{title:'Notas Fiscais (NF-e)',load:()=>loadNFe()},
  usuarios:{title:'Usuários',load:()=>loadUsuarios()},
  permissoes:{title:'Permissões por Grupo',load:()=>loadPermissoes()},
  logs:{title:'Logs / Auditoria',load:()=>loadLogs()},
  config:{title:'Configurações',load:()=>loadConfig()},
};
function nav(id){
  const s=SCREENS[id]; if(!s) return;
  const mod=modDaTela(id);
  if(mod && !can(mod,'ver')){
    $('#page-title').textContent='Acesso negado';
    $('#screen').innerHTML=errBox('Você não tem permissão para acessar esta tela.','Fale com um administrador para liberar o módulo '+mod+'.');
    return;
  }
  document.querySelectorAll('#menu a').forEach(a=>a.classList.toggle('active',a.dataset.nav===id));
  $('#page-title').textContent=s.title;
  $('#screen').innerHTML=skeletonTable();
  try{ s.load(); }catch(e){ $('#screen').innerHTML=errBox('Falha ao abrir a tela.',e.message); }
}
window.nav=nav;

async function loadDashboard(){
  try{
    const [cr,cp,cob]=await Promise.all([
      sb.rpc('erp_list',{p_tabela:'vw_contas_receber'}),
      sb.rpc('erp_list',{p_tabela:'vw_contas_pagar'}),
      sb.rpc('erp_list',{p_tabela:'vw_cobranca_clientes'}),
    ]);
    const R=(cr.data||[]), P=(cp.data||[]), C=(cob.data||[]);
    const sum=(a,f)=>a.reduce((s,x)=>s+(Number(x[f])||0),0);
    const abertoR=R.filter(t=>['ABERTO','PAGO_PARCIAL','VENCIDO'].includes(t.status));
    const abertoP=P.filter(t=>['ABERTO','PAGO_PARCIAL','VENCIDO'].includes(t.status));
    const kpis=[
      ['A Receber (aberto)',fmtFull(sum(abertoR,'valor_saldo'))],
      ['A Pagar (aberto)',fmtFull(sum(abertoP,'valor_saldo'))],
      ['Vencido (receber)',fmtFull(sum(R.filter(t=>t.vencido),'valor_saldo'))],
      ['Clientes inadimplentes',String(C.length)],
      ['Títulos a receber',String(R.length)],
      ['Títulos a pagar',String(P.length)],
    ];
    $('#screen').innerHTML='<div class="grid-kpi">'+kpis.map(k=>
      '<div class="metric"><div class="lbl">'+esc(k[0])+'</div><div class="val">'+esc(k[1])+'</div></div>').join('')+
      '</div><div class="card card-pad" style="font-size:13px;color:hsl(var(--muted-foreground))">'+
      'Bem-vindo, '+esc(window.usuarioAtual.nome)+'. Use o menu à esquerda. Em <b>Configurações</b> você cadastra e edita todas as tabelas do sistema.</div>';
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar o dashboard.',e.message); }
}

/* restaura sessão */
(function(){ const u=sessionStorage.getItem('erp_user'); if(u){ try{
  window.usuarioAtual=JSON.parse(u);
  const pp=sessionStorage.getItem('erp_perm'); if(pp) window.perm=JSON.parse(pp);
  entrarApp();
}catch(e){} } })();
