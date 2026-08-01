/* ERP Bononi — Fiscal: NF-e (gerar a partir de Venda/OS e emitir via Edge Function) */
async function loadNFe(){
  try{
    const {data,error}=await sb.rpc('erp_list',{p_tabela:'vw_nfe',p_limit:9999});
    if(error) throw error;
    const rows=(data||[]).sort((a,b)=>b.id-a.id);
    const badge={PENDENTE:'warn',ENVIANDO:'info',AUTORIZADA:'ok',DENEGADA:'err',REJEITADA:'err',CANCELADA:'muted',INUTILIZADA:'muted',EM_CONTINGENCIA:'warn'};
    let html='<div class="toolbar"><input type="search" id="nf-busca" placeholder="Filtrar por cliente/número..." onkeyup="nfeFiltrar()">'+
      '<div class="spacer"></div><button class="btn btn-sm" onclick="nfeGerar()">+ Gerar NF-e</button></div>';
    html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>Nº</th><th>Série</th><th>Cliente</th><th>Natureza</th>'+
      '<th>Valor</th><th>Ambiente</th><th>Status</th><th>Chave</th><th></th></tr></thead><tbody id="nf-body"></tbody></table></div>';
    $('#screen').innerHTML=html;
    window.__nfBadge=badge; window.__nfRows=rows; nfeFiltrar();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as NF-e.',e.message); }
}
window.loadNFe=loadNFe;
function nfeFiltrar(){
  const rows=window.__nfRows||[], badge=window.__nfBadge||{};
  const q=($('#nf-busca')?$('#nf-busca').value:'').toLowerCase();
  const f=rows.filter(n=>(String(n.cliente||'')+String(n.numero||'')).toLowerCase().includes(q));
  const body=$('#nf-body'); if(!body) return;
  if(f.length===0){ body.innerHTML='<tr><td colspan="9"><div class="empty">Nenhuma NF-e. Clique em <b>+ Gerar NF-e</b>.</div></td></tr>'; return; }
  body.innerHTML=f.map(n=>{
    const pode=['PENDENTE','REJEITADA','EM_CONTINGENCIA'].includes(n.status);
    return '<tr><td>'+esc(n.numero)+'</td><td>'+esc(n.serie||'')+'</td><td>'+esc(n.cliente||'—')+'</td>'+
      '<td>'+esc(n.natureza||'')+' <span class="b-badge b-badge-muted">'+esc(n.cfop||'')+'</span></td>'+
      '<td class="mono">'+fmtNum(n.valor_total)+'</td><td>'+esc(n.ambiente||'')+'</td>'+
      '<td><span class="b-badge b-badge-'+(badge[n.status]||'muted')+'">'+esc(n.status)+'</span></td>'+
      '<td style="font-size:11px">'+esc(n.chave_acesso||'—')+'</td>'+
      '<td class="acoes">'+(pode?'<button class="btn btn-sm" onclick="nfeEmitir('+n.id+')">Emitir</button> ':'')+
        (n.mensagem_sefaz?'<button class="btn btn-ghost btn-sm" onclick="nfeMsg('+n.id+')">Ver</button>':'')+'</td></tr>';
  }).join('');
}
window.nfeFiltrar=nfeFiltrar;
function nfeMsg(id){ const n=(window.__nfRows||[]).find(x=>x.id===id)||{};
  openModal('NF-e #'+id+' — retorno SEFAZ','<p style="font-size:13px">'+esc(n.mensagem_sefaz||'—')+'</p>',
    '<button class="btn btn-ghost" onclick="closeModal()">Fechar</button>'); }
window.nfeMsg=nfeMsg;

async function nfeGerar(){
  const nats=await lookup('naturezas_operacao');
  const vendaNats=nats.filter(n=>n.finalidade==='VENDA');
  const body='<div class="form-grid">'+
    '<div class="field"><label>Origem *</label><select id="nfg-origem"><option value="VENDA">Venda</option><option value="OS">OS</option></select></div>'+
    '<div class="field"><label>ID do documento *</label><input type="number" id="nfg-id"></div>'+
    '<div class="field full"><label>Natureza da operação *</label><select id="nfg-nat">'+
      vendaNats.map(n=>'<option value="'+n.id+'">'+esc(n.descricao)+' ('+esc(n.cfop)+')</option>').join('')+'</select></div></div>'+
    '<p style="font-size:12px;color:hsl(var(--muted-foreground))">A NF-e é gerada como <b>PENDENTE</b> (rascunho fiscal). A emissão na SEFAZ é feita depois, no botão Emitir.</p>';
  openModal('Gerar NF-e', body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="nfeGerarSalvar()">Gerar</button>');
}
window.nfeGerar=nfeGerar;
async function nfeGerarSalvar(){
  try{
    const {data,error}=await sb.rpc('erp_gerar_nfe',{p_origem:$('#nfg-origem').value,
      p_id_origem:Number($('#nfg-id').value),p_id_natureza_op:Number($('#nfg-nat').value),p_id_usuario:UID()});
    if(error) throw error;
    closeModal(); toast('NF-e nº '+data.numero+' gerada ('+data.itens+' itens)','ok'); loadNFe();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.nfeGerarSalvar=nfeGerarSalvar;

async function nfeEmitir(id){
  if(!await confirmAsync('Emitir a NF-e #'+id+' na SEFAZ?')) return;
  try{
    toast('Enviando à SEFAZ...','');
    const {data,error}=await sb.functions.invoke('emitir-nfe',{body:{id_nfe:id}});
    if(error) throw error;
    if(data&&data.ok===false) throw new Error(data.error||'Falha na emissão');
    toast('Retorno: '+((data&&data.status)||'enviado'), (data&&data.status==='AUTORIZADA')?'ok':'');
    loadNFe();
  }catch(e){ toast('Emissão indisponível: '+(e.message||e),'err'); loadNFe(); }
}
window.nfeEmitir=nfeEmitir;
