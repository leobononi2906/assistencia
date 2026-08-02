/* ERP Bononi — Relatórios (hub unificado: um relatório por área, vários modelos + filtros) */

/* Configuração de cada relatório: modelos (agrupamentos), rpc e quais filtros exibir */
const REL_CFG={
  vendas:{ rpc:'erp_rel_vendas', titulo:'Relatório de Vendas',
    modelos:[['analitico','Analítico (por venda)'],['produto','Por produto'],['cliente','Por cliente'],['vendedor','Por vendedor'],['dia','Por dia'],['mes','Por mês']],
    filtros:['empresa','periodo','cliente','produto','status'], status:['ABERTA','FATURADA','ENTREGUE','CANCELADA','DEVOLVIDA'] },
  compras:{ rpc:'erp_rel_compras', titulo:'Relatório de Compras',
    modelos:[['analitico','Analítico (por pedido)'],['produto','Por produto'],['fornecedor','Por fornecedor'],['mes','Por mês']],
    filtros:['empresa','periodo','fornecedor','produto','status'], status:['ABERTO','PARCIAL','RECEBIDO','CANCELADO'] },
  produtos:{ rpc:'erp_rel_produtos', titulo:'Relatório de Produtos',
    modelos:[['posicao','Posição de estoque'],['mais_vendidos','Mais vendidos'],['sem_giro','Sem giro'],['grupo','Por grupo']],
    filtros:['empresa','periodo','grupo','situacao'] },
  clientes:{ rpc:'erp_rel_clientes', titulo:'Relatório de Clientes',
    modelos:[['ranking','Ranking de compras'],['inativos','Inativos'],['novos','Novos no período'],['uf','Por UF']],
    filtros:['empresa','periodo','uf','situacao'] },
};

function relFmt(val, tipo){
  if(val==null||val==='') return '';
  if(tipo==='money') return fmtFull(val);
  if(tipo==='num') return fmtNum(val);
  if(tipo==='data') return fmtDate(val);
  return esc(val);
}
function relSelect(id, items, allLabel, labelField){
  labelField=labelField||'nome';
  return '<select id="'+id+'"><option value="">'+(allLabel||'Todos')+'</option>'+
    (items||[]).map(function(it){ return '<option value="'+it.id+'">'+esc(it[labelField]||('#'+it.id))+'</option>'; }).join('')+'</select>';
}
function relField(label, inner){ return '<div class="field"><label>'+label+'</label>'+inner+'</div>'; }

/* Abre um relatório genérico */
async function abrirRelatorio(key){
  const cfg=REL_CFG[key]; if(!cfg){ $('#screen').innerHTML=errBox('Relatório não encontrado.'); return; }
  window.__relKey=key;
  try{
    const need=cfg.filtros;
    const [empresas,clientes,produtos,fornecedores,grupos]=await Promise.all([
      lookup('empresas'),
      need.includes('cliente')?lookup('clientes'):Promise.resolve([]),
      need.includes('produto')?lookup('produtos'):Promise.resolve([]),
      need.includes('fornecedor')?lookup('fornecedores'):Promise.resolve([]),
      need.includes('grupo')?lookup('grupos_produto'):Promise.resolve([]),
    ]);
    const hoje=new Date().toISOString().slice(0,10);
    const ini=new Date(); ini.setDate(1); const de=ini.toISOString().slice(0,10);

    let f='';
    f+=relField('Modelo','<select id="rl-ag">'+cfg.modelos.map(m=>'<option value="'+m[0]+'">'+m[1]+'</option>').join('')+'</select>');
    if(need.includes('empresa')) f+=relField('Empresa', relSelect('rl-emp',empresas,'Todas'));
    if(need.includes('periodo')){ f+=relField('De','<input type="date" id="rl-de" value="'+de+'">'); f+=relField('Até','<input type="date" id="rl-ate" value="'+hoje+'">'); }
    if(need.includes('cliente')) f+=relField('Cliente', comboHTML('rl-cli',comboCliItems(clientes),'','Todos'));
    if(need.includes('fornecedor')) f+=relField('Fornecedor', relSelect('rl-forn',fornecedores,'Todos'));
    if(need.includes('produto')) f+=relField('Produto', comboHTML('rl-prod',comboProdItems(produtos),'','Todos'));
    if(need.includes('grupo')) f+=relField('Grupo', relSelect('rl-grupo',grupos,'Todos','descricao'));
    if(need.includes('uf')) f+=relField('UF','<input id="rl-uf" maxlength="2" style="text-transform:uppercase" placeholder="Todas">');
    if(need.includes('situacao')) f+=relField('Situação','<select id="rl-sit"><option value="">Todas</option><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select>');
    if(need.includes('status')) f+=relField('Status','<select id="rl-status"><option value="">Todos (menos cancelado)</option>'+cfg.status.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select>');
    f+='<div class="field" style="align-self:end"><button class="btn" onclick="relGerar()">Gerar relatório</button></div>';

    $('#screen').innerHTML='<div class="card card-pad" style="margin-bottom:14px"><div class="form-grid">'+f+'</div></div><div id="rl-res"></div>';
    relGerar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível abrir o relatório.',e.message); }
}
window.abrirRelatorio=abrirRelatorio;

/* loaders individuais (para o menu) */
function loadRelVendas(){ return abrirRelatorio('vendas'); }
function loadRelCompras(){ return abrirRelatorio('compras'); }
function loadRelProdutos(){ return abrirRelatorio('produtos'); }
function loadRelClientes(){ return abrirRelatorio('clientes'); }
window.loadRelVendas=loadRelVendas; window.loadRelCompras=loadRelCompras;
window.loadRelProdutos=loadRelProdutos; window.loadRelClientes=loadRelClientes;

function relHas(id){ return !!document.getElementById(id); }
function relV(id){ const el=document.getElementById(id); return el?el.value:''; }
function relPayload(){
  const p={ agrupamento:relV('rl-ag') };
  if(relHas('rl-emp')) p.id_empresa=relV('rl-emp')||null;
  if(relHas('rl-de')) p.data_de=relV('rl-de')||null;
  if(relHas('rl-ate')) p.data_ate=relV('rl-ate')||null;
  if(relHas('rl-cli')) p.id_cliente=comboVal('rl-cli')||null;
  if(relHas('rl-prod')) p.id_produto=comboVal('rl-prod')||null;
  if(relHas('rl-forn')) p.id_fornecedor=relV('rl-forn')||null;
  if(relHas('rl-grupo')) p.id_grupo=relV('rl-grupo')||null;
  if(relHas('rl-uf')) p.uf=(relV('rl-uf')||'').toUpperCase()||null;
  if(relHas('rl-sit')) p.situacao=relV('rl-sit')||null;
  if(relHas('rl-status')) p.status=relV('rl-status')||null;
  return p;
}
function relFiltroTxt(p){
  const parts=[];
  if(p.data_de||p.data_ate) parts.push('Período: '+(p.data_de?fmtDate(p.data_de):'…')+' a '+(p.data_ate?fmtDate(p.data_ate):'…'));
  if(p.status) parts.push('Status: '+p.status);
  if(p.uf) parts.push('UF: '+p.uf);
  if(p.situacao) parts.push('Situação: '+p.situacao);
  return parts.join('  ·  ');
}

async function relGerar(){
  const cfg=REL_CFG[window.__relKey]; const res=$('#rl-res'); if(!cfg||!res) return;
  res.innerHTML=skeletonTable();
  const p=relPayload();
  try{
    const {data,error}=await sb.rpc(cfg.rpc,{p:p}); if(error) throw error;
    window.__rel={ dados:data, titulo:cfg.titulo, filtros:relFiltroTxt(p) };
    relRender('rl-res');
  }catch(e){ res.innerHTML=errBox('Erro ao gerar o relatório.',e.message); }
}
window.relGerar=relGerar;

/* ===================== RENDER GENÉRICO ===================== */
function relRender(targetId){
  const st=window.__rel||{}; const d=st.dados||{}; const cols=d.colunas||[]; const rows=d.linhas||[]; const tot=d.totais||{};
  const temMoney=cols.some(c=>c.tipo==='money');
  let h='<div class="grid-kpi"><div class="metric"><div class="lbl">Registros</div><div class="val">'+(tot.qtd||0)+'</div></div>';
  if(temMoney) h+='<div class="metric"><div class="lbl">Valor total</div><div class="val">'+fmtFull(tot.valor)+'</div></div>';
  h+='</div>';
  h+='<div class="toolbar"><div class="spacer"></div>'+
     '<button class="btn btn-ghost btn-sm" onclick="relExportCSV()">Exportar CSV</button>'+
     '<button class="btn btn-sm" onclick="relImprimir()">Imprimir</button></div>';
  h+='<div class="tbl-wrap"><table class="data"><thead><tr>'+
     cols.map(c=>'<th'+(c.tipo==='money'||c.tipo==='num'?' style="text-align:right"':'')+'>'+esc(c.label)+'</th>').join('')+'</tr></thead><tbody>';
  if(!rows.length) h+='<tr><td colspan="'+(cols.length||1)+'"><div class="empty">Nada encontrado para os filtros.</div></td></tr>';
  rows.forEach(r=>{ h+='<tr>'+cols.map(c=>'<td'+(c.tipo==='money'||c.tipo==='num'?' class="mono" style="text-align:right"':'')+'>'+relFmt(r[c.key],c.tipo)+'</td>').join('')+'</tr>'; });
  h+='</tbody></table></div>';
  $('#'+targetId).innerHTML=h;
}
window.relRender=relRender;

function relExportCSV(){
  const d=(window.__rel&&window.__rel.dados)||{}; const cols=d.colunas||[]; const rows=d.linhas||[]; const sep=';';
  let csv=cols.map(c=>'"'+String(c.label).replace(/"/g,'""')+'"').join(sep)+'\n';
  rows.forEach(r=>{ csv+=cols.map(c=>{ let v=r[c.key]; if(v==null) v='';
      if(c.tipo==='money'||c.tipo==='num') v=String(v).replace('.',','); else if(c.tipo==='data') v=fmtDate(v);
      return '"'+String(v).replace(/"/g,'""')+'"'; }).join(sep)+'\n'; });
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=((window.__rel&&window.__rel.titulo)||'relatorio').toLowerCase().replace(/[^a-z0-9]+/g,'_')+'.csv';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
}
window.relExportCSV=relExportCSV;

function relImprimir(){
  const st=window.__rel||{}; const d=st.dados||{}; const cols=d.colunas||[]; const rows=d.linhas||[]; const tot=d.totais||{};
  const temMoney=cols.some(c=>c.tipo==='money');
  let t='';
  if(st.filtros) t+='<div class="sub">'+esc(st.filtros)+'</div>';
  t+='<table><thead><tr>'+cols.map(c=>'<th class="'+(c.tipo==='money'||c.tipo==='num'?'r':'')+'">'+esc(c.label)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(r=>'<tr>'+cols.map(c=>'<td class="'+(c.tipo==='money'||c.tipo==='num'?'r':'')+'">'+relFmt(r[c.key],c.tipo)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  const rod=(tot.qtd||0)+' registro(s)'+(temMoney?'  ·  Total: '+fmtFull(tot.valor):'');
  imprimirDoc((st.titulo||'Relatório'), t, rod);
}
window.relImprimir=relImprimir;
