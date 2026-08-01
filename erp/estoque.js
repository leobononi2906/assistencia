/* ERP Bononi — Estoque: Solicitações (fila) e Gôndola */

/* ---------------- SOLICITAÇÕES ---------------- */
async function loadSolicitacoes(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_solicitacoes',p_limit:9999});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>(a.prioridade-b.prioridade)||(a.id-b.id));
    const pend=rows.filter(r=>['PENDENTE','PARCIAL','SEPARANDO'].includes(r.status));
    let html='<div class="grid-kpi">'+
      '<div class="metric"><div class="lbl">Pendentes</div><div class="val">'+pend.length+'</div></div>'+
      '<div class="metric"><div class="lbl">Total na fila</div><div class="val">'+rows.length+'</div></div></div>';
    html+='<div class="toolbar"><input type="search" id="sol-busca" placeholder="Filtrar por produto/doc..." onkeyup="solFiltrar()">'+
      '<select id="sol-status" onchange="solFiltrar()"><option value="pend">Pendentes</option><option value="">Todas</option></select>'+
      '<div class="spacer"></div><button class="btn btn-sm" onclick="solNova()">+ Nova solicitação</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>#</th><th>Origem</th><th>Doc</th><th>Produto</th>'+
      '<th>Solicitado</th><th>Pendente</th><th>Prio.</th><th>Status</th><th>Data</th><th></th></tr></thead><tbody id="sol-body"></tbody></table></div>';
    $('#screen').innerHTML=html;
    window.__solRows=rows; solFiltrar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as solicitações.',e.message); }
}
window.loadSolicitacoes=loadSolicitacoes;
function solFiltrar(){
  const rows=window.__solRows||[]; const q=($('#sol-busca')?$('#sol-busca').value:'').toLowerCase();
  const st=$('#sol-status')?$('#sol-status').value:'pend';
  let f=rows.filter(r=>(String(r.produto||'')+String(r.numero_doc||'')).toLowerCase().includes(q));
  if(st==='pend') f=f.filter(r=>['PENDENTE','PARCIAL','SEPARANDO'].includes(r.status));
  const body=$('#sol-body'); if(!body) return;
  if(f.length===0){ body.innerHTML='<tr><td colspan="10"><div class="empty">Nenhuma solicitação.</div></td></tr>'; return; }
  const badge={PENDENTE:'warn',PARCIAL:'info',SEPARANDO:'info',ATENDIDA:'ok',CANCELADA:'muted'};
  body.innerHTML=f.map(r=>{
    const aberto=['PENDENTE','PARCIAL','SEPARANDO'].includes(r.status);
    return '<tr><td>'+r.id+'</td><td>'+esc(r.origem)+'</td><td>'+esc(r.numero_doc||('#'+r.id_origem))+'</td>'+
      '<td>'+esc(r.produto||'')+'</td><td class="mono">'+fmtNum(r.qtd_solicitada)+'</td>'+
      '<td class="mono">'+fmtNum(r.qtd_pendente)+'</td><td>'+r.prioridade+'</td>'+
      '<td><span class="b-badge b-badge-'+(badge[r.status]||'muted')+'">'+esc(r.status)+'</span></td>'+
      '<td>'+fmtDate(r.data_solicitacao)+'</td>'+
      '<td class="acoes">'+(aberto?('<button class="btn btn-sm" onclick="solAtender('+r.id+','+(Number(r.qtd_pendente)||0)+','+(r.id_centro_estoque||'null')+')">Atender</button> '+
        '<button class="btn btn-danger btn-sm" onclick="solCancelar('+r.id+')">Cancelar</button>'):'')+'</td></tr>';
  }).join('');
}
window.solFiltrar=solFiltrar;

async function solNova(){
  const produtos=await lookup('produtos'); const centros=await lookup('centros_estoque');
  const body='<div class="form-grid">'+
    '<div class="field"><label>Origem *</label><select id="sn-origem"><option value="VENDA">Venda</option><option value="OS">OS</option></select></div>'+
    '<div class="field"><label>ID do documento *</label><input type="number" id="sn-iddoc" placeholder="nº interno da OS/Venda"></div>'+
    '<div class="field full"><label>Produto *</label><select id="sn-prod">'+produtos.map(p=>'<option value="'+p.id+'">'+esc(p.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Quantidade *</label><input type="number" step="0.001" id="sn-qtd"></div>'+
    '<div class="field"><label>Centro estoque</label><select id="sn-centro"><option value="">—</option>'+centros.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field full"><label>Observação</label><input type="text" id="sn-obs"></div>'+
    '<div class="field full"><div class="chk"><input type="checkbox" id="sn-reserva"><span>Reservar estoque</span></div></div></div>';
  openModal('Nova solicitação de produto', body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="solNovaSalvar()">Solicitar</button>');
}
window.solNova=solNova;
async function solNovaSalvar(){
  try{
    const p={ p_origem:$('#sn-origem').value, p_id_origem:Number($('#sn-iddoc').value),
      p_id_produto:Number($('#sn-prod').value), p_qtd:Number($('#sn-qtd').value), p_id_usuario:UID(),
      p_id_centro_estoque:$('#sn-centro').value?Number($('#sn-centro').value):null,
      p_observacao:$('#sn-obs').value||null, p_reservar:$('#sn-reserva').checked };
    const {data,error}=await sb.rpc('erp_solicitar_produto',p);
    if(error) throw error;
    closeModal(); toast('Solicitação criada (#'+data.id_solicitacao+')','ok'); loadSolicitacoes();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.solNovaSalvar=solNovaSalvar;

async function solAtender(id, pendente, idCentro){
  const centros=await lookup('centros_estoque');
  const body='<div class="form-grid">'+
    '<div class="field"><label>Quantidade a atender *</label><input type="number" step="0.001" id="at-qtd" value="'+pendente+'"></div>'+
    '<div class="field"><label>Centro de estoque *</label><select id="at-centro">'+
      centros.map(c=>'<option value="'+c.id+'"'+(String(idCentro)===String(c.id)?' selected':'')+'>'+esc(c.descricao)+'</option>').join('')+'</select></div></div>';
  openModal('Atender solicitação #'+id, body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="solAtenderSalvar('+id+')">Lançar no documento</button>');
}
window.solAtender=solAtender;
async function solAtenderSalvar(id){
  try{
    const {data,error}=await sb.rpc('erp_atender_solicitacao',{p_id_solicitacao:id,
      p_qtd_atendida:Number($('#at-qtd').value),p_id_centro:Number($('#at-centro').value),p_id_usuario:UID()});
    if(error) throw error;
    closeModal(); toast('Atendida ('+data.status+'), item lançado','ok'); loadSolicitacoes();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.solAtenderSalvar=solAtenderSalvar;
async function solCancelar(id){
  if(!await confirmAsync('Cancelar a solicitação #'+id+'?')) return;
  try{ const {error}=await sb.rpc('erp_cancelar_solicitacao',{p_id:id,p_id_usuario:UID(),p_motivo:null});
    if(error) throw error; toast('Solicitação cancelada','ok'); loadSolicitacoes();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.solCancelar=solCancelar;

/* ---------------- GÔNDOLA ---------------- */
async function loadGondola(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_gondola_saldo',p_limit:9999});
    if(error) throw error;
    const rows=data||[];
    let html='<div class="toolbar"><b style="font-size:13px">Saldo da gôndola</b><div class="spacer"></div>'+
      '<button class="btn btn-sm" onclick="gonAbastecer()">Abastecer gôndola</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Gôndola</th><th>Produto</th><th>Ref.</th>'+
      '<th>Disponível</th><th>Reservado</th><th>Preço</th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="6"><div class="empty">Nenhum produto na gôndola. Marque um centro como gôndola em Configurações → Centros de Estoque e abasteça.</div></td></tr>';
    rows.forEach(r=>{ html+='<tr><td>'+esc(r.gondola||'')+'</td><td>'+esc(r.produto||'')+'</td><td>'+esc(r.referencia||'')+'</td>'+
      '<td class="mono">'+fmtNum(r.estoque_disponivel)+'</td><td class="mono">'+fmtNum(r.estoque_reservado)+'</td>'+
      '<td class="mono">'+fmtNum(r.preco_venda)+'</td></tr>'; });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar a gôndola.',e.message); }
}
window.loadGondola=loadGondola;
async function gonAbastecer(){
  const produtos=await lookup('produtos'); const centros=await lookup('centros_estoque');
  const gond=centros.filter(c=>c.gondola), orig=centros.filter(c=>!c.gondola);
  if(gond.length===0){ toast('Nenhum centro marcado como gôndola. Marque em Configurações → Centros de Estoque.','err'); return; }
  const body='<div class="form-grid">'+
    '<div class="field full"><label>Produto *</label><select id="ga-prod">'+produtos.map(p=>'<option value="'+p.id+'">'+esc(p.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Do estoque *</label><select id="ga-orig">'+orig.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Para gôndola *</label><select id="ga-gond">'+gond.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Quantidade *</label><input type="number" step="0.001" id="ga-qtd"></div></div>';
  openModal('Abastecer gôndola', body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="gonAbastecerSalvar()">Transferir</button>');
}
window.gonAbastecer=gonAbastecer;
async function gonAbastecerSalvar(){
  try{
    const {error}=await sb.rpc('erp_gondola_abastecer',{p_id_produto:Number($('#ga-prod').value),
      p_id_centro_origem:Number($('#ga-orig').value),p_id_centro_gondola:Number($('#ga-gond').value),
      p_qtd:Number($('#ga-qtd').value),p_id_usuario:UID()});
    if(error) throw error; closeModal(); toast('Gôndola abastecida','ok'); loadGondola();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.gonAbastecerSalvar=gonAbastecerSalvar;
