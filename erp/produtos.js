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
    const rows=data||[];
    let html='<div class="toolbar">'+
      '<input type="search" id="pd-busca" placeholder="Buscar produto (nome, referência, EAN)..." value="'+esc(busca||'')+'" onkeydown="if(event.key===\'Enter\')loadProdutos(this.value)">'+
      '<button class="btn btn-ghost btn-sm" onclick="loadProdutos($(\'#pd-busca\').value)">Buscar</button>'+
      '<div class="spacer"></div><button class="btn btn-sm" onclick="pdEditor(null)">+ Novo produto</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>#</th><th>Referência</th><th>Nome</th>'+
      '<th>NCM</th><th>Preço venda</th><th>Situação</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="7"><div class="empty">Nenhum produto encontrado.</div></td></tr>';
    rows.forEach(r=>{
      html+='<tr><td>'+r.id+'</td><td>'+esc(r.referencia||'')+'</td><td>'+esc(r.nome||'')+'</td>'+
        '<td class="mono">'+esc(r.ncm||'—')+'</td><td class="mono">'+fmtNum(r.preco_venda)+'</td>'+
        '<td><span class="b-badge b-badge-'+(String(r.situacao||'').toUpperCase()==='ATIVO'?'ok':'muted')+'">'+esc(r.situacao||'')+'</span></td>'+
        '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick="pdEditor('+r.id+')">Abrir</button></td></tr>';
    });
    html+='</tbody></table></div><div style="font-size:11px;color:hsl(var(--text-muted));margin-top:8px">'+rows.length+' produto(s)</div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os produtos.',e.message); }
}
window.loadProdutos=loadProdutos;

/* ---------------- EDITOR (tela única) ---------------- */
async function pdEditor(id){
  pdProdutoId=id; pdFull=null;
  const empresas=await lookup('empresas');
  if(!pdEmpresa && empresas[0]) pdEmpresa=empresas[0].id;
  $('#page-title').textContent = id?'Produto — edição':'Produto — novo';
  let html='<div class="toolbar">'+
    '<button class="btn btn-ghost btn-sm" onclick="loadProdutos()">&larr; Voltar</button>'+
    '<div class="spacer"></div>'+
    '<label style="font-size:12px;color:hsl(var(--text-muted));margin-right:6px">Empresa (preço/fiscal):</label>'+
    '<select id="pd-emp" onchange="pdTrocaEmpresa(this.value)"'+(id?'':' disabled')+'>'+pdOptions(empresas,pdEmpresa,false)+'</select>'+
    '</div>';
  html+='<div class="tabs" id="pd-tabs">'+
    '<a class="tab active" data-t="ident" onclick="pdTab(\'ident\')">Identidade (global)</a>'+
    '<a class="tab" data-t="preco" onclick="pdTab(\'preco\')">Preço por empresa</a>'+
    '<a class="tab" data-t="fiscal" onclick="pdTab(\'fiscal\')">Fiscal por empresa</a>'+
    '</div>';
  html+='<div id="pd-tab-body" class="card card-pad"></div>';
  $('#screen').innerHTML=html;
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
}
window.pdTab=pdTab;

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
      situacao:$('#pi-situacao').value, controla_estoque:$('#pi-controla').checked };
    const {data,error}=await sb.rpc('erp_produto_salvar',{p:payload});
    if(error) throw error;
    const novo=!pdProdutoId;
    pdProdutoId=Number(data);
    toast(novo?'Produto criado (#'+pdProdutoId+')':'Identidade salva','ok');
    if(novo){ pdEditor(pdProdutoId); } // recarrega já em modo edição (habilita empresa/tabs)
    else { pdFull=await pdCarregar(pdProdutoId, pdEmpresa); }
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pdSalvarIdent=pdSalvarIdent;

/* ---- Preço por empresa ---- */
async function pdRenderPreco(){
  const body=$('#pd-tab-body');
  if(!pdProdutoId){ body.innerHTML='<div class="empty">Salve a identidade do produto primeiro.</div>'; return; }
  const tabelas=await lookup('tabelas_preco');
  const precos=(pdFull&&pdFull.precos)||[];
  const mapa={}; precos.forEach(pp=>mapa[pp.id_tabela_preco]=pp);
  let html='<div style="font-size:12px;color:hsl(var(--text-muted));margin-bottom:10px">Preços da empresa selecionada, por tabela de preço.</div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Tabela</th><th>Tipo cálculo</th><th>Margem %</th><th>Preço venda</th><th></th></tr></thead><tbody>';
  tabelas.forEach(t=>{
    const pp=mapa[t.id]||{};
    html+='<tr><td>'+esc(pdLabel(t))+'</td>'+
      '<td><select id="pp-tipo-'+t.id+'"><option value="FIXO"'+(String(pp.tipo_calculo||'FIXO')==='FIXO'?' selected':'')+'>FIXO</option><option value="MARGEM"'+(pp.tipo_calculo==='MARGEM'?' selected':'')+'>MARGEM</option></select></td>'+
      '<td><input type="number" step="0.01" style="width:90px" id="pp-margem-'+t.id+'" value="'+(pp.margem_percentual==null?'':esc(String(pp.margem_percentual)))+'"></td>'+
      '<td><input type="number" step="0.01" style="width:120px" id="pp-preco-'+t.id+'" value="'+(pp.preco_venda==null?'':esc(String(pp.preco_venda)))+'"></td>'+
      '<td class="acoes"><button class="btn btn-sm" onclick="pdSalvarPreco('+t.id+')">Salvar</button></td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
async function pdSalvarPreco(idTabela){
  try{
    const payload={ tipo_calculo:$('#pp-tipo-'+idTabela).value,
      margem_percentual:$('#pp-margem-'+idTabela).value, preco_venda:$('#pp-preco-'+idTabela).value };
    const {error}=await sb.rpc('erp_preco_empresa_salvar',
      {p_id_produto:pdProdutoId,p_id_empresa:pdEmpresa,p_id_tabela:Number(idTabela),p:payload});
    if(error) throw error;
    toast('Preço salvo','ok');
    pdFull=await pdCarregar(pdProdutoId, pdEmpresa);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.pdSalvarPreco=pdSalvarPreco;

/* ---- Fiscal por empresa (inclui reforma IBS/CBS/IS) ---- */
async function pdRenderFiscal(){
  const body=$('#pd-tab-body');
  if(!pdProdutoId){ body.innerHTML='<div class="empty">Salve a identidade do produto primeiro.</div>'; return; }
  const [gtrib,cstibs,cclass]=await Promise.all([lookup('grupos_tributarios'),lookup('cst_ibscbs'),lookup('cclasstrib')]);
  const f=(pdFull&&pdFull.fiscal)||{};
  const gEf=pdFull&&pdFull.grupo_trib_efetivo, nEf=pdFull&&pdFull.ncm_efetivo;
  const cstOpts=(cstibs||[]).map(o=>'<option value="'+esc(o.codigo)+'"'+(String(f.cst_ibscbs||'')===String(o.codigo)?' selected':'')+'>'+esc(o.codigo+' — '+(o.descricao||''))+'</option>').join('');
  const ccOpts=(cclass||[]).map(o=>'<option value="'+esc(o.codigo)+'"'+(String(f.cclasstrib||'')===String(o.codigo)?' selected':'')+'>'+esc(o.codigo+' — '+(o.descricao||''))+'</option>').join('');
  body.innerHTML=
    '<div style="font-size:12px;color:hsl(var(--text-muted));margin-bottom:10px">Configuração fiscal específica desta empresa. Em branco, usa o padrão global do produto. '+
      'Efetivo hoje: grupo tributário <b>#'+esc(String(gEf||'—'))+'</b>, NCM <b>'+esc(nEf||'—')+'</b>.</div>'+
    '<div class="form-grid">'+
    '<div class="field"><label>Grupo tributário (empresa)</label><select id="pf-gtrib">'+pdOptions(gtrib,f.id_grupo_tributario)+'</select></div>'+
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
