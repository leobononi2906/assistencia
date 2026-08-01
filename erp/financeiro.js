/* ERP Bononi — Financeiro: Contas a Receber/Pagar, Caixa, Cobrança */
const lookupCache={};
async function lookup(tabela){
  if(lookupCache[tabela]) return lookupCache[tabela];
  const {data}=await sb.rpc('erp_list',{p_tabela:tabela,p_limit:9999});
  lookupCache[tabela]=data||[]; return lookupCache[tabela];
}
function statusBadge(st,vencido){
  if(vencido && !['PAGO','CANCELADO','RENEGOCIADO'].includes(st)) return '<span class="b-badge b-badge-err">VENCIDO</span>';
  const m={ABERTO:'info',PAGO:'ok',PAGO_PARCIAL:'warn',VENCIDO:'err',CANCELADO:'muted',RENEGOCIADO:'muted'};
  return '<span class="b-badge b-badge-'+(m[st]||'muted')+'">'+esc(st||'')+'</span>';
}
const UID=()=>window.usuarioAtual&&window.usuarioAtual.id;

/* ---------------- CONTAS A RECEBER ---------------- */
async function loadCR(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_contas_receber',p_limit:9999});
    if(error) throw error;
    renderTitulos('CR', data||[]);
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar Contas a Receber.',e.message); }
}
async function loadCP(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_contas_pagar',p_limit:9999});
    if(error) throw error;
    renderTitulos('CP', data||[]);
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar Contas a Pagar.',e.message); }
}
window.loadCR=loadCR; window.loadCP=loadCP;

function renderTitulos(tipo, rows){
  const parte=tipo==='CR'?'cliente':'fornecedor';
  const abertos=rows.filter(t=>['ABERTO','PAGO_PARCIAL','VENCIDO'].includes(t.status));
  const totSaldo=abertos.reduce((s,t)=>s+(Number(t.valor_saldo)||0),0);
  const totVenc=rows.filter(t=>t.vencido).reduce((s,t)=>s+(Number(t.valor_saldo)||0),0);
  let html='<div class="grid-kpi">'+
    '<div class="metric"><div class="lbl">Em aberto</div><div class="val">'+fmtFull(totSaldo)+'</div></div>'+
    '<div class="metric"><div class="lbl">Vencido</div><div class="val">'+fmtFull(totVenc)+'</div></div>'+
    '<div class="metric"><div class="lbl">Títulos</div><div class="val">'+rows.length+'</div></div></div>';
  html+='<div class="toolbar"><input type="search" id="ft-busca" placeholder="Filtrar por '+parte+'..." onkeyup="ftFiltrar()">'+
    '<select id="ft-status" onchange="ftFiltrar()"><option value="">Todos os status</option>'+
    '<option value="abertos">Somente em aberto</option><option value="vencidos">Somente vencidos</option></select></div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr>'+
    '<th>Nº</th><th>Parc.</th><th>'+parte.charAt(0).toUpperCase()+parte.slice(1)+'</th><th>Empresa</th>'+
    '<th>Vencimento</th><th>Valor</th><th>Saldo</th><th>Status</th><th>Atraso</th><th></th></tr></thead><tbody id="ft-body"></tbody></table></div>';
  $('#screen').innerHTML=html;
  window.__ftRows=rows; window.__ftTipo=tipo; ftFiltrar();
}
function ftFiltrar(){
  const rows=window.__ftRows||[], tipo=window.__ftTipo, parte=tipo==='CR'?'cliente':'fornecedor';
  const q=($('#ft-busca')?$('#ft-busca').value:'').toLowerCase();
  const st=$('#ft-status')?$('#ft-status').value:'';
  let f=rows.filter(t=>String(t[parte]||'').toLowerCase().includes(q));
  if(st==='abertos') f=f.filter(t=>['ABERTO','PAGO_PARCIAL','VENCIDO'].includes(t.status));
  if(st==='vencidos') f=f.filter(t=>t.vencido);
  const body=$('#ft-body'); if(!body) return;
  if(f.length===0){ body.innerHTML='<tr><td colspan="10"><div class="empty">Nenhum título.</div></td></tr>'; return; }
  body.innerHTML=f.map(t=>{
    const aberto=['ABERTO','PAGO_PARCIAL','VENCIDO'].includes(t.status);
    return '<tr><td>'+esc(t.numero||'')+'</td><td>'+esc(t.parcela||'')+'</td>'+
      '<td>'+esc(t[parte]||'—')+'</td><td>'+esc(t.empresa||'')+'</td>'+
      '<td>'+fmtDate(t.data_vencimento)+'</td><td class="mono">'+fmtNum(t.valor)+'</td>'+
      '<td class="mono">'+fmtNum(t.valor_saldo)+'</td><td>'+statusBadge(t.status,t.vencido)+'</td>'+
      '<td>'+(t.dias_atraso>0?('<span class="b-badge b-badge-err">'+t.dias_atraso+'d</span>'):'—')+'</td>'+
      '<td class="acoes">'+(aberto?'<button class="btn btn-sm" onclick="ftBaixar('+t.id+','+(Number(t.valor_saldo)||0)+')">Baixar</button>':'')+'</td></tr>';
  }).join('');
}
window.ftFiltrar=ftFiltrar;

async function ftBaixar(id, saldo){
  const contas=await lookup('contas_financeiras');
  const formas=await lookup('formas_pagamento');
  const body='<div class="form-grid">'+
    '<div class="field full"><label>Conta financeira *</label><select id="bx-conta">'+
      contas.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Valor pago *</label><input type="number" step="0.01" id="bx-valor" value="'+saldo.toFixed(2)+'"></div>'+
    '<div class="field"><label>Forma pagamento</label><select id="bx-forma"><option value="">—</option>'+
      formas.map(f=>'<option value="'+f.id+'">'+esc(f.descricao)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label>Desconto</label><input type="number" step="0.01" id="bx-desc" value="0"></div>'+
    '<div class="field"><label>Juros</label><input type="number" step="0.01" id="bx-juros" value="0"></div>'+
    '<div class="field"><label>Multa</label><input type="number" step="0.01" id="bx-multa" value="0"></div>'+
    '<div class="field"><label>Data da baixa</label><input type="date" id="bx-data"></div>'+
    '</div>';
  openModal('Baixar título #'+id, body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="ftBaixarSalvar('+id+')">Confirmar baixa</button>');
}
window.ftBaixar=ftBaixar;
async function ftBaixarSalvar(id){
  try{
    const p={ p_id_titulo:id, p_id_conta_financeira:Number($('#bx-conta').value),
      p_valor_pago:Number($('#bx-valor').value), p_id_forma_pagamento:$('#bx-forma').value?Number($('#bx-forma').value):null,
      p_id_usuario:UID(), p_valor_desconto:Number($('#bx-desc').value)||0, p_valor_juros:Number($('#bx-juros').value)||0,
      p_valor_multa:Number($('#bx-multa').value)||0, p_data_baixa:$('#bx-data').value||null, p_observacao:null };
    const {data,error}=await sb.rpc('erp_baixar_titulo',p);
    if(error) throw error;
    closeModal(); toast('Baixa registrada ('+(data.novo_status||'')+')','ok');
    (window.__ftTipo==='CR'?loadCR:loadCP)();
  }catch(e){ toast('Erro na baixa: '+(e.message||e),'err'); }
}
window.ftBaixarSalvar=ftBaixarSalvar;

/* ---------------- CAIXA ---------------- */
async function loadCaixa(){
  try{
    const [emp,contas,sess]=await Promise.all([lookup('empresas'),lookup('contas_financeiras'),
      sb.rpc('erp_list',{p_tabela:'caixas_sessoes',p_limit:9999})]);
    const sessoes=(sess.data||[]).sort((a,b)=>b.id-a.id);
    let html='<div class="card card-pad" style="margin-bottom:16px"><div class="toolbar" style="margin:0">'+
      '<b style="font-size:13px">Abrir caixa:</b>'+
      '<select id="cx-emp">'+emp.map(e=>'<option value="'+e.id+'">'+esc(e.nome)+'</option>').join('')+'</select>'+
      '<select id="cx-conta">'+contas.map(c=>'<option value="'+c.id+'">'+esc(c.descricao)+'</option>').join('')+'</select>'+
      '<input type="number" step="0.01" id="cx-abertura" placeholder="Valor abertura" style="width:140px">'+
      '<button class="btn btn-sm" onclick="cxAbrir()">Abrir</button></div></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>#</th><th>Empresa</th><th>Conta</th>'+
      '<th>Abertura</th><th>V. Abertura</th><th>Status</th><th>V. Sistema</th><th>Diferença</th><th></th></tr></thead><tbody>';
    if(sessoes.length===0) html+='<tr><td colspan="9"><div class="empty">Nenhuma sessão de caixa.</div></td></tr>';
    sessoes.forEach(s=>{
      const empN=(emp.find(e=>e.id===s.id_empresa)||{}).nome||'', ctN=(contas.find(c=>c.id===s.id_conta_financeira)||{}).descricao||'';
      const aberto=s.status==='ABERTO';
      html+='<tr><td>'+s.id+'</td><td>'+esc(empN)+'</td><td>'+esc(ctN)+'</td>'+
        '<td>'+fmtDate(s.data_abertura)+'</td><td class="mono">'+fmtNum(s.valor_abertura)+'</td>'+
        '<td>'+(aberto?'<span class="b-badge b-badge-ok">ABERTO</span>':'<span class="b-badge b-badge-muted">FECHADO</span>')+'</td>'+
        '<td class="mono">'+(s.valor_sistema!=null?fmtNum(s.valor_sistema):'—')+'</td>'+
        '<td class="mono">'+(s.diferenca!=null?fmtNum(s.diferenca):'—')+'</td>'+
        '<td class="acoes">'+(aberto?('<button class="btn btn-ghost btn-sm" onclick="cxMov('+s.id+')">Movimento</button> '+
          '<button class="btn btn-danger btn-sm" onclick="cxFechar('+s.id+')">Fechar</button>'):'')+'</td></tr>';
    });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar o Caixa.',e.message); }
}
window.loadCaixa=loadCaixa;
async function cxAbrir(){
  try{ const {data,error}=await sb.rpc('erp_abrir_caixa',{p_id_empresa:Number($('#cx-emp').value),
      p_id_conta_financeira:Number($('#cx-conta').value),p_id_usuario:UID(),p_valor_abertura:Number($('#cx-abertura').value)||0});
    if(error) throw error; toast('Caixa aberto (sessão '+data.id_sessao+')','ok'); loadCaixa();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cxAbrir=cxAbrir;
function cxMov(id){
  const body='<div class="form-grid">'+
    '<div class="field"><label>Tipo *</label><select id="mv-tipo"><option>RECEBIMENTO</option><option>PAGAMENTO</option><option>SUPRIMENTO</option><option>SANGRIA</option></select></div>'+
    '<div class="field"><label>Valor *</label><input type="number" step="0.01" id="mv-valor"></div>'+
    '<div class="field full"><label>Descrição</label><input type="text" id="mv-desc"></div></div>';
  openModal('Movimento de caixa — sessão '+id, body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="cxMovSalvar('+id+')">Lançar</button>');
}
window.cxMov=cxMov;
async function cxMovSalvar(id){
  try{ const {error}=await sb.rpc('erp_movimento_caixa',{p_id_sessao:id,p_tipo:$('#mv-tipo').value,
      p_valor:Number($('#mv-valor').value),p_descricao:$('#mv-desc').value||null,p_id_usuario:UID()});
    if(error) throw error; closeModal(); toast('Movimento lançado','ok'); loadCaixa();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cxMovSalvar=cxMovSalvar;
function cxFechar(id){
  const body='<div class="field"><label>Valor contado (conferência) *</label><input type="number" step="0.01" id="fc-valor"></div>'+
    '<div class="field"><label>Observação</label><input type="text" id="fc-obs"></div>';
  openModal('Fechar caixa — sessão '+id, body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-danger" onclick="cxFecharSalvar('+id+')">Fechar caixa</button>');
}
window.cxFechar=cxFechar;
async function cxFecharSalvar(id){
  try{ const {data,error}=await sb.rpc('erp_fechar_caixa',{p_id_sessao:id,p_valor_contado:Number($('#fc-valor').value),
      p_id_usuario:UID(),p_observacao:$('#fc-obs').value||null});
    if(error) throw error; closeModal();
    toast('Caixa fechado. Diferença: '+fmtFull(data.diferenca), data.diferenca==0?'ok':'err'); loadCaixa();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cxFecharSalvar=cxFecharSalvar;

/* ---------------- COBRANÇA ---------------- */
async function loadCobranca(){
  try{
    const [cli,regua]=await Promise.all([sb.rpc('erp_list',{p_tabela:'vw_cobranca_clientes',p_limit:9999}),lookup('cobranca_regua')]);
    const rows=(cli.data||[]).sort((a,b)=>(Number(b.total_vencido)||0)-(Number(a.total_vencido)||0));
    const faixa=(dias)=>regua.find(r=>dias>=r.dias_de&&dias<=r.dias_ate)||{descricao:'—',cor:'#9AA5B8'};
    const totVenc=rows.reduce((s,r)=>s+(Number(r.total_vencido)||0),0);
    let html='<div class="grid-kpi">'+
      '<div class="metric"><div class="lbl">Total vencido</div><div class="val">'+fmtFull(totVenc)+'</div></div>'+
      '<div class="metric"><div class="lbl">Clientes inadimplentes</div><div class="val">'+rows.length+'</div></div></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Cliente</th><th>Contato</th>'+
      '<th>Tít. venc.</th><th>Vencido</th><th>A vencer</th><th>Saldo devedor</th><th>Maior atraso</th><th>Faixa</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="9"><div class="empty">Nenhum cliente com saldo devedor. 🎉</div></td></tr>';
    rows.forEach(r=>{
      const fx=faixa(Number(r.maior_atraso)||0);
      const contato=r.whatsapp||r.celular||r.telefone||'—';
      html+='<tr><td>'+esc(r.cliente||'—')+'</td><td>'+esc(contato)+'</td>'+
        '<td>'+(r.titulos_vencidos||0)+'</td><td class="mono">'+fmtNum(r.total_vencido)+'</td>'+
        '<td class="mono">'+fmtNum(r.total_a_vencer)+'</td><td class="mono">'+fmtNum(r.saldo_devedor)+'</td>'+
        '<td>'+(r.maior_atraso>0?('<span class="b-badge b-badge-err">'+r.maior_atraso+'d</span>'):'—')+'</td>'+
        '<td><span class="b-badge" style="background:'+esc(fx.cor)+'22;color:'+esc(fx.cor)+'">'+esc(fx.descricao)+'</span></td>'+
        '<td class="acoes"><button class="btn btn-sm" onclick="cobAcao('+r.id_cliente+','+(r.id_empresa||'null')+',\''+esc(String(r.cliente||'')).replace(/'/g,"")+'\')">Registrar ação</button></td></tr>';
    });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar a Cobrança.',e.message); }
}
window.loadCobranca=loadCobranca;
function cobAcao(idCliente,idEmpresa,nome){
  const body='<div class="form-grid">'+
    '<div class="field"><label>Tipo *</label><select id="ca-tipo"><option>CONTATO</option><option>PROMESSA</option><option>ACORDO</option><option>OBS</option></select></div>'+
    '<div class="field"><label>Canal</label><select id="ca-canal"><option value="">—</option><option>WHATSAPP</option><option>TELEFONE</option><option>EMAIL</option><option>PRESENCIAL</option></select></div>'+
    '<div class="field"><label>Data promessa</label><input type="date" id="ca-dtprom"></div>'+
    '<div class="field"><label>Valor promessa</label><input type="number" step="0.01" id="ca-vlprom"></div>'+
    '<div class="field full"><label>Descrição</label><textarea id="ca-desc" rows="2"></textarea></div></div>';
  openModal('Registrar ação — '+nome, body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="cobAcaoSalvar('+idCliente+','+idEmpresa+')">Salvar</button>');
}
window.cobAcao=cobAcao;
async function cobAcaoSalvar(idCliente,idEmpresa){
  try{
    const dados={ id_cliente:idCliente, id_empresa:idEmpresa||null, id_usuario:UID(),
      tipo:$('#ca-tipo').value, canal:$('#ca-canal').value||null, descricao:$('#ca-desc').value||null,
      data_promessa:$('#ca-dtprom').value||null, valor_promessa:$('#ca-vlprom').value?Number($('#ca-vlprom').value):null };
    const {data,error}=await sb.rpc('erp_upsert',{p_tabela:'cobranca_acoes',p_dados:dados,p_id:null});
    if(error) throw error;
    if(data&&data.ok===false) throw new Error(data.erro);
    closeModal(); toast('Ação de cobrança registrada','ok');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cobAcaoSalvar=cobAcaoSalvar;
