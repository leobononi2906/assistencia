/* ERP Bononi — Relatórios (hub unificado: um relatório, vários modelos + filtros) */

/* helper de formatação por tipo de coluna */
function relFmt(val, tipo){
  if(val==null||val==='') return '';
  if(tipo==='money') return fmtFull(val);
  if(tipo==='num') return fmtNum(val);
  if(tipo==='data') return fmtDate(val);
  return esc(val);
}

/* ===================== RELATÓRIO DE VENDAS ===================== */
async function loadRelVendas(){
  try{
    const [emp,cli,prod]=await Promise.all([lookup('empresas'),lookup('clientes'),lookup('produtos')]);
    const hoje=new Date().toISOString().slice(0,10);
    const ini=new Date(); ini.setDate(1); const de=ini.toISOString().slice(0,10);
    const modelos=[['analitico','Analítico (por venda)'],['produto','Agrupado por produto'],
      ['cliente','Agrupado por cliente'],['vendedor','Agrupado por vendedor'],['dia','Por dia'],['mes','Por mês']];
    let html='<div class="card card-pad" style="margin-bottom:14px"><div class="form-grid">'+
      '<div class="field"><label>Modelo</label><select id="rv-ag">'+modelos.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('')+'</select></div>'+
      '<div class="field"><label>Empresa</label><select id="rv-emp"><option value="">Todas</option>'+emp.map(e=>'<option value="'+e.id+'">'+esc(e.nome)+'</option>').join('')+'</select></div>'+
      '<div class="field"><label>De</label><input type="date" id="rv-de" value="'+de+'"></div>'+
      '<div class="field"><label>Até</label><input type="date" id="rv-ate" value="'+hoje+'"></div>'+
      '<div class="field"><label>Cliente</label>'+comboHTML('rv-cli',comboCliItems(cli),'','Todos')+'</div>'+
      '<div class="field"><label>Produto</label>'+comboHTML('rv-prod',comboProdItems(prod),'','Todos')+'</div>'+
      '<div class="field"><label>Status</label><select id="rv-status"><option value="">Todos (menos cancelada)</option>'+
        ['ABERTA','FATURADA','ENTREGUE','CANCELADA','DEVOLVIDA'].map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select></div>'+
      '<div class="field" style="align-self:end"><button class="btn" onclick="relVendasGerar()">Gerar relatório</button></div>'+
      '</div></div><div id="rv-res"></div>';
    $('#screen').innerHTML=html;
    relVendasGerar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível abrir o relatório.',e.message); }
}
window.loadRelVendas=loadRelVendas;

async function relVendasGerar(){
  const res=$('#rv-res'); if(!res) return; res.innerHTML=skeletonTable();
  const p={ agrupamento:$('#rv-ag').value, id_empresa:$('#rv-emp').value||null,
    data_de:$('#rv-de').value||null, data_ate:$('#rv-ate').value||null,
    id_cliente:comboVal('rv-cli')||null, id_produto:comboVal('rv-prod')||null, status:$('#rv-status').value||null };
  try{
    const {data,error}=await sb.rpc('erp_rel_vendas',{p:p}); if(error) throw error;
    window.__rel={dados:data, titulo:'Relatório de Vendas', filtros:relVendasFiltroTxt(p)};
    relRender('rv-res');
  }catch(e){ res.innerHTML=errBox('Erro ao gerar o relatório.',e.message); }
}
window.relVendasGerar=relVendasGerar;
function relVendasFiltroTxt(p){
  const parts=[];
  if(p.data_de||p.data_ate) parts.push('Período: '+(p.data_de?fmtDate(p.data_de):'…')+' a '+(p.data_ate?fmtDate(p.data_ate):'…'));
  if(p.status) parts.push('Status: '+p.status);
  return parts.join('  ·  ');
}

/* ===================== RENDER GENÉRICO (reutilizável p/ todos os relatórios) ===================== */
function relRender(targetId){
  const st=window.__rel||{}; const d=st.dados||{}; const cols=d.colunas||[]; const rows=d.linhas||[]; const tot=d.totais||{};
  let h='<div class="grid-kpi">'+
    '<div class="metric"><div class="lbl">Registros</div><div class="val">'+(tot.qtd||0)+'</div></div>'+
    '<div class="metric"><div class="lbl">Valor total</div><div class="val">'+fmtFull(tot.valor)+'</div></div></div>';
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
  let t='';
  if(st.filtros) t+='<div class="sub">'+esc(st.filtros)+'</div>';
  t+='<table><thead><tr>'+cols.map(c=>'<th class="'+(c.tipo==='money'||c.tipo==='num'?'r':'')+'">'+esc(c.label)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(r=>'<tr>'+cols.map(c=>'<td class="'+(c.tipo==='money'||c.tipo==='num'?'r':'')+'">'+relFmt(r[c.key],c.tipo)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  imprimirDoc((st.titulo||'Relatório'), t, 'Total: '+fmtFull(tot.valor)+'  ·  '+(tot.qtd||0)+' registro(s)');
}
window.relImprimir=relImprimir;
