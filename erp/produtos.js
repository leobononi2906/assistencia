/* ERP Bononi — Produtos: tela única (Identidade global + Preço por empresa + Fiscal por empresa) */

/* rótulo amigável para linhas de lookup */
function pdLabel(r){
  const c=['nome','descricao','razao_social','nome_fantasia','sigla','codigo'].find(k=>r&&r[k]!=null&&r[k]!=='');
  return (c?String(r[c]):('#'+r.id));
}
function pdOptions(rows, val, incluiVazio){
  return (incluiVazio!==false?'<option value="">— selecione —</option>':'')+
    (rows||[]).map(o=>'<option value="'+o.id+'"'+(String(val)===String(o.id)?' selected':'')+'>'+esc(pdLabel(o))+'</option>').join('');
}

/* estado da tela */
let pdEmpresa=null;          // empresa selecionada (preço/fiscal)
let pdProdutoId=null;        // produto em edição
let pdFull=null;             // cache do erp_produto_full atual

/* ---------------- LISTA ---------------- */
async function loadProdutos(busca){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'produtos',p_busca:busca||null,p_limit:500,p_offset:0});
    if(error) throw error;
    const rows=data||[]; window.__prodRows=rows;
    let html='<div class="toolbar">'+
      '<input type="search" id="pd-busca" placeholder="Buscar produto (nome, referência, EAN)..." value="'+esc(busca||'')+'" onkeydown="if(event.key===\'Enter\')loadProdutos(this.value)">'+
      '<button class="btn btn-ghost btn-sm" onclick="loadProdutos($(\'#pd-busca\').value)">Buscar</button>'+
      '<div class="spacer"></div>'+permBtn('PRODUTOS','incluir','<button class="btn btn-sm" onclick="pdEditor(null)">+ Novo produto</button>')+'</div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>#</th><th>Referência</th><th>Nome</th>'+
      '<th>NCM</th><th>Preço venda</th><th>Situação</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="7"><div class="empty">Nenhum produto encontrado.</div></td></tr>';
    rows.forEach(r=>{
      html+='<tr><td>'+r.id+'</td><td>'+esc(r.referencia||'')+'</td><td>'+esc(r.nome||'')+'</td>'+
        '<td class="mono">'+esc(r.ncm||'—')+'</td><td class="mono">'+fmtNum(r.preco_venda)+'</td>'+
        '<td><span class="b-badge b-badge-'+(String(r.situacao||'').toUpperCase()==='ATIVO'?'ok':'muted')+'">'+esc(r.situacao||'')+'</span></td>'+
        '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick="etiquetaProdutoDialog('+r.id+')">Etiqueta</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="pdEditor('+r.id+')">Abrir</button></td></tr>';
    });
    html+='</tbody></table></div><div style="font-size:11px;color:hsl(var(--text-muted));margin-top:8px">'+rows.length+' produto(s)</div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os produtos.',e.message); }
}
window.loadProdutos=loadProdutos;

/* ---------------- EDITOR (tela única) ---------------- */
async function pdEditor(id, opts){
  opts=opts||{};
  pdProdutoId=id; pdFull=null;
  const empresas=await lookup('empresas');
  if(!pdEmpresa && empresas[0]) pdEmpresa=empresas[0].id;
  const inModal=!!opts.modal && typeof modalBody==='function' && modalBody();
  const tgt = inModal ? modalBody() : $('#screen');
  if(inModal) modalSetTitle(id?'Produto — edição':'Produto');
  else $('#page-title').textContent = id?'Produto — edição':'Produto — novo';
  let html='<div class="toolbar">'+
    (inModal?'':'<button class="btn btn-ghost btn-sm" onclick="loadProdutos()">&larr; Voltar</button>')+
    '<div class="spacer"></div>'+
    '<label style="font-size:12px;color:hsl(var(--text-muted));margin-right:6px">Empresa (preço/fiscal):</label>'+
    '<select id="pd-emp" onchange="pdTrocaEmpresa(this.value)"'+(id?'':' disabled')+'>'+pdOptions(empresas,pdEmpresa,false)+'</select>'+
    '</div>';
  html+='<div class="tabs" id="pd-tabs">'+
    '<a class="tab active" data-t="ident" onclick="pdTab(\'ident\')">Identidade (global)</a>'+
    '<a class="tab" data-t="preco" onclick="pdTab(\'preco\')">Preço por empresa</a>'+
    '<a class="tab" data-t="fiscal" onclick="pdTab(\'fiscal\')">Fiscal por empresa</a>'+
    (id?'<a class="tab" data-t="mov" onclick="pdTab(\'mov\')">Movimentações</a>':'')+
    (id?'<a class="tab" data-t="abc" onclick="pdTab(\'abc\')">Curva ABC</a>':'')+
    '</div>';
  html+='<div id="pd-tab-body" class="card card-pad"></div>';
  tgt.innerHTML=html;
  if(id){ pdFull=await pdCarregar(id, pdEmpresa); }
  pdTab('ident');
}
window.pdEditor=pdEditor;

async function pdCarregar(id, emp){
  const {data,error}=await sb.rpc('erp_produto_full',{p_id_produto:Number(id),p_id_empresa:Number(emp)});
  if(error){ toast('Erro ao carregar produto: '+error.message,'err'); return null; }
  return data;
}

async function pdTrocaEmpresa(emp){
  pdEmpresa=Number(emp);
  if(pdProdutoId){ pdFull=await pdCarregar(pdProdutoId, pdEmpresa); }
  const cur=document.querySelector('#pd-tabs .tab.active'); pdTab(cur?cur.dataset.t:'preco');
}
window.pdTrocaEmpresa=pdTrocaEmpresa;

function pdTab(t){
  document.querySelectorAll('#pd-tabs .tab').forEach(a=>a.classList.toggle('active',a.dataset.t===t));
  if(t==='ident') return pdRenderIdent();
  if(t==='preco') return pdRenderPreco();
  if(t==='fiscal') return pdRenderFiscal();
  if(t==='mov') return pdRenderMov();
  if(t==='abc') return pdRenderAbc();
}
window.pdTab=pdTab;

/* ---- Movimentações de estoque do produto ---- */
async function pdRenderMov(){
  const body=$('#pd-tab-body');
  if(!pdProdutoId){ body.innerHTML='<div class="empty">Salve o produto primeiro.</div>'; return; }
  body.innerHTML='<div class="empty">Carregando…</div>';
  const {data,error}=await sb.rpc('erp_produto_historico',{p_id_produto:Number(pdProdutoId),p_id_empresa:null,p_limit:300});
  if(error){ body.innerHTML=errBox('Erro ao carregar movimentações',error.message); return; }
  const d=data||{}, r=d.resumo||{}, movs=d.movimentos||[];
  let html='<div class="grid-kpi">'+
    '<div class="metric"><div class="lbl">Saldo atual</div><div class="val">'+fmtNum(r.saldo_atual)+'</div></div>'+
    '<div class="metric"><div class="lbl">Entradas 12m</div><div class="val">'+fmtNum(r.entradas_12m)+'</div></div>'+
    '<div class="metric"><div class="lbl">Saídas 12m</div><div class="val">'+fmtNum(r.saidas_12m)+'</div></div></div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Data</th><th>Tipo</th><th>Origem</th><th>Qtd</th><th>Custo un.</th><th>Saldo ant.</th><th>Saldo post.</th><th>Ref.</th><th>Empresa/Centro</th><th>Usuário</th></tr></thead><tbody>';
  if(!movs.length) html+='<tr><td colspan="10"><div class="empty">Sem movimentações.</div></td></tr>';
  movs.forEach(m=>{
    const ent=m.tipo==='ENTRADA';
    html+='<tr><td>'+fmtDateTime(m.data)+'</td>'+
      '<td><span class="b-badge '+(ent?'b-badge-ok':'b-badge-warn')+'">'+esc(m.tipo||'')+'</span></td>'+
      '<td>'+esc(m.origem||'')+'</td>'+
      '<td class="mono">'+(ent?'+':'−')+fmtNum(m.quantidade)+'</td>'+
      '<td class="mono">'+(m.custo_unitario!=null?fmtNum(m.custo_unitario):'—')+'</td>'+
      '<td class="mono">'+(m.estoque_anterior!=null?fmtNum(m.estoque_anterior):'—')+'</td>'+
      '<td class="mono">'+(m.estoque_posterior!=null?fmtNum(m.estoque_posterior):'—')+'</td>'+
      '<td class="mono">'+esc(m.numero_referencia||'')+'</td>'+
      '<td>'+esc((m.empresa||'')+(m.centro?(' / '+m.centro):''))+'</td>'+
      '<td>'+esc(m.usuario||'')+'</td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
window.pdRenderMov=pdRenderMov;

/* ---- Curva ABC do produto (mês a mês) ---- */
async function pdRenderAbc(){
  const body=$('#pd-tab-body');
  if(!pdProdutoId){ body.innerHTML='<div class="empty">Salve o produto primeiro.</div>'; return; }
  body.innerHTML='<div class="empty">Carregando…</div>';
  const {data,error}=await sb.rpc('erp_produto_curva_abc',{p_id_produto:Number(pdProdutoId),p_id_empresa:null,p_meses:24});
  if(error){ body.innerHTML=errBox('Erro ao carregar curva ABC',error.message); return; }
  const rows=data||[];
  const cls={A:'b-badge-ok',B:'b-badge-warn',C:'b-badge-muted'};
  let html='<p class="hint" style="margin-bottom:8px">Classe por mês (consolidado). A curva é gerada automaticamente todo dia 1º; classe A = 80% do faturamento, B = 80–95%, C = restante.</p>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Mês</th><th>Classe</th><th>Posição</th><th>Faturamento</th><th>Qtd</th><th>Particip.</th></tr></thead><tbody>';
  if(!rows.length) html+='<tr><td colspan="6"><div class="empty">Sem curva ABC gerada ainda para este produto.</div></td></tr>';
  rows.forEach(x=>{
    html+='<tr><td class="mono">'+String(x.mes).padStart(2,'0')+'/'+x.ano+'</td>'+
      '<td><span class="b-badge '+(cls[x.classe]||'b-badge-muted')+'">'+esc(x.classe)+'</span></td>'+
      '<td class="mono">'+(x.posicao||'')+'º</td><td class="mono">'+fmtNum(x.faturamento)+'</td>'+
      '<td class="mono">'+fmtNum(x.quantidade)+'</td><td class="mono">'+fmtNum(x.participacao)+'%</td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
window.pdRenderAbc=pdRenderAbc;

/* ---- Identidade (global) ---- */
async function pdRenderIdent(){
  const body=$('#pd-tab-body');
  const [grupos,subgrupos,marcas,unidades,gtrib]=await Promise.all([
    lookup('grupos_produto'),lookup('subgrupos_produto'),lookup('marcas'),lookup('unidades'),lookup('grupos_tributarios')]);
  const p=(pdFull&&pdFull.produto)||{};
  body.innerHTML='<div class="form-grid">'+
    '<div class="field"><label>Referência</label><input type="text" id="pi-referencia" value="'+esc(p.referencia||'')+'"></div>'+
    '<div class="field"><label>Código de barras (EAN)</label><input type="text" id="pi-ean" value="'+esc(p.codigo_barras||'')+'"></div>'+
    '<div class="field full"><label>Nome *</label><input type="text" id="pi-nome" value="'+esc(p.nome||'')+'"></div>'+
    '<div class="field full"><label>Descrição</label><input type="text" id="pi-descricao" value="'+esc(p.descricao||'')+'"></div>'+
    '<div class="field"><label>Grupo</label><select id="pi-grupo">'+pdOptions(grupos,p.id_grupo)+'</select></div>'+
    '<div class="field"><label>Subgrupo</label><select id="pi-subgrupo">'+pdOptions(subgrupos,p.id_subgrupo)+'</select></div>'+
    '<div class="field"><label>Marca</label><select id="pi-marca">'+pdOptions(marcas,p.id_marca)+'</select></div>'+
    '<div class="field"><label>Unidade</label><select id="pi-unidade">'+pdOptions(unidades,p.id_unidade)+'</select></div>'+
    '<div class="field"><label>Grupo tributário (padrão global)</label><select id="pi-gtrib">'+pdOptions(gtrib,p.id_grupo_tributario)+'</select></div>'+
    '<div class="field"><label>NCM (padrão global)</label><input type="text" id="pi-ncm" maxlength="10" value="'+esc(p.ncm||'')+'"></div>'+
    '<div class="field"><label>CEST</label><input type="text" id="pi-cest" maxlength="10" value="'+esc(p.cest||'')+'"></div>'+
    '<div class="field"><label>Origem (0-8)</label><input type="number" id="pi-origem" min="0" max="8" value="'+(p.origem==null?'0':esc(String(p.origem)))+'"></div>'+
    '<div class="field"><label>Custo padrão</label><input type="number" step="0.01" id="pi-custo" value="'+(p.preco_custo==null?'':esc(String(p.preco_custo)))+'"></div>'+
    '<div class="field"><label>Preço venda (padrão)</label><input type="number" step="0.01" id="pi-preco" value="'+(p.preco_venda==null?'':esc(String(p.preco_venda)))+'"></div>'+
    '<div class="field"><label>Estoque mínimo</label><input type="number" step="0.001" id="pi-emin" value="'+(p.estoque_minimo==null?'':esc(String(p.estoque_minimo)))+'"></div>'+
    '<div class="field"><label>Estoque máximo</label><input type="number" step="0.001" id="pi-emax" value="'+(p.estoque_maximo==null?'':esc(String(p.estoque_maximo)))+'"></div>'+
    '<div class="field"><label>Situação</label><select id="pi-situacao"><option value="ATIVO"'+(String(p.situacao||'ATIVO')==='ATIVO'?' selected':'')+'>ATIVO</option><option value="INATIVO"'+(p.situacao==='INATIVO'?' selected':'')+'>INATIVO</option></select></div>'+
    '<div class="field"><label>&nbsp;</label><div class="chk"><input type="checkbox" id="pi-controla" '+(p.controla_estoque===false?'':'checked')+'><span>Controla estoque</span></div></div>'+
    '</div>'+
    '<div style="margin-top:14px;display:flex;gap:8px;align-items:center">'+
      '<button class="btn btn-ok" onclick="pdSalvarIdent()">Salvar identidade</button>'+
      (pdProdutoId?'':'<span style="font-size:12px;color:hsl(var(--text-muted))">Salve a identidade para habilitar preço e fiscal por empresa.</span>')+
    '</div>';
}
async function pdSalvarIdent(){
  try{
    const nome=$('#pi-nome').value.trim();
    if(!nome){ toast('Informe o nome do produto','err'); return; }
    const payload={ id:pdProdutoId||null, nome,
      referencia:$('#pi-referencia').value, codigo_barras:$('#pi-ean').value,
      descricao:$('#pi-descricao').value, id_grupo:$('#pi-grupo').value, id_subgrupo:$('#pi-subgrupo').value,
      id_marca:$('#pi-marca').value, id_unidade:$('#pi-unidade').value,
      id_grupo_tributario:$('#pi-gtrib').value, ncm:$('#pi-ncm').value, cest:$('#pi-cest').value,
      origem:$('#pi-origem').value, preco_custo:$('#pi-custo').value, preco_venda:$('#pi-preco').value,
      estoque_minimo:$('#pi-emin').value, estoque_maximo:$('#pi-emax').value,
      situacao:$('#pi-situacao').value, controla_estoque:$('#pi-controla').checked,
      atualizado_em_ref:(pdFull&&pdFull.produto&&pdFull.produto.atualizado_em)||null };
    const {data,error}=await sb.rpc('erp_produto_salvar',{p:payload});
    if(error) throw error;
    const novo=!pdProdutoId;
    pdProdutoId=Number(data);
    // preços em modo markup (não-fixos) seguem o custo — recalcula após salvar a identidade
    try{ await sb.rpc('erp_precos_recalcular_margem',{p_id_produto:pdProdutoId}); }catch(_){}
    toast(novo?'Produto criado (#'+pdProdutoId+')':'Identidade salva','ok');
    if(novo){ pdEditor(pdProdutoId); } // recarrega já em modo edição (habilita empresa/tabs)
    else { pdFull=await pdCarregar(pdProdutoId, pdEmpresa); }
  }catch(e){
    if(String(e.message||e).indexOf('CONFLITO_EDICAO')>=0){
      toast('Este produto foi alterado por outro usuário. Recarreguei os dados — revise e salve de novo.','err');
      pdFull=await pdCarregar(pdProdutoId, pdEmpresa); pdTab('ident');
    } else { toast('Erro: '+(e.message||e),'err'); }
  }
}
window.pdSalvarIdent=pdSalvarIdent;

/* ---- Preço por empresa (custo → markup → venda; tag Preço fixo; compartilhamento) ---- */
function pdCustoAtual(){ return Number(pdFull&&pdFull.produto&&pdFull.produto.preco_custo)||0; }
function pdCalcVenda(t){ const custo=pdCustoAtual(); const m=Number(($('#pp-margem-'+t)||{}).value);
  const v=$('#pp-preco-'+t); if(!v) return; if(custo>0 && !isNaN(m)) v.value=(Math.round(custo*(1+m/100)*100)/100); }
function pdCalcMarkup(t){ const custo=pdCustoAtual(); const val=Number(($('#pp-preco-'+t)||{}).value);
  const m=$('#pp-margem-'+t); if(!m) return; if(custo>0 && !isNaN(val)) m.value=(Math.round((val/custo-1)*10000)/100); }
window.pdCalcVenda=pdCalcVenda; window.pdCalcMarkup=pdCalcMarkup;

async function pdRenderPreco(){
  const body=$('#pd-tab-body');
  if(!pdProdutoId){ body.innerHTML='<div class="empty">Salve a identidade do produto primeiro.</div>'; return; }
  const tabelas=await lookup('tabelas_preco');
  const precos=(pdFull&&pdFull.precos)||[];
  const custo=pdCustoAtual();
  const mapa={}; precos.forEach(pp=>mapa[pp.id_tabela_preco]=pp);
  // banner de compartilhamento
  let banner;
  if(pdFull&&pdFull.preco_compartilhado){
    banner='<div class="err" style="background:hsla(38 92% 50%/.12);border-color:hsla(38 92% 50%/.35);color:hsl(var(--warning));font-weight:500">'+
      'Esta empresa <b>usa os preços de '+esc(pdFull.preco_owner_nome||'—')+'</b>. Alterações valem para todas as empresas do mesmo grupo de preço.</div>';
  } else {
    const seg=(pdFull&&pdFull.preco_seguidores)||[];
    banner='<div style="font-size:12px;color:hsl(var(--text-muted))">Preços próprios desta empresa.'+
      (seg.length?(' Compartilhados com: <b>'+seg.map(esc).join(', ')+'</b>.'):'')+'</div>';
  }
  let html='<div class="toolbar" style="margin-bottom:6px"><div>'+banner+'</div><div class="spacer"></div>'+
    '<button class="btn btn-ghost btn-sm" onclick="pdComparAbrir()">Gerenciar compartilhamento</button></div>';
  html+='<div style="font-size:12px;color:hsl(var(--text-muted));margin-bottom:8px">Custo atual: <b>'+fmtFull(custo)+'</b>. '+
    'O markup calcula a venda; edite a venda que o markup se ajusta. <b>Preço fixo</b> trava a venda (não recalcula quando o custo mudar).</div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Tabela</th><th>Markup %</th><th>Preço venda</th><th>Preço fixo</th><th></th></tr></thead><tbody>';
  tabelas.forEach(t=>{
    const pp=mapa[t.id]||{};
    const fixo=String(pp.tipo_calculo||'')==='FIXO';
    let markup=pp.margem_percentual, venda=pp.preco_venda;
    if((markup==null||markup==='') && venda!=null && custo>0) markup=Math.round((Number(venda)/custo-1)*10000)/100;
    html+='<tr><td>'+esc(pdLabel(t))+'</td>'+
      '<td><input type="number" step="0.01" style="width:90px" id="pp-margem-'+t.id+'" value="'+(markup==null?'':esc(String(markup)))+'" oninput="pdCalcVenda('+t.id+')"></td>'+
      '<td><input type="number" step="0.01" style="width:120px" id="pp-preco-'+t.id+'" value="'+(venda==null?'':esc(String(venda)))+'" oninput="pdCalcMarkup('+t.id+')"></td>'+
      '<td><label class="chk"><input type="checkbox" id="pp-fixo-'+t.id+'" '+(fixo?'checked':'')+'></label></td>'+
      '<td class="acoes"><button class="btn btn-sm" onclick="pdSalvarPreco('+t.id+')">Salvar</button></td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
async function pdSalvarPreco(idTabela){
  try{
    const fixo=($('#pp-fixo-'+idTabela)||{}).checked;
    const payload={ tipo_calculo: fixo?'FIXO':'MARGEM',
      margem_percentual:$('#pp-margem-'+idTabela).value, preco_venda:$('#pp-preco-'+idTabela).value };
    const {error}=await sb.rpc('erp_preco_empresa_salvar',
      {p_id_produto:pdProdutoId,p_id_empresa:pdEmpresa,p_id_tabela:Number(idTabela),p:payload});
    if(error) throw error;
    toast('Preço salvo','ok');
    pdFull=await pdCarregar(pdProdutoId, pdEmpresa);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pdSalvarPreco=pdSalvarPreco;

/* ---- Modal: compartilhamento de preços entre empresas ---- */
async function pdComparAbrir(){
  openModal('Compartilhamento de preços','<div class="empty">Carregando…</div>',
    '<button class="btn btn-ghost btn-sm" onclick="closeModal()">Fechar</button>',{push:true,wide:true});
  pdComparRender();
}
window.pdComparAbrir=pdComparAbrir;
async function pdComparRender(){
  const b=modalBody(); if(!b) return;
  const {data,error}=await sb.rpc('erp_empresas_precos_listar');
  if(error){ b.innerHTML=errBox('Erro ao carregar empresas',error.message); return; }
  const emps=Array.isArray(data)?data:[];
  const donas=emps.filter(e=>e.propria);
  let h='<div style="font-size:12px;color:hsl(var(--text-muted));margin-bottom:10px">Cada empresa tem preços próprios ou compartilha os de outra. Só dá para compartilhar com uma empresa de preços próprios.</div>';
  h+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Empresa</th><th>Preços</th><th>Compartilhado com</th></tr></thead><tbody>';
  emps.forEach(e=>{
    const temSeg=Number(e.seguidores)>0;
    let sel='<select onchange="pdComparDefinir('+e.id+',this.value)"><option value="">Preços próprios</option>'+
      donas.filter(d=>d.id!==e.id).map(d=>'<option value="'+d.id+'"'+(String(e.id_empresa_precos)===String(d.id)?' selected':'')+'>Usa preços de '+esc(d.nome)+'</option>').join('')+'</select>';
    h+='<tr><td>'+esc(e.nome)+'</td>'+
      '<td>'+(e.propria?('<span class="b-badge b-badge-ok">próprios</span>'+(temSeg?(' <span style="font-size:11px;color:hsl(var(--text-muted))">'+e.seguidores+' seguidora(s)</span>'):'')):'<span class="b-badge b-badge-info">compartilha</span>')+'</td>'+
      '<td>'+(temSeg?'<span style="font-size:11px;color:hsl(var(--text-muted))">tem seguidoras — realoque-as antes</span>':sel)+'</td></tr>';
  });
  h+='</tbody></table></div>';
  b.innerHTML=h;
}
async function pdComparDefinir(idEmp, idDona){
  try{
    const {error}=await sb.rpc('erp_empresa_precos_definir',{p_id_empresa:idEmp,p_id_empresa_precos:idDona?Number(idDona):null});
    if(error) throw error;
    toast('Compartilhamento atualizado','ok');
    if(pdProdutoId){ pdFull=await pdCarregar(pdProdutoId, pdEmpresa); pdTab('preco'); }
    pdComparRender();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pdComparDefinir=pdComparDefinir;

/* ---- Fiscal por empresa (inclui reforma IBS/CBS/IS) ---- */
async function pdRenderFiscal(){
  const body=$('#pd-tab-body');
  if(!pdProdutoId){ body.innerHTML='<div class="empty">Salve a identidade do produto primeiro.</div>'; return; }
  const [gtrib,cstibs,cclass]=await Promise.all([lookup('grupos_tributarios'),lookup('cst_ibscbs'),lookup('cclasstrib')]);
  window.__gtrib=gtrib;
  const f=(pdFull&&pdFull.fiscal)||{};
  const gEf=pdFull&&pdFull.grupo_trib_efetivo, nEf=pdFull&&pdFull.ncm_efetivo;
  const cstOpts=(cstibs||[]).map(o=>'<option value="'+esc(o.codigo)+'"'+(String(f.cst_ibscbs||'')===String(o.codigo)?' selected':'')+'>'+esc(o.codigo+' — '+(o.descricao||''))+'</option>').join('');
  const ccOpts=(cclass||[]).map(o=>'<option value="'+esc(o.codigo)+'"'+(String(f.cclasstrib||'')===String(o.codigo)?' selected':'')+'>'+esc(o.codigo+' — '+(o.descricao||''))+'</option>').join('');
  body.innerHTML=
    '<div style="font-size:12px;color:hsl(var(--text-muted));margin-bottom:10px">Configuração fiscal específica desta empresa. Em branco, usa o padrão global do produto. '+
      'Efetivo hoje: grupo tributário <b>#'+esc(String(gEf||'—'))+'</b>, NCM <b>'+esc(nEf||'—')+'</b>.</div>'+
    '<div class="form-grid">'+
    '<div class="field"><label>Grupo tributário (empresa)</label><select id="pf-gtrib" onchange="pdFiscalIpi()">'+pdOptions(gtrib,f.id_grupo_tributario)+'</select></div>'+
    '<div class="field"><label>IPI (do grupo tributário)</label><input type="text" id="pf-ipi" readonly value="'+esc(pdIpiTexto(gtrib,f.id_grupo_tributario))+'" style="background:hsl(var(--muted));"></div>'+
    '<div class="field"><label>NCM</label><input type="text" id="pf-ncm" maxlength="10" value="'+esc(f.ncm||'')+'"></div>'+
    '<div class="field"><label>CEST</label><input type="text" id="pf-cest" maxlength="10" value="'+esc(f.cest||'')+'"></div>'+
    '<div class="field"><label>CFOP padrão</label><input type="text" id="pf-cfop" maxlength="10" value="'+esc(f.cfop_padrao||'')+'"></div>'+
    '<div class="field"><label>CST/CSOSN (ICMS)</label><input type="text" id="pf-cst" maxlength="4" value="'+esc(f.cst_csosn||'')+'"></div>'+
    '<div class="field"><label>Alíquota ICMS %</label><input type="number" step="0.0001" id="pf-aliqicms" value="'+(f.aliquota_icms==null?'':esc(String(f.aliquota_icms)))+'"></div>'+
    '<div class="field"><label>Origem (0-8)</label><input type="number" id="pf-origem" min="0" max="8" value="'+(f.origem==null?'0':esc(String(f.origem)))+'"></div>'+
    '<div class="field"><label>&nbsp;</label><div class="chk"><input type="checkbox" id="pf-ativo" '+(f.ativo===false?'':'checked')+'><span>Ativo</span></div></div>'+
    '<div class="field full" style="border-top:1px solid hsl(var(--border));padding-top:8px;margin-top:2px"><b style="font-size:12px">Reforma Tributária (IBS / CBS / IS)</b></div>'+
    '<div class="field"><label>CST IBS/CBS</label><select id="pf-cstibs"><option value="">— selecione —</option>'+cstOpts+'</select></div>'+
    '<div class="field"><label>cClassTrib</label><select id="pf-cclass"><option value="">— selecione —</option>'+ccOpts+'</select></div>'+
    '<div class="field full" style="font-size:11px;color:hsl(var(--text-muted))">As alíquotas de IBS-UF, IBS-Município, CBS e IS são definidas no <b>Grupo Tributário</b> (Configurações → Fiscal). Aqui você define apenas CST e cClassTrib por empresa.</div>'+
    '</div>'+
    '<div style="margin-top:14px"><button class="btn btn-ok" onclick="pdSalvarFiscal()">Salvar fiscal da empresa</button></div>';
}
/* mostra a alíquota/CST de IPI do grupo tributário selecionado (IPI é definido no grupo, não no produto) */
function pdIpiTexto(gtrib, idGrupo){
  const g=(gtrib||[]).find(x=>String(x.id)===String(idGrupo));
  if(!g) return '— selecione um grupo tributário —';
  const aliq=(g.aliq_ipi==null?'0':g.aliq_ipi); const cst=(g.cst_ipi||'—');
  return 'Alíquota '+fmtNum(aliq)+'%  ·  CST '+cst;
}
function pdFiscalIpi(){
  const inp=$('#pf-ipi'); if(inp) inp.value=pdIpiTexto(window.__gtrib, $('#pf-gtrib').value);
}
window.pdFiscalIpi=pdFiscalIpi;
async function pdSalvarFiscal(){
  try{
    const payload={ id_grupo_tributario:$('#pf-gtrib').value, ncm:$('#pf-ncm').value, cest:$('#pf-cest').value,
      cfop_padrao:$('#pf-cfop').value, cst_csosn:$('#pf-cst').value, aliquota_icms:$('#pf-aliqicms').value,
      origem:$('#pf-origem').value, ativo:$('#pf-ativo').checked,
      cst_ibscbs:$('#pf-cstibs').value, cclasstrib:$('#pf-cclass').value };
    const {error}=await sb.rpc('erp_fiscal_empresa_salvar',
      {p_id_produto:pdProdutoId,p_id_empresa:pdEmpresa,p:payload});
    if(error) throw error;
    toast('Fiscal da empresa salvo','ok');
    pdFull=await pdCarregar(pdProdutoId, pdEmpresa);
    pdRenderFiscal();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pdSalvarFiscal=pdSalvarFiscal;

/* ================= CURVA ABC (tela) ================= */
let abcEmpresa='', abcAno=null, abcMes=null;
async function loadCurvaABC(){
  const empresas=await lookup('empresas');
  const now=new Date();
  if(abcAno===null){ // default: mês anterior (que é o gerado automaticamente)
    const d=new Date(now.getFullYear(), now.getMonth()-1, 1);
    abcAno=d.getFullYear(); abcMes=d.getMonth()+1;
  }
  const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  let optMes=''; for(let m=1;m<=12;m++) optMes+='<option value="'+m+'"'+(m===abcMes?' selected':'')+'>'+meses[m-1]+'</option>';
  let optAno=''; for(let a=now.getFullYear();a>=now.getFullYear()-4;a--) optAno+='<option value="'+a+'"'+(a===abcAno?' selected':'')+'>'+a+'</option>';
  const optEmp='<option value="">Consolidado (todas)</option>'+(empresas||[]).map(e=>'<option value="'+e.id+'"'+(String(abcEmpresa)===String(e.id)?' selected':'')+'>'+esc(e.nome_fantasia||e.nome)+'</option>').join('');
  let html='<div class="toolbar">'+
    '<select id="abc-emp" onchange="abcReload()">'+optEmp+'</select>'+
    '<select id="abc-mes" onchange="abcReload()">'+optMes+'</select>'+
    '<select id="abc-ano" onchange="abcReload()">'+optAno+'</select>'+
    '<select id="abc-classe" onchange="abcReload()"><option value="">Todas classes</option><option>A</option><option>B</option><option>C</option></select>'+
    '<div class="spacer"></div>'+
    '<button class="btn btn-sm" onclick="abcGerar()">↻ Gerar/atualizar este mês</button></div>'+
    '<div id="abc-body"></div>';
  $('#screen').innerHTML=html;
  abcReload();
}
window.loadCurvaABC=loadCurvaABC;
async function abcReload(){
  abcEmpresa=$('#abc-emp').value; abcAno=Number($('#abc-ano').value); abcMes=Number($('#abc-mes').value);
  const classe=$('#abc-classe').value||null;
  const body=$('#abc-body'); body.innerHTML='<div class="empty">Carregando…</div>';
  const {data,error}=await sb.rpc('erp_curva_abc',{p_ano:abcAno,p_mes:abcMes,p_id_empresa:abcEmpresa?Number(abcEmpresa):null,p_classe:classe,p_limit:2000});
  if(error){ body.innerHTML=errBox('Erro ao carregar curva ABC',error.message); return; }
  const d=data||{}, r=d.resumo||{}, itens=d.itens||[];
  let html='<div class="grid-kpi">'+
    '<div class="metric"><div class="lbl">Faturamento</div><div class="val">'+fmtFull(r.faturamento)+'</div></div>'+
    '<div class="metric"><div class="lbl">Produtos</div><div class="val">'+(r.produtos||0)+'</div></div>'+
    '<div class="metric"><div class="lbl">Classe A</div><div class="val">'+(r.A||0)+'</div></div>'+
    '<div class="metric"><div class="lbl">Classe B</div><div class="val">'+(r.B||0)+'</div></div>'+
    '<div class="metric"><div class="lbl">Classe C</div><div class="val">'+(r.C||0)+'</div></div></div>';
  const cls={A:'b-badge-ok',B:'b-badge-warn',C:'b-badge-muted'};
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>#</th><th>Produto</th><th>Ref.</th><th>Classe</th><th>Faturamento</th><th>Qtd</th><th>Margem</th><th>Particip.</th><th>Acum.</th></tr></thead><tbody>';
  if(!itens.length) html+='<tr><td colspan="9"><div class="empty">Sem curva para este mês. Clique em “Gerar/atualizar este mês”.</div></td></tr>';
  itens.forEach(x=>{
    html+='<tr><td class="mono">'+(x.posicao||'')+'</td><td>'+esc(x.produto||'')+'</td><td class="mono">'+esc(x.referencia||'')+'</td>'+
      '<td><span class="b-badge '+(cls[x.classe]||'b-badge-muted')+'">'+esc(x.classe)+'</span></td>'+
      '<td class="mono">'+fmtNum(x.faturamento)+'</td><td class="mono">'+fmtNum(x.quantidade)+'</td>'+
      '<td class="mono">'+fmtNum(x.margem)+'</td><td class="mono">'+fmtNum(x.participacao)+'%</td>'+
      '<td class="mono">'+fmtNum(x.participacao_acum)+'%</td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
window.abcReload=abcReload;
async function abcGerar(){
  try{
    const emp=$('#abc-emp').value?Number($('#abc-emp').value):null;
    const {data,error}=await sb.rpc('erp_gerar_curva_abc',{p_ano:Number($('#abc-ano').value),p_mes:Number($('#abc-mes').value),p_id_empresa:emp});
    if(error) throw error;
    toast('Curva gerada: '+(data&&data.produtos||0)+' produto(s)','ok'); abcReload();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.abcGerar=abcGerar;
