/* ERP Bononi — Estoque: Transferências (entre depósitos e empresas) e Inventário */

function ceLabel(c, empresas){
  const e=(empresas||[]).find(x=>String(x.id)===String(c.id_empresa));
  return (c.descricao||('#'+c.id))+' · '+((e&&(e.nome_fantasia||e.nome))||('empresa '+c.id_empresa))+(c.gondola?' (gôndola)':'');
}

/* ================= TRANSFERÊNCIAS ================= */
let tfId=null, tfItens=[], tfCab={};
async function loadTransferencias(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_transferencias',p_limit:500});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><b style="font-size:13px">Transferências de estoque</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="tfEditor(null)">+ Nova transferência</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Origem</th><th>Destino</th><th>Tipo</th>'+
      '<th>Status</th><th>Enviada</th><th>Recebida</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="8"><div class="empty">Nenhuma transferência.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.numero)+'</td>'+
      '<td>'+esc(r.centro_origem||'')+' <span style="color:hsl(var(--text-muted));font-size:11px">'+esc(r.empresa_origem||'')+'</span></td>'+
      '<td>'+esc(r.centro_destino||'')+' <span style="color:hsl(var(--text-muted));font-size:11px">'+esc(r.empresa_destino||'')+'</span></td>'+
      '<td>'+(r.entre_empresas?'<span class="b-badge b-badge-warn">entre empresas</span>':'<span class="b-badge b-badge-muted">interna</span>')+'</td>'+
      '<td>'+tfBadge(r.status)+'</td><td>'+fmtDate(r.data_transferencia)+'</td><td>'+fmtDate(r.data_recebimento)+'</td>'+
      '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick="tfEditor('+r.id+')">Abrir</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as transferências.',e.message); }
}
window.loadTransferencias=loadTransferencias;
function tfBadge(s){ const m={PENDENTE:'warn',ENVIADA:'info',RECEBIDA:'ok',CANCELADA:'muted'}; return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }

async function tfEditor(id){
  tfId=id; tfItens=[]; tfCab={};
  const [centrosR, empresas]=await Promise.all([lookup('centros_estoque'), lookup('empresas')]);
  const centros=centrosR.filter(c=>!c.gondola);
  if(id){ const {data}=await sb.rpc('erp_transferencia_detalhe',{p_id:id});
    tfCab=(data&&data.transf)||{}; tfItens=((data&&data.itens)||[]).map(x=>({id_produto:x.id_produto,quantidade:x.quantidade_solicitada})); }
  const st=tfCab.status||'PENDENTE'; const bloq=st!=='PENDENTE';
  $('#page-title').textContent=id?('Transferência '+(tfCab.numero||'')):'Nova transferência';
  let html='<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadTransferencias()">&larr; Voltar</button><div class="spacer"></div>'+(id?tfBadge(st):'')+'</div>';
  html+='<div class="card card-pad"><div class="form-grid">'+
    '<div class="field"><label>Centro de origem *</label><select id="tf-org" '+(bloq?'disabled':'')+'>'+
      centros.map(c=>'<option value="'+c.id+'"'+(String(tfCab.id_centro_origem)===String(c.id)?' selected':'')+'>'+esc(ceLabel(c,empresas))+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Centro de destino *</label><select id="tf-dst" '+(bloq?'disabled':'')+'>'+
      centros.map(c=>'<option value="'+c.id+'"'+(String(tfCab.id_centro_destino)===String(c.id)?' selected':'')+'>'+esc(ceLabel(c,empresas))+'</option>').join('')+'</select></div>'+
    '<div class="field full"><label>Observação</label><input type="text" id="tf-obs" '+(bloq?'disabled':'')+' value="'+esc(tfCab.observacao||'')+'"></div>'+
    '</div><div style="font-size:11px;color:hsl(var(--text-muted));margin-top:4px">Origem e destino em empresas diferentes = transferência entre empresas (o saldo migra de uma para a outra).</div></div>';
  html+='<div class="card card-pad" style="margin-top:12px"><div class="toolbar"><b style="font-size:13px">Itens</b><div class="spacer"></div>'+
    (bloq?'':'<button class="btn btn-sm" onclick="tfAddItem()">+ Item</button>')+'</div><div id="tf-itens"></div></div>';
  if(!bloq) html+='<div style="margin-top:12px;display:flex;gap:8px">'+
    '<button class="btn btn-ok" onclick="tfSalvar()">Salvar</button>'+
    (id?'<button class="btn" onclick="tfEnviar()">Enviar (baixa origem)</button>':'')+
    (id?'<button class="btn btn-danger" onclick="tfCancelar()">Cancelar</button>':'')+'</div>';
  else if(st==='ENVIADA') html+='<div style="margin-top:12px"><button class="btn btn-ok" onclick="tfReceber()">Receber (entrada destino)</button></div>';
  $('#screen').innerHTML=html;
  tfRenderItens(bloq);
}
window.tfEditor=tfEditor;
async function tfRenderItens(bloq){
  const produtos=await lookup('produtos'); const box=$('#tf-itens'); if(!box) return;
  let h='<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Quantidade</th>'+(bloq?'':'<th></th>')+'</tr></thead><tbody>';
  if(tfItens.length===0) h+='<tr><td colspan="3"><div class="empty">Sem itens.</div></td></tr>';
  tfItens.forEach((it,ix)=>{
    if(bloq){ h+='<tr><td>'+esc((produtos.find(p=>String(p.id)===String(it.id_produto))||{}).nome||'')+'</td><td class="mono">'+fmtNum(it.quantidade)+'</td></tr>'; return; }
    h+='<tr><td><select onchange="tfItemSet('+ix+',\'id_produto\',this.value)">'+pdOptions(produtos,it.id_produto)+'</select></td>'+
      '<td><input type="number" step="0.001" style="width:110px" value="'+esc(it.quantidade||'')+'" onchange="tfItemSet('+ix+',\'quantidade\',this.value)"></td>'+
      '<td class="acoes"><button class="btn btn-danger btn-sm" onclick="tfDelItem('+ix+')">×</button></td></tr>';
  });
  h+='</tbody></table></div>'; box.innerHTML=h;
}
function tfAddItem(){ tfItens.push({id_produto:'',quantidade:''}); tfRenderItens(false); }
window.tfAddItem=tfAddItem;
function tfDelItem(ix){ tfItens.splice(ix,1); tfRenderItens(false); }
window.tfDelItem=tfDelItem;
function tfItemSet(ix,k,v){ tfItens[ix][k]=v; }
window.tfItemSet=tfItemSet;
async function tfSalvar(){
  try{
    const cab={ id:tfId||null, id_centro_origem:$('#tf-org').value, id_centro_destino:$('#tf-dst').value,
      observacao:$('#tf-obs').value, id_usuario:UID() };
    const itens=tfItens.filter(i=>i.id_produto&&Number(i.quantidade)>0).map(i=>({id_produto:i.id_produto,quantidade:i.quantidade}));
    if(itens.length===0){ toast('Adicione ao menos um item','err'); return; }
    const {data,error}=await sb.rpc('erp_transferencia_salvar',{p_cab:cab,p_itens:itens});
    if(error) throw error; toast(tfId?'Transferência salva':'Transferência criada','ok'); tfEditor(Number(data));
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.tfSalvar=tfSalvar;
async function tfEnviar(){
  if(!await confirmAsync('Enviar a transferência? Isso baixa o estoque do centro de origem.')) return;
  try{ const {data,error}=await sb.rpc('erp_transferencia_enviar',{p_id:tfId,p_id_usuario:UID()}); if(error) throw error;
    toast('Enviada — '+(data.itens_enviados||0)+' item(ns) baixados na origem','ok'); tfEditor(tfId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.tfEnviar=tfEnviar;
async function tfReceber(){
  if(!await confirmAsync('Confirmar o recebimento? Isso dá entrada no centro de destino.')) return;
  try{ const {data,error}=await sb.rpc('erp_transferencia_receber',{p_id:tfId,p_id_usuario:UID()}); if(error) throw error;
    toast('Recebida — '+(data.itens_recebidos||0)+' item(ns) no destino','ok'); tfEditor(tfId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.tfReceber=tfReceber;
async function tfCancelar(){
  if(!await confirmAsync('Cancelar esta transferência (pendente)?')) return;
  try{ const {error}=await sb.rpc('erp_transferencia_cancelar',{p_id:tfId}); if(error) throw error; toast('Cancelada','ok'); loadTransferencias();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.tfCancelar=tfCancelar;

/* ================= INVENTÁRIO ================= */
let invId=null;
async function loadInventarios(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_inventarios',p_limit:500});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="toolbar"><b style="font-size:13px">Inventários</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="invNovo()">+ Novo inventário</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Número</th><th>Empresa</th><th>Centro</th><th>Itens</th>'+
      '<th>Contados</th><th>Status</th><th>Início</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="8"><div class="empty">Nenhum inventário.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.numero)+'</td><td>'+esc(r.empresa||'')+'</td><td>'+esc(r.centro||'')+'</td>'+
      '<td class="mono">'+esc(r.itens)+'</td><td class="mono">'+esc(r.contados)+'</td><td>'+invBadge(r.status)+'</td>'+
      '<td>'+fmtDate(r.data_inicio)+'</td><td class="acoes"><button class="btn btn-ghost btn-sm" onclick="invEditor('+r.id+')">Abrir</button></td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os inventários.',e.message); }
}
window.loadInventarios=loadInventarios;
function invBadge(s){ const m={ABERTO:'warn',EM_CONTAGEM:'info',CONFERENCIA:'info',FINALIZADO:'ok',CANCELADO:'muted'}; return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }

async function invNovo(){
  const [centrosR,empresas]=await Promise.all([lookup('centros_estoque'),lookup('empresas')]);
  const centros=centrosR.filter(c=>!c.gondola);
  const b='<div class="form-grid">'+
    '<div class="field full"><label>Centro de estoque *</label><select id="iv-centro">'+
      centros.map(c=>'<option value="'+c.id+'" data-emp="'+c.id_empresa+'">'+esc(ceLabel(c,empresas))+'</option>').join('')+'</select></div>'+
    '<div class="field full" style="font-size:12px;color:hsl(var(--text-muted))">Ao criar, o sistema tira uma "foto" dos saldos atuais do centro para você contar.</div></div>';
  openModal('Novo inventário', b, '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="invCriar()">Criar e abrir</button>');
}
window.invNovo=invNovo;
async function invCriar(){
  try{
    const sel=$('#iv-centro'); const centro=Number(sel.value); const emp=Number(sel.selectedOptions[0].dataset.emp);
    const {data,error}=await sb.rpc('erp_inventario_criar',{p_id_empresa:emp,p_id_centro:centro,p_id_usuario:UID()});
    if(error) throw error; closeModal(); toast('Inventário criado','ok'); invEditor(Number(data));
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.invCriar=invCriar;

async function invEditor(id){
  invId=id;
  const {data,error}=await sb.rpc('erp_inventario_detalhe',{p_id:id});
  if(error){ $('#screen').innerHTML=errBox('Erro ao abrir inventário.',error.message); return; }
  const inv=(data&&data.inv)||{}, itens=(data&&data.itens)||[];
  const bloq=['FINALIZADO','CANCELADO'].includes(inv.status);
  $('#page-title').textContent='Inventário '+(inv.numero||'');
  let html='<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadInventarios()">&larr; Voltar</button>'+
    '<div class="spacer"></div>'+invBadge(inv.status)+'</div>'+
    '<div class="card card-pad" style="margin-bottom:12px;font-size:13px">Empresa <b>'+esc(inv.empresa||'')+'</b> · Centro <b>'+esc(inv.centro||'')+'</b> · '+
    esc(inv.contados||0)+'/'+esc(inv.itens||0)+' itens contados</div>';
  html+='<div class="toolbar">'+(bloq?'':'<button class="btn btn-sm" onclick="invAddItem()">+ Produto</button>')+
    '<span style="font-size:11px;color:hsl(var(--text-muted));margin-left:8px">Regra: o item encerra quando a contagem repete a referência (o saldo do sistema na 1ª contagem, ou a contagem anterior nas seguintes).</span>'+
    '<div class="spacer"></div>'+
    (bloq?'':'<button class="btn btn-ok" onclick="invAjustar(false)">Finalizar e ajustar estoque</button>')+'</div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Produto</th><th>Ref.</th><th>Sistema</th><th>Nova contagem</th>'+
    '<th>Última</th><th>Contagens</th><th>Diferença</th><th>Situação</th></tr></thead><tbody>';
  if(itens.length===0) html+='<tr><td colspan="8"><div class="empty">Sem itens.</div></td></tr>';
  itens.forEach(it=>{
    const dif=(it.qtd_contada==null||!it.encerrado)?null:(Number(it.qtd_contada)-Number(it.saldo_sistema||0));
    const sit = it.ajustado?'<span class="b-badge b-badge-ok">ajustado</span>'
      : it.encerrado?'<span class="b-badge b-badge-ok">encerrado</span>'
      : (it.num_contagens>0?'<span class="b-badge b-badge-warn">recontar</span>':'<span class="b-badge b-badge-muted">a contar</span>');
    html+='<tr><td>'+esc(it.produto||'')+'</td><td>'+esc(it.referencia||'')+'</td>'+
      '<td class="mono">'+fmtNum(it.saldo_sistema)+'</td>'+
      '<td>'+((bloq||it.ajustado)?'<span style="color:hsl(var(--text-muted))">—</span>'
        :'<input type="number" step="0.001" style="width:100px" placeholder="contar" onkeydown="if(event.key===\'Enter\')invContar('+it.id+',this.value)" onchange="invContar('+it.id+',this.value)">')+'</td>'+
      '<td class="mono">'+(it.qtd_contada==null?'—':fmtNum(it.qtd_contada))+'</td>'+
      '<td class="mono" style="text-align:center">'+(it.num_contagens||0)+'</td>'+
      '<td class="mono" style="color:'+(dif==null?'inherit':(dif<0?'hsl(var(--destructive))':(dif>0?'hsl(var(--success))':'inherit')))+'">'+(dif==null?'—':fmtNum(dif))+'</td>'+
      '<td>'+sit+'</td></tr>';
  });
  html+='</tbody></table></div>';
  $('#screen').innerHTML=html;
}
window.invEditor=invEditor;
async function invContar(idItem, qtd){
  if(qtd===''||qtd==null) return;
  try{
    const {data,error}=await sb.rpc('erp_inventario_contar',{p_id_item:idItem,p_qtd:Number(qtd)});
    if(error) throw error;
    toast((data&&data.mensagem)||'Contagem registrada', data&&data.encerrado?'ok':'');
    invEditor(invId); // atualiza situação (encerrado / recontar) e diferença
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.invContar=invContar;
async function invAddItem(){
  const produtos=await lookup('produtos');
  const b='<div class="field full"><label>Produto</label><select id="ia-prod">'+pdOptions(produtos,'')+'</select></div>';
  openModal('Adicionar produto ao inventário', b, '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="invAddItemSalvar()">Adicionar</button>');
}
window.invAddItem=invAddItem;
async function invAddItemSalvar(){
  try{ const p=Number($('#ia-prod').value); if(!p){ toast('Selecione um produto','err'); return; }
    const {error}=await sb.rpc('erp_inventario_add_item',{p_id_inventario:invId,p_id_produto:p}); if(error) throw error;
    closeModal(); invEditor(invId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.invAddItemSalvar=invAddItemSalvar;
async function invAjustar(forcar){
  if(!await confirmAsync('Finalizar o inventário e ajustar o estoque com as diferenças dos itens encerrados?')) return;
  try{
    const {data,error}=await sb.rpc('erp_inventario_ajustar',{p_id:invId,p_id_usuario:UID(),p_forcar:!!forcar});
    if(error) throw error;
    toast('Inventário finalizado — '+(data.itens_ajustados||0)+' ajuste(s) no estoque','ok'); invEditor(invId);
  }catch(e){
    const msg=(e.message||String(e));
    if(/divergente/i.test(msg)){
      if(await confirmAsync(msg+'\n\nDeseja finalizar mesmo assim, aplicando a última contagem desses itens?')) return invAjustar(true);
      return;
    }
    toast('Erro: '+msg,'err');
  }
}
window.invAjustar=invAjustar;
