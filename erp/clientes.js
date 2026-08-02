/* ERP Bononi — Clientes: tela única (Dados + Endereço + Crédito/Pagamento + Contatos) */

let clId=null, clFull=null, clVendedores=null;

/* ---------------- LISTA ---------------- */
async function loadClientes(busca){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'clientes',p_busca:busca||null,p_limit:500,p_offset:0});
    if(error) throw error;
    const rows=data||[];
    let html='<div class="toolbar">'+
      '<input type="search" id="cl-busca" placeholder="Buscar cliente (nome, fantasia, CPF/CNPJ)..." value="'+esc(busca||'')+'" onkeydown="if(event.key===\'Enter\')loadClientes(this.value)">'+
      '<button class="btn btn-ghost btn-sm" onclick="loadClientes($(\'#cl-busca\').value)">Buscar</button>'+
      '<div class="spacer"></div>'+permBtn('CLIENTES','incluir','<button class="btn btn-sm" onclick="clEditor(null)">+ Novo cliente</button>')+'</div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Cód.</th><th>Nome</th><th>CPF/CNPJ</th>'+
      '<th>Cidade/UF</th><th>Limite</th><th>Prazo</th><th>Situação</th><th></th></tr></thead><tbody>';
    if(rows.length===0) html+='<tr><td colspan="8"><div class="empty">Nenhum cliente encontrado.</div></td></tr>';
    rows.forEach(r=>{
      html+='<tr><td>'+esc(r.codigo||r.id)+'</td><td>'+esc(r.nome||'')+(r.nome_fantasia?' <span style="color:hsl(var(--text-muted))">('+esc(r.nome_fantasia)+')</span>':'')+'</td>'+
        '<td class="mono">'+esc(r.cpf_cnpj||'—')+'</td><td>'+esc((r.cidade||'')+(r.uf?('/'+r.uf):''))+'</td>'+
        '<td class="mono">'+fmtNum(r.limite_credito)+'</td>'+
        '<td>'+(r.permite_prazo?'<span class="b-badge b-badge-ok">Sim</span>':'<span class="b-badge b-badge-muted">Não</span>')+'</td>'+
        '<td><span class="b-badge b-badge-'+(String(r.situacao||'').toUpperCase()==='ATIVO'?'ok':'muted')+'">'+esc(r.situacao||'')+'</span></td>'+
        '<td class="acoes" style="white-space:nowrap"><button class="btn btn-ghost btn-sm" onclick="clEditor('+r.id+')">Abrir</button> '+
          '<button class="btn btn-ghost btn-sm" onclick="clEditor('+r.id+',\'hist\')">Histórico</button></td></tr>';
    });
    html+='</tbody></table></div><div style="font-size:11px;color:hsl(var(--text-muted));margin-top:8px">'+rows.length+' cliente(s)</div>';
    $('#screen').innerHTML=html;
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar os clientes.',e.message); }
}
window.loadClientes=loadClientes;

/* ---------------- EDITOR ---------------- */
async function clEditor(id, initTab, opts){
  opts=opts||{};
  clId=id; clFull=null;
  const inModal=!!opts.modal && typeof modalBody==='function' && modalBody();
  const tgt = inModal ? modalBody() : $('#screen');
  if(inModal) modalSetTitle(id?'Cliente — edição':'Cliente');
  else $('#page-title').textContent = id?'Cliente — edição':'Cliente — novo';
  let html = inModal ? '' :
    '<div class="toolbar"><button class="btn btn-ghost btn-sm" onclick="loadClientes()">&larr; Voltar</button><div class="spacer"></div></div>';
  html+='<div class="tabs" id="cl-tabs">'+
    '<a class="tab active" data-t="dados" onclick="clTab(\'dados\')">Dados & Endereço</a>'+
    '<a class="tab" data-t="credito" onclick="clTab(\'credito\')">Crédito & Pagamento</a>'+
    '<a class="tab" data-t="contatos" onclick="clTab(\'contatos\')">Contatos</a>'+
    (id?'<a class="tab" data-t="hist" onclick="clTab(\'hist\')">Histórico</a>':'')+
    '</div><div id="cl-tab-body" class="card card-pad"></div>';
  tgt.innerHTML=html;
  if(id){ clFull=await clCarregar(id); }
  clTab(initTab&&id?initTab:'dados');
}
window.clEditor=clEditor;

async function clCarregar(id){
  const {data,error}=await sb.rpc('erp_cliente_full',{p_id_cliente:Number(id)});
  if(error){ toast('Erro ao carregar: '+error.message,'err'); return null; }
  return data;
}
function clTab(t){
  document.querySelectorAll('#cl-tabs .tab').forEach(a=>a.classList.toggle('active',a.dataset.t===t));
  if(t==='dados') return clRenderDados();
  if(t==='credito') return clRenderCredito();
  if(t==='contatos') return clRenderContatos();
  if(t==='hist') return clRenderHistorico();
}
window.clTab=clTab;

/* ---- Histórico (pagamentos + movimentações) ---- */
async function clRenderHistorico(){
  const body=$('#cl-tab-body');
  if(!clId){ body.innerHTML='<div class="empty">Salve o cliente para ver o histórico.</div>'; return; }
  body.innerHTML='<div class="empty">Carregando…</div>';
  const {data,error}=await sb.rpc('erp_cliente_historico',{p_id_cliente:Number(clId),p_id_empresa:null,p_limit:200});
  if(error){ body.innerHTML=errBox('Erro ao carregar histórico',error.message); return; }
  const d=data||{}, r=d.resumo||{}, movs=d.movimentacoes||[], pags=d.pagamentos||[];
  let html='<div class="grid-kpi">'+
    '<div class="metric"><div class="lbl">Total comprado</div><div class="val">'+fmtFull(r.total_comprado)+'</div></div>'+
    '<div class="metric"><div class="lbl">Compras</div><div class="val">'+(r.qtd_compras||0)+'</div></div>'+
    '<div class="metric"><div class="lbl">Total pago</div><div class="val">'+fmtFull(r.total_pago)+'</div></div>'+
    '<div class="metric"><div class="lbl">Saldo devedor</div><div class="val">'+fmtFull(r.saldo_devedor)+'</div></div>'+
    '<div class="metric"><div class="lbl">Última compra</div><div class="val" style="font-size:15px">'+(r.ultima_compra?fmtDate(r.ultima_compra):'—')+'</div></div></div>';
  // Movimentações
  html+='<h3 style="margin:14px 0 6px">Movimentações ('+movs.length+')</h3>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Data</th><th>Doc</th><th>Tipo</th><th>Número</th><th>Empresa</th><th>Valor</th><th>Status</th></tr></thead><tbody>';
  if(!movs.length) html+='<tr><td colspan="7"><div class="empty">Sem movimentações.</div></td></tr>';
  movs.forEach(m=>{
    const badge=m.doc==='OS'?'b-badge-info':'b-badge-muted';
    const rot=esc(m.numero||('#'+m.id));
    const linkable=(m.doc==='VENDA'||m.doc==='OS')&&m.id;
    const num=linkable?('<span class="doc-link" onclick="abrirDoc(\''+m.doc+'\','+m.id+')">'+rot+'</span>'):rot;
    html+='<tr'+(m.cancelada?' style="opacity:.5;text-decoration:line-through"':'')+'>'+
      '<td>'+fmtDate(m.data)+'</td><td><span class="b-badge '+badge+'">'+esc(m.doc)+'</span></td>'+
      '<td>'+esc(m.tipo||'')+'</td><td class="mono">'+num+'</td>'+
      '<td>'+esc(m.empresa||'')+'</td><td class="mono">'+fmtNum(m.valor)+'</td><td>'+esc(m.status||'')+'</td></tr>';
  });
  html+='</tbody></table></div>';
  // Pagamentos
  html+='<h3 style="margin:14px 0 6px">Pagamentos ('+pags.length+')</h3>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Data</th><th>Título</th><th>Forma</th><th>Pago</th><th>Juros/Multa</th><th></th></tr></thead><tbody>';
  if(!pags.length) html+='<tr><td colspan="6"><div class="empty">Sem pagamentos registrados.</div></td></tr>';
  pags.forEach(p=>{
    const jm=(Number(p.valor_juros)||0)+(Number(p.valor_multa)||0);
    html+='<tr'+(p.estornado?' style="opacity:.5"':'')+'><td>'+fmtDate(p.data)+'</td>'+
      '<td class="mono">'+esc(p.titulo||'')+' '+esc(p.parcela||'')+'</td><td>'+esc(p.forma||'—')+'</td>'+
      '<td class="mono">'+fmtNum(p.valor_pago)+'</td><td class="mono">'+(jm?fmtNum(jm):'—')+'</td>'+
      '<td>'+(p.estornado?'<span class="b-badge b-badge-err">estornado</span>':'')+'</td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
window.clRenderHistorico=clRenderHistorico;

/* ---- Dados & Endereço ---- */
async function clRenderDados(){
  const body=$('#cl-tab-body');
  const [empresas,tabprecos,transp,muns]=await Promise.all([
    lookup('empresas'),lookup('tabelas_preco'),lookup('transportadoras'),lookup('municipios')]);
  if(!clVendedores){ const {data}=await sb.rpc('erp_vendedores'); clVendedores=data||[]; }
  const c=(clFull&&clFull.cliente)||{};
  const munOpts=(muns||[]).slice(0,6000).map(m=>'<option value="'+esc((m.nome||'')+' / '+(m.uf||''))+'" data-id="'+m.id+'">').join('');
  const munSel=c.id_municipio?((muns.find(m=>String(m.id)===String(c.id_municipio))||{}).nome||''):'';
  body.innerHTML='<div class="form-grid">'+
    '<div class="field"><label>Tipo pessoa</label><select id="cl-tp"><option value="F"'+(c.tipo_pessoa==='F'||!c.tipo_pessoa?' selected':'')+'>Física</option><option value="J"'+(c.tipo_pessoa==='J'?' selected':'')+'>Jurídica</option></select></div>'+
    '<div class="field"><label>Empresa</label><select id="cl-emp">'+pdOptions(empresas,c.id_empresa)+'</select></div>'+
    '<div class="field full"><label>Nome / Razão social *</label><input type="text" id="cl-nome" value="'+esc(c.nome||'')+'"></div>'+
    '<div class="field full"><label>Nome fantasia</label><input type="text" id="cl-fant" value="'+esc(c.nome_fantasia||'')+'"></div>'+
    '<div class="field"><label>CPF / CNPJ</label><input type="text" id="cl-doc" maxlength="18" value="'+esc(c.cpf_cnpj||'')+'"></div>'+
    '<div class="field"><label>RG / IE</label><input type="text" id="cl-ie" maxlength="20" value="'+esc(c.rg_ie||'')+'"></div>'+
    '<div class="field"><label>Indicador IE</label><select id="cl-indie"><option value="1"'+(String(c.indicador_ie)==='1'?' selected':'')+'>1 - Contribuinte</option><option value="2"'+(String(c.indicador_ie)==='2'?' selected':'')+'>2 - Isento</option><option value="9"'+(String(c.indicador_ie)==='9'||c.indicador_ie==null?' selected':'')+'>9 - Não contribuinte</option></select></div>'+
    '<div class="field"><label>Inscrição municipal</label><input type="text" id="cl-im" maxlength="20" value="'+esc(c.inscricao_municipal||'')+'"></div>'+
    '<div class="field"><label>E-mail</label><input type="email" id="cl-email" value="'+esc(c.email||'')+'"></div>'+
    '<div class="field"><label>E-mail NF-e</label><input type="email" id="cl-emailnfe" value="'+esc(c.email_nfe||'')+'"></div>'+
    '<div class="field"><label>Telefone</label><input type="text" id="cl-fone" value="'+esc(c.telefone||'')+'"></div>'+
    '<div class="field"><label>Celular</label><input type="text" id="cl-cel" value="'+esc(c.celular||'')+'"></div>'+
    '<div class="field"><label>WhatsApp</label><input type="text" id="cl-wpp" value="'+esc(c.whatsapp||'')+'"></div>'+
    '<div class="field"><label>Vendedor</label><select id="cl-vend"><option value="">—</option>'+
      (clVendedores||[]).map(v=>'<option value="'+v.id+'"'+(String(c.id_vendedor)===String(v.id)?' selected':'')+'>'+esc(v.nome)+'</option>').join('')+'</select></div>'+
    '<div class="field full" style="border-top:1px solid hsl(var(--border));padding-top:8px;margin-top:2px"><b style="font-size:12px">Endereço</b></div>'+
    '<div class="field full"><label>Logradouro</label><input type="text" id="cl-end" value="'+esc(c.endereco||'')+'"></div>'+
    '<div class="field"><label>Número</label><input type="text" id="cl-num" value="'+esc(c.numero||'')+'"></div>'+
    '<div class="field"><label>Complemento</label><input type="text" id="cl-compl" value="'+esc(c.complemento||'')+'"></div>'+
    '<div class="field"><label>Bairro</label><input type="text" id="cl-bairro" value="'+esc(c.bairro||'')+'"></div>'+
    '<div class="field"><label>CEP</label><input type="text" id="cl-cep" maxlength="9" value="'+esc(c.cep||'')+'"></div>'+
    '<div class="field"><label>Cidade</label><input type="text" id="cl-cidade" value="'+esc(c.cidade||'')+'"></div>'+
    '<div class="field"><label>UF</label><input type="text" id="cl-uf" maxlength="2" value="'+esc(c.uf||'')+'"></div>'+
    '<div class="field"><label>Município IBGE</label><input list="cl-muns" id="cl-mun" value="'+esc(munSel)+'" placeholder="digite a cidade"><datalist id="cl-muns">'+munOpts+'</datalist></div>'+
    '<div class="field"><label>Situação</label><select id="cl-sit"><option value="ATIVO"'+(String(c.situacao||'ATIVO')==='ATIVO'?' selected':'')+'>ATIVO</option><option value="INATIVO"'+(c.situacao==='INATIVO'?' selected':'')+'>INATIVO</option></select></div>'+
    '<div class="field full"><label>Observação</label><input type="text" id="cl-obs" value="'+esc(c.observacao||'')+'"></div>'+
    '</div>'+
    '<div style="margin-top:14px"><button class="btn btn-ok" onclick="clSalvarDados()">Salvar cliente</button></div>';
}
window.clRenderDados=clRenderDados;

function clMunId(muns){
  const el=$('#cl-mun'); if(!el||!el.value) return '';
  const opt=Array.from(document.querySelectorAll('#cl-muns option')).find(o=>o.value===el.value);
  return opt?opt.dataset.id:'';
}
async function clSalvarDados(){
  try{
    const nome=$('#cl-nome').value.trim();
    if(!nome){ toast('Informe o nome do cliente','err'); return; }
    const muns=await lookup('municipios');
    const payload={ id:clId||null, tipo_pessoa:$('#cl-tp').value, id_empresa:$('#cl-emp').value,
      nome, nome_fantasia:$('#cl-fant').value, cpf_cnpj:$('#cl-doc').value, rg_ie:$('#cl-ie').value,
      indicador_ie:$('#cl-indie').value, inscricao_municipal:$('#cl-im').value,
      email:$('#cl-email').value, email_nfe:$('#cl-emailnfe').value, telefone:$('#cl-fone').value,
      celular:$('#cl-cel').value, whatsapp:$('#cl-wpp').value, id_vendedor:$('#cl-vend').value,
      endereco:$('#cl-end').value, numero:$('#cl-num').value, complemento:$('#cl-compl').value,
      bairro:$('#cl-bairro').value, cep:$('#cl-cep').value, cidade:$('#cl-cidade').value, uf:$('#cl-uf').value,
      id_municipio:clMunId(muns), situacao:$('#cl-sit').value, observacao:$('#cl-obs').value,
      atualizado_em_ref:(clFull&&clFull.cliente&&clFull.cliente.atualizado_em)||null };
    const {data,error}=await sb.rpc('erp_cliente_salvar',{p:payload});
    if(error) throw error;
    const novo=!clId; clId=Number(data);
    toast(novo?'Cliente criado (#'+clId+')':'Cliente salvo','ok');
    clFull=await clCarregar(clId);
    if(novo) clEditor(clId);
  }catch(e){
    if(String(e.message||e).indexOf('CONFLITO_EDICAO')>=0){
      toast('Este cliente foi alterado por outro usuário. Recarreguei os dados — revise e salve de novo.','err');
      clFull=await clCarregar(clId); clRenderDados();
    } else { toast('Erro: '+(e.message||e),'err'); }
  }
}
window.clSalvarDados=clSalvarDados;

/* ---- Crédito & Pagamento ---- */
async function clRenderCredito(){
  const body=$('#cl-tab-body');
  if(!clId){ body.innerHTML='<div class="empty">Salve os dados do cliente primeiro.</div>'; return; }
  const [tabprecos]=await Promise.all([lookup('tabelas_preco')]);
  const c=(clFull&&clFull.cliente)||{}, cr=(clFull&&clFull.credito)||{}, conds=(clFull&&clFull.condicoes)||[];
  const limite=Number(cr.limite)||0, usado=Number(cr.usado)||0, disp=limite-usado;
  const pct=limite>0?Math.min(100,Math.round(usado/limite*100)):0;
  let html='<div class="grid-kpi" style="margin-bottom:14px">'+
    '<div class="metric"><div class="lbl">Limite de crédito</div><div class="val">'+fmtFull(limite)+'</div></div>'+
    '<div class="metric"><div class="lbl">Usado (títulos em aberto)</div><div class="val">'+fmtFull(usado)+'</div></div>'+
    '<div class="metric"><div class="lbl">Disponível</div><div class="val" style="color:hsl(var(--'+(disp<0?'destructive':'success')+'))">'+fmtFull(disp)+'</div></div>'+
    '</div>'+
    '<div style="height:8px;background:hsl(var(--surface2));border-radius:6px;overflow:hidden;margin-bottom:16px"><div style="height:100%;width:'+pct+'%;background:hsl(var(--'+(pct>=100?'destructive':'primary')+'))"></div></div>';
  html+='<div class="form-grid">'+
    '<div class="field"><label>Limite de crédito</label><input type="number" step="0.01" id="cl-limite" value="'+(c.limite_credito==null?'':esc(String(c.limite_credito)))+'"></div>'+
    '<div class="field"><label>Tabela de preço padrão</label><select id="cl-tabpreco">'+pdOptions(tabprecos,c.id_tabela_preco)+'</select></div>'+
    '<div class="field"><label>Desc. produto %</label><input type="number" step="0.01" id="cl-descprod" value="'+(c.perc_desc_produto==null?'':esc(String(c.perc_desc_produto)))+'"></div>'+
    '<div class="field"><label>Desc. serviço %</label><input type="number" step="0.01" id="cl-descserv" value="'+(c.perc_desc_servico==null?'':esc(String(c.perc_desc_servico)))+'"></div>'+
    '<div class="field full"><div class="chk"><input type="checkbox" id="cl-prazo" '+(c.permite_prazo?'checked':'')+'><span>Permite compra a prazo (necessário para liberar condições parceladas)</span></div></div>'+
    '</div><div style="margin:10px 0 18px"><button class="btn btn-ok" onclick="clSalvarCredito()">Salvar crédito</button></div>';
  html+='<b style="font-size:13px">Condições de pagamento liberadas</b>'+
    '<div style="font-size:12px;color:hsl(var(--text-muted));margin:4px 0 10px">À vista é sempre liberada. As condições a prazo só valem para este cliente se marcadas aqui (e exige "permite prazo").</div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Condição</th><th>Parcelas</th><th>Intervalo</th><th>Consome limite</th><th>Liberada</th></tr></thead><tbody>';
  conds.forEach(cd=>{
    const av=cd.a_vista===true;
    html+='<tr><td>'+esc(cd.descricao||'')+(av?' <span class="b-badge b-badge-muted">à vista</span>':'')+'</td>'+
      '<td>'+esc(cd.num_parcelas)+'</td><td>'+esc(cd.intervalo_dias||0)+'d</td>'+
      '<td>'+(cd.libera_limite?'<span class="b-badge b-badge-warn">Sim</span>':'<span class="b-badge b-badge-muted">Não</span>')+'</td>'+
      '<td>'+(av?'<span class="b-badge b-badge-ok">sempre</span>'
        :'<label class="chk"><input type="checkbox" '+(cd.liberada?'checked':'')+' onchange="clToggleCond('+cd.id+',this.checked)"><span></span></label>')+'</td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
window.clRenderCredito=clRenderCredito;
async function clSalvarCredito(){
  try{
    const payload={ id:clId, limite_credito:$('#cl-limite').value, id_tabela_preco:$('#cl-tabpreco').value,
      perc_desc_produto:$('#cl-descprod').value, perc_desc_servico:$('#cl-descserv').value,
      permite_prazo:$('#cl-prazo').checked };
    const {error}=await sb.rpc('erp_cliente_salvar',{p:payload});
    if(error) throw error;
    toast('Crédito salvo','ok'); clFull=await clCarregar(clId); clRenderCredito();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.clSalvarCredito=clSalvarCredito;
async function clToggleCond(idCond, liberar){
  try{
    const {error}=await sb.rpc('erp_cliente_condicao_set',{p_id_cliente:clId,p_id_condicao:idCond,p_liberar:liberar});
    if(error) throw error;
    toast(liberar?'Condição liberada':'Condição bloqueada','ok');
    clFull=await clCarregar(clId);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); clFull=await clCarregar(clId); clRenderCredito(); }
}
window.clToggleCond=clToggleCond;

/* ---- Contatos ---- */
function clRenderContatos(){
  const body=$('#cl-tab-body');
  if(!clId){ body.innerHTML='<div class="empty">Salve os dados do cliente primeiro.</div>'; return; }
  const contatos=(clFull&&clFull.contatos)||[];
  let html='<div class="toolbar"><b style="font-size:13px">Contatos</b><div class="spacer"></div>'+
    '<button class="btn btn-sm" onclick="clContatoForm(null)">+ Novo contato</button></div>';
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Nome</th><th>Cargo</th><th>Celular</th><th>E-mail</th><th>Principal</th><th></th></tr></thead><tbody>';
  if(contatos.length===0) html+='<tr><td colspan="6"><div class="empty">Nenhum contato.</div></td></tr>';
  contatos.forEach(ct=>{
    html+='<tr><td>'+esc(ct.nome||'')+'</td><td>'+esc(ct.cargo||'')+'</td><td>'+esc(ct.celular||ct.telefone||'')+'</td>'+
      '<td>'+esc(ct.email||'')+'</td><td>'+(ct.principal?'<span class="b-badge b-badge-ok">Sim</span>':'')+'</td>'+
      '<td class="acoes"><button class="btn btn-ghost btn-sm" onclick=\'clContatoForm('+JSON.stringify(ct)+')\'>Editar</button> '+
      '<button class="btn btn-danger btn-sm" onclick="clContatoExcluir('+ct.id+')">Excluir</button></td></tr>';
  });
  html+='</tbody></table></div>';
  body.innerHTML=html;
}
window.clRenderContatos=clRenderContatos;
function clContatoForm(ct){
  ct=ct||{};
  const b='<div class="form-grid">'+
    '<div class="field full"><label>Nome *</label><input type="text" id="ct-nome" value="'+esc(ct.nome||'')+'"></div>'+
    '<div class="field"><label>Cargo</label><input type="text" id="ct-cargo" value="'+esc(ct.cargo||'')+'"></div>'+
    '<div class="field"><label>CPF</label><input type="text" id="ct-cpf" value="'+esc(ct.cpf||'')+'"></div>'+
    '<div class="field"><label>Telefone</label><input type="text" id="ct-fone" value="'+esc(ct.telefone||'')+'"></div>'+
    '<div class="field"><label>Celular</label><input type="text" id="ct-cel" value="'+esc(ct.celular||'')+'"></div>'+
    '<div class="field full"><label>E-mail</label><input type="email" id="ct-email" value="'+esc(ct.email||'')+'"></div>'+
    '<div class="field"><label>Nascimento</label><input type="date" id="ct-nasc" value="'+esc(ct.data_nascimento?String(ct.data_nascimento).slice(0,10):'')+'"></div>'+
    '<div class="field"><label>&nbsp;</label><div class="chk"><input type="checkbox" id="ct-princ" '+(ct.principal?'checked':'')+'><span>Principal</span></div></div>'+
    '</div>';
  openModal((ct.id?'Editar ':'Novo ')+'contato', b,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="clContatoSalvar('+(ct.id||'null')+')">Salvar</button>');
}
window.clContatoForm=clContatoForm;
async function clContatoSalvar(id){
  try{
    const nome=$('#ct-nome').value.trim();
    if(!nome){ toast('Informe o nome do contato','err'); return; }
    const payload={ id:id||null, nome, cargo:$('#ct-cargo').value, cpf:$('#ct-cpf').value,
      telefone:$('#ct-fone').value, celular:$('#ct-cel').value, email:$('#ct-email').value,
      data_nascimento:$('#ct-nasc').value, principal:$('#ct-princ').checked };
    const {error}=await sb.rpc('erp_cliente_contato_salvar',{p_id_cliente:clId,p:payload});
    if(error) throw error;
    closeModal(); toast('Contato salvo','ok'); clFull=await clCarregar(clId); clRenderContatos();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.clContatoSalvar=clContatoSalvar;
async function clContatoExcluir(id){
  if(!await confirmAsync('Excluir este contato?')) return;
  try{
    const {error}=await sb.rpc('erp_cliente_contato_excluir',{p_id:id});
    if(error) throw error;
    toast('Contato excluído','ok'); clFull=await clCarregar(clId); clRenderContatos();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.clContatoExcluir=clContatoExcluir;
