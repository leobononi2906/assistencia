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

/* ---------- modal ---------- */
function openModal(title, bodyHTML, footHTML){
  $('#modal-title').textContent=title; $('#modal-body').innerHTML=bodyHTML;
  $('#modal-foot').innerHTML=footHTML||''; $('#modal-bg').classList.add('open');
}
function closeModal(){ $('#modal-bg').classList.remove('open'); }
window.closeModal=closeModal;
function confirmAsync(msg){ return new Promise(res=>{
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
