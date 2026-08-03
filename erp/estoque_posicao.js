/* ERP Bononi — Estoque: Posição (saldo por produto/centro, com split contábil × não-contábil)
   Centros marcados como "não contabiliza" (ex.: Garantia) não somam no saldo vendável/contábil. */

let epRows=[], epTot={}, epDet=false;

async function loadPosicaoEstoque(){
  try{
    $('#screen').innerHTML=skeletonTable();
    const [empresas,grupos]=await Promise.all([lookup('empresas'), lookup('grupos_produto')]);
    let html='<div class="card card-pad" style="margin-bottom:14px"><div class="form-grid" style="grid-template-columns:repeat(4,1fr)">'+
      '<div class="field"><label>Empresa</label><select id="ep-emp" onchange="epCentros();epBuscar()"><option value="">Todas</option>'+pdOptions(empresas,'',false)+'</select></div>'+
      '<div class="field"><label>Centro de estoque</label><select id="ep-centro" onchange="epBuscar()"><option value="">Todos</option></select></div>'+
      '<div class="field"><label>Grupo</label><select id="ep-grupo" onchange="epBuscar()"><option value="">Todos</option>'+grupos.map(g=>'<option value="'+g.id+'">'+esc(pdLabel(g))+'</option>').join('')+'</select></div>'+
      '<div class="field"><label>Buscar produto</label><input type="search" id="ep-busca" placeholder="nome ou referência" onkeydown="if(event.key===\'Enter\')epBuscar()"></div>'+
      '<div class="field"><label>&nbsp;</label><label class="chk" style="height:37px"><input type="checkbox" id="ep-comsaldo" checked onchange="epBuscar()"> Só com saldo</label></div>'+
      '<div class="field"><label>&nbsp;</label><label class="chk" style="height:37px"><input type="checkbox" id="ep-det" onchange="epBuscar()"> Detalhar por centro</label></div>'+
      '<div class="field"><label>&nbsp;</label><button class="btn" onclick="epBuscar()">Atualizar</button></div>'+
      '</div></div>'+
      '<div id="ep-kpi" class="grid-kpi"></div><div id="ep-lista"></div>';
    $('#screen').innerHTML=html;
    epCentros();
    epBuscar();
  }catch(e){ bononiLog('ERRO','LOAD_POSICAO',{erro:e&&e.message});
    $('#screen').innerHTML=errBox('Não foi possível abrir a posição de estoque.',e.message); }
}
window.loadPosicaoEstoque=loadPosicaoEstoque;

async function epCentros(){
  const centros=await lookup('centros_estoque'); const emp=($('#ep-emp')||{}).value;
  const lista=centros.filter(c=>!emp||String(c.id_empresa)===String(emp));
  const sel=$('#ep-centro'); if(!sel) return;
  sel.innerHTML='<option value="">Todos</option>'+lista.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+(c.contabiliza===false?' (não contábil)':'')+'</option>').join('');
}
window.epCentros=epCentros;

function epVal(sel){ const v=($(sel)||{}).value; return v?Number(v):null; }

async function epBuscar(){
  const box=$('#ep-lista'); if(!box) return;
  box.innerHTML='<div class="card card-pad"><div class="skel" style="width:100%;height:26px;margin-bottom:8px"></div><div class="skel" style="width:100%;height:26px"></div></div>';
  try{
    epDet=$('#ep-det').checked;
    const {data,error}=await sb.rpc('erp_estoque_posicao',{
      p_id_empresa:epVal('#ep-emp'), p_id_centro:epVal('#ep-centro'), p_id_grupo:epVal('#ep-grupo'),
      p_busca:($('#ep-busca').value||'').trim()||null, p_somente_com_saldo:$('#ep-comsaldo').checked,
      p_detalhado:epDet });
    if(error) throw error;
    epRows=(data&&data.itens)||[]; epTot=(data&&data.totais)||{};
    epRender();
  }catch(e){ bononiLog('ERRO','POSICAO_LISTAR',{erro:e&&e.message});
    box.innerHTML=errBox('Falha ao carregar a posição de estoque.',e.message); }
}
window.epBuscar=epBuscar;

function epRender(){
  const kpi=$('#ep-kpi');
  if(epDet){
    kpi.innerHTML='<div class="metric"><div class="lbl">Linhas</div><div class="val">'+epRows.length+'</div></div>';
  }else{
    kpi.innerHTML=
      '<div class="metric"><div class="lbl">Produtos</div><div class="val">'+(epTot.produtos||0)+'</div></div>'+
      '<div class="metric"><div class="lbl">Valor contábil</div><div class="val">'+fmtFull(epTot.valor_contabil)+'</div></div>'+
      '<div class="metric"><div class="lbl">Valor não-contábil</div><div class="val" style="color:hsl(var(--warning))">'+fmtFull(epTot.valor_nao_contabil)+'</div></div>'+
      '<div class="metric"><div class="lbl">Itens em não-contábil</div><div class="val">'+(epTot.itens_nao_contabil||0)+'</div></div>';
  }
  const box=$('#ep-lista');
  if(epRows.length===0){ box.innerHTML='<div class="card"><div class="empty">Nenhum item para os filtros escolhidos.</div></div>'; return; }
  let h='<div class="tbl-wrap"><table class="data"><thead><tr>';
  if(epDet){
    h+='<th>Ref.</th><th>Produto</th><th>Empresa</th><th>Centro</th><th>Saldo</th><th>Reserv.</th><th>Dispon.</th><th>Custo méd.</th><th>Valor</th>';
  }else{
    h+='<th>Ref.</th><th>Produto</th><th>Contábil</th><th>Reserv.</th><th>Dispon.</th><th>A chegar</th><th>Não-contábil</th><th>Custo méd.</th><th>Valor contábil</th>';
  }
  h+='</tr></thead><tbody>';
  epRows.forEach(r=>{
    if(epDet){
      const naoConta=r.contabiliza===false;
      h+='<tr><td class="mono">'+esc(r.referencia||'')+'</td>'+
        '<td><span class="doc-link" onclick="abrirDoc(\'produto\','+r.id_produto+')">'+esc(r.nome||'')+'</span></td>'+
        '<td>'+esc(r.empresa||'')+'</td>'+
        '<td>'+esc(r.centro||'')+(naoConta?' <span class="b-badge b-badge-warn">não conta</span>':'')+'</td>'+
        '<td class="mono">'+fmtNum(r.estoque_atual)+'</td><td class="mono">'+fmtNum(r.reservado)+'</td>'+
        '<td class="mono">'+fmtNum(r.disponivel)+'</td><td class="mono">'+fmtNum(r.custo_medio)+'</td>'+
        '<td class="mono">'+fmtFull(r.valor)+'</td></tr>';
    }else{
      const nc=Number(r.estoque_nao_contabil)||0;
      h+='<tr><td class="mono">'+esc(r.referencia||'')+'</td>'+
        '<td><span class="doc-link" onclick="abrirDoc(\'produto\','+r.id_produto+')">'+esc(r.nome||'')+'</span>'+
          (r.grupo?('<div style="font-size:11px;color:hsl(var(--text-muted))">'+esc(r.grupo)+'</div>'):'')+'</td>'+
        '<td class="mono">'+fmtNum(r.estoque_contabil)+'</td><td class="mono">'+fmtNum(r.reservado)+'</td>'+
        '<td class="mono">'+fmtNum(r.disponivel)+'</td>'+
        '<td class="mono"'+(Number(r.a_chegar)>0?' style="color:hsl(var(--blue-mid));font-weight:700" title="Próxima previsão: '+(r.proxima_entrada?fmtDate(r.proxima_entrada):'—')+'"':'')+'>'+
          (Number(r.a_chegar)>0?('+'+fmtNum(r.a_chegar)+(r.proxima_entrada?(' <span style="font-size:10px;color:hsl(var(--text-muted));font-weight:400">'+fmtDate(r.proxima_entrada)+'</span>'):'')):'—')+'</td>'+
        '<td class="mono"'+(nc>0?' style="color:hsl(var(--warning));font-weight:700"':'')+'>'+(nc>0?fmtNum(nc):'—')+'</td>'+
        '<td class="mono">'+fmtNum(r.custo_medio)+'</td><td class="mono">'+fmtFull(r.valor_contabil)+'</td></tr>';
    }
  });
  h+='</tbody></table></div>';
  h+='<div style="font-size:11px;color:hsl(var(--text-muted));margin-top:8px">Centros marcados como <b>não contábil</b> (ex.: Garantia) não entram no saldo contábil/disponível nem na análise de demanda. Marque em Configurações → Centros de Estoque (campo “contabiliza”).</div>';
  box.innerHTML=h;
}
