/* ERP Bononi — Pátio / Serviços
   4 telas de pátio que cruzam várias OS:
     - Distribuição   (loadDistribuicao)  → os_distribuicao_dados + os_distribuir_servico/_producao
     - Precificação   (loadPrecificacao)  → os_precificacao_dados + os_apontamento_faturavel + os_avaliar_servicos
     - Apontamento    (loadApontamento)   → os_distribuicao_dados (picker) + os_apontamento_salvar
     - Solicitações   (loadOsSolicitacoes)→ os_solicitacoes_listar + erp_solicitar_produto
   Telas grandes e simples: a equipe do pátio trabalha aqui. */

/* estilo próprio (injeta uma vez) */
(function svcStyle(){
  if(document.getElementById('svc-css')) return;
  var css=''
   +'.bar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}'
   +'.bar .spacer{flex:1}'
   +'.mut{color:hsl(var(--text-muted));font-weight:400}'
   +'.r{text-align:right}'
   +'.lnk{background:none;border:none;color:hsl(var(--blue-mid));cursor:pointer;font-size:12px;text-decoration:underline;padding:0 2px}'
   +'.sel-filtro{padding:9px 12px;border:1px solid hsl(var(--border));border-radius:var(--radius-sm);background:hsl(var(--card));font-size:14px;color:hsl(var(--foreground))}'
   +'.btn-block{display:block;width:100%}'
   +'.btn-lg{padding:14px;font-size:15px;font-weight:600}'
   /* cards de distribuição */
   +'.svc-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}'
   +'.svc-card{background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:var(--radius);padding:14px;box-shadow:0 1px 3px rgba(15,29,53,.04);display:flex;flex-direction:column;gap:8px}'
   +'.svc-card-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px}'
   +'.svc-card-cli{font-size:13px;color:hsl(var(--muted-foreground))}'
   +'.svc-card-desc{font-size:15px;font-weight:600;color:hsl(var(--foreground))}'
   +'.svc-card-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px}'
   +'.svc-card-tec{font-size:13px;color:hsl(var(--foreground));display:flex;align-items:center;gap:8px}'
   +'.tec-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
   +'.btn-tec{justify-content:center;padding:16px;font-size:15px;background:hsl(var(--surface2));border:1px solid hsl(var(--border));color:hsl(var(--foreground))}'
   +'.btn-tec:hover{background:hsl(var(--blue-pale));border-color:hsl(var(--blue-mid))}'
   /* apontamento */
   +'.apt-wrap{display:grid;grid-template-columns:minmax(0,420px) 1fr;gap:16px;align-items:start}'
   +'@media(max-width:820px){.apt-wrap{grid-template-columns:1fr}}'
   +'.apt-title{font-size:15px;font-weight:700;margin-bottom:12px}'
   +'.apt-form .field{margin-bottom:12px}'
   +'.apt-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}'
   +'@media(max-width:520px){.apt-row{grid-template-columns:1fr 1fr}}'
   +'.apt-form input,.apt-form select{padding:12px;font-size:15px}'
   /* precificação */
   +'.prec-os{margin-bottom:14px;overflow:hidden}'
   +'.prec-os-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 16px;background:hsl(var(--surface2));border-bottom:1px solid hsl(var(--border));font-size:14px;flex-wrap:wrap}'
   +'.prec-svc-list{padding:6px 16px}'
   +'.prec-svc{padding:12px 0;border-bottom:1px solid hsl(var(--border))}'
   +'.prec-svc:last-child{border-bottom:none}'
   +'.prec-svc-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}'
   +'.prec-svc-desc{flex:1;min-width:180px;font-size:14px}'
   +'.prec-svc-nums{font-size:13px;color:hsl(var(--foreground));white-space:nowrap}'
   +'.prec-svc-val{display:flex;align-items:center;gap:6px}'
   +'.prec-svc-val label{font-size:12px;color:hsl(var(--text-muted))}'
   +'.prec-svc-val input{width:120px;padding:9px;font-size:15px;text-align:right;font-family:"DM Mono",monospace}'
   +'.prec-apts{margin-top:10px;background:hsl(var(--surface2));border-radius:var(--radius-sm);padding:6px 10px}'
   +'.prec-apts summary{cursor:pointer;font-size:12px;color:hsl(var(--blue-mid));padding:4px 0}'
   +'.prec-apts table{margin-top:6px}'
   +'.prec-apts tr.apt-off td{opacity:.42;text-decoration:line-through}'
   +'.prec-apts tr.apt-off td:first-child{text-decoration:none;opacity:1}'
   +'.prec-os-foot{padding:12px 16px;border-top:1px solid hsl(var(--border));display:flex;justify-content:flex-end}'
   +'.prec-noapt{font-size:12px;margin-top:6px}'
   +'.prec-blocos{padding:12px 16px;background:hsl(var(--warning-bg));border-bottom:1px solid hsl(var(--border))}'
   +'.prec-blocos-tit{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:hsl(var(--warning));margin-bottom:8px}'
   +'.prec-bloco{background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:8px}'
   +'.prec-bloco:last-child{margin-bottom:0}'
   +'.prec-bloco-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}'
   +'.pcs-apt{width:18px;height:18px}';
  var st=document.createElement('style'); st.id='svc-css'; st.textContent=css; document.head.appendChild(st);
})();

/* helpers comuns */
function svcArea(a){ return a?'<span class="b-badge b-badge-info">'+esc(a)+'</span>':''; }
function svcStatusBadge(s){ var m={PENDENTE:'warn',EM_EXECUCAO:'info',EM_ANDAMENTO:'info',ABERTA:'info',CONCLUIDO:'ok',AGUARDANDO_PECA:'warn'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }
function fmtHoras(h){ h=Number(h)||0; var H=Math.floor(h); var M=Math.round((h-H)*60); if(M===60){H++;M=0;} return H+'h'+(M?(' '+(M<10?'0':'')+M+'m'):''); }

/* ============ 1) DISTRIBUIÇÃO ============ */
async function loadDistribuicao(){
  try{
    var res=await sb.rpc('os_distribuicao_dados',{p_id_empresa:null});
    if(res.error) throw res.error;
    window.__dist=res.data||{}; renderDistribuicao();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar a distribuição.',e.message); }
}
window.loadDistribuicao=loadDistribuicao;

function renderDistribuicao(){
  var d=window.__dist||{}; var servicos=Array.isArray(d.servicos)?d.servicos:[]; var areas=Array.isArray(d.areas)?d.areas:[];
  var areaF=window.__distArea||'';
  var lista=areaF?servicos.filter(function(s){return String(s.id_area)===String(areaF);}):servicos;
  var html='<div class="bar">'+
    '<select class="sel-filtro" onchange="distFiltraArea(this.value)"><option value="">Todas as áreas</option>'+
      areas.map(function(a){return '<option value="'+a.id+'"'+(String(a.id)===String(areaF)?' selected':'')+'>'+esc(a.descricao)+'</option>';}).join('')+'</select>'+
    '<div class="spacer"></div><span class="mut" style="font-size:13px">'+lista.length+' pendente(s)</span>'+
    '<button class="btn btn-sm btn-ghost" onclick="loadDistribuicao()">Atualizar</button></div>';
  if(lista.length===0){ html+='<div class="empty">Nada pendente de distribuição. 🎉</div>'; $('#screen').innerHTML=html; return; }
  html+='<div class="svc-cards">'+lista.map(distCard).join('')+'</div>';
  $('#screen').innerHTML=html;
}
function distCard(s){
  var assigned=!!s.id_tecnico;
  return '<div class="svc-card">'+
    '<div class="svc-card-top"><b>OS '+esc(s.numero_os||'')+'</b> '+svcStatusBadge(s.status)+
      (s.origem==='PRODUCAO'?' <span class="b-badge b-badge-muted">PRODUÇÃO</span>':'')+'</div>'+
    '<div class="svc-card-cli">'+esc(s.cliente||'')+'</div>'+
    '<div class="svc-card-desc">'+esc(s.descricao||'')+'</div>'+
    '<div class="svc-card-meta">'+(s.area?svcArea(s.area):'')+
      (s.tempo_previsto?' <span class="mut">previsto '+fmtHoras(s.tempo_previsto)+'</span>':'')+'</div>'+
    (assigned
      ? '<div class="svc-card-tec">👤 <b>'+esc(s.tecnico_nome||'')+'</b> <button class="lnk" onclick="distAbrir('+s.id+',&quot;'+s.origem+'&quot;)">trocar</button></div>'
      : '<button class="btn btn-ok btn-block" onclick="distAbrir('+s.id+',&quot;'+s.origem+'&quot;)">Distribuir</button>')+
  '</div>';
}
window.distFiltraArea=function(v){ window.__distArea=v; renderDistribuicao(); };

function distAbrir(id, origem){
  var d=window.__dist||{}; var tec=Array.isArray(d.tecnicos)?d.tecnicos:[];
  if(tec.length===0){ toast('Nenhum técnico ativo cadastrado','err'); return; }
  openModal('Distribuir para quem?',
    '<div class="tec-grid">'+tec.map(function(t){
      return '<button class="btn btn-tec" onclick="distConfirmar('+id+',&quot;'+origem+'&quot;,'+t.id+')">'+esc(t.nome)+'</button>';
    }).join('')+'</div>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>');
}
window.distAbrir=distAbrir;
async function distConfirmar(id, origem, idTec){
  try{
    var fn=(origem==='PRODUCAO')?'os_distribuir_producao':'os_distribuir_servico';
    var params=(origem==='PRODUCAO')
      ?{p_id_os_peca:id,p_id_tecnico:idTec,p_id_usuario:UID()}
      :{p_id_servico_os:id,p_id_tecnico:idTec,p_id_usuario:UID()};
    var res=await sb.rpc(fn,params); if(res.error) throw res.error;
    toast('Distribuído','ok'); closeModal(); loadDistribuicao();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.distConfirmar=distConfirmar;

/* ============ 2) PRECIFICAÇÃO (gestão) ============ */
async function loadPrecificacao(){
  try{
    var res=await sb.rpc('os_precificacao_dados',{p_id_empresa:null});
    if(res.error) throw res.error;
    window.__prec=res.data||{}; renderPrecificacao();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar a precificação.',e.message); }
}
window.loadPrecificacao=loadPrecificacao;

function renderPrecificacao(){
  var d=window.__prec||{}; var ordens=Array.isArray(d.ordens)?d.ordens:[];
  var html='<div class="bar"><span class="mut" style="font-size:13px">Marque as horas faturáveis e defina o valor de cada serviço.</span>'+
    '<div class="spacer"></div><button class="btn btn-sm btn-ghost" onclick="loadPrecificacao()">Atualizar</button></div>';
  if(ordens.length===0){ html+='<div class="empty">Nenhuma OS com serviços a precificar.</div>'; $('#screen').innerHTML=html; return; }
  html+=ordens.map(precOsCard).join('');
  $('#screen').innerHTML=html;
}
function precOsCard(o){
  var servicos=Array.isArray(o.servicos)?o.servicos:[];
  var blocos=Array.isArray(o.blocos)?o.blocos:[];
  return '<div class="card prec-os">'+
    '<div class="prec-os-head"><div><b>OS '+esc(o.numero||'')+'</b> · '+esc(o.cliente||'')+' '+svcStatusBadge(o.status)+
      (o.defeito?'<div class="mut" style="font-size:12px;margin-top:2px">'+esc(o.defeito)+'</div>':'')+'</div>'+
      '<div class="mono">'+fmtFull(o.valor_total)+'</div></div>'+
    (blocos.length
      ? '<div class="prec-blocos"><div class="prec-blocos-tit">Apontamentos a fechar (por área) — vire cada bloco em serviço</div>'+
        blocos.map(function(b){return precBloco(o.id_os,b);}).join('')+'</div>'
      : '')+
    '<div class="prec-svc-list">'+(servicos.length?servicos.map(precSvcRow).join(''):(blocos.length?'':'<div class="empty">Sem serviços.</div>'))+'</div>'+
    (servicos.length?'<div class="prec-os-foot"><button class="btn btn-ok" onclick="precSalvar('+o.id_os+')">Salvar valores da OS</button></div>':'')+
  '</div>';
}
function precBloco(idOs,b){
  var apts=Array.isArray(b.apontamentos)?b.apontamentos:[];
  var profs=[]; apts.forEach(function(a){ if(a.colaborador && profs.indexOf(a.colaborador)<0) profs.push(a.colaborador); });
  return '<div class="prec-bloco">'+
    '<div class="prec-bloco-head">'+
      '<div>'+svcArea(b.area)+' <b>'+fmtHoras(b.horas_faturaveis)+'</b> <span class="mut">faturáveis · '+esc(profs.join(', '))+'</span></div>'+
      '<button class="btn btn-sm btn-ok" onclick="precCriarServico('+idOs+','+(b.id_area==null?'null':b.id_area)+')">Criar serviço →</button>'+
    '</div>'+
    '<details class="prec-apts"><summary>'+apts.length+' apontamento(s)</summary>'+
      '<table class="data"><thead><tr><th>Colaborador</th><th>Data</th><th>Início</th><th>Término</th><th class="r">Horas</th></tr></thead><tbody>'+
      apts.map(function(a){ return '<tr><td>'+esc(a.colaborador||'')+'</td><td>'+fmtDate(a.data)+'</td><td>'+esc(a.hora_inicio||'—')+'</td><td>'+esc(a.hora_termino||'—')+'</td><td class="r mono">'+fmtNum(a.horas)+'</td></tr>'; }).join('')+
      '</tbody></table></details>'+
  '</div>';
}
function precSvcRow(s){
  var apts=Array.isArray(s.apontamentos)?s.apontamentos:[];
  var val=(Number(s.valor_total)||0);
  return '<div class="prec-svc" data-sv="'+s.id+'">'+
    '<div class="prec-svc-head">'+
      '<div class="prec-svc-desc"><b>'+esc(s.descricao||'')+'</b>'+(s.area?' '+svcArea(s.area):'')+
        (s.tecnico?' <span class="mut">· '+esc(s.tecnico)+'</span>':'')+'</div>'+
      '<div class="prec-svc-nums" id="nums'+s.id+'">'+precNums(s)+'</div>'+
      '<div class="prec-svc-val"><label>R$</label><input type="number" step="0.01" id="val'+s.id+'" value="'+(val>0?val:'')+'" placeholder="0,00"></div>'+
    '</div>'+
    (apts.length
      ? '<details class="prec-apts"><summary>'+apts.length+' apontamento(s) — marque quais entram na conta</summary>'+
        '<table class="data"><thead><tr><th></th><th>Colaborador</th><th>Data</th><th>Início</th><th>Término</th><th class="r">Horas</th></tr></thead><tbody>'+
        apts.map(function(a){
          return '<tr id="aptrow'+a.id+'" class="'+(a.faturavel?'':'apt-off')+'">'+
            '<td><input type="checkbox" '+(a.faturavel?'checked':'')+' onchange="precFatura('+a.id+',this.checked,'+s.id+')"></td>'+
            '<td>'+esc(a.colaborador||'')+'</td><td>'+fmtDate(a.data)+'</td>'+
            '<td>'+esc(a.hora_inicio||'—')+'</td><td>'+esc(a.hora_termino||'—')+'</td>'+
            '<td class="r mono">'+fmtNum(a.horas)+'</td></tr>';
        }).join('')+'</tbody></table></details>'
      : '<div class="prec-noapt mut">Sem apontamentos ainda.</div>')+
  '</div>';
}
function precNums(s){
  return '<span class="mut">previsto</span> '+fmtHoras(s.tempo_previsto)+
    ' · <b>'+fmtHoras(s.horas_faturaveis)+'</b> <span class="mut">de '+fmtHoras(s.horas_total)+' apontadas</span>';
}
function precFindSvc(idSvc){
  var d=window.__prec||{}; var ordens=Array.isArray(d.ordens)?d.ordens:[];
  for(var i=0;i<ordens.length;i++){ var ss=ordens[i].servicos||[];
    for(var j=0;j<ss.length;j++){ if(String(ss[j].id)===String(idSvc)) return ss[j]; } }
  return null;
}
async function precFatura(idApt, val, idSvc){
  try{
    var res=await sb.rpc('os_apontamento_faturavel',{p_id:idApt,p_faturavel:val}); if(res.error) throw res.error;
    var s=precFindSvc(idSvc);
    if(s){ var a=(s.apontamentos||[]).find(function(x){return String(x.id)===String(idApt);}); if(a) a.faturavel=val;
      s.horas_faturaveis=(s.apontamentos||[]).filter(function(x){return x.faturavel;}).reduce(function(t,x){return t+(Number(x.horas)||0);},0);
      var nums=document.getElementById('nums'+idSvc); if(nums) nums.innerHTML=precNums(s);
    }
    var tr=document.getElementById('aptrow'+idApt); if(tr) tr.classList.toggle('apt-off',!val);
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.precFatura=precFatura;
async function precSalvar(idOs){
  try{
    var d=window.__prec||{}; var o=(d.ordens||[]).find(function(x){return String(x.id_os)===String(idOs);}); if(!o) return;
    var payload=(o.servicos||[]).map(function(s){
      var el=document.getElementById('val'+s.id); var raw=el?el.value:'';
      var v=(raw!==''&&raw!=null)?Number(raw):null;
      var qtd=Number(s.quantidade)||1;
      return {id:s.id, valor_total:v, valor_unitario:(v!=null?(v/(qtd||1)):null), tempo_realizado:s.horas_faturaveis, status:s.status};
    }).filter(function(x){return x.valor_total!=null;});
    if(payload.length===0){ toast('Informe ao menos um valor','err'); return; }
    var res=await sb.rpc('os_avaliar_servicos',{p_id_os:idOs,p_servicos:payload,p_id_usuario:UID()}); if(res.error) throw res.error;
    toast('Valores salvos','ok'); loadPrecificacao();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.precSalvar=precSalvar;

function precFindBloco(idOs, idArea){
  var d=window.__prec||{}; var o=(d.ordens||[]).find(function(x){return String(x.id_os)===String(idOs);}); if(!o) return null;
  return (o.blocos||[]).find(function(b){ return (b.id_area==null && (idArea==null||idArea==='null')) || String(b.id_area)===String(idArea); });
}
async function precCriarServico(idOs, idArea){
  try{
    var b=precFindBloco(idOs, idArea); if(!b){ toast('Bloco não encontrado','err'); return; }
    var apts=Array.isArray(b.apontamentos)?b.apontamentos:[];
    var cat=await lookup('servicos');
    var catItems=(cat||[]).map(function(s){ return {v:s.id, label:s.nome, busca:s.codigo||'', preco:s.preco}; });
    window.__precCat=catItems;
    var rows=apts.map(function(a){
      return '<tr><td><input type="checkbox" class="pcs-apt" value="'+a.id+'" checked></td><td>'+esc(a.colaborador||'')+'</td><td>'+fmtDate(a.data)+'</td><td class="r mono">'+fmtNum(a.horas)+(a.faturavel?'':' <span class="mut">(não fat.)</span>')+'</td></tr>';
    }).join('');
    openModal('Criar serviço — '+esc(b.area||'Sem área'),
      '<div class="form-grid">'+
        '<div class="field full"><label>Serviço da tabela <span class="mut">(opcional — preenche descrição e valor)</span></label>'+comboHTML('pcs-cat',catItems,'','Escolher da tabela…','precCatPick')+'</div>'+
        '<div class="field full"><label>Descrição *</label><input type="text" id="pcs-desc" value="'+esc(b.area||'')+'"></div>'+
        '<div class="field"><label>Valor (R$) *</label><input type="number" step="0.01" id="pcs-val" placeholder="0,00"></div>'+
        '<div class="field"><label>Horas faturáveis</label><input type="text" value="'+fmtHoras(b.horas_faturaveis)+'" disabled></div>'+
      '</div>'+
      '<div class="mut" style="margin:10px 0 4px;font-size:12px">Apontamentos que entram neste serviço (herdam os profissionais):</div>'+
      '<div class="tbl-wrap"><table class="data"><thead><tr><th></th><th>Colaborador</th><th>Data</th><th class="r">Horas</th></tr></thead><tbody>'+rows+'</tbody></table></div>',
      '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-ok" onclick="precCriarServicoSalvar('+idOs+','+(idArea==null?'null':idArea)+')">Criar serviço</button>');
  }catch(e){ toast('Erro ao abrir: '+(e.message||e),'err'); }
}
window.precCriarServico=precCriarServico;
function precCatPick(v){
  var it=(window.__precCat||[]).find(function(x){return String(x.v)===String(v);}); if(!it) return;
  var desc=document.getElementById('pcs-desc'); if(desc && it.label) desc.value=it.label;
  var val=document.getElementById('pcs-val'); if(val && it.preco!=null && (val.value===''||Number(val.value)===0)) val.value=it.preco;
}
window.precCatPick=precCatPick;
async function precCriarServicoSalvar(idOs, idArea){
  try{
    var desc=(document.getElementById('pcs-desc').value||'').trim();
    if(!desc){ toast('Informe a descrição do serviço','err'); return; }
    var val=Number(document.getElementById('pcs-val').value)||0;
    var ids=Array.prototype.map.call(document.querySelectorAll('.pcs-apt:checked'),function(c){return Number(c.value);});
    if(ids.length===0){ toast('Selecione ao menos um apontamento','err'); return; }
    var cat=comboVal('pcs-cat');
    var res=await sb.rpc('os_servico_criar_de_apontamentos',{p_id_os:idOs,p_descricao:desc,p_valor_total:val,
      p_apontamentos:ids,p_id_area:(idArea==null||idArea==='null')?null:Number(idArea),
      p_id_servico:cat?Number(cat):null,p_id_usuario:UID()});
    if(res.error) throw res.error;
    var r=res.data||{}; if(r.ok===false){ toast(r.erro||'Falha ao criar','err'); return; }
    toast('Serviço criado a partir dos apontamentos','ok'); closeModal(); loadPrecificacao();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.precCriarServicoSalvar=precCriarServicoSalvar;

/* ============ 3) APONTAMENTO (colaborador) ============ */
async function loadApontamento(){
  try{
    var res=await sb.rpc('os_apontamento_dados',{p_id_empresa:null});
    if(res.error) throw res.error;
    window.__apt=res.data||{}; window.__aptLog=window.__aptLog||[];
    renderApontamento();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar o apontamento.',e.message); }
}
window.loadApontamento=loadApontamento;

function renderApontamento(){
  var d=window.__apt||{};
  var ordens=Array.isArray(d.ordens)?d.ordens:[];
  var areas=Array.isArray(d.areas)?d.areas:[];
  var cols=Array.isArray(d.colaboradores)?d.colaboradores:[];
  var osItems=ordens.map(function(o){ return {v:o.id, label:'OS '+(o.numero||('#'+o.id))+' — '+(o.cliente||''), busca:(o.cliente||'')+' '+(o.defeito||'')}; });
  var colItems=cols.map(function(c){ return {v:c.id, label:c.nome}; });
  var hoje=new Date().toISOString().slice(0,10);
  var html='<div class="apt-wrap">'+
    '<div class="card card-pad apt-form">'+
      '<div class="apt-title">Apontar horas</div>'+
      '<div class="field"><label>Colaborador *</label>'+comboHTML('apt-col',colItems,'','Quem trabalhou…')+'</div>'+
      '<div class="field"><label>OS *</label>'+comboHTML('apt-os',osItems,'','Número da OS, cliente ou defeito…')+'</div>'+
      '<div class="field"><label>Área do serviço *</label><select id="apt-area"><option value="">Selecione a área…</option>'+
        areas.map(function(a){return '<option value="'+a.id+'">'+esc(a.descricao)+'</option>';}).join('')+'</select></div>'+
      '<div class="apt-row">'+
        '<div class="field"><label>Data</label><input type="date" id="apt-data" value="'+hoje+'"></div>'+
        '<div class="field"><label>Início</label><input type="time" id="apt-ini" oninput="aptCalc()"></div>'+
        '<div class="field"><label>Término</label><input type="time" id="apt-fim" oninput="aptCalc()"></div>'+
        '<div class="field"><label>Horas</label><input type="number" step="0.25" id="apt-horas" placeholder="0,00"></div>'+
      '</div>'+
      '<div class="field"><label>Observação</label><input type="text" id="apt-obs" placeholder="O que foi feito (opcional)"></div>'+
      '<button class="btn btn-ok btn-block btn-lg" onclick="aptSalvar()">Registrar apontamento</button>'+
      '<div class="mut" style="font-size:12px;margin-top:8px">O serviço e o valor são definidos depois, no fechamento (Precificação).</div>'+
    '</div>'+
    '<div class="card card-pad">'+
      '<div class="apt-title">Registrados nesta sessão</div>'+
      '<div id="apt-log-body">'+renderAptLog()+'</div>'+
    '</div>'+
  '</div>';
  $('#screen').innerHTML=html;
}
function renderAptLog(){
  var log=window.__aptLog||[];
  if(log.length===0) return '<div class="empty">Nenhum apontamento ainda. Preencha ao lado.</div>';
  return '<div class="tbl-wrap"><table class="data"><thead><tr><th>Colaborador</th><th>OS</th><th>Área</th><th>Data</th><th class="r">Horas</th></tr></thead><tbody>'+
    log.map(function(l){ return '<tr><td>'+esc(l.colaborador)+'</td><td>'+esc(l.os)+'</td><td>'+esc(l.area)+'</td><td>'+fmtDate(l.data)+'</td><td class="r mono">'+fmtNum(l.horas)+'</td></tr>'; }).join('')+
    '</tbody></table></div>';
}
function aptCalc(){
  var ini=$('#apt-ini').value, fim=$('#apt-fim').value;
  if(ini&&fim){ var a=ini.split(':').map(Number), b=fim.split(':').map(Number);
    var mins=(b[0]*60+b[1])-(a[0]*60+a[1]); if(mins<0) mins+=1440;
    $('#apt-horas').value=(mins/60).toFixed(2); }
}
window.aptCalc=aptCalc;
async function aptSalvar(){
  try{
    var idCol=comboVal('apt-col'), idOs=comboVal('apt-os'), idArea=$('#apt-area').value;
    if(!idCol){ toast('Selecione o colaborador','err'); return; }
    if(!idOs){ toast('Selecione a OS','err'); return; }
    if(!idArea){ toast('Selecione a área do serviço','err'); return; }
    var ini=$('#apt-ini').value||null, fim=$('#apt-fim').value||null;
    var horas=Number($('#apt-horas').value)||0;
    if(horas<=0 && ini && fim){ var a=ini.split(':').map(Number), b=fim.split(':').map(Number); var m=(b[0]*60+b[1])-(a[0]*60+a[1]); if(m<0)m+=1440; horas=m/60; }
    if(horas<=0){ toast('Informe as horas (ou início e término)','err'); return; }
    var d=window.__apt||{};
    var os=(d.ordens||[]).find(function(o){return String(o.id)===String(idOs);});
    var col=(d.colaboradores||[]).find(function(c){return String(c.id)===String(idCol);});
    var area=(d.areas||[]).find(function(x){return String(x.id)===String(idArea);});
    var data=$('#apt-data').value||new Date().toISOString().slice(0,10);
    var res=await sb.rpc('os_apontamento_salvar',{p_id:null,p_id_os:Number(idOs),p_id_servico_os:null,
      p_id_os_peca:null,p_id_colaborador:Number(idCol),p_data_apontamento:data,
      p_hora_inicio:ini,p_hora_termino:fim,p_horas_trabalhadas:horas,p_fator:1,
      p_id_area:Number(idArea),p_observacao:($('#apt-obs').value||null)});
    if(res.error) throw res.error;
    window.__aptLog.unshift({colaborador:col?col.nome:'',os:'OS '+(os?os.numero:''),area:area?area.descricao:'',data:data,horas:horas});
    toast('Apontamento registrado','ok');
    $('#apt-ini').value=''; $('#apt-fim').value=''; $('#apt-horas').value=''; $('#apt-obs').value=''; comboSet('apt-os','');
    var lb=document.getElementById('apt-log-body'); if(lb) lb.innerHTML=renderAptLog();
    var inp=document.getElementById('apt-os_in'); if(inp) inp.focus();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.aptSalvar=aptSalvar;

/* ============ 4) SOLICITAÇÕES ============ */
async function loadOsSolicitacoes(){
  try{
    var res=await sb.rpc('os_solicitacoes_listar',{p_id_empresa:null,p_status:window.__solStatus||null});
    if(res.error) throw res.error;
    window.__sol=Array.isArray(res.data)?res.data:[]; renderOsSolicitacoes();
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as solicitações.',e.message); }
}
window.loadOsSolicitacoes=loadOsSolicitacoes;

function solBadge(s){ var m={PENDENTE:'warn',PARCIAL:'info',ATENDIDA:'ok',ATENDIDO:'ok',CANCELADA:'muted',CANCELADO:'muted'};
  return '<span class="b-badge b-badge-'+(m[s]||'muted')+'">'+esc(s||'')+'</span>'; }
function renderOsSolicitacoes(){
  var rows=window.__sol||[];
  var html='<div class="bar">'+
    '<select class="sel-filtro" onchange="solFiltra(this.value)"><option value="">Todos os status</option>'+
      ['PENDENTE','PARCIAL','ATENDIDA','CANCELADA'].map(function(s){return '<option value="'+s+'"'+(window.__solStatus===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select>'+
    '<div class="spacer"></div>'+permBtn('OS','incluir','<button class="btn btn-sm btn-ok" onclick="solNova()">+ Nova solicitação</button>')+'</div>';
  if(rows.length===0){ html+='<div class="empty">Nenhuma solicitação.</div>'; $('#screen').innerHTML=html; return; }
  html+='<div class="tbl-wrap"><table class="data"><thead><tr><th>OS</th><th>Cliente</th><th>Produto</th>'+
    '<th class="r">Solic.</th><th class="r">Atend.</th><th>Status</th><th>Solicitante</th><th>Data</th></tr></thead><tbody>'+
    rows.map(function(r){
      return '<tr><td><b>'+esc(r.numero_os||('#'+r.id_os))+'</b></td><td>'+esc(r.cliente||'')+'</td>'+
        '<td>'+esc(r.produto||'')+(r.referencia?' <span class="mut">'+esc(r.referencia)+'</span>':'')+'</td>'+
        '<td class="r mono">'+fmtNum(r.qtd_solicitada)+'</td><td class="r mono">'+fmtNum(r.qtd_atendida)+'</td>'+
        '<td>'+solBadge(r.status)+'</td><td>'+esc(r.solicitante||'')+'</td><td>'+fmtDateTime(r.data_solicitacao)+'</td></tr>';
    }).join('')+'</tbody></table></div>';
  $('#screen').innerHTML=html;
}
window.solFiltra=function(v){ window.__solStatus=v||null; loadOsSolicitacoes(); };

async function solNova(){
  try{
    var os=await lookup('vw_os'), prod=await lookup('produtos'), cen=await lookup('centros_estoque');
    var osItems=(os||[]).map(function(o){ return {v:o.id, label:'OS '+(o.numero||('#'+o.id))+' — '+(o.cliente||''), busca:(o.cliente||'')}; });
    openModal('Nova solicitação de produto',
      '<div class="form-grid"><div class="field full"><label>OS *</label>'+comboHTML('sol-os',osItems,'','Número da OS ou cliente…')+'</div>'+
      '<div class="field full"><label>Produto * <span class="mut">(nome, referência ou bipe o código)</span></label>'+comboHTML('sol-prod',comboProdItems(prod),'','Nome, referência ou EAN…')+'</div>'+
      '<div class="field"><label>Quantidade *</label><input type="number" step="0.001" id="sol-qtd"></div>'+
      '<div class="field"><label>Centro estoque</label><select id="sol-cen"><option value="">—</option>'+(cen||[]).map(function(c){return '<option value="'+c.id+'">'+esc(c.descricao)+'</option>';}).join('')+'</select></div></div>',
      '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-ok" onclick="solNovaSalvar()">Solicitar</button>');
  }catch(e){ toast('Erro ao abrir: '+(e.message||e),'err'); }
}
window.solNova=solNova;
async function solNovaSalvar(){
  try{
    var idOs=comboVal('sol-os'), idProd=comboVal('sol-prod');
    if(!idOs){ toast('Selecione a OS','err'); return; }
    if(!idProd){ toast('Selecione o produto','err'); return; }
    var qtd=Number($('#sol-qtd').value)||0; if(qtd<=0){ toast('Informe a quantidade','err'); return; }
    var res=await sb.rpc('erp_solicitar_produto',{p_origem:'OS',p_id_origem:Number(idOs),p_id_produto:Number(idProd),
      p_qtd:qtd,p_id_usuario:UID(),p_id_centro_estoque:$('#sol-cen').value?Number($('#sol-cen').value):null});
    if(res.error) throw res.error; toast('Solicitação criada','ok'); closeModal(); loadOsSolicitacoes();
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.solNovaSalvar=solNovaSalvar;
