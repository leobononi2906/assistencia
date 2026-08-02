/* ERP Bononi — Orçamentos de Venda (ao aprovar: vira Venda + gera solicitações de peças p/ estoque) */

let ocId=null, ocItens=[], ocCab={}, ocVend=null;

async function loadOrcamentos(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_orcamentos',p_limit:500});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><b style="font-size:13px">Orçamentos de Venda</b><div class="spacer"></div>'+
      permBtn('ORCAMENTOS','incluir','<button class="btn btn-sm" onclick="ocEditor(null)">+ Novo orçamento</button>')+'</div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Cliente</th><th>Empresa</th>'+
      '<th>Emissão</th><th>Validade</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="8"><div class="empty">Nenhum orçamento.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.numero)+'</td><td>'+esc(r.cliente||'')+'</td><td>'+esc(r.empresa||'')+'</td>'+
      '<td>'+fmtDate(r.data_emissao)+'</td><td>'+fmtDate(r.data_validade)+'</td><td class="mono">'+fmtNum(r.valor_total)+'</td>'+
      '<td>'+ocBadge(r.status)+'</td><td class="acoes"><button class="btn btn-ghost btn-sm" onclick="ocEditor('+r.id+')">Abrir</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os orçamentos.',e.message); }
}
window.loadOrcamentos=loadOrcamentos;
function ocBadge(s){ const m={ABERTO:'info',ENVIADO:'info',APROVADO:'ok',REPROVADO:'muted',EXPIRADO:'warn',CONVERTIDO:'ok'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }

async function ocEditor(id){
  ocId=id; ocItens=[]; ocCab={};
  const [empresas,clientes,cond]=await Promise.all([lookup('empresas'),lookup('clientes'),lookup('condicoes_pagamento')]);
  if(!ocVend){ const {data}=await sb.rpc('erp_vendedores'); ocVend=data||[]; }
  let idVenda=null;
  if(id){ const {data}=await sb.rpc('erp_orcamento_detalhe',{p_id:id});
    ocCab=(data&&data.cab)||{}; ocItens=((data&&data.itens)||[]).map(x=>({...x})); idVenda=data&&data.orc&&data.orc.id_venda; }
  const st=ocCab.status||'ABERTO'; const bloq=['CONVERTIDO','REPROVADO','EXPIRADO'].includes(st);
  $('#page-title').textContent=id?('Orçamento '+(ocCab.numero||'')):'Novo orçamento';
  let html='<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadOrcamentos()">&larr; Voltar</button>'+
    '<div class="spacer"></div>'+(id?ocBadge(st):'')+'</div>';
  if(st==='CONVERTIDO'&&idVenda) html+='<div class="card card-pad" style="margin-bottom:12px;background:hsl(var(--success-bg))">'+
    'Convertido na venda <b>#'+idVenda+'</b>. As peças foram enviadas como <b>solicitações</b> para o estoque atender.</div>';
  html+='<div class="card card-pad"><div class="form-grid">'+
    '<div class="field"><label>Empresa *</label><select id="oc-emp" '+(id?'disabled':'')+'>'+pdOptions(empresas,ocCab.id_empresa)+'</select></div>'+
    '<div class="field"><label>Cliente *</label><select id="oc-cli" '+(bloq?'disabled':'')+'>'+pdOptions(clientes,ocCab.id_cliente)+'</select></div>'+
    '<div class="field"><label>Vendedor</label><select id="oc-vend" '+(bloq?'disabled':'')+'><option value="">—</option>'+
      (ocVend||[]).map(v=>'<option value="'+v.id+'"'+(String(ocCab.id_vendedor)===String(v.id)?' selected':'')+'>'+esc(v.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Condição de pagamento</label><select id="oc-cond" '+(bloq?'disabled':'')+'>'+pdOptions(cond,ocCab.id_condicao_pagamento)+'</select></div>'+
    '<div class="field"><label>Validade</label><input type="date" id="oc-val" '+(bloq?'disabled':'')+' value="'+esc(ocCab.data_validade?String(ocCab.data_validade).slice(0,10):'')+'"></div>'+
    '<div class="field"><label>Frete</label><input type="number" step="0.01" id="oc-frete" '+(bloq?'disabled':'')+' value="'+(ocCab.valor_frete==null?'':esc(String(ocCab.valor_frete)))+'"></div>'+
    '<div class="field"><label>Desconto</label><input type="number" step="0.01" id="oc-desc" '+(bloq?'disabled':'')+' value="'+(ocCab.valor_desconto==null?'':esc(String(ocCab.valor_desconto)))+'"></div>'+
    '<div class="field full"><label>Observação (cliente)</label><input type="text" id="oc-obs" '+(bloq?'disabled':'')+' value="'+esc(ocCab.observacao||'')+'"></div>'+
    '</div></div>';
  html+='<div class="card card-pad" style="margin-top:12px"><div class="toolbar"><b style="font-size:13px">Itens</b><div class="spacer"></div>'+
    (bloq?'':'<button class="btn btn-sm" onclick="ocAddItem()">+ Item</button>')+'</div><div id="oc-itens"></div>'+
    '<div id="oc-total" style="text-align:right;font-size:13px;margin-top:8px"></div></div>';
  if(!bloq) html+='<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="btn btn-ok" onclick="ocSalvar()">Salvar</button>'+
    (id?'<button class="btn" onclick="ocStatus(\'ENVIADO\')">Marcar enviado</button>':'')+
    (id?'<button class="btn" onclick="ocAprovar()">Aprovar → gerar venda + solicitações</button>':'')+
    (id?'<button class="btn btn-danger" onclick="ocReprovar()">Reprovar</button>':'')+'</div>';
  $('#screen').innerHTML=html;
  ocRenderItens(bloq);
}
window.ocEditor=ocEditor;
async function ocRenderItens(bloq){
  const produtos=await lookup('produtos');
  const box=$('#oc-itens'); if(!box) return;
  let h='<div class="tbl-wrap"><table class="data"><thead><tr><th>Tipo</th><th>Produto</th><th>Descrição</th><th>Qtd</th><th>Vlr unit.</th><th>Desc.</th><th>Total</th>'+(bloq?'':'<th></th>')+'</tr></thead><tbody>';
  if(ocItens.length===0) h+='<tr><td colspan="8"><div class="empty">Sem itens.</div></td></tr>';
  ocItens.forEach((it,ix)=>{
    const tot=(Number(it.quantidade)||0)*(Number(it.valor_unitario)||0)-(Number(it.valor_desconto)||0);
    if(bloq){ h+='<tr><td>'+esc(it.tipo||'PRODUTO')+'</td>'+
      '<td>'+esc((produtos.find(p=>String(p.id)===String(it.id_produto))||{}).nome||'—')+'</td>'+
      '<td>'+esc(it.descricao||'')+'</td><td class="mono">'+fmtNum(it.quantidade)+'</td><td class="mono">'+fmtNum(it.valor_unitario)+'</td>'+
      '<td class="mono">'+fmtNum(it.valor_desconto)+'</td><td class="mono">'+fmtNum(it.valor_total||tot)+'</td></tr>'; return; }
    const isProd=(it.tipo||'PRODUTO')==='PRODUTO';
    h+='<tr><td><select onchange="ocItemSet('+ix+',\'tipo\',this.value)"><option value="PRODUTO"'+(isProd?' selected':'')+'>Produto</option><option value="SERVICO"'+(!isProd?' selected':'')+'>Serviço</option></select></td>'+
      '<td>'+(isProd?'<select onchange="ocItemProd('+ix+',this.value)">'+pdOptions(produtos,it.id_produto)+'</select>':'<span style="color:hsl(var(--text-muted))">—</span>')+'</td>'+
      '<td><input type="text" value="'+esc(it.descricao||'')+'" onchange="ocItemSet('+ix+',\'descricao\',this.value)"></td>'+
      '<td><input type="number" step="0.001" style="width:74px" value="'+esc(it.quantidade||'')+'" onchange="ocItemSet('+ix+',\'quantidade\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:100px" value="'+esc(it.valor_unitario||'')+'" onchange="ocItemSet('+ix+',\'valor_unitario\',this.value)"></td>'+
      '<td><input type="number" step="0.01" style="width:90px" value="'+esc(it.valor_desconto||'')+'" onchange="ocItemSet('+ix+',\'valor_desconto\',this.value)"></td>'+
      '<td class="mono">'+fmtNum(tot)+'</td>'+
      '<td class="acoes"><button class="btn btn-danger btn-sm" onclick="ocDelItem('+ix+')">×</button></td></tr>';
  });
  h+='</tbody></table></div>';
  box.innerHTML=h;
  const tp=ocItens.reduce((s,it)=>s+((Number(it.quantidade)||0)*(Number(it.valor_unitario)||0)-(Number(it.valor_desconto)||0)),0);
  const extra=(Number(($('#oc-frete')||{}).value)||0)-(Number(($('#oc-desc')||{}).value)||0);
  const tel=$('#oc-total'); if(tel) tel.innerHTML='Itens: <b>'+fmtFull(tp)+'</b> &nbsp;·&nbsp; Total: <b>'+fmtFull(tp+extra)+'</b>';
}
function ocAddItem(){ ocItens.push({tipo:'PRODUTO',id_produto:'',descricao:'',quantidade:'',valor_unitario:'',valor_desconto:''}); ocRenderItens(false); }
window.ocAddItem=ocAddItem;
function ocDelItem(ix){ ocItens.splice(ix,1); ocRenderItens(false); }
window.ocDelItem=ocDelItem;
function ocItemSet(ix,k,v){ ocItens[ix][k]=v; if(k==='tipo'&&v==='SERVICO') ocItens[ix].id_produto=''; ocRenderItens(false); }
window.ocItemSet=ocItemSet;
async function ocItemProd(ix,idp){ const produtos=await lookup('produtos'); const p=produtos.find(x=>String(x.id)===String(idp));
  ocItens[ix].id_produto=idp; if(p){ if(!ocItens[ix].descricao) ocItens[ix].descricao=p.nome; if(!ocItens[ix].valor_unitario&&p.preco_venda) ocItens[ix].valor_unitario=p.preco_venda; } ocRenderItens(false); }
window.ocItemProd=ocItemProd;
function ocColeta(){
  return { id:ocId||null, id_empresa:$('#oc-emp').value, id_cliente:$('#oc-cli').value, id_vendedor:$('#oc-vend').value,
    id_condicao_pagamento:$('#oc-cond').value, data_validade:$('#oc-val').value, valor_frete:$('#oc-frete').value,
    valor_desconto:$('#oc-desc').value, observacao:$('#oc-obs').value };
}
async function ocSalvar(){
  try{
    const cab=ocColeta();
    if(!cab.id_empresa||!cab.id_cliente){ toast('Empresa e cliente são obrigatórios','err'); return; }
    const itens=ocItens.filter(i=>Number(i.quantidade)>0&&(i.id_produto||i.descricao)).map(i=>({
      tipo:i.tipo||'PRODUTO', id_produto:(i.tipo||'PRODUTO')==='PRODUTO'?i.id_produto:null, descricao:i.descricao,
      quantidade:i.quantidade, valor_unitario:i.valor_unitario, valor_desconto:i.valor_desconto||0 }));
    if(itens.length===0){ toast('Adicione ao menos um item','err'); return; }
    const {data,error}=await sb.rpc('erp_orcamento_salvar',{p_cab:cab,p_itens:itens});
    if(error) throw error;
    toast(ocId?'Orçamento salvo':'Orçamento criado (#'+data+')','ok'); ocEditor(Number(data));
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ocSalvar=ocSalvar;
async function ocStatus(st){
  try{ const {error}=await sb.rpc('erp_orcamento_status',{p_id:ocId,p_status:st,p_motivo:null}); if(error) throw error;
    toast('Status: '+st,'ok'); ocEditor(ocId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ocStatus=ocStatus;
async function ocReprovar(){
  const motivo=prompt('Motivo da reprovação (opcional):')||null;
  try{ const {error}=await sb.rpc('erp_orcamento_status',{p_id:ocId,p_status:'REPROVADO',p_motivo:motivo}); if(error) throw error;
    toast('Orçamento reprovado','ok'); ocEditor(ocId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ocReprovar=ocReprovar;
async function ocAprovar(){
  if(!await confirmAsync('Aprovar o orçamento? Isso cria a venda e envia as peças como solicitações para o estoque atender.')) return;
  try{
    const {data,error}=await sb.rpc('erp_orcamento_aprovar',{p_id:ocId,p_id_usuario:UID()});
    if(error) throw error;
    toast('Aprovado — venda '+(data.numero_venda||'')+' criada, '+(data.solicitacoes||0)+' solicitação(ões) de peça enviada(s) ao estoque','ok');
    ocEditor(ocId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.ocAprovar=ocAprovar;
