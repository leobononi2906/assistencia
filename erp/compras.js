/* ERP Bononi — Compras: Pedidos de Compra e Recebimentos (Entrada de NF) */

/* estado de itens em memória para os editores */
let pcId=null, pcItens=[], pcCab={};
let rcId=null, rcItens=[], rcCab={};

/* ============ PEDIDOS DE COMPRA ============ */
async function loadPedidosCompra(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_pedidos_compra',p_limit:500});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><b style="font-size:13px">Pedidos de Compra</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="pcEditor(null)">+ Novo pedido</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Fornecedor</th><th>Empresa</th>'+
      '<th>Data</th><th>Previsão</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="8"><div class="empty">Nenhum pedido de compra.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.numero)+'</td><td>'+esc(r.fornecedor||'')+'</td><td>'+esc(r.empresa||'')+'</td>'+
      '<td>'+fmtDate(r.data_pedido)+'</td><td>'+fmtDate(r.data_previsao)+'</td><td class="mono">'+fmtNum(r.valor_total)+'</td>'+
      '<td>'+pcBadge(r.status)+'</td><td class="acoes"><button class="btn btn-ghost btn-sm" onclick="pcEditor('+r.id+')">Abrir</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os pedidos.',e.message); }
}
window.loadPedidosCompra=loadPedidosCompra;
function pcBadge(s){ const m={PENDENTE:'warn',APROVADO:'info',ENVIADO:'info',RECEBIDO_PARCIAL:'warn',RECEBIDO:'ok',CANCELADO:'muted'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }

async function pcEditor(id){
  pcId=id; pcItens=[]; pcCab={};
  const [empresas,forn,cond]=await Promise.all([lookup('empresas'),lookup('fornecedores'),lookup('condicoes_pagamento')]);
  if(id){ const {data}=await sb.rpc('erp_pedido_compra_detalhe',{p_id:id});
    pcCab=(data&&data.cab)||{}; pcItens=((data&&data.itens)||[]).map(x=>({...x})); }
  const st=pcCab.status||'PENDENTE'; const bloq=['RECEBIDO','RECEBIDO_PARCIAL','CANCELADO'].includes(st);
  $('#page-title').textContent=id?('Pedido '+(pcCab.numero||'')):'Novo pedido de compra';
  let html='<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadPedidosCompra()">&larr; Voltar</button>'+
    '<div class="spacer"></div>'+(id?pcBadge(st):'')+'</div>';
  html+='<div class="card card-pad"><div class="form-grid">'+
    '<div class="field"><label>Empresa *</label><select id="pc-emp" '+(id?'disabled':'')+'>'+pdOptions(empresas,pcCab.id_empresa)+'</select></div>'+
    '<div class="field"><label>Fornecedor *</label><select id="pc-forn" '+(bloq?'disabled':'')+'>'+pdOptions(forn,pcCab.id_fornecedor)+'</select></div>'+
    '<div class="field"><label>Condição de pagamento</label><select id="pc-cond" '+(bloq?'disabled':'')+'>'+pdOptions(cond,pcCab.id_condicao_pagamento)+'</select></div>'+
    '<div class="field"><label>Previsão de entrega</label><input type="date" id="pc-prev" '+(bloq?'disabled':'')+' value="'+esc(pcCab.data_previsao?String(pcCab.data_previsao).slice(0,10):'')+'"></div>'+
    '<div class="field"><label>Frete</label><input type="number" step="0.01" id="pc-frete" '+(bloq?'disabled':'')+' value="'+(pcCab.valor_frete==null?'':esc(String(pcCab.valor_frete)))+'"></div>'+
    '<div class="field"><label>Desconto</label><input type="number" step="0.01" id="pc-desc" '+(bloq?'disabled':'')+' value="'+(pcCab.valor_desconto==null?'':esc(String(pcCab.valor_desconto)))+'"></div>'+
    '<div class="field full"><label>Observação</label><input type="text" id="pc-obs" '+(bloq?'disabled':'')+' value="'+esc(pcCab.observacao||'')+'"></div>'+
    '</div></div>';
  html+='<div class="card card-pad" style="margin-top:12px"><div class="toolbar"><b style="font-size:13px">Itens</b><div class="spacer"></div>'+
    (bloq?'':'<button class="btn btn-sm" onclick="pcAddItem()">+ Item</button>')+'</div><div id="pc-itens"></div></div>';
  if(!bloq) html+='<div style="margin-top:12px;display:flex;gap:8px">'+
    '<button class="btn btn-ok" onclick="pcSalvar()">Salvar pedido</button>'+
    (id&&st==='PENDENTE'?'<button class="btn" onclick="pcStatus(\'APROVADO\')">Aprovar</button>':'')+
    (id&&['APROVADO','ENVIADO'].includes(st)?'<button class="btn" onclick="pcGerarRecebimento()">Gerar recebimento (entrada)</button>':'')+
    (id&&st!=='CANCELADO'?'<button class="btn btn-danger" onclick="pcStatus(\'CANCELADO\')">Cancelar pedido</button>':'')+'</div>';
  else if(id&&['RECEBIDO','RECEBIDO_PARCIAL'].includes(st)) html+='<div style="margin-top:12px"><button class="btn" onclick="pcGerarRecebimento()">Novo recebimento deste pedido</button></div>';
  $('#screen').innerHTML=html;
  pcRenderItens(bloq);
}
window.pcEditor=pcEditor;
async function pcRenderItens(bloq){
  const produtos=await lookup('produtos');
  const box=$('#pc-itens'); if(!box) return;
  let h='<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Descrição</th><th>Qtd</th><th>Vlr unit.</th><th>Desc.</th><th>Total</th><th>Recebido</th>'+(bloq?'':'<th></th>')+'</tr></thead><tbody>';
  if(pcItens.length===0) h+='<tr><td colspan="8"><div class="empty">Sem itens.</div></td></tr>';
  pcItens.forEach((it,ix)=>{
    const tot=(Number(it.quantidade)||0)*(Number(it.valor_unitario)||0)-(Number(it.valor_desconto)||0);
    if(bloq){ h+='<tr><td>'+esc((produtos.find(p=>String(p.id)===String(it.id_produto))||{}).nome||it.descricao||'')+'</td>'+
      '<td>'+esc(it.descricao||'')+'</td><td class="mono">'+fmtNum(it.quantidade)+'</td><td class="mono">'+fmtNum(it.valor_unitario)+'</td>'+
      '<td class="mono">'+fmtNum(it.valor_desconto)+'</td><td class="mono">'+fmtNum(it.valor_total||tot)+'</td>'+
      '<td class="mono">'+fmtNum(it.quantidade_recebida)+'</td></tr>'; return; }
    h+='<tr><td><select onchange="pcItemProd('+ix+',this.value)">'+pdOptions(produtos,it.id_produto)+'</select></td>'+
      '<td><input type="text" value="'+esc(it.descricao||'')+'" onchange="pcItemSet('+ix+',\'descricao\',this.value)"></td>'+
      '<td><input type="number" step="0.001" style="width:80px" value="'+esc(it.quantidade||'')+'" onchange="pcItemSet('+ix+',\'quantidade\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:100px" value="'+esc(it.valor_unitario||'')+'" onchange="pcItemSet('+ix+',\'valor_unitario\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:90px" value="'+esc(it.valor_desconto||'')+'" onchange="pcItemSet('+ix+',\'valor_desconto\',this.value)"></td>'+
      '<td class="mono">'+fmtNum(tot)+'</td><td class="mono">'+fmtNum(it.quantidade_recebida)+'</td>'+
      '<td class="acoes"><button class="btn btn-danger btn-sm" onclick="pcDelItem('+ix+')">×</button></td></tr>';
  });
  h+='</tbody></table></div>';
  box.innerHTML=h;
}
function pcAddItem(){ pcItens.push({id_produto:'',descricao:'',quantidade:'',valor_unitario:'',valor_desconto:''}); pcRenderItens(false); }
window.pcAddItem=pcAddItem;
function pcDelItem(ix){ pcItens.splice(ix,1); pcRenderItens(false); }
window.pcDelItem=pcDelItem;
function pcItemSet(ix,k,v){ pcItens[ix][k]=v; pcRenderItens(false); }
window.pcItemSet=pcItemSet;
async function pcItemProd(ix,idp){ const produtos=await lookup('produtos'); const p=produtos.find(x=>String(x.id)===String(idp));
  pcItens[ix].id_produto=idp; if(p){ if(!pcItens[ix].descricao) pcItens[ix].descricao=p.nome; if(!pcItens[ix].valor_unitario&&p.preco_custo) pcItens[ix].valor_unitario=p.preco_custo; } pcRenderItens(false); }
window.pcItemProd=pcItemProd;
async function pcSalvar(){
  try{
    const cab={ id:pcId||null, id_empresa:$('#pc-emp').value, id_fornecedor:$('#pc-forn').value,
      id_condicao_pagamento:$('#pc-cond').value, data_previsao:$('#pc-prev').value,
      valor_frete:$('#pc-frete').value, valor_desconto:$('#pc-desc').value, observacao:$('#pc-obs').value, id_usuario:UID() };
    if(!cab.id_empresa||!cab.id_fornecedor){ toast('Empresa e fornecedor são obrigatórios','err'); return; }
    const itens=pcItens.filter(i=>i.id_produto&&Number(i.quantidade)>0).map(i=>({id_produto:i.id_produto,
      descricao:i.descricao,referencia_fornecedor:i.referencia_fornecedor||null,quantidade:i.quantidade,
      valor_unitario:i.valor_unitario,valor_desconto:i.valor_desconto||0}));
    if(itens.length===0){ toast('Adicione ao menos um item','err'); return; }
    const {data,error}=await sb.rpc('erp_pedido_compra_salvar',{p_cab:cab,p_itens:itens});
    if(error) throw error;
    toast(pcId?'Pedido salvo':'Pedido criado (#'+data+')','ok'); pcEditor(Number(data));
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pcSalvar=pcSalvar;
async function pcStatus(st){
  if(st==='CANCELADO' && !await confirmAsync('Cancelar este pedido de compra?')) return;
  try{ const {error}=await sb.rpc('erp_pedido_compra_status',{p_id:pcId,p_status:st}); if(error) throw error;
    toast('Status: '+st,'ok'); pcEditor(pcId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pcStatus=pcStatus;
function pcGerarRecebimento(){ rcFromPedido=pcId; nav('recebimentos'); setTimeout(()=>rcEditor(null,pcId),50); }
window.pcGerarRecebimento=pcGerarRecebimento;
let rcFromPedido=null;

/* ============ RECEBIMENTOS (ENTRADA) ============ */
async function loadRecebimentos(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_recebimentos',p_limit:500});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><b style="font-size:13px">Recebimentos / Entradas de NF</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="rcEditor(null)">+ Nova entrada</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Fornecedor</th><th>NF</th><th>Tipo</th>'+
      '<th>Empresa</th><th>Recebido em</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="9"><div class="empty">Nenhuma entrada.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.numero)+'</td><td>'+esc(r.fornecedor||'')+'</td>'+
      '<td>'+esc(r.numero_nf_fornecedor||'—')+(r.serie_nf?('/'+esc(r.serie_nf)):'')+'</td><td>'+esc(r.tipo_entrada||'')+'</td>'+
      '<td>'+esc(r.empresa||'')+'</td><td>'+fmtDate(r.data_recebimento)+'</td><td class="mono">'+fmtNum(r.valor_total)+'</td>'+
      '<td>'+rcBadge(r.status)+'</td><td class="acoes"><button class="btn btn-ghost btn-sm" onclick="rcEditor('+r.id+')">Abrir</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os recebimentos.',e.message); }
}
window.loadRecebimentos=loadRecebimentos;
function rcBadge(s){ const m={DIGITACAO:'warn',CONFIRMADO:'ok',CANCELADO:'muted'}; return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }

async function rcEditor(id, fromPedido){
  rcId=id; rcItens=[]; rcCab={}; let titulos=[];
  const [empresas,forn,cond,tipos,centros]=await Promise.all([
    lookup('empresas'),lookup('fornecedores'),lookup('condicoes_pagamento'),lookup('tipos_entrada'),lookup('centros_estoque')]);
  if(id){ const {data}=await sb.rpc('erp_recebimento_detalhe',{p_id:id});
    rcCab=(data&&data.cab)||{}; rcItens=((data&&data.itens)||[]).map(x=>({...x})); titulos=(data&&data.titulos)||[]; }
  else if(fromPedido){ const {data}=await sb.rpc('erp_pedido_compra_detalhe',{p_id:fromPedido});
    const c=(data&&data.cab)||{};
    rcCab={ id_empresa:c.id_empresa, id_fornecedor:c.id_fornecedor, id_pedido:fromPedido, id_condicao_pagamento:c.id_condicao_pagamento };
    rcItens=((data&&data.itens)||[]).filter(i=>i.status!=='RECEBIDO'&&i.status!=='CANCELADO').map(i=>({
      id_produto:i.id_produto, id_pedido_item:i.id, descricao:i.descricao,
      quantidade:(Number(i.quantidade)||0)-(Number(i.quantidade_recebida)||0), valor_unitario:i.valor_unitario })); }
  const st=rcCab.status||'DIGITACAO'; const bloq=st!=='DIGITACAO';
  const centrosNorm=centros.filter(c=>!c.gondola);
  $('#page-title').textContent=id?('Entrada '+(rcCab.numero||'')):'Nova entrada de NF';
  let html='<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadRecebimentos()">&larr; Voltar</button>'+
    '<div class="spacer"></div>'+(id?rcBadge(st):'')+'</div>';
  html+='<div class="card card-pad"><div class="form-grid">'+
    '<div class="field"><label>Empresa *</label><select id="rc-emp" '+(bloq?'disabled':'')+'>'+pdOptions(empresas,rcCab.id_empresa)+'</select></div>'+
    '<div class="field"><label>Fornecedor *</label><select id="rc-forn" '+(bloq?'disabled':'')+'>'+pdOptions(forn,rcCab.id_fornecedor)+'</select></div>'+
    '<div class="field"><label>Tipo de entrada</label><select id="rc-tipo" '+(bloq?'disabled':'')+'>'+pdOptions(tipos,rcCab.id_tipo_entrada)+'</select></div>'+
    '<div class="field"><label>Centro de estoque *</label><select id="rc-centro" '+(bloq?'disabled':'')+'>'+pdOptions(centrosNorm,rcCab.id_centro_estoque)+'</select></div>'+
    '<div class="field"><label>NF fornecedor</label><input type="text" id="rc-nf" '+(bloq?'disabled':'')+' value="'+esc(rcCab.numero_nf_fornecedor||'')+'"></div>'+
    '<div class="field"><label>Série</label><input type="text" id="rc-serie" '+(bloq?'disabled':'')+' value="'+esc(rcCab.serie_nf||'')+'"></div>'+
    '<div class="field"><label>Emissão NF</label><input type="date" id="rc-emissao" '+(bloq?'disabled':'')+' value="'+esc(rcCab.data_emissao_nf?String(rcCab.data_emissao_nf).slice(0,10):'')+'"></div>'+
    '<div class="field"><label>Condição pagamento *</label><select id="rc-cond" '+(bloq?'disabled':'')+'>'+pdOptions(cond,rcCab.id_condicao_pagamento)+'</select></div>'+
    '<div class="field"><label>Frete</label><input type="number" step="0.01" id="rc-frete" '+(bloq?'disabled':'')+' value="'+(rcCab.valor_frete==null?'':esc(String(rcCab.valor_frete)))+'"></div>'+
    '<div class="field"><label>IPI</label><input type="number" step="0.01" id="rc-ipi" '+(bloq?'disabled':'')+' value="'+(rcCab.valor_ipi==null?'':esc(String(rcCab.valor_ipi)))+'"></div>'+
    '<div class="field"><label>ICMS ST</label><input type="number" step="0.01" id="rc-st" '+(bloq?'disabled':'')+' value="'+(rcCab.valor_icms_st==null?'':esc(String(rcCab.valor_icms_st)))+'"></div>'+
    '<div class="field"><label>Outras despesas</label><input type="number" step="0.01" id="rc-outras" '+(bloq?'disabled':'')+' value="'+(rcCab.valor_outras==null?'':esc(String(rcCab.valor_outras)))+'"></div>'+
    '<div class="field"><label>Desconto</label><input type="number" step="0.01" id="rc-desc" '+(bloq?'disabled':'')+' value="'+(rcCab.valor_desconto==null?'':esc(String(rcCab.valor_desconto)))+'"></div>'+
    '<div class="field full"><label>Observação</label><input type="text" id="rc-obs" '+(bloq?'disabled':'')+' value="'+esc(rcCab.observacao||'')+'"></div>'+
    '</div></div>';
  html+='<div class="card card-pad" style="margin-top:12px"><div class="toolbar"><b style="font-size:13px">Itens da NF</b><div class="spacer"></div>'+
    (bloq?'':'<button class="btn btn-sm" onclick="rcAddItem()">+ Item</button>')+'</div><div id="rc-itens"></div>'+
    '<div id="rc-total" style="text-align:right;font-size:13px;margin-top:8px"></div></div>';
  if(!bloq) html+='<div style="margin-top:12px;display:flex;gap:8px">'+
    '<button class="btn btn-ok" onclick="rcSalvar()">Salvar rascunho</button>'+
    (id?'<button class="btn" onclick="rcConfirmar()">Confirmar entrada (estoque + Contas a Pagar)</button>':'')+
    (id?'<button class="btn btn-danger" onclick="rcCancelar()">Cancelar</button>':'')+'</div>';
  if(titulos.length){ html+='<div class="card card-pad" style="margin-top:12px"><b style="font-size:13px">Contas a Pagar geradas</b>'+
    '<div class="tbl-wrap" style="margin-top:8px"><table class="data"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead><tbody>'+
    titulos.map(t=>'<tr><td>'+esc(t.parcela||'')+'</td><td>'+fmtDate(t.vencimento)+'</td><td class="mono">'+fmtNum(t.valor)+'</td><td>'+esc(t.status)+'</td></tr>').join('')+
    '</tbody></table></div></div>'; }
  $('#screen').innerHTML=html;
  rcRenderItens(bloq);
}
window.rcEditor=rcEditor;
async function rcRenderItens(bloq){
  const produtos=await lookup('produtos'), centros=(await lookup('centros_estoque')).filter(c=>!c.gondola);
  const box=$('#rc-itens'); if(!box) return;
  let h='<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Descrição</th><th>Qtd</th><th>Vlr unit.</th><th>IPI</th><th>ICMS ST</th><th>Custo final</th><th>Total</th>'+(bloq?'':'<th></th>')+'</tr></thead><tbody>';
  if(rcItens.length===0) h+='<tr><td colspan="9"><div class="empty">Sem itens.</div></td></tr>';
  rcItens.forEach((it,ix)=>{
    const tot=(Number(it.quantidade)||0)*(Number(it.valor_unitario)||0)+(Number(it.valor_ipi)||0)+(Number(it.valor_icms_st)||0);
    if(bloq){ h+='<tr><td>'+esc((produtos.find(p=>String(p.id)===String(it.id_produto))||{}).nome||it.descricao||'')+'</td>'+
      '<td>'+esc(it.descricao||'')+'</td><td class="mono">'+fmtNum(it.quantidade)+'</td><td class="mono">'+fmtNum(it.valor_unitario)+'</td>'+
      '<td class="mono">'+fmtNum(it.valor_ipi)+'</td><td class="mono">'+fmtNum(it.valor_icms_st)+'</td>'+
      '<td class="mono">'+fmtNum(it.custo_unitario_final)+'</td><td class="mono">'+fmtNum(it.valor_total||tot)+'</td></tr>'; return; }
    h+='<tr><td><select onchange="rcItemProd('+ix+',this.value)">'+pdOptions(produtos,it.id_produto)+'</select></td>'+
      '<td><input type="text" value="'+esc(it.descricao||'')+'" onchange="rcItemSet('+ix+',\'descricao\',this.value)"></td>'+
      '<td><input type="number" step="0.001" style="width:74px" value="'+esc(it.quantidade||'')+'" onchange="rcItemSet('+ix+',\'quantidade\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:90px" value="'+esc(it.valor_unitario||'')+'" onchange="rcItemSet('+ix+',\'valor_unitario\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:74px" value="'+esc(it.valor_ipi||'')+'" onchange="rcItemSet('+ix+',\'valor_ipi\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:74px" value="'+esc(it.valor_icms_st||'')+'" onchange="rcItemSet('+ix+',\'valor_icms_st\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:90px" placeholder="=unit" value="'+esc(it.custo_unitario_final||'')+'" onchange="rcItemSet('+ix+',\'custo_unitario_final\',this.value)"></td>'+
      '<td class="mono">'+fmtNum(tot)+'</td>'+
      '<td class="acoes"><button class="btn btn-danger btn-sm" onclick="rcDelItem('+ix+')">×</button></td></tr>';
  });
  h+='</tbody></table></div>';
  box.innerHTML=h;
  const tp=rcItens.reduce((s,it)=>s+((Number(it.quantidade)||0)*(Number(it.valor_unitario)||0)+(Number(it.valor_ipi)||0)+(Number(it.valor_icms_st)||0)),0);
  const extra=(Number(($('#rc-frete')||{}).value)||0)+(Number(($('#rc-outras')||{}).value)||0)-(Number(($('#rc-desc')||{}).value)||0);
  const tel=$('#rc-total'); if(tel) tel.innerHTML='Produtos: <b>'+fmtFull(tp)+'</b> &nbsp;·&nbsp; Total NF (com frete/desc.): <b>'+fmtFull(tp+extra)+'</b>';
}
function rcAddItem(){ rcItens.push({id_produto:'',descricao:'',quantidade:'',valor_unitario:'',valor_ipi:'',valor_icms_st:'',custo_unitario_final:''}); rcRenderItens(false); }
window.rcAddItem=rcAddItem;
function rcDelItem(ix){ rcItens.splice(ix,1); rcRenderItens(false); }
window.rcDelItem=rcDelItem;
function rcItemSet(ix,k,v){ rcItens[ix][k]=v; rcRenderItens(false); }
window.rcItemSet=rcItemSet;
async function rcItemProd(ix,idp){ const produtos=await lookup('produtos'); const p=produtos.find(x=>String(x.id)===String(idp));
  rcItens[ix].id_produto=idp; if(p){ if(!rcItens[ix].descricao) rcItens[ix].descricao=p.nome; if(!rcItens[ix].valor_unitario&&p.preco_custo) rcItens[ix].valor_unitario=p.preco_custo; } rcRenderItens(false); }
window.rcItemProd=rcItemProd;
function rcColetaCab(){
  return { id:rcId||null, id_empresa:$('#rc-emp').value, id_fornecedor:$('#rc-forn').value,
    id_pedido:rcCab.id_pedido||null, id_tipo_entrada:$('#rc-tipo').value, id_centro_estoque:$('#rc-centro').value,
    numero_nf_fornecedor:$('#rc-nf').value, serie_nf:$('#rc-serie').value, data_emissao_nf:$('#rc-emissao').value,
    id_condicao_pagamento:$('#rc-cond').value, valor_frete:$('#rc-frete').value, valor_ipi:$('#rc-ipi').value,
    valor_icms_st:$('#rc-st').value, valor_outras:$('#rc-outras').value, valor_desconto:$('#rc-desc').value,
    observacao:$('#rc-obs').value, id_usuario:UID() };
}
async function rcSalvar(){
  try{
    const cab=rcColetaCab();
    if(!cab.id_empresa||!cab.id_fornecedor){ toast('Empresa e fornecedor são obrigatórios','err'); return; }
    const itens=rcItens.filter(i=>i.id_produto&&Number(i.quantidade)>0).map(i=>({id_produto:i.id_produto,
      id_pedido_item:i.id_pedido_item||null, descricao:i.descricao, quantidade:i.quantidade, valor_unitario:i.valor_unitario,
      valor_ipi:i.valor_ipi||0, valor_icms_st:i.valor_icms_st||0, custo_unitario_final:i.custo_unitario_final||null,
      id_centro_estoque:cab.id_centro_estoque||null }));
    if(itens.length===0){ toast('Adicione ao menos um item','err'); return; }
    const {data,error}=await sb.rpc('erp_recebimento_salvar',{p_cab:cab,p_itens:itens});
    if(error) throw error;
    toast(rcId?'Rascunho salvo':'Entrada criada (#'+data+')','ok'); rcEditor(Number(data));
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.rcSalvar=rcSalvar;
async function rcConfirmar(){
  if(!await confirmAsync('Confirmar a entrada? Isso lança o estoque e gera as Contas a Pagar — não pode ser desfeito pela tela.')) return;
  try{
    const {data,error}=await sb.rpc('erp_recebimento_confirmar',{p_id:rcId,p_id_usuario:UID()});
    if(error) throw error;
    const fin=data&&data.financeiro; const np=(fin&&fin.parcelas)||0;
    toast('Entrada confirmada — '+(data.itens_estoque||0)+' item(ns) no estoque'+(np?', '+np+' parcela(s) a pagar':''),'ok');
    rcEditor(rcId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.rcConfirmar=rcConfirmar;
async function rcCancelar(){
  if(!await confirmAsync('Cancelar esta entrada (em digitação)?')) return;
  try{ const {error}=await sb.rpc('erp_recebimento_cancelar',{p_id:rcId}); if(error) throw error;
    toast('Entrada cancelada','ok'); loadRecebimentos();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.rcCancelar=rcCancelar;
