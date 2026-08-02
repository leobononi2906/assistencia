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
    '<option value="abertos" selected>Somente em aberto</option><option value="vencidos">Somente vencidos</option></select></div>';
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
    '<div class="field"><label>Data da baixa</label><input type="date" id="bx-data" value="'+new Date().toISOString().slice(0,10)+'"></div>'+
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
let cobRows=[];
async function loadCobranca(){
  try{
    const [cli,regua]=await Promise.all([sb.rpc('erp_list',{p_tabela:'vw_cobranca_clientes',p_limit:9999}),lookup('cobranca_regua')]);
    cobRows=(cli.data||[]).sort((a,b)=>(Number(b.total_vencido)||0)-(Number(a.total_vencido)||0));
    const faixa=(dias)=>regua.find(r=>dias>=r.dias_de&&dias<=r.dias_ate)||{descricao:'—',cor:'#9AA5B8'};
    const totVenc=cobRows.reduce((s,r)=>s+(Number(r.total_vencido)||0),0);
    let html='<div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="btn btn-sm btn-ghost" onclick="cobConfig()">⚙ Config cobrança (PIX/juros)</button></div>';
    html+='<div class="grid-kpi">'+
      '<div class="metric"><div class="lbl">Total vencido</div><div class="val">'+fmtFull(totVenc)+'</div></div>'+
      '<div class="metric"><div class="lbl">Clientes inadimplentes</div><div class="val">'+cobRows.length+'</div></div></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Cliente</th><th>Contato</th>'+
      '<th>Tít. venc.</th><th>Vencido</th><th>A vencer</th><th>Saldo devedor</th><th>Maior atraso</th><th>Faixa</th><th>Ações</th></tr></thead><tbody>';
    if(cobRows.length===0) html+='<tr><td colspan="9"><div class="empty">Nenhum cliente com saldo devedor. 🎉</div></td></tr>';
    cobRows.forEach((r,i)=>{
      const fx=faixa(Number(r.maior_atraso)||0);
      const contato=r.whatsapp||r.celular||r.telefone||'—';
      html+='<tr><td>'+esc(r.cliente||'—')+'</td><td>'+esc(contato)+'</td>'+
        '<td>'+(r.titulos_vencidos||0)+'</td><td class="mono">'+fmtNum(r.total_vencido)+'</td>'+
        '<td class="mono">'+fmtNum(r.total_a_vencer)+'</td><td class="mono">'+fmtNum(r.saldo_devedor)+'</td>'+
        '<td>'+(r.maior_atraso>0?('<span class="b-badge b-badge-err">'+r.maior_atraso+'d</span>'):'—')+'</td>'+
        '<td><span class="b-badge" style="background:'+esc(fx.cor)+'22;color:'+esc(fx.cor)+'">'+esc(fx.descricao)+'</span></td>'+
        '<td class="acoes" style="white-space:nowrap">'+
          '<button class="btn btn-sm btn-ok" onclick="cobCobrar('+i+')">Cobrar</button> '+
          '<button class="btn btn-sm" onclick="cobReneg('+i+')">Renegociar</button> '+
          '<button class="btn btn-sm btn-ghost" onclick="cobAcao('+r.id_cliente+','+(r.id_empresa||'null')+',\''+esc(String(r.cliente||'')).replace(/'/g,"")+'\')">Ação</button>'+
        '</td></tr>';
    });
    html+='</tbody></table></div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar a Cobrança.',e.message); }
}
window.loadCobranca=loadCobranca;

/* ----- PIX copia-e-cola (BR Code EMV) ----- */
function pixTxt(s,max){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z0-9 ]/g,'').trim().slice(0,max||99); }
function pixTLV(id,v){ v=String(v); return id+String(v.length).padStart(2,'0')+v; }
function pixCRC16(str){ let c=0xFFFF; for(let i=0;i<str.length;i++){ c^=str.charCodeAt(i)<<8; for(let j=0;j<8;j++){ c=(c&0x8000)?((c<<1)^0x1021):(c<<1); c&=0xFFFF; } } return c.toString(16).toUpperCase().padStart(4,'0'); }
function pixBRCode(o){
  const chave=String(o.chave||'').trim();
  if(!chave) return '';
  const gui=pixTLV('00','br.gov.bcb.pix')+pixTLV('01',chave)+(o.descricao?pixTLV('02',pixTxt(o.descricao,40)):'');
  const mai=pixTLV('26',gui);
  const val=(o.valor&&Number(o.valor)>0)?pixTLV('54',Number(o.valor).toFixed(2)):'';
  const add=pixTLV('62',pixTLV('05',o.txid?pixTxt(o.txid,25).replace(/ /g,''):'***'));
  let p='000201'+mai+pixTLV('52','0000')+pixTLV('53','986')+val+pixTLV('58','BR')+
        pixTLV('59',pixTxt(o.nome,25)||'RECEBEDOR')+pixTLV('60',pixTxt(o.cidade,15)||'BRASIL')+add+'6304';
  return p+pixCRC16(p);
}

/* ----- Modal Cobrar (PIX + mensagem WhatsApp/e-mail) ----- */
function cobMsgFill(tpl,ctx){
  return String(tpl||'').replace(/{cliente}/g,ctx.cliente).replace(/{empresa}/g,ctx.empresa)
    .replace(/{total}/g,ctx.total).replace(/{qtd}/g,ctx.qtd).replace(/{maior_atraso}/g,ctx.maior_atraso)
    .replace(/{lista}/g,ctx.lista).replace(/{pix}/g,ctx.pix);
}
async function cobCobrar(idx){
  const r=cobRows[idx]; if(!r) return;
  try{
    const [dados,cfgR,tpls]=await Promise.all([
      sb.rpc('erp_cobranca_cliente_titulos',{p_id_cliente:r.id_cliente,p_id_empresa:r.id_empresa||null}),
      sb.rpc('erp_cobranca_config_get',{p_id_empresa:r.id_empresa}),
      lookup('cobranca_templates') ]);
    if(dados.error) throw dados.error;
    const d=dados.data||{}, cfg=(cfgR.data)||{}, titulos=d.titulos||[];
    const total=Number(d.total_saldo)||0, maior=Number(d.maior_atraso)||0;
    const pix=pixBRCode({chave:cfg.pix_chave,nome:cfg.beneficiario_nome,cidade:cfg.beneficiario_cidade,valor:total,txid:'COB'+r.id_cliente,descricao:cfg.empresa});
    const lista=titulos.map(t=>'• '+(t.numero||'')+' '+(t.parcela||'')+' venc '+fmtDate(t.vencimento)+' — '+fmtNum(t.valor_saldo)+(t.dias_atraso>0?(' ('+t.dias_atraso+'d)'):'')).join('\n');
    const ctx={cliente:(d.cliente&&d.cliente.nome)||r.cliente||'',empresa:cfg.empresa||'',total:fmtNum(total),qtd:titulos.length,maior_atraso:maior,lista:lista,pix:(pix||'(PIX não configurado)')};
    // escolhe template WhatsApp pela faixa do maior atraso
    const cand=(tpls||[]).filter(t=>t.ativo!==false&&t.canal==='WHATSAPP'&&maior>=(t.faixa_de??-9999)&&maior<=(t.faixa_ate??9999));
    const msg=cobMsgFill((cand[0]||{}).mensagem||'Olá {cliente}, consta em aberto {total} com a {empresa}.\n{pix}',ctx);
    const fone=String(d.cliente&&(d.cliente.whatsapp||d.cliente.celular||d.cliente.telefone)||'').replace(/\D/g,'');
    const email=(d.cliente&&d.cliente.email)||'';
    const pixHint=pix?'':'<p class="hint" style="color:var(--warning)">⚠ Empresa sem chave PIX cadastrada — clique em Config cobrança.</p>';
    const body='<div class="form-grid">'+
      '<div class="field full"><label>Títulos em aberto ('+titulos.length+') — total '+fmtNum(total)+'</label>'+
        '<div class="tbl-wrap" style="max-height:150px;overflow:auto"><table class="data"><tbody>'+
        (titulos.length?titulos.map(t=>'<tr><td>'+esc(t.numero||'')+' '+esc(t.parcela||'')+'</td><td>'+fmtDate(t.vencimento)+'</td><td class="mono">'+fmtNum(t.valor_saldo)+'</td><td>'+(t.dias_atraso>0?('<span class="b-badge b-badge-err">'+t.dias_atraso+'d</span>'):'—')+'</td></tr>').join(''):'<tr><td>Sem títulos</td></tr>')+
        '</tbody></table></div></div>'+
      '<div class="field full"><label>PIX copia e cola</label>'+pixHint+
        '<textarea id="cob-pix" rows="3" readonly style="font-family:var(--font-mono);font-size:11px">'+esc(pix||'')+'</textarea>'+
        '<button class="btn btn-sm" style="margin-top:4px" onclick="cobCopy(\'cob-pix\')">Copiar PIX</button></div>'+
      '<div class="field full"><label>Mensagem</label><textarea id="cob-msg" rows="7">'+esc(msg)+'</textarea></div>'+
      '</div>';
    const foot='<button class="btn btn-ghost" onclick="closeModal()">Fechar</button>'+
      (fone?('<button class="btn btn-ok" onclick="cobEnviarWa(\''+fone+'\')">Enviar WhatsApp</button>'):'')+
      (email?('<button class="btn" onclick="cobEnviarMail(\''+esc(email)+'\',\''+esc((ctx.empresa||'Cobrança').replace(/'/g,''))+'\')">E-mail</button>'):'')+
      '<button class="btn" onclick="cobAcao('+r.id_cliente+','+(r.id_empresa||'null')+',\''+esc(String(r.cliente||'')).replace(/'/g,"")+'\')">Registrar ação</button>';
    openModal('Cobrar — '+esc(r.cliente||''),body,foot);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cobCobrar=cobCobrar;
function cobCopy(id){ const el=$('#'+id); if(!el)return; el.select(); try{ document.execCommand('copy'); }catch(e){} if(navigator.clipboard) navigator.clipboard.writeText(el.value).catch(()=>{}); toast('Copiado','ok'); }
window.cobCopy=cobCopy;
function cobEnviarWa(fone){ const msg=$('#cob-msg').value||''; const f=fone.length<=11?('55'+fone):fone; window.open('https://wa.me/'+f+'?text='+encodeURIComponent(msg),'_blank'); }
window.cobEnviarWa=cobEnviarWa;
function cobEnviarMail(email,assunto){ const msg=$('#cob-msg').value||''; window.open('mailto:'+email+'?subject='+encodeURIComponent(assunto)+'&body='+encodeURIComponent(msg),'_blank'); }
window.cobEnviarMail=cobEnviarMail;

/* ----- Modal Renegociar ----- */
async function cobReneg(idx){
  const r=cobRows[idx]; if(!r) return;
  try{
    const [dados,cfgR,formas]=await Promise.all([
      sb.rpc('erp_cobranca_cliente_titulos',{p_id_cliente:r.id_cliente,p_id_empresa:r.id_empresa||null}),
      sb.rpc('erp_cobranca_config_get',{p_id_empresa:r.id_empresa}),
      lookup('formas_pagamento') ]);
    if(dados.error) throw dados.error;
    const d=dados.data||{}, cfg=cfgR.data||{}, titulos=d.titulos||[];
    if(!titulos.length){ toast('Cliente sem títulos em aberto','warn'); return; }
    window._renTit=titulos;
    const optForma='<option value="">—</option>'+(formas||[]).map(f=>'<option value="'+f.id+'">'+esc(f.descricao||('#'+f.id))+'</option>').join('');
    const hoje=new Date(); const venc=new Date(hoje.getTime()+30*86400000).toISOString().slice(0,10);
    const linhas=titulos.map((t,i)=>'<tr><td><input type="checkbox" class="ren-chk" data-id="'+t.id+'" data-saldo="'+t.valor_saldo+'" checked onchange="cobRenPrev()"></td>'+
      '<td>'+esc(t.numero||'')+' '+esc(t.parcela||'')+'</td><td>'+fmtDate(t.vencimento)+'</td>'+
      '<td class="mono">'+fmtNum(t.valor_saldo)+'</td><td>'+(t.dias_atraso>0?('<span class="b-badge b-badge-err">'+t.dias_atraso+'d</span>'):'—')+'</td></tr>').join('');
    const body='<div class="form-grid">'+
      '<div class="field full"><label>Títulos a renegociar</label>'+
        '<div class="tbl-wrap" style="max-height:170px;overflow:auto"><table class="data"><thead><tr><th></th><th>Nº</th><th>Venc.</th><th>Saldo</th><th>Atraso</th></tr></thead><tbody>'+linhas+'</tbody></table></div></div>'+
      '<div class="field"><label>Juros (R$)</label><input type="number" step="0.01" id="ren-juros" value="0" oninput="cobRenPrev()"></div>'+
      '<div class="field"><label>Multa (R$)</label><input type="number" step="0.01" id="ren-multa" value="0" oninput="cobRenPrev()"></div>'+
      '<div class="field"><label>Entrada (R$)</label><input type="number" step="0.01" id="ren-entrada" value="0" oninput="cobRenPrev()"></div>'+
      '<div class="field"><label>Parcelas</label><input type="number" min="1" step="1" id="ren-parc" value="1" oninput="cobRenPrev()"></div>'+
      '<div class="field"><label>1º vencimento</label><input type="date" id="ren-venc" value="'+venc+'"></div>'+
      '<div class="field"><label>Forma de pagamento</label><select id="ren-forma">'+optForma+'</select></div>'+
      '<div class="field full"><label>Observação</label><input id="ren-obs" placeholder="Opcional"></div>'+
      '<div class="field full"><div id="ren-prev" class="hint"></div></div>'+
      '<input type="hidden" id="ren-cfg-juros" value="'+(cfg.juros_mes||0)+'"><input type="hidden" id="ren-cfg-multa" value="'+(cfg.multa_pct||0)+'">'+
      '</div>';
    openModal('Renegociar — '+esc(r.cliente||''),body,
      '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
      '<button class="btn btn-sm btn-ghost" onclick="cobRenSugerir()">Sugerir juros/multa</button>'+
      '<button class="btn btn-ok" onclick="cobRenSalvar('+r.id_cliente+')">Gerar acordo</button>');
    cobRenPrev();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cobReneg=cobReneg;
function cobRenSel(){ return Array.from(document.querySelectorAll('.ren-chk')).filter(c=>c.checked); }
function cobRenPrev(){
  const sel=cobRenSel();
  const saldo=sel.reduce((s,c)=>s+(Number(c.dataset.saldo)||0),0);
  const juros=Number($('#ren-juros').value)||0, multa=Number($('#ren-multa').value)||0, ent=Number($('#ren-entrada').value)||0;
  const n=Math.max(1,parseInt($('#ren-parc').value)||1);
  const fin=Math.round((saldo+juros+multa-ent)*100)/100;
  const parc=Math.round((fin/n)*100)/100;
  const el=$('#ren-prev'); if(!el) return;
  if(fin<=0){ el.innerHTML='<span style="color:var(--destructive)">Selecione títulos e ajuste os valores — valor a financiar deve ser &gt; 0.</span>'; return; }
  el.innerHTML='Saldo selecionado: <b>'+fmtNum(saldo)+'</b> + juros '+fmtNum(juros)+' + multa '+fmtNum(multa)+' − entrada '+fmtNum(ent)+
    ' = <b>'+fmtNum(fin)+'</b> em <b>'+n+'x</b> de ~<b>'+fmtNum(parc)+'</b>';
}
window.cobRenPrev=cobRenPrev;
function cobRenSugerir(){
  const sel=cobRenSel(); const saldo=sel.reduce((s,c)=>s+(Number(c.dataset.saldo)||0),0);
  const jm=Number($('#ren-cfg-juros').value)||0, mp=Number($('#ren-cfg-multa').value)||0;
  // maior atraso entre os selecionados (via _renTit)
  const ids=sel.map(c=>Number(c.dataset.id));
  const atraso=Math.max(0,...(window._renTit||[]).filter(t=>ids.includes(t.id)).map(t=>Number(t.dias_atraso)||0));
  $('#ren-multa').value=(Math.round(saldo*mp/100*100)/100).toFixed(2);
  $('#ren-juros').value=(Math.round(saldo*jm/100*(atraso/30)*100)/100).toFixed(2);
  cobRenPrev();
}
window.cobRenSugerir=cobRenSugerir;
async function cobRenSalvar(idCliente){
  try{
    const sel=cobRenSel(); if(!sel.length){ toast('Selecione ao menos um título','warn'); return; }
    const ids=sel.map(c=>Number(c.dataset.id));
    const p={ p_ids:ids, p_id_usuario:UID(), p_qtd_parcelas:Math.max(1,parseInt($('#ren-parc').value)||1),
      p_primeiro_venc:$('#ren-venc').value, p_valor_entrada:Number($('#ren-entrada').value)||0,
      p_valor_juros:Number($('#ren-juros').value)||0, p_valor_multa:Number($('#ren-multa').value)||0,
      p_id_forma:$('#ren-forma').value?Number($('#ren-forma').value):null, p_observacao:$('#ren-obs').value||null };
    if(!p.p_primeiro_venc){ toast('Informe o 1º vencimento','warn'); return; }
    const {data,error}=await sb.rpc('erp_renegociar_titulos',p);
    if(error) throw error;
    if(data&&data.ok===false) throw new Error(data.erro||'Falha');
    closeModal(); toast('Acordo '+data.numero+' gerado ('+data.qtd_parcelas+'x)','ok'); loadCobranca();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cobRenSalvar=cobRenSalvar;

/* ----- Modal Config cobrança (por empresa) ----- */
async function cobConfig(){
  try{
    const empresas=await lookup('empresas');
    const opt=(empresas||[]).map(e=>'<option value="'+e.id+'">'+esc(e.nome_fantasia||e.nome||('#'+e.id))+'</option>').join('');
    const body='<div class="form-grid">'+
      '<div class="field full"><label>Empresa</label><select id="cfg-emp" onchange="cobConfigLoad()">'+opt+'</select></div>'+
      '<div class="field"><label>Tipo de chave PIX</label><select id="cfg-pixtipo"><option value="">—</option><option>EVP</option><option>CPF</option><option>CNPJ</option><option>EMAIL</option><option>TELEFONE</option></select></div>'+
      '<div class="field"><label>Chave PIX</label><input id="cfg-pixchave"></div>'+
      '<div class="field"><label>Beneficiário (nome)</label><input id="cfg-benef" maxlength="25"></div>'+
      '<div class="field"><label>Cidade</label><input id="cfg-cidade" maxlength="15"></div>'+
      '<div class="field"><label>Juros ao mês (%)</label><input type="number" step="0.001" id="cfg-juros"></div>'+
      '<div class="field"><label>Multa (%)</label><input type="number" step="0.001" id="cfg-multa"></div>'+
      '<div class="field full"><label>Instruções</label><input id="cfg-instr" placeholder="Opcional"></div>'+
      '</div>';
    openModal('Config de cobrança',body,
      '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
      '<button class="btn btn-ok" onclick="cobConfigSalvar()">Salvar</button>');
    cobConfigLoad();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cobConfig=cobConfig;
async function cobConfigLoad(){
  const id=Number($('#cfg-emp').value); if(!id) return;
  const {data}=await sb.rpc('erp_cobranca_config_get',{p_id_empresa:id}); const c=data||{};
  $('#cfg-pixtipo').value=c.pix_tipo||''; $('#cfg-pixchave').value=c.pix_chave||'';
  $('#cfg-benef').value=c.beneficiario_nome||''; $('#cfg-cidade').value=c.beneficiario_cidade||'';
  $('#cfg-juros').value=c.juros_mes!=null?c.juros_mes:''; $('#cfg-multa').value=c.multa_pct!=null?c.multa_pct:'';
  $('#cfg-instr').value=c.instrucoes||'';
}
window.cobConfigLoad=cobConfigLoad;
async function cobConfigSalvar(){
  try{
    const dados={ id_empresa:Number($('#cfg-emp').value), pix_tipo:$('#cfg-pixtipo').value||null,
      pix_chave:$('#cfg-pixchave').value||null, beneficiario_nome:$('#cfg-benef').value||null,
      beneficiario_cidade:$('#cfg-cidade').value||null,
      juros_mes:$('#cfg-juros').value!==''?Number($('#cfg-juros').value):null,
      multa_pct:$('#cfg-multa').value!==''?Number($('#cfg-multa').value):null, instrucoes:$('#cfg-instr').value||null };
    const {data,error}=await sb.rpc('erp_cobranca_config_salvar',{p_dados:dados});
    if(error) throw error; if(data&&data.ok===false) throw new Error(data.erro);
    closeModal(); toast('Configuração salva','ok');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cobConfigSalvar=cobConfigSalvar;

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
