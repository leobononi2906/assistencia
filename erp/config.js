/* ERP Bononi — Configurações: CRUD genérico de todas as tabelas registradas */
let cfgTabela=null, cfgLabel='', cfgCols=[], cfgPk='id', cfgReadonly=false;
const cfgFkCache={};

async function loadConfig(){
  try{
    const {data,error}=await sb.from('erp_admin_tabelas').select('*').eq('somente_leitura',false)
      .eq('ativo',true).order('grupo').order('ordem');
    if(error) throw error;
    const tabs=data||[];
    const grupos={};
    tabs.forEach(t=>{ (grupos[t.grupo]=grupos[t.grupo]||[]).push(t); });
    let nav='';
    Object.keys(grupos).forEach(g=>{
      nav+='<div class="g">'+esc(g)+'</div>';
      grupos[g].forEach(t=>{ nav+='<a data-tab="'+esc(t.tabela)+'" onclick="cfgOpen(\''+t.tabela+'\',\''+esc(t.label)+'\')">'+esc(t.label)+'</a>'; });
    });
    $('#screen').innerHTML='<div class="cfg"><div class="card card-pad cfg-nav">'+nav+'</div>'+
      '<div id="cfg-main"><div class="empty">Selecione uma tabela à esquerda para gerenciar os registros.</div></div></div>';
    if(tabs[0]) cfgOpen(tabs[0].tabela, tabs[0].label);
  }catch(e){ $('#screen').innerHTML=errBox('Não foi possível carregar as configurações.',e.message); }
}
window.loadConfig=loadConfig;

async function cfgOpen(tabela,label){
  cfgTabela=tabela; cfgLabel=label;
  document.querySelectorAll('.cfg-nav a').forEach(a=>a.classList.toggle('active',a.dataset.tab===tabela));
  const main=$('#cfg-main'); if(!main) return;
  main.innerHTML=skeletonTable();
  try{
    const meta=await sb.rpc('erp_colunas',{p_tabela:tabela});
    if(meta.error) throw meta.error;
    cfgCols=(meta.data&&meta.data.colunas)||[]; cfgPk=(meta.data&&meta.data.pk)||'id'; cfgReadonly=!!(meta.data&&meta.data.somente_leitura);
    await cfgRender('');
  }catch(e){ main.innerHTML=errBox('Falha ao abrir "'+esc(label)+'".',e.message); }
}
window.cfgOpen=cfgOpen;

function cfgDisplayCols(){
  // até 6 colunas "amigáveis" (evita blobs/timestamps técnicos)
  const skip=['criado_em','atualizado_em','senha_hash'];
  return cfgCols.filter(c=>!skip.includes(c.coluna) && !['json','jsonb','text'].includes(c.tipo)).slice(0,6);
}

async function cfgRender(busca){
  const main=$('#cfg-main');
  const {data,error}=await sb.rpc('erp_list',{p_tabela:cfgTabela,p_busca:busca||null,p_limit:9999,p_offset:0});
  if(error){ main.innerHTML=errBox('Erro ao listar.',error.message); return; }
  const rows=data||[]; const disp=cfgDisplayCols();
  let html='<div class="toolbar">'+
    '<input type="search" id="cfg-busca" placeholder="Buscar em '+esc(cfgLabel)+'..." value="'+esc(busca||'')+'" onkeydown="if(event.key===\'Enter\')cfgRender(this.value)">'+
    '<button class="btn btn-ghost btn-sm" onclick="cfgRender($(\'#cfg-busca\').value)">Buscar</button>'+
    '<div class="spacer"></div>'+
    (cfgReadonly?'<span class="b-badge b-badge-muted">somente leitura</span>':
      '<button class="btn btn-sm" onclick="cfgForm(null)">+ Novo</button>')+'</div>';
  if(rows.length===0){ html+='<div class="card"><div class="empty">Nenhum registro. '+(cfgReadonly?'':'Clique em <b>+ Novo</b> para cadastrar.')+'</div></div>';
    main.innerHTML=html; return; }
  html+='<div class="tbl-wrap"><table class="data"><thead><tr>'+
    disp.map(c=>'<th>'+esc(c.coluna)+'</th>').join('')+(cfgReadonly?'':'<th></th>')+'</tr></thead><tbody>';
  rows.forEach(r=>{
    html+='<tr>'+disp.map(c=>'<td>'+cfgCell(r[c.coluna],c)+'</td>').join('');
    if(!cfgReadonly){ const id=esc(String(r[cfgPk]));
      html+='<td class="acoes">'+
        '<button class="btn btn-ghost btn-sm" onclick="cfgForm(\''+id+'\')">Editar</button> '+
        '<button class="btn btn-danger btn-sm" onclick="cfgExcluir(\''+id+'\')">Excluir</button></td>'; }
    html+='</tr>';
  });
  html+='</tbody></table></div><div style="font-size:11px;color:hsl(var(--text-muted));margin-top:8px">'+rows.length+' registro(s)</div>';
  main.innerHTML=html;
}
window.cfgRender=cfgRender;

function cfgCell(v,c){
  if(v===null||v===undefined) return '<span style="color:hsl(var(--text-muted))">—</span>';
  if(c.tipo==='boolean') return v?'<span class="b-badge b-badge-ok">Sim</span>':'<span class="b-badge b-badge-muted">Não</span>';
  if(c.tipo==='numeric') return '<span class="mono">'+fmtNum(v)+'</span>';
  return esc(String(v).slice(0,60));
}

function cfgEditableCols(){
  return cfgCols.filter(c=>!c.gerada && !c.identidade &&
    !(c.coluna===cfgPk) && !['criado_em','atualizado_em'].includes(c.coluna));
}

async function cfgForm(id){
  let reg={};
  if(id){ const {data}=await sb.rpc('erp_list',{p_tabela:cfgTabela,p_limit:9999});
    reg=(data||[]).find(r=>String(r[cfgPk])===String(id))||{}; }
  // pré-carrega FKs registradas
  const cols=cfgEditableCols();
  for(const c of cols){ if(c.fk_tabela) await cfgLoadFk(c.fk_tabela); }
  let body='<div class="form-grid">';
  cols.forEach(c=>{
    const val=reg[c.coluna];
    const req=(!c.nulo && !c.default)?' required':'';
    const full=(['text','json','jsonb'].includes(c.tipo)||c.fk_tabela)?' full':'';
    let input;
    if(c.tipo==='boolean'){
      input='<div class="chk"><input type="checkbox" id="f_'+c.coluna+'" '+(val?'checked':'')+'><span>'+esc(c.coluna)+'</span></div>';
      body+='<div class="field'+full+'"><label>&nbsp;</label>'+input+'</div>'; return;
    } else if(c.fk_tabela && cfgFkCache[c.fk_tabela]){
      const opts=cfgFkCache[c.fk_tabela];
      input='<select id="f_'+c.coluna+'"'+req+'><option value="">— selecione —</option>'+
        opts.map(o=>'<option value="'+esc(String(o.id))+'"'+(String(val)===String(o.id)?' selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select>';
    } else if(['integer','bigint','smallint'].includes(c.tipo)){
      input='<input type="number" step="1" id="f_'+c.coluna+'" value="'+(val==null?'':esc(String(val)))+'"'+req+'>';
    } else if(c.tipo==='numeric'){
      input='<input type="number" step="0.01" id="f_'+c.coluna+'" value="'+(val==null?'':esc(String(val)))+'"'+req+'>';
    } else if(c.tipo==='date'){
      input='<input type="date" id="f_'+c.coluna+'" value="'+(val?esc(String(val).slice(0,10)):'')+'"'+req+'>';
    } else if(['text','json','jsonb'].includes(c.tipo)){
      input='<textarea id="f_'+c.coluna+'" rows="2"'+req+'>'+(val==null?'':esc(String(val)))+'</textarea>';
    } else {
      const mx=c.tamanho?(' maxlength="'+c.tamanho+'"'):'';
      input='<input type="text" id="f_'+c.coluna+'" value="'+(val==null?'':esc(String(val)))+'"'+mx+req+'>';
    }
    body+='<div class="field'+full+'"><label>'+esc(c.coluna)+(req?' *':'')+'</label>'+input+'</div>';
  });
  body+='</div>';
  openModal((id?'Editar ':'Novo ')+cfgLabel, body,
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-ok" onclick="cfgSalvar('+(id?('\''+esc(String(id))+'\''):'null')+')">Salvar</button>');
}
window.cfgForm=cfgForm;

async function cfgLoadFk(tabela){
  if(cfgFkCache[tabela]) return;
  // só carrega se a tabela estiver registrada; senão vira input numérico
  const {data,error}=await sb.rpc('erp_list',{p_tabela:tabela,p_limit:9999}).catch(()=>({error:true}));
  if(error||!data){ cfgFkCache[tabela]=null; return; }
  const lblCol=['nome','descricao','razao_social','label','sigla','placa','codigo'].find(k=>data[0]&&k in data[0]);
  cfgFkCache[tabela]=data.map(r=>({id:r.id, label:(lblCol?r[lblCol]:('#'+r.id))+' (#'+r.id+')'}));
}

async function cfgSalvar(id){
  try{
    const dados={};
    cfgEditableCols().forEach(c=>{
      const el=document.getElementById('f_'+c.coluna); if(!el) return;
      let v;
      if(c.tipo==='boolean') v=el.checked;
      else if(['integer','bigint','smallint','numeric'].includes(c.tipo)) v=el.value===''?null:Number(el.value);
      else v=el.value===''?(c.nulo?null:''):el.value;
      if(v===''&&c.nulo) v=null;
      // não envia vazio opcional para respeitar default
      if(v===null && !id && c.default) return;
      dados[c.coluna]=v;
    });
    const {data,error}=await sb.rpc('erp_upsert',{p_tabela:cfgTabela,p_dados:dados,p_id:id?String(id):null});
    if(error) throw error;
    if(data&&data.ok===false) throw new Error(data.erro||'Falha ao salvar');
    closeModal(); toast(id?'Registro atualizado':'Registro criado','ok');
    cfgRender($('#cfg-busca')?$('#cfg-busca').value:'');
  }catch(e){ toast('Erro: '+(e.message||e),'err'); }
}
window.cfgSalvar=cfgSalvar;

async function cfgExcluir(id){
  if(!await confirmAsync('Excluir este registro de "'+cfgLabel+'"? Esta ação não pode ser desfeita.')) return;
  try{
    const {data,error}=await sb.rpc('erp_delete',{p_tabela:cfgTabela,p_id:String(id)});
    if(error) throw error;
    toast('Registro excluído','ok');
    cfgRender($('#cfg-busca')?$('#cfg-busca').value:'');
  }catch(e){ toast('Erro ao excluir: '+(e.message||e),'err'); }
}
window.cfgExcluir=cfgExcluir;
