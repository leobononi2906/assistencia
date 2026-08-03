/* ERP Bononi — Compras: Cotações de Compra (mapa comparativo -> pedido)
   Cria a cotação (itens = produtos a cotar), registra as respostas de N fornecedores,
   seleciona a melhor por item e gera o(s) Pedido(s) de Compra agrupado(s) por fornecedor. */

let ctId=null, ctCab={}, ctItens=[], ctDet=null;

function ctBadge(s){ const m={ABERTA:'info',ENVIADA:'info',RESPONDIDA:'warn',FINALIZADA:'ok',CANCELADA:'muted'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }
function ctBloq(){ return ['FINALIZADA','CANCELADA'].includes(ctCab.status); }

/* ---------------- LISTA ---------------- */
async function loadCotacoes(){
  try{
    const [empresas,res]=await Promise.all([ lookup('empresas'), sb.rpc('erp_cotacao_listar',{}) ]);
    if(res.error) throw res.error;
    const rows=Array.isArray(res.data)?res.data:[];
    const empNome=id=>{ const e=empresas.find(x=>String(x.id)===String(id)); return e?pdLabel(e):''; };
    let html='<div class="toolbar"><b style="font-size:13px">Cotações de Compra</b><div class="spacer"></div>'+
      permBtn('COMPRAS','incluir','<button class="btn btn-sm" onclick="ctEditor(null)">+ Nova cotação</button>')+'</div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Empresa</th><th>Emissão</th>'+
      '<th>Validade</th><th>Itens</th><th>Fornec.</th><th>Selec.</th><th>Status</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="9"><div class="empty">Nenhuma cotação.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.numero)+'</td><td>'+esc(empNome(r.id_empresa))+'</td>'+
      '<td>'+fmtDate(r.data_emissao)+'</td><td>'+fmtDate(r.data_validade)+'</td>'+
      '<td class="mono">'+(r.qtd_itens||0)+'</td><td class="mono">'+(r.qtd_fornecedores||0)+'</td>'+
      '<td class="mono">'+(r.qtd_selecionados||0)+'</td><td>'+ctBadge(r.status)+'</td>'+
      '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick="ctEditor('+r.id+')">Abrir</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ bononiLog('ERRO','LOAD_COTACOES',{erro:e&&e.message});
    $('#screen').innerHTML=errBox('Não foi possível carregar as cotações.',e.message); }
}
window.loadCotacoes=loadCotacoes;

/* ---------------- EDITOR ---------------- */
async function ctEditor(id, seedItens){
  ctId=id; ctCab={}; ctItens=[]; ctDet=null;
  try{
    const empresas=await lookup('empresas');
    if(id){ const {data,error}=await sb.rpc('erp_cotacao_detalhe',{p_id:id}); if(error) throw error;
      ctDet=data||{}; ctCab=ctDet.cab||{};
      ctItens=(ctDet.itens||[]).map(i=>({id_produto:i.id_produto,quantidade:i.quantidade,observacao:i.observacao})); }
    else if(Array.isArray(seedItens)){ ctItens=seedItens.map(x=>({...x})); }
    const bloq=ctBloq();
    $('#page-title').textContent=id?('Cotação '+(ctCab.numero||'')):'Nova cotação de compra';
    let html='<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadCotacoes()">&larr; Voltar</button>'+
      '<div class="spacer"></div>'+(id?ctBadge(ctCab.status):'')+'</div>';
    html+='<div class="card card-pad"><div class="form-grid">'+
      '<div class="field"><label>Empresa *</label><select id="ct-emp" '+(id?'disabled':'')+'>'+pdOptions(empresas,ctCab.id_empresa)+'</select></div>'+
      '<div class="field"><label>Validade da cotação</label><input type="date" id="ct-val" '+(bloq?'disabled':'')+' value="'+esc(ctCab.data_validade?String(ctCab.data_validade).slice(0,10):'')+'"></div>'+
      '<div class="field full"><label>Observação</label><input type="text" id="ct-obs" '+(bloq?'disabled':'')+' value="'+esc(ctCab.observacao||'')+'"></div>'+
      '</div></div>';
    html+='<div class="card card-pad" style="margin-top:12px"><div class="toolbar"><b style="font-size:13px">Itens a cotar</b><div class="spacer"></div>'+
      (bloq?'':'<button class="btn btn-sm" onclick="ctAddItem()">+ Produto</button>')+'</div><div id="ct-itens"></div></div>';
    if(!bloq) html+='<div style="margin-top:12px;display:flex;gap:8px">'+
      '<button class="btn btn-ok" onclick="ctSalvar()">Salvar cotação</button>'+
      (id?'<button class="btn btn-danger" onclick="ctCancelar()">Cancelar cotação</button>':'')+'</div>';
    if(id) html+='<div id="ct-mapa" style="margin-top:16px"></div>';
    $('#screen').innerHTML=html;
    ctRenderItens(bloq);
    if(id) ctRenderMapa();
  }catch(e){ bononiLog('ERRO','COTACAO_EDITOR',{erro:e&&e.message});
    $('#screen').innerHTML=errBox('Não foi possível abrir a cotação.',e.message); }
}
window.ctEditor=ctEditor;

async function ctRenderItens(bloq){
  const produtos=await lookup('produtos'); const box=$('#ct-itens'); if(!box) return;
  let h='<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Qtd</th><th>Obs.</th>'+(bloq?'':'<th></th>')+'</tr></thead><tbody>';
  if(ctItens.length===0) h+='<tr><td colspan="4"><div class="empty">Sem itens.</div></td></tr>';
  ctItens.forEach((it,ix)=>{
    if(bloq){ h+='<tr><td>'+esc((produtos.find(p=>String(p.id)===String(it.id_produto))||{}).nome||'')+'</td>'+
      '<td class="mono">'+fmtNum(it.quantidade)+'</td><td>'+esc(it.observacao||'')+'</td></tr>'; return; }
    h+='<tr><td><select onchange="ctItemSet('+ix+',\'id_produto\',this.value)">'+pdOptions(produtos,it.id_produto)+'</select></td>'+
      '<td><input type="number" step="0.001" style="width:90px" value="'+esc(it.quantidade!=null?String(it.quantidade):'1')+'" onchange="ctItemSet('+ix+',\'quantidade\',this.value)"></td>'+
      '<td><input type="text" value="'+esc(it.observacao||'')+'" onchange="ctItemSet('+ix+',\'observacao\',this.value)"></td>'+
      '<td class="acoes"><button class="btn btn-danger btn-sm" onclick="ctDelItem('+ix+')">×</button></td></tr>';
  });
  h+='</tbody></table></div>';
  box.innerHTML=h;
}
function ctAddItem(){ ctItens.push({id_produto:'',quantidade:'1',observacao:''}); ctRenderItens(false); }
window.ctAddItem=ctAddItem;
function ctDelItem(ix){ ctItens.splice(ix,1); ctRenderItens(false); }
window.ctDelItem=ctDelItem;
function ctItemSet(ix,k,v){ ctItens[ix][k]=v; }
window.ctItemSet=ctItemSet;

async function ctSalvar(){
  try{
    const cab={ id:ctId||null, id_empresa:$('#ct-emp').value, data_validade:$('#ct-val').value,
      observacao:$('#ct-obs').value, id_usuario:UID() };
    if(!cab.id_empresa){ toast('Selecione a empresa','err'); return; }
    const itens=ctItens.filter(i=>i.id_produto).map(i=>({id_produto:i.id_produto,
      quantidade:i.quantidade||1, observacao:i.observacao||null}));
    if(itens.length===0){ toast('Adicione ao menos um produto','err'); return; }
    const {data,error}=await sb.rpc('erp_cotacao_salvar',{p_cab:cab,p_itens:itens});
    if(error) throw error;
    toast(ctId?'Cotação salva':'Cotação criada','ok'); ctEditor(Number(data));
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ctSalvar=ctSalvar;

async function ctCancelar(){
  if(!await confirmAsync('Cancelar esta cotação?')) return;
  try{ const {error}=await sb.rpc('erp_cotacao_status',{p_id:ctId,p_status:'CANCELADA'}); if(error) throw error;
    toast('Cotação cancelada','ok'); ctEditor(ctId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ctCancelar=ctCancelar;

/* ---------------- MAPA COMPARATIVO ---------------- */
function ctResp(idProd,idForn){ return (ctDet.respostas||[]).find(r=>r.id_produto===idProd&&r.id_fornecedor===idForn); }
function ctMenorPreco(idProd){ const ps=(ctDet.respostas||[]).filter(r=>r.id_produto===idProd&&Number(r.preco_unitario)>0)
  .map(r=>Number(r.preco_unitario)); return ps.length?Math.min(...ps):null; }

function ctRenderMapa(){
  const box=$('#ct-mapa'); if(!box) return;
  const itens=ctDet.itens||[], forns=ctDet.fornecedores||[];
  const bloq=ctBloq();
  let h='<div class="card card-pad"><div class="toolbar"><b style="font-size:13px">Mapa comparativo</b><div class="spacer"></div>';
  if(!bloq){ h+='<button class="btn btn-sm" onclick="ctAbrirResposta(null)">+ Cotação de fornecedor</button>';
    if(forns.length) h+='<button class="btn btn-ghost btn-sm" onclick="ctSelMenor()">Selecionar menor preço</button>'; }
  h+='</div>';
  if(itens.length===0){ box.innerHTML=h+'<div class="empty">Adicione itens e salve a cotação para registrar as respostas.</div></div>'; return; }
  if(forns.length===0){ box.innerHTML=h+'<div class="empty">Nenhum fornecedor respondeu ainda. Use “+ Cotação de fornecedor”.</div></div>'; return; }

  h+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Qtd</th>';
  forns.forEach(f=>{ h+='<th style="text-align:right">'+(bloq?esc(f.fornecedor):'<span class="doc-link" onclick="ctAbrirResposta('+f.id_fornecedor+')">'+esc(f.fornecedor)+'</span>')+'</th>'; });
  h+='<th>Escolhido</th></tr></thead><tbody>';
  itens.forEach(it=>{
    const menor=ctMenorPreco(it.id_produto);
    h+='<tr><td>'+esc(it.nome)+'<div style="font-size:11px;color:hsl(var(--text-muted))">'+esc(it.referencia||'')+'</div></td>'+
      '<td class="mono">'+fmtNum(it.quantidade)+'</td>';
    forns.forEach(f=>{
      const r=ctResp(it.id_produto,f.id_fornecedor);
      if(!r||!(Number(r.preco_unitario)>0)){ h+='<td class="mono" style="text-align:right;color:hsl(var(--text-muted))">—</td>'; return; }
      const pv=Number(r.preco_unitario), best=menor!=null&&pv<=menor;
      const tot=pv*(Number(it.quantidade)||0);
      h+='<td class="mono" style="text-align:right'+(best?';background:hsl(var(--success-bg));color:hsl(var(--success));font-weight:700':'')+
        (r.selecionado?';outline:2px solid hsl(var(--blue-mid));outline-offset:-2px':'')+'" title="'+
        (r.prazo_entrega_dias?('prazo '+r.prazo_entrega_dias+'d'):'')+(r.condicao_pagamento?(' · '+esc(r.condicao_pagamento)):'')+'">'+
        fmtFull(pv)+'<div style="font-size:10px;color:hsl(var(--text-muted))">'+fmtFull(tot)+'</div></td>';
    });
    // seletor de vencedor
    const respItem=(ctDet.respostas||[]).filter(r=>r.id_produto===it.id_produto&&Number(r.preco_unitario)>0);
    const sel=respItem.find(r=>r.selecionado);
    if(bloq){ h+='<td>'+(sel?esc(sel.fornecedor):'—')+'</td>'; }
    else{ h+='<td><select onchange="ctSelecionar('+it.id_produto+',this.value)"><option value="">—</option>'+
      respItem.map(r=>'<option value="'+r.id_fornecedor+'"'+(r.selecionado?' selected':'')+'>'+esc(r.fornecedor)+' ('+fmtFull(r.preco_unitario)+')</option>').join('')+'</select></td>'; }
    h+='</tr>';
  });
  h+='</tbody></table></div>';

  // resumo + gerar
  const sels=(ctDet.respostas||[]).filter(r=>r.selecionado);
  const totSel=sels.reduce((s,r)=>{ const it=itens.find(i=>i.id_produto===r.id_produto); return s+(Number(r.preco_unitario)||0)*((it&&Number(it.quantidade))||0); },0);
  const nForn=new Set(sels.map(r=>r.id_fornecedor)).size;
  h+='<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:12px">'+
    '<div><b>'+sels.length+'</b>/'+itens.length+' item(ns) escolhido(s) · <b>'+fmtFull(totSel)+'</b>'+
      (nForn?(' · '+nForn+' fornecedor(es) → '+nForn+' pedido(s)'):'')+'</div><div class="spacer" style="flex:1"></div>';
  if(!bloq && can('COMPRAS','incluir')) h+='<button class="btn btn-ok" onclick="ctGerarPedidos()" '+(sels.length?'':'disabled')+'>Gerar pedido(s) de compra</button>';
  h+='</div></div>';
  box.innerHTML=h;
}

async function ctSelecionar(idProd,idForn){
  try{ const {error}=await sb.rpc('erp_cotacao_selecionar',{p_id_cotacao:ctId,p_id_produto:idProd,p_id_fornecedor:idForn?Number(idForn):null});
    if(error) throw error; await ctReload();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ctSelecionar=ctSelecionar;
async function ctSelMenor(){
  try{ const {data,error}=await sb.rpc('erp_cotacao_selecionar_menor',{p_id_cotacao:ctId}); if(error) throw error;
    toast((data&&data.selecionados||0)+' item(ns) com menor preço selecionado(s)','ok'); await ctReload();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ctSelMenor=ctSelMenor;
async function ctReload(){ const {data}=await sb.rpc('erp_cotacao_detalhe',{p_id:ctId}); ctDet=data||ctDet; ctRenderMapa(); }

/* ---- modal: registrar/editar a resposta de um fornecedor ---- */
async function ctAbrirResposta(idForn){
  const forn=await lookup('fornecedores');
  const itens=ctDet.itens||[];
  const existentes=idForn?(ctDet.respostas||[]).filter(r=>r.id_fornecedor===idForn):[];
  const getR=idp=>existentes.find(r=>r.id_produto===idp)||{};
  let body='<div class="field"><label>Fornecedor *</label><select id="cr-forn" '+(idForn?'disabled':'')+'>'+
    pdOptions(forn,idForn||'')+'</select></div>'+
    '<div class="tbl-wrap" style="margin-top:10px"><table class="data"><thead><tr><th>Produto</th><th>Preço unit.</th><th>Prazo (d)</th><th>Condição</th></tr></thead><tbody>';
  itens.forEach(it=>{ const r=getR(it.id_produto);
    body+='<tr><td>'+esc(it.nome)+'</td>'+
      '<td><input type="number" step="0.01" style="width:100px" id="cr-'+it.id_produto+'-preco" value="'+(r.preco_unitario!=null?esc(String(r.preco_unitario)):'')+'"></td>'+
      '<td><input type="number" style="width:70px" id="cr-'+it.id_produto+'-prazo" value="'+(r.prazo_entrega_dias!=null?esc(String(r.prazo_entrega_dias)):'')+'"></td>'+
      '<td><input type="text" style="width:130px" id="cr-'+it.id_produto+'-cond" value="'+esc(r.condicao_pagamento||'')+'"></td></tr>';
  });
  body+='</tbody></table></div><div style="font-size:11px;color:hsl(var(--text-muted));margin-top:6px">Deixe o preço em branco para itens que o fornecedor não cotou.</div>';
  const foot='<button class="btn btn-ghost btn-sm" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="ctSalvarResposta('+(idForn||'null')+')">Salvar resposta</button>';
  openModal(idForn?'Editar cotação do fornecedor':'Nova cotação de fornecedor', body, foot, {push:true, wide:true});
}
window.ctAbrirResposta=ctAbrirResposta;
async function ctSalvarResposta(idForn){
  try{
    const fid=idForn||Number($('#cr-forn').value);
    if(!fid){ toast('Selecione o fornecedor','err'); return; }
    const itens=(ctDet.itens||[]).map(it=>({ id_produto:it.id_produto,
      preco_unitario:($('#cr-'+it.id_produto+'-preco')||{}).value||null,
      prazo_entrega_dias:($('#cr-'+it.id_produto+'-prazo')||{}).value||null,
      condicao_pagamento:($('#cr-'+it.id_produto+'-cond')||{}).value||null }));
    const {data,error}=await sb.rpc('erp_cotacao_resposta_salvar',{p_id_cotacao:ctId,p_id_fornecedor:Number(fid),p_itens:itens,p_id_usuario:UID()});
    if(error) throw error;
    toast('Resposta salva ('+(data&&data.itens||0)+' item/ns)','ok'); closeModal(); await ctReload();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ctSalvarResposta=ctSalvarResposta;

async function ctGerarPedidos(){
  const sels=(ctDet.respostas||[]).filter(r=>r.selecionado);
  if(sels.length===0){ toast('Selecione o fornecedor vencedor de ao menos um item','err'); return; }
  const nForn=new Set(sels.map(r=>r.id_fornecedor)).size;
  if(!await confirmAsync('Gerar '+nForn+' pedido(s) de compra a partir dos itens selecionados? A cotação será finalizada.')) return;
  try{
    const {data,error}=await sb.rpc('erp_cotacao_gerar_pedidos',{p_id_cotacao:ctId,p_id_usuario:UID()});
    if(error) throw error;
    const peds=(data&&data.pedidos)||[];
    toast(peds.length+' pedido(s): '+peds.map(p=>p.numero).join(', '),'ok');
    if(peds.length && await confirmAsync('Pedido(s) '+peds.map(p=>p.numero).join(', ')+' criado(s). Abrir a lista de Pedidos de Compra?')){
      nav('pedidos_compra'); return;
    }
    ctEditor(ctId);
  }catch(e){ bononiLog('ERRO','COTACAO_GERAR',{erro:e&&e.message}); toast('Erro: '+(e.message||e),'err'); }
}
window.ctGerarPedidos=ctGerarPedidos;
