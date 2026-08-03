/* ERP Bononi — Compras: Demanda / Sugestão de Compra
   Analisa a demanda (reposição mín/máx e/ou giro/consumo) com filtros por empresa,
   grupo, subgrupo, fornecedor e busca; permite alterar mínimo/máximo na hora e
   formar o pedido de compra marcando itens (1 pedido por fornecedor). */

let dmRows=[];                 // linhas retornadas pela análise
const dmSel=new Set();         // id_produto marcados
const dmQtd={};                // override manual de quantidade por id_produto
const dmForn={};               // override de fornecedor por id_produto (quando sem principal)
let dmFiltros={grupos:[],subgrupos:[]};

function dmUrg(u){ const m={CRITICO:'err',ALERTA:'warn',OK:'ok'};
  return '<span class="b-badge b-badge-'+(m[u]||'muted')+'">'+esc(u||'')+'</span>'; }
function dmEffQtd(r){ const o=dmQtd[r.id_produto]; return o==null?Number(r.sugestao_qtd)||0:Number(o)||0; }
function dmEffForn(r){ return dmForn[r.id_produto]!=null?dmForn[r.id_produto]:(r.id_fornecedor||''); }

async function loadDemanda(){
  try{
    $('#screen').innerHTML=skeletonTable();
    const [empresas,filtros]=await Promise.all([ lookup('empresas'), sb.rpc('erp_demanda_filtros') ]);
    dmFiltros=(filtros&&filtros.data)||{grupos:[],subgrupos:[]};
    let html=''+
      '<div class="card card-pad" style="margin-bottom:14px">'+
      '<div class="form-grid" style="grid-template-columns:repeat(4,1fr)">'+
        '<div class="field"><label>Empresa</label><select id="dm-emp" onchange="dmAnalisar()">'+
          '<option value="">Todas</option>'+pdOptions(empresas,'',false)+'</select></div>'+
        '<div class="field"><label>Modo de análise</label><select id="dm-modo" onchange="dmAnalisar()">'+
          '<option value="ambos">Reposição + Giro</option>'+
          '<option value="reposicao">Reposição (mín/máx)</option>'+
          '<option value="giro">Giro (consumo)</option></select></div>'+
        '<div class="field"><label>Grupo</label><select id="dm-grupo" onchange="dmGrupoChange()">'+
          '<option value="">Todos</option>'+dmFiltros.grupos.map(g=>'<option value="'+g.id+'">'+esc(g.descricao)+'</option>').join('')+'</select></div>'+
        '<div class="field"><label>Subgrupo</label><select id="dm-subgrupo" onchange="dmAnalisar()"><option value="">Todos</option></select></div>'+
        '<div class="field"><label>Fornecedor</label><select id="dm-forn" onchange="dmAnalisar()"><option value="">Todos</option></select></div>'+
        '<div class="field"><label>Urgência</label><select id="dm-urg" onchange="dmAnalisar()">'+
          '<option value="">Todas</option><option value="CRITICO">Crítico</option>'+
          '<option value="ALERTA">Alerta</option><option value="OK">OK</option></select></div>'+
        '<div class="field"><label>Buscar produto</label><input type="search" id="dm-busca" placeholder="nome ou referência" onkeydown="if(event.key===\'Enter\')dmAnalisar()"></div>'+
        '<div class="field"><label>&nbsp;</label><label class="chk" style="height:37px"><input type="checkbox" id="dm-somente" checked onchange="dmAnalisar()"> Só itens em demanda</label></div>'+
      '</div>'+
      '<div class="form-grid" style="grid-template-columns:repeat(4,1fr);margin-top:6px">'+
        '<div class="field"><label>Janela de consumo (dias)</label><input type="number" id="dm-dias" value="90" min="1" onchange="dmAnalisar()"></div>'+
        '<div class="field"><label>Lead time (dias)</label><input type="number" id="dm-lead" value="15" min="0" onchange="dmAnalisar()"></div>'+
        '<div class="field"><label>Estoque desejado (dias)</label><input type="number" id="dm-alvo" value="30" min="0" onchange="dmAnalisar()"></div>'+
        '<div class="field"><label>&nbsp;</label><button class="btn" onclick="dmAnalisar()">Analisar demanda</button></div>'+
      '</div></div>'+
      '<div id="dm-kpi" class="grid-kpi"></div>'+
      '<div id="dm-lista"></div>'+
      '<div id="dm-rodape" style="margin-top:12px"></div>';
    $('#screen').innerHTML=html;
    dmFornSelect(empresas);
    dmAnalisar();
  }catch(e){ bononiLog('ERRO','LOAD_DEMANDA',{erro:e&&e.message});
    $('#screen').innerHTML=errBox('Não foi possível abrir a análise de demanda.',e.message); }
}
window.loadDemanda=loadDemanda;

async function dmFornSelect(){
  const forn=await lookup('fornecedores'); const sel=$('#dm-forn'); if(!sel) return;
  sel.innerHTML='<option value="">Todos</option>'+pdOptions(forn,'',false);
}
function dmGrupoChange(){
  const g=$('#dm-grupo').value; const sub=$('#dm-subgrupo');
  const lista=dmFiltros.subgrupos.filter(s=>!g||String(s.id_grupo)===String(g));
  sub.innerHTML='<option value="">Todos</option>'+lista.map(s=>'<option value="'+s.id+'">'+esc(s.descricao)+'</option>').join('');
  dmAnalisar();
}
window.dmGrupoChange=dmGrupoChange;

async function dmAnalisar(){
  const box=$('#dm-lista'); if(!box) return;
  box.innerHTML='<div class="card card-pad"><div class="skel" style="width:100%;height:26px;margin-bottom:8px"></div>'+
    '<div class="skel" style="width:100%;height:26px;margin-bottom:8px"></div><div class="skel" style="width:100%;height:26px"></div></div>';
  try{
    const p={ p_id_empresa:val('#dm-emp'), p_dias:numOr('#dm-dias',90), p_modo:$('#dm-modo').value,
      p_id_grupo:val('#dm-grupo'), p_id_subgrupo:val('#dm-subgrupo'), p_id_fornecedor:val('#dm-forn'),
      p_busca:($('#dm-busca').value||'').trim()||null, p_urgencia:$('#dm-urg').value||null,
      p_cobertura_alvo:numOr('#dm-alvo',30), p_lead_time:numOr('#dm-lead',15),
      p_somente_demanda:$('#dm-somente').checked };
    const {data,error}=await sb.rpc('erp_demanda_listar',p);
    if(error) throw error;
    dmRows=Array.isArray(data)?data:[];
    dmRender();
  }catch(e){ bononiLog('ERRO','DEMANDA_LISTAR',{erro:e&&e.message});
    box.innerHTML=errBox('Falha ao analisar a demanda.',e.message); }
}
window.dmAnalisar=dmAnalisar;
function val(sel){ const v=($(sel)||{}).value; return v?Number(v):null; }
function numOr(sel,def){ const v=Number(($(sel)||{}).value); return v>0?v:def; }

function dmRender(){
  const modo=$('#dm-modo').value;
  // KPIs
  const nCrit=dmRows.filter(r=>r.urgencia==='CRITICO').length;
  const nAlert=dmRows.filter(r=>r.urgencia==='ALERTA').length;
  const totalCompra=dmRows.reduce((s,r)=>s+(Number(r.sugestao_qtd)||0)*(Number(r.preco_custo)||0),0);
  $('#dm-kpi').innerHTML=
    '<div class="metric"><div class="lbl">Itens na análise</div><div class="val">'+dmRows.length+'</div></div>'+
    '<div class="metric"><div class="lbl">Críticos</div><div class="val" style="color:hsl(var(--destructive))">'+nCrit+'</div></div>'+
    '<div class="metric"><div class="lbl">Alertas</div><div class="val" style="color:hsl(var(--warning))">'+nAlert+'</div></div>'+
    '<div class="metric"><div class="lbl">Compra sugerida (custo)</div><div class="val">'+fmtFull(totalCompra)+'</div></div>';

  const box=$('#dm-lista');
  if(dmRows.length===0){ box.innerHTML='<div class="card"><div class="empty">Nenhum item para os filtros escolhidos.<br>Ajuste os filtros ou desmarque “Só itens em demanda” para revisar e editar mínimo/máximo.</div></div>';
    dmResumo(); return; }
  const colSug = modo==='giro'?'Sug. giro':(modo==='reposicao'?'Sug. repo':'Sugestão');
  let h='<div class="tbl-wrap"><table class="data"><thead><tr>'+
    '<th style="width:32px"><input type="checkbox" onchange="dmToggleAll(this.checked)"></th>'+
    '<th>Referência</th><th>Produto</th><th>Fornecedor</th><th>Estoque</th>'+
    '<th title="Estoque mínimo — editável">Mín.</th><th title="Estoque máximo — editável">Máx.</th>'+
    '<th>Cons./dia</th><th title="Dias de cobertura no ritmo atual">Cobert.</th>'+
    '<th>'+colSug+'</th><th title="Quantidade a comprar (editável)">Comprar</th><th>Custo un.</th><th>Urgência</th></tr></thead><tbody>';
  dmRows.forEach(r=>{
    const id=r.id_produto, sub=r.subgrupo?(' · '+esc(r.subgrupo)):'';
    const cob=Number(r.cobertura_dias)>=999?'—':fmtNum(r.cobertura_dias);
    const sug = modo==='giro'?r.sugestao_giro:(modo==='reposicao'?r.sugestao_reposicao:r.sugestao_qtd);
    const fornCell = r.id_fornecedor
      ? esc(r.fornecedor||('#'+r.id_fornecedor))
      : '<select onchange="dmSetForn('+id+',this.value)" style="max-width:150px"><option value="">— definir —</option>'+dmFornOpts(dmForn[id])+'</select>';
    h+='<tr'+(dmSel.has(id)?' style="background:hsl(var(--blue-pale))"':'')+'>'+
      '<td><input type="checkbox" '+(dmSel.has(id)?'checked':'')+' onchange="dmToggle('+id+',this.checked)"></td>'+
      '<td class="mono">'+esc(r.referencia||'')+'</td>'+
      '<td><span class="doc-link" onclick="abrirDoc(\'produto\','+id+')">'+esc(r.nome||'')+'</span>'+
        '<div style="font-size:11px;color:hsl(var(--text-muted))">'+esc(r.grupo||'—')+sub+'</div></td>'+
      '<td>'+fornCell+'</td>'+
      '<td class="mono">'+fmtNum(r.estoque_atual)+'</td>'+
      '<td><input type="number" step="0.001" style="width:70px" value="'+esc(String(r.estoque_minimo??''))+'" onchange="dmSalvarLimite('+id+',\'min\',this.value)"></td>'+
      '<td><input type="number" step="0.001" style="width:70px" value="'+esc(String(r.estoque_maximo??''))+'" onchange="dmSalvarLimite('+id+',\'max\',this.value)"></td>'+
      '<td class="mono">'+fmtNum(r.consumo_dia)+'</td>'+
      '<td class="mono">'+cob+'</td>'+
      '<td class="mono">'+fmtNum(sug)+'</td>'+
      '<td><input type="number" step="0.001" style="width:80px" value="'+esc(String(dmEffQtd(r)))+'" onchange="dmSetQtd('+id+',this.value)"></td>'+
      '<td class="mono">'+fmtFull(r.preco_custo)+'</td>'+
      '<td>'+dmUrg(r.urgencia)+'</td></tr>';
  });
  h+='</tbody></table></div>';
  box.innerHTML=h;
  dmResumo();
}

function dmFornOpts(sel){
  const forn=lookupCache['fornecedores']||[];
  return forn.map(f=>'<option value="'+f.id+'"'+(String(sel)===String(f.id)?' selected':'')+'>'+esc(pdLabel(f))+'</option>').join('');
}
function dmToggle(id,ch){ if(ch) dmSel.add(id); else dmSel.delete(id); dmRender(); }
window.dmToggle=dmToggle;
function dmToggleAll(ch){ dmSel.clear(); if(ch) dmRows.forEach(r=>dmSel.add(r.id_produto)); dmRender(); }
window.dmToggleAll=dmToggleAll;
function dmSetQtd(id,v){ dmQtd[id]=v; dmResumo(); }
window.dmSetQtd=dmSetQtd;
function dmSetForn(id,v){ dmForn[id]=v?Number(v):null; dmResumo(); }
window.dmSetForn=dmSetForn;

async function dmSalvarLimite(id,campo,v){
  try{
    const num=(v===''||v==null)?null:Number(v);
    const p={p_id:id, p_min:campo==='min'?num:null, p_max:campo==='max'?num:null, p_id_usuario:UID()};
    const {data,error}=await sb.rpc('erp_produto_estoque_limites',p);
    if(error) throw error;
    // reflete o novo limite na linha e recalcula a análise (sugestão/urgência dependem do mín/máx)
    const row=dmRows.find(r=>r.id_produto===id);
    if(row&&data){ row.estoque_minimo=data.estoque_minimo; row.estoque_maximo=data.estoque_maximo; }
    toast('Limite atualizado','ok');
    dmAnalisar();
  }catch(e){ toast('Erro ao salvar limite: '+(e.message||e),'err'); dmAnalisar(); }
}
window.dmSalvarLimite=dmSalvarLimite;

function dmResumo(){
  const rod=$('#dm-rodape'); if(!rod) return;
  const sel=dmRows.filter(r=>dmSel.has(r.id_produto));
  const comQtd=sel.filter(r=>dmEffQtd(r)>0);
  const total=comQtd.reduce((s,r)=>s+dmEffQtd(r)*(Number(r.preco_custo)||0),0);
  const semForn=comQtd.filter(r=>!dmEffForn(r)).length;
  const fornSet=new Set(comQtd.map(r=>String(dmEffForn(r))).filter(Boolean));
  const podeGerar=can('COMPRAS','incluir');
  rod.innerHTML='<div class="card card-pad" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'+
    '<div><b>'+comQtd.length+'</b> item(ns) marcado(s) · <b>'+fmtFull(total)+'</b>'+
      (fornSet.size?(' · '+fornSet.size+' fornecedor(es) → '+fornSet.size+' pedido(s)'):'')+
      (semForn?(' · <span style="color:hsl(var(--destructive))">'+semForn+' sem fornecedor</span>'):'')+'</div>'+
    '<div class="spacer" style="flex:1"></div>'+
    (podeGerar?'<button class="btn btn-ok" onclick="dmGerarPedidos()" '+(comQtd.length?'':'disabled')+'>Gerar pedido(s) de compra</button>'
              :'<span style="font-size:12px;color:hsl(var(--text-muted))">Sem permissão para incluir compras</span>')+'</div>';
}

async function dmGerarPedidos(){
  const sel=dmRows.filter(r=>dmSel.has(r.id_produto) && dmEffQtd(r)>0);
  if(sel.length===0){ toast('Marque itens e informe a quantidade','err'); return; }
  const semForn=sel.filter(r=>!dmEffForn(r));
  if(semForn.length){ toast('Há '+semForn.length+' item(ns) sem fornecedor. Defina o fornecedor na linha.','err'); return; }
  const emp=val('#dm-emp');
  if(!emp){ toast('Selecione a empresa para gerar o pedido','err'); return; }
  if(!await confirmAsync('Gerar pedido(s) de compra com '+sel.length+' item(ns)? Um pedido por fornecedor (status PENDENTE).')) return;
  try{
    const itens=sel.map(r=>({ id_produto:r.id_produto, id_fornecedor:dmEffForn(r), descricao:r.nome,
      referencia_fornecedor:r.referencia_fornecedor||null, quantidade:dmEffQtd(r), valor_unitario:Number(r.preco_custo)||0 }));
    const {data,error}=await sb.rpc('erp_demanda_gerar_pedidos',{p_itens:itens,p_id_empresa:emp,p_id_usuario:UID()});
    if(error) throw error;
    const peds=(data&&data.pedidos)||[];
    toast(peds.length+' pedido(s) gerado(s): '+peds.map(p=>p.numero).join(', '),'ok');
    dmSel.clear(); Object.keys(dmQtd).forEach(k=>delete dmQtd[k]);
    if(peds.length && await confirmAsync('Pedido(s) '+peds.map(p=>p.numero).join(', ')+' criado(s). Abrir a lista de Pedidos de Compra?')){
      nav('pedidos_compra'); return;
    }
    dmAnalisar();
  }catch(e){ bononiLog('ERRO','DEMANDA_GERAR',{erro:e&&e.message}); toast('Erro: '+(e.message||e),'err'); }
}
window.dmGerarPedidos=dmGerarPedidos;
