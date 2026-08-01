/* ERP Bononi — Comercial: Vendas e Ordens de Serviço (listar, abrir, solicitar, finalizar, NF-e) */

function stBadgeVenda(s){ const m={ABERTA:'info',FATURADA:'ok',ENTREGUE:'ok',CANCELADA:'muted',DEVOLVIDA:'muted'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s)+'</span>'; }
function stBadgeOS(s){ const m={ABERTA:'info',EM_ANDAMENTO:'info',EM_EXECUCAO:'info',AGUARDANDO_PECA:'warn',
  AGUARDANDO_APROVACAO:'warn',CONCLUIDA:'warn',FATURADA:'ok',CANCELADA:'muted'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s)+'</span>'; }

/* ---------------- VENDAS ---------------- */
async function loadVendas(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_vendas',p_limit:9999});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><input type="search" id="vd-busca" placeholder="Filtrar por cliente/número..." onkeyup="vdFiltrar()">'+
      '<div class="spacer"></div><button class="btn btn-sm" onclick="vdNova()">+ Nova venda</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Cliente</th><th>Empresa</th>'+
      '<th>Data</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody id="vd-body"></tbody></table></div>';
    $('#screen').innerHTML=html; window.__vdRows=rows; vdFiltrar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as vendas.',e.message); }
}
window.loadVendas=loadVendas;
function vdFiltrar(){
  const rows=window.__vdRows||[]; const q=($('#vd-busca')?$('#vd-busca').value:'').toLowerCase();
  const f=rows.filter(v=>(String(v.cliente||'')+String(v.numero||'')).toLowerCase().includes(q));
  const body=$('#vd-body'); if(!body) return;
  if(f.length===0){ body.innerHTML='<tr><td colspan="7"><div class="empty">Nenhuma venda.</div></td></tr>'; return; }
  body.innerHTML=f.map(v=>'<tr><td>'+esc(v.numero||'')+'</td><td>'+esc(v.cliente||'—')+'</td><td>'+esc(v.empresa||'')+'</td>'+
    '<td>'+fmtDate(v.data_venda)+'</td><td class="mono">'+fmtNum(v.valor_total)+'</td><td>'+stBadgeVenda(v.status)+'</td>'+
    '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick="vdAbrir('+v.id+')">Abrir</button></td></tr>').join('');
}
window.vdFiltrar=vdFiltrar;

async function vdNova(){
  const emp=await lookup('empresas'), cli=await lookup('clientes'), fp=await lookup('formas_pagamento'), cp=await lookup('condicoes_pagamento');
  const body='<div class="form-grid">'+
    '<div class="field"><label>Empresa *</label><select id="vn-emp">'+emp.map(e=>'<option value="'+e.id+'">'+esc(e.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Cliente *</label><select id="vn-cli">'+cli.map(c=>'<option value="'+c.id+'">'+esc(c.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Forma pagamento</label><select id="vn-fp"><option value="">—</option>'+fp.map(f=>'<option value="'+f.id+'">'+esc(f.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Condição</label><select id="vn-cp"><option value="">—</option>'+cp.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div></div>'+
    '<p style="font-size:12px;color:hsl(var(--muted-foreground))">Os produtos entram por <b>solicitação</b> (estoque lança). Vendedor não adiciona direto.</p>';
  openModal('Nova venda', body,'<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="vdNovaSalvar()">Criar</button>');
}
window.vdNova=vdNova;
async function vdNovaSalvar(){
  try{ const {data,error}=await sb.rpc('erp_criar_venda',{p_id_empresa:Number($('#vn-emp').value),p_id_cliente:Number($('#vn-cli').value),
      p_id_forma:$('#vn-fp').value?Number($('#vn-fp').value):null,p_id_condicao:$('#vn-cp').value?Number($('#vn-cp').value):null,p_id_usuario:UID()});
    if(error) throw error; toast('Venda '+data.numero+' criada','ok'); closeModal(); loadVendas(); setTimeout(()=>vdAbrir(data.id),300);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.vdNovaSalvar=vdNovaSalvar;

async function vdAbrir(id){
  try{
    const {data,error}=await sb.rpc('erp_venda_detalhe',{p_id:id}); if(error) throw error;
    const v=data.venda||{}, itens=data.itens||[], sol=data.solicitacoes||[];
    const fin=v.status==='FATURADA';
    let body='<div style="margin-bottom:10px;font-size:13px"><b>'+esc(v.numero)+'</b> — '+esc(v.cliente||'')+' · '+esc(v.empresa||'')+' · '+stBadgeVenda(v.status)+' · <span class="mono">'+fmtFull(v.valor_total)+'</span></div>';
    body+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:hsl(var(--text-muted));margin:8px 0 4px">Itens lançados</div>';
    body+= itens.length? '<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Qtd</th><th>Unit</th><th>Total</th></tr></thead><tbody>'+
      itens.map(i=>'<tr><td>'+esc(i.descricao||'')+'</td><td class="mono">'+fmtNum(i.quantidade)+'</td><td class="mono">'+fmtNum(i.valor_unitario)+'</td><td class="mono">'+fmtNum(i.valor_total)+'</td></tr>').join('')+'</tbody></table></div>'
      : '<div class="empty" style="padding:14px">Nenhum item lançado ainda.</div>';
    body+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:hsl(var(--text-muted));margin:12px 0 4px">Solicitações</div>';
    body+= sol.length? '<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Solic.</th><th>Pend.</th><th>Status</th></tr></thead><tbody>'+
      sol.map(s=>'<tr><td>'+esc(s.produto||'')+'</td><td class="mono">'+fmtNum(s.qtd_solicitada)+'</td><td class="mono">'+fmtNum(s.qtd_pendente)+'</td><td>'+esc(s.status)+'</td></tr>').join('')+'</tbody></table></div>'
      : '<div class="empty" style="padding:14px">Sem solicitações.</div>';
    const foot='<button class="btn btn-ghost" onclick="closeModal()">Fechar</button>'+
      '<button class="btn btn-ghost" onclick="vdSolicitar('+id+')">Solicitar produto</button>'+
      (fin?'':'<button class="btn btn-ok" onclick="vdFinalizar('+id+')">Finalizar (financeiro)</button>')+
      '<button class="btn" onclick="vdNFe('+id+')">Gerar NF-e</button>';
    openModal('Venda '+esc(v.numero), body, foot);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.vdAbrir=vdAbrir;
async function vdSolicitar(id){
  const prod=await lookup('produtos'), cen=await lookup('centros_estoque');
  openModal('Solicitar produto — venda #'+id,
    '<div class="form-grid"><div class="field full"><label>Produto *</label><select id="vs-prod">'+prod.map(p=>'<option value="'+p.id+'">'+esc(p.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Quantidade *</label><input type="number" step="0.001" id="vs-qtd"></div>'+
    '<div class="field"><label>Centro estoque</label><select id="vs-cen"><option value="">—</option>'+cen.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div></div>',
    '<button class="btn btn-ghost" onclick="vdAbrir('+id+')">Voltar</button><button class="btn btn-ok" onclick="vdSolicitarSalvar('+id+')">Solicitar</button>');
}
window.vdSolicitar=vdSolicitar;
async function vdSolicitarSalvar(id){
  try{ const {error}=await sb.rpc('erp_solicitar_produto',{p_origem:'VENDA',p_id_origem:id,p_id_produto:Number($('#vs-prod').value),
      p_qtd:Number($('#vs-qtd').value),p_id_usuario:UID(),p_id_centro_estoque:$('#vs-cen').value?Number($('#vs-cen').value):null});
    if(error) throw error; toast('Solicitação criada','ok'); vdAbrir(id);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.vdSolicitarSalvar=vdSolicitarSalvar;
async function vdFinalizar(id){
  if(!await confirmAsync('Finalizar a venda? Isso gera o movimento financeiro (não emite NF-e).')) return;
  try{ const {data,error}=await sb.rpc('erp_finalizar_venda',{p_id_venda:id,p_id_usuario:UID()});
    if(error) throw error; toast('Venda finalizada — financeiro gerado','ok'); closeModal(); loadVendas();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.vdFinalizar=vdFinalizar;
async function vdNFe(id){
  const nats=(await lookup('naturezas_operacao')).filter(n=>n.finalidade==='VENDA');
  openModal('Gerar NF-e — venda #'+id,
    '<div class="field"><label>Natureza da operação *</label><select id="vnf-nat">'+nats.map(n=>'<option value="'+n.id+'">'+esc(n.descricao)+' ('+esc(n.cfop)+')</option>').join('')+'</select></div>'+
    '<p style="font-size:12px;color:hsl(var(--muted-foreground))">A NF-e é independente do financeiro. Gera como PENDENTE; emissão em Fiscal → NF-e.</p>',
    '<button class="btn btn-ghost" onclick="vdAbrir('+id+')">Voltar</button><button class="btn btn-ok" onclick="vdNFeSalvar('+id+')">Gerar</button>');
}
window.vdNFe=vdNFe;
async function vdNFeSalvar(id){
  try{ const {data,error}=await sb.rpc('erp_gerar_nfe',{p_origem:'VENDA',p_id_origem:id,p_id_natureza_op:Number($('#vnf-nat').value),p_id_usuario:UID()});
    if(error) throw error; toast('NF-e nº '+data.numero+' gerada ('+data.itens+' itens)','ok'); closeModal();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.vdNFeSalvar=vdNFeSalvar;

/* ---------------- ORDENS DE SERVIÇO ---------------- */
async function loadOS(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_os',p_limit:9999});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><input type="search" id="os-busca" placeholder="Filtrar por cliente/número..." onkeyup="osFiltrar()">'+
      '<div class="spacer"></div><button class="btn btn-sm" onclick="osNova()">+ Nova OS</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Cliente</th><th>Empresa</th>'+
      '<th>Entrada</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody id="os-body"></tbody></table></div>';
    $('#screen').innerHTML=html; window.__osRows=rows; osFiltrar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as OS.',e.message); }
}
window.loadOS=loadOS;
function osFiltrar(){
  const rows=window.__osRows||[]; const q=($('#os-busca')?$('#os-busca').value:'').toLowerCase();
  const f=rows.filter(o=>(String(o.cliente||'')+String(o.numero||'')).toLowerCase().includes(q));
  const body=$('#os-body'); if(!body) return;
  if(f.length===0){ body.innerHTML='<tr><td colspan="7"><div class="empty">Nenhuma OS.</div></td></tr>'; return; }
  body.innerHTML=f.map(o=>'<tr><td>'+esc(o.numero||'')+'</td><td>'+esc(o.cliente||'—')+'</td><td>'+esc(o.empresa||'')+'</td>'+
    '<td>'+fmtDate(o.data_entrada)+'</td><td class="mono">'+fmtNum(o.valor_total)+'</td><td>'+stBadgeOS(o.status)+'</td>'+
    '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick="osAbrir('+o.id+')">Abrir</button></td></tr>').join('');
}
window.osFiltrar=osFiltrar;
async function osNova(){
  const emp=await lookup('empresas'), cli=await lookup('clientes'), tp=await lookup('tipos_os'), fp=await lookup('formas_pagamento'), cp=await lookup('condicoes_pagamento');
  const body='<div class="form-grid">'+
    '<div class="field"><label>Empresa *</label><select id="on-emp">'+emp.map(e=>'<option value="'+e.id+'">'+esc(e.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Cliente *</label><select id="on-cli">'+cli.map(c=>'<option value="'+c.id+'">'+esc(c.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Tipo de OS</label><select id="on-tp"><option value="">—</option>'+tp.map(t=>'<option value="'+t.id+'">'+esc(t.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Forma pagamento</label><select id="on-fp"><option value="">—</option>'+fp.map(f=>'<option value="'+f.id+'">'+esc(f.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Condição</label><select id="on-cp"><option value="">—</option>'+cp.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div></div>';
  openModal('Nova OS', body,'<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-ok" onclick="osNovaSalvar()">Criar</button>');
}
window.osNova=osNova;
async function osNovaSalvar(){
  try{ const {data,error}=await sb.rpc('erp_criar_os',{p_id_empresa:Number($('#on-emp').value),p_id_cliente:Number($('#on-cli').value),
      p_id_tipo_os:$('#on-tp').value?Number($('#on-tp').value):null,p_id_forma:$('#on-fp').value?Number($('#on-fp').value):null,
      p_id_condicao:$('#on-cp').value?Number($('#on-cp').value):null,p_id_usuario:UID()});
    if(error) throw error; toast('OS '+data.numero+' criada','ok'); closeModal(); loadOS(); setTimeout(()=>osAbrir(data.id),300);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.osNovaSalvar=osNovaSalvar;
async function osAbrir(id){
  try{
    const {data,error}=await sb.rpc('erp_os_detalhe',{p_id:id}); if(error) throw error;
    const o=data.os||{}, pecas=data.pecas||[], serv=data.servicos||[], sol=data.solicitacoes||[];
    const fin=o.status==='FATURADA';
    let body='<div style="margin-bottom:10px;font-size:13px"><b>'+esc(o.numero)+'</b> — '+esc(o.cliente||'')+' · '+esc(o.empresa||'')+' · '+stBadgeOS(o.status)+' · <span class="mono">'+fmtFull(o.valor_total)+'</span></div>';
    body+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:hsl(var(--text-muted));margin:8px 0 4px">Peças</div>';
    body+= pecas.length? '<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Qtd</th><th>Total</th></tr></thead><tbody>'+
      pecas.map(i=>'<tr><td>'+esc(i.descricao||'')+'</td><td class="mono">'+fmtNum(i.quantidade)+'</td><td class="mono">'+fmtNum(i.valor_total)+'</td></tr>').join('')+'</tbody></table></div>'
      : '<div class="empty" style="padding:14px">Sem peças lançadas.</div>';
    body+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:hsl(var(--text-muted));margin:12px 0 4px">Solicitações</div>';
    body+= sol.length? '<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Solic.</th><th>Pend.</th><th>Status</th></tr></thead><tbody>'+
      sol.map(s=>'<tr><td>'+esc(s.produto||'')+'</td><td class="mono">'+fmtNum(s.qtd_solicitada)+'</td><td class="mono">'+fmtNum(s.qtd_pendente)+'</td><td>'+esc(s.status)+'</td></tr>').join('')+'</tbody></table></div>'
      : '<div class="empty" style="padding:14px">Sem solicitações.</div>';
    const foot='<button class="btn btn-ghost" onclick="closeModal()">Fechar</button>'+
      '<button class="btn btn-ghost" onclick="osSolicitar('+id+')">Solicitar produto</button>'+
      (fin?'':'<button class="btn btn-ok" onclick="osFinalizar('+id+')">Finalizar (financeiro)</button>')+
      '<button class="btn" onclick="osNFe('+id+')">Gerar NF-e</button>';
    openModal('OS '+esc(o.numero), body, foot);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.osAbrir=osAbrir;
async function osSolicitar(id){
  const prod=await lookup('produtos'), cen=await lookup('centros_estoque');
  openModal('Solicitar produto — OS #'+id,
    '<div class="form-grid"><div class="field full"><label>Produto *</label><select id="oss-prod">'+prod.map(p=>'<option value="'+p.id+'">'+esc(p.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Quantidade *</label><input type="number" step="0.001" id="oss-qtd"></div>'+
    '<div class="field"><label>Centro estoque</label><select id="oss-cen"><option value="">—</option>'+cen.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div></div>',
    '<button class="btn btn-ghost" onclick="osAbrir('+id+')">Voltar</button><button class="btn btn-ok" onclick="osSolicitarSalvar('+id+')">Solicitar</button>');
}
window.osSolicitar=osSolicitar;
async function osSolicitarSalvar(id){
  try{ const {error}=await sb.rpc('erp_solicitar_produto',{p_origem:'OS',p_id_origem:id,p_id_produto:Number($('#oss-prod').value),
      p_qtd:Number($('#oss-qtd').value),p_id_usuario:UID(),p_id_centro_estoque:$('#oss-cen').value?Number($('#oss-cen').value):null});
    if(error) throw error; toast('Solicitação criada','ok'); osAbrir(id);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.osSolicitarSalvar=osSolicitarSalvar;
async function osFinalizar(id){
  if(!await confirmAsync('Finalizar a OS? Isso gera o movimento financeiro (não emite NF-e).')) return;
  try{ const {data,error}=await sb.rpc('erp_finalizar_os',{p_id_os:id,p_id_usuario:UID()});
    if(error) throw error; toast('OS finalizada — financeiro gerado','ok'); closeModal(); loadOS();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.osFinalizar=osFinalizar;
async function osNFe(id){
  const nats=(await lookup('naturezas_operacao')).filter(n=>n.finalidade==='VENDA');
  openModal('Gerar NF-e — OS #'+id,
    '<div class="field"><label>Natureza da operação *</label><select id="onf-nat">'+nats.map(n=>'<option value="'+n.id+'">'+esc(n.descricao)+' ('+esc(n.cfop)+')</option>').join('')+'</select></div>',
    '<button class="btn btn-ghost" onclick="osAbrir('+id+')">Voltar</button><button class="btn btn-ok" onclick="osNFeSalvar('+id+')">Gerar</button>');
}
window.osNFe=osNFe;
async function osNFeSalvar(id){
  try{ const {data,error}=await sb.rpc('erp_gerar_nfe',{p_origem:'OS',p_id_origem:id,p_id_natureza_op:Number($('#onf-nat').value),p_id_usuario:UID()});
    if(error) throw error; toast('NF-e nº '+data.numero+' gerada','ok'); closeModal();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.osNFeSalvar=osNFeSalvar;
