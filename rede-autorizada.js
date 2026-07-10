// ═══════════════════════════════════════════
// REDE AUTORIZADA STONNI — GESTÃO
// rede-autorizada.js
// ═══════════════════════════════════════════
'use strict';

var _raData = {};
var _raCache = {};

var RA_PAGES = {
'ra-aprovar': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Ordens de Serviço — Fila de Aprovação</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <select class="filter-select" id="ra-apr-filtro" onchange="raFiltrarOS()">
        <option value="enviada">Aguardando aprovação</option>
        <option value="aprovada">Aprovadas</option>
        <option value="recusada">Recusadas</option>
        <option value="">Todas</option>
      </select>
      <input class="search-input" id="ra-apr-busca" placeholder="Buscar parceiro, cliente..." oninput="raFiltrarOS()" style="width:200px">
    </div>
  </div>
  <div class="cards-grid cards-grid-4" id="ra-apr-kpis"></div>
  <div class="table-card">
    <div class="table-card-header"><span class="table-card-title">Ordens de Serviço</span><span id="ra-apr-count" style="font-size:12px;color:var(--text-muted)"></span></div>
    <div style="overflow-x:auto"><table class="data-table" id="ra-apr-table"><tbody id="ra-apr-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-servicos': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Tabela de Serviços</div>
    <div style="display:flex;gap:8px">
      <select class="filter-select" id="ra-srv-linha" onchange="raCarregarServicos()">
        <option value="">Todas as linhas</option>
        <option value="geladeira">Geladeira</option>
        <option value="ar_condicionado">AR Condicionado</option>
        <option value="gerador">Gerador</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="raNovoServico()">+ Novo serviço</button>
    </div>
  </div>
  <div class="table-card">
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Código</th><th>Descrição</th><th>Linha</th><th>Categoria</th><th>Valor</th><th>Teto</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-srv-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-pecas': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Catálogo de Peças</div>
    <div style="display:flex;gap:8px">
      <select class="filter-select" id="ra-pec-linha" onchange="raCarregarPecas()">
        <option value="">Todas as linhas</option>
        <option value="geladeira">Geladeira</option>
        <option value="ar_condicionado">AR Condicionado</option>
        <option value="gerador">Gerador</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="raNovaPeca()">+ Nova peça</button>
    </div>
  </div>
  <div class="table-card">
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Referência</th><th>Nome</th><th>Linha</th><th>Aplicação</th><th>Custo</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-pec-tbody"><tr><td colspan="7" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-envios': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Envio de Peças</div>
    <button class="btn btn-primary btn-sm" onclick="raNovoEnvio()">+ Novo envio</button>
  </div>
  <div class="cards-grid cards-grid-3" id="ra-env-kpis"></div>
  <div class="table-card">
    <div class="table-card-header"><span class="table-card-title">Envios recentes</span></div>
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Parceiro</th><th>Peça</th><th>Qtd</th><th>NF</th><th>Rastreio</th><th>Status</th><th>Data</th><th></th></tr></thead><tbody id="ra-env-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-pagamentos': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Pagamentos — Fechamento Mensal</div>
    <div style="display:flex;gap:8px">
      <select class="filter-select" id="ra-pag-mes" onchange="raCarregarPagamentos()"></select>
      <button class="btn btn-primary btn-sm" onclick="raGerarFechamento()">Gerar fechamento</button>
    </div>
  </div>
  <div class="cards-grid cards-grid-4" id="ra-pag-kpis"></div>
  <div class="table-card">
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Parceiro</th><th>OS</th><th>Serviços</th><th>Peças</th><th>Total</th><th>NF Parceiro</th><th>Status</th><th></th></tr></thead><tbody id="ra-pag-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-materiais': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Materiais Técnicos</div>
    <div style="display:flex;gap:8px">
      <select class="filter-select" id="ra-mat-linha" onchange="raCarregarMateriais()">
        <option value="">Todas as linhas</option>
        <option value="geladeira">Geladeira</option>
        <option value="ar_condicionado">AR Condicionado</option>
        <option value="gerador">Gerador</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="raNovoMaterial()">+ Novo material</button>
    </div>
  </div>
  <div class="table-card">
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Título</th><th>Tipo</th><th>Linha</th><th>Modelo</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-mat-tbody"><tr><td colspan="6" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-config': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Configurações — Categorias de Serviço</div>
    <div style="display:flex;gap:8px">
      <select class="filter-select" id="ra-cfg-linha" onchange="raCfgCarregar()">
        <option value="">Todas as linhas</option>
        <option value="geladeira">Geladeira</option>
        <option value="ar_condicionado">AR Condicionado</option>
        <option value="gerador">Gerador</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="raCfgNovaCategoria()">+ Nova categoria</button>
    </div>
  </div>
  <div class="table-card">
    <div class="table-card-header"><span class="table-card-title">Categorias</span><span id="ra-cfg-count" style="font-size:12px;color:var(--text-muted)"></span></div>
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Ordem</th><th>Nome</th><th>Linha</th><th>Prefixo</th><th>Teto</th><th>Serviços</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-cfg-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`
};

// ═══ MÓDULO ═══
window.ModuloRedeAutorizada = {
  showPage: function(paginaId, slot) {
    var html = RA_PAGES[paginaId];
    if (!html) { slot.innerHTML = '<div class="module-placeholder"><p>Página não encontrada</p></div>'; return; }
    slot.innerHTML = html;
    switch(paginaId) {
      case 'ra-aprovar':    raCarregarOS(); break;
      case 'ra-servicos':   raCarregarServicos(); break;
      case 'ra-pecas':      raCarregarPecas(); break;
      case 'ra-envios':     raCarregarEnvios(); break;
      case 'ra-pagamentos': raCarregarPagamentos(); break;
      case 'ra-materiais':  raCarregarMateriais(); break;
      case 'ra-config':     raCfgCarregar(); break;
    }
  }
};

// ═══ HELPERS ═══
var SB_URL = 'https://vishxwdxqiygbxmtpfoy.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc2h4d2R4cWl5Z2J4bXRwZm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njg2MjIsImV4cCI6MjA4ODA0NDYyMn0.J647m3ieDHahNQYBWMRESl0aPFXsT_zt_7ZcDvyB-SA';

function raFetch(path) {
  return fetch(SB_URL + '/rest/v1/' + path, { headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY} }).then(function(r) { return r.json(); });
}
function raPost(table, data) {
  return fetch(SB_URL + '/rest/v1/' + table, { method: 'POST', headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}, body: JSON.stringify(data) }).then(function(r) { return r.json(); });
}
function raPatch(table, filter, data) {
  return fetch(SB_URL + '/rest/v1/' + table + '?' + filter, { method: 'PATCH', headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}, body: JSON.stringify(data) }).then(function(r) { return r.json(); });
}
function raDelete(table, filter) {
  return fetch(SB_URL + '/rest/v1/' + table + '?' + filter, { method: 'DELETE', headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY} });
}

function raFmt(v) { return 'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
function raDate(d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—'; }
function raToast(msg) { alert(msg); } // simplificado — usa o toast do index se existir
function raModal(title, bodyHtml, footerHtml) {
  var el = document.createElement('div');
  el.className = 'modal-overlay';
  el.id = 'ra-modal';
  el.onclick = function(e) { if (e.target === el) el.remove(); };
  el.innerHTML = '<div class="modal"><div class="modal-header"><span class="modal-title">' + title + '</span><button class="btn-icon" onclick="document.getElementById(\'ra-modal\').remove()">✕</button></div><div class="modal-body">' + bodyHtml + '</div>' + (footerHtml ? '<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">' + footerHtml + '</div>' : '') + '</div>';
  document.body.appendChild(el);
}

// ═══════════════════════════════════════
// 1. APROVAR OS
// ═══════════════════════════════════════
var _raOS = [];
async function raCarregarOS() {
  try {
    var os = await raFetch('prt_ordens_servico?order=criado_em.desc&select=*,assist_parceiros(nome,cidade,uf)');
    _raOS = Array.isArray(os) ? os : [];
    // KPIs
    var env = _raOS.filter(function(o) { return o.status === 'enviada'; }).length;
    var apr = _raOS.filter(function(o) { return o.status === 'aprovada'; }).length;
    var rec = _raOS.filter(function(o) { return o.status === 'recusada'; }).length;
    var valApr = _raOS.filter(function(o) { return o.status === 'aprovada' || o.status === 'paga'; }).reduce(function(s, o) { return s + (parseFloat(o.valor_servico) || 0); }, 0);
    var kpis = document.getElementById('ra-apr-kpis');
    if (kpis) kpis.innerHTML =
      '<div class="card"><div class="card-label">Aguardando</div><div class="card-value orange">' + env + '</div></div>' +
      '<div class="card"><div class="card-label">Aprovadas</div><div class="card-value green">' + apr + '</div></div>' +
      '<div class="card"><div class="card-label">Recusadas</div><div class="card-value red">' + rec + '</div></div>' +
      '<div class="card"><div class="card-label">Valor aprovado</div><div class="card-value blue">' + raFmt(valApr) + '</div></div>';
    raFiltrarOS();
  } catch (e) { console.error('raCarregarOS', e); }
}

window.raFiltrarOS = function() {
  var filtro = document.getElementById('ra-apr-filtro').value;
  var busca = (document.getElementById('ra-apr-busca').value || '').toLowerCase();
  var lista = _raOS.filter(function(o) {
    if (filtro && o.status !== filtro) return false;
    if (busca) {
      var txt = ((o.cliente_nome || '') + (o.protocolo || '') + (o.assist_parceiros ? o.assist_parceiros.nome : '')).toLowerCase();
      if (txt.indexOf(busca) === -1) return false;
    }
    return true;
  });
  var count = document.getElementById('ra-apr-count');
  if (count) count.textContent = lista.length + ' OS';
  var tbody = document.getElementById('ra-apr-tbody');
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma OS encontrada</td></tr>'; return; }
  var statusBadge = function(s) {
    var cls = {enviada:'badge-orange',aprovada:'badge-green',recusada:'badge-red',paga:'badge-purple',rascunho:'badge-gray',em_analise:'badge-blue'};
    return '<span class="badge ' + (cls[s] || 'badge-gray') + '">' + (s || '').replace(/_/g, ' ') + '</span>';
  };
  tbody.innerHTML = lista.map(function(o) {
    var parc = o.assist_parceiros ? o.assist_parceiros.nome : 'Parceiro #' + o.parceiro_id;
    return '<tr style="cursor:pointer" onclick="raDetalheOS(' + o.id + ')">' +
      '<td class="mono" style="font-weight:600">' + (o.protocolo || '#' + o.id) + '</td>' +
      '<td>' + parc + '</td>' +
      '<td>' + (o.cliente_nome || '') + '</td>' +
      '<td>' + (o.produto_linha || '') + '</td>' +
      '<td>' + (o.codigo_servico || '') + '</td>' +
      '<td class="mono right">' + raFmt(o.valor_servico) + '</td>' +
      '<td>' + raDate(o.data_servico) + '</td>' +
      '<td>' + statusBadge(o.status) + '</td></tr>';
  }).join('');
};

window.raDetalheOS = async function(id) {
  var o = _raOS.find(function(x) { return x.id === id; });
  if (!o) return;
  var parc = o.assist_parceiros ? o.assist_parceiros.nome : 'Parceiro #' + o.parceiro_id;
  // Carregar peças da OS
  var pecasOS = [];
  try { pecasOS = await raFetch('prt_os_pecas?os_id=eq.' + id + '&select=*'); if (!Array.isArray(pecasOS)) pecasOS = []; } catch(e) {}
  var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">PROTOCOLO</label><div style="font-weight:700">' + (o.protocolo || '#' + o.id) + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">PARCEIRO</label><div>' + parc + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">CLIENTE</label><div>' + (o.cliente_nome || '-') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">TELEFONE</label><div>' + (o.cliente_telefone || '-') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">CIDADE/UF</label><div>' + (o.cliente_cidade || '') + '/' + (o.cliente_uf || '') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">PRODUTO</label><div>' + (o.produto_linha || '') + (o.produto_modelo ? ' — ' + o.produto_modelo : '') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">Nº SÉRIE</label><div>' + (o.numero_serie || '-') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">NF COMPRA</label><div>' + (o.numero_nf || '-') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">DATA COMPRA</label><div>' + raDate(o.data_compra) + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">CÓD. ERRO</label><div>' + (o.codigo_erro || '-') + '</div></div>' +
    '<div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">DEFEITO</label><div>' + (o.defeito_descricao || '-') + '</div></div>' +
    '<div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">DIAGNÓSTICO</label><div>' + (o.diagnostico || '-') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">SOLUÇÃO</label><div>' + ((o.solucao_tipo || '').replace(/_/g, ' ')) + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">SERVIÇO</label><div style="font-weight:600;color:var(--blue-mid)">' + (o.codigo_servico || '-') + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">VALOR</label><div style="font-weight:700;color:var(--blue-mid);font-size:16px">' + raFmt(o.valor_servico) + '</div></div>' +
    '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">DATA SERVIÇO</label><div>' + raDate(o.data_servico) + '</div></div>' +
    '</div>';
  // Peças utilizadas
  if (pecasOS.length) {
    body += '<div style="margin-top:16px;border-top:1px solid var(--border);padding-top:12px"><label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase">PEÇAS UTILIZADAS</label>';
    pecasOS.forEach(function(p) {
      body += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid #f0f0f0"><span>' + p.referencia + ' — ' + p.nome_peca + '</span><span style="font-weight:600">x' + p.quantidade + '</span></div>';
    });
    body += '</div>';
  }
  // Fotos
  if (o.foto_nf || o.foto_equipamento) {
    body += '<div style="display:flex;gap:12px;margin-top:12px;border-top:1px solid var(--border);padding-top:12px">';
    if (o.foto_nf) body += '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">FOTO NF</label><br><img src="' + o.foto_nf + '" style="max-width:200px;max-height:150px;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="window.open(\'' + o.foto_nf + '\')"></div>';
    if (o.foto_equipamento) body += '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">EQUIPAMENTO</label><br><img src="' + o.foto_equipamento + '" style="max-width:200px;max-height:150px;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="window.open(\'' + o.foto_equipamento + '\')"></div>';
    body += '</div>';
  }
  if (o.motivo_recusa) body += '<div class="alert alert-error" style="margin-top:12px"><strong>Motivo recusa:</strong> ' + o.motivo_recusa + '</div>';

  var footer = '';
  if (o.status === 'enviada') {
    footer = '<button class="btn btn-secondary" onclick="raEditarServicoOS(' + o.id + ')">✏️ Alterar serviço</button>' +
             '<button class="btn btn-danger" onclick="raRecusarOS(' + o.id + ')">Recusar</button>' +
             '<button class="btn btn-success" onclick="raAprovarOS(' + o.id + ')">✓ Aprovar</button>';
  } else if (o.status === 'aprovada') {
    footer = '<button class="btn btn-secondary" onclick="raEditarServicoOS(' + o.id + ')">✏️ Alterar serviço</button>';
  }
  raModal('OS ' + (o.protocolo || '#' + o.id), body, footer);
};

window.raEditarServicoOS = async function(osId) {
  var o = _raOS.find(function(x) { return x.id === osId; });
  if (!o) return;
  var linhaDb = {Geladeira:'geladeira','Ar Condicionado':'ar_condicionado',Gerador:'gerador',Outros:'outros'}[o.produto_linha] || o.produto_linha || '';
  var servicos = await raFetch('prt_tabela_servicos?ativo=eq.true&order=codigo.asc&select=*' + (linhaDb ? '&linha_produto=eq.' + linhaDb : ''));
  if (!Array.isArray(servicos)) servicos = [];
  var catNomes = {eletrica:'Intervenções Elétricas',frigorifico:'Frigorífico / Recuperação',outros:'Outras Intervenções',outros_servicos:'Outros Serviços'};
  var cats = {};
  servicos.forEach(function(s) { if (!cats[s.categoria]) cats[s.categoria] = []; cats[s.categoria].push(s); });
  var html = '<p style="margin-bottom:12px;font-size:13px">Serviço atual: <strong>' + (o.codigo_servico || 'nenhum') + '</strong> — ' + raFmt(o.valor_servico) + '</p>';
  Object.keys(cats).forEach(function(cat) {
    html += '<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">' + (catNomes[cat] || cat) + '</div>';
    cats[cat].forEach(function(s) {
      var sel = o.codigo_servico === s.codigo;
      html += '<div style="padding:6px 10px;border-radius:6px;cursor:pointer;margin:2px 0;display:flex;justify-content:space-between;align-items:center;' + (sel ? 'background:var(--blue-pale);border:1px solid var(--blue-mid)' : 'background:var(--surface2);border:1px solid var(--border)') + '" onclick="raConfirmarServicoOS(' + osId + ',\'' + s.codigo + '\',' + s.valor + ')"><div><span style="font-weight:600">' + s.codigo + '</span> ' + s.descricao + '</div><span style="font-weight:700;color:var(--blue-mid)">' + raFmt(s.valor) + '</span></div>';
    });
    html += '</div>';
  });
  document.getElementById('ra-modal')?.remove();
  raModal('Alterar Serviço — ' + (o.protocolo || '#' + o.id), html, '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove();raDetalheOS(' + osId + ')">Voltar</button>');
};

window.raConfirmarServicoOS = async function(osId, codigo, valor) {
  if (!confirm('Alterar serviço para ' + codigo + ' (' + raFmt(valor) + ')?')) return;
  var s = (await raFetch('prt_tabela_servicos?codigo=eq.' + codigo + '&select=*'));
  var serv = Array.isArray(s) && s.length ? s[0] : null;
  await raPatch('prt_ordens_servico', 'id=eq.' + osId, {
    codigo_servico: codigo,
    valor_servico: valor,
    categoria_servico: serv ? serv.categoria : null,
    atualizado_em: new Date().toISOString()
  });
  document.getElementById('ra-modal')?.remove();
  raLog('ACAO','os','APROVAR_OS',String(id));raCarregarOS();
};

window.raAprovarOS = async function(id) {
  if (!confirm('Confirma aprovação desta OS?')) return;
  await raPatch('prt_ordens_servico', 'id=eq.' + id, { status: 'aprovada', data_aprovacao: new Date().toISOString(), aprovado_por: (window.getUsuario() || {}).nome || 'gestor' });
  document.getElementById('ra-modal')?.remove();
  raLog('ACAO','os','APROVAR_OS',String(id));raCarregarOS();
};

window.raRecusarOS = function(id) {
  raModal('Recusar OS', '<div class="field"><label>Motivo da recusa</label><textarea id="ra-motivo-recusa" class="search-input" style="width:100%;height:80px;resize:vertical" placeholder="Explique o motivo da recusa..."></textarea></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-danger" onclick="raConfirmarRecusa(' + id + ')">Confirmar recusa</button>');
};

window.raConfirmarRecusa = async function(id) {
  var motivo = document.getElementById('ra-motivo-recusa').value.trim();
  if (!motivo) { alert('Informe o motivo'); return; }
  await raPatch('prt_ordens_servico', 'id=eq.' + id, { status: 'recusada', motivo_recusa: motivo });raLog('ACAO','os','RECUSAR_OS',String(id),null,{motivo:motivo});
  document.getElementById('ra-modal')?.remove();
  raLog('ACAO','os','APROVAR_OS',String(id));raCarregarOS();
};

// ═══════════════════════════════════════
// 2. SERVIÇOS — CRUD (com categorias da nova tabela + código automático)
// ═══════════════════════════════════════
var _raServicos = [];
var _raCategorias = [];

window.raCarregarServicos = async function() {
  var linha = document.getElementById('ra-srv-linha')?.value || '';
  // carregar categorias
  var catUrl = 'prt_categorias_servico?order=ordem.asc&select=*';
  if (linha) catUrl += '&linha_produto=eq.' + linha;
  _raCategorias = await raFetch(catUrl);
  if (!Array.isArray(_raCategorias)) _raCategorias = [];
  // carregar serviços
  var url = 'prt_tabela_servicos?order=codigo.asc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raServicos = await raFetch(url);
  if (!Array.isArray(_raServicos)) _raServicos = [];
  var tbody = document.getElementById('ra-srv-tbody');
  var linhaNomes = {geladeira:'Geladeira',ar_condicionado:'AR Condicionado',gerador:'Gerador'};
  // map de categorias por id
  var catMap = {};
  _raCategorias.forEach(function(c) { catMap[c.id] = c; });
  if (!_raServicos.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum serviço cadastrado</td></tr>'; return; }
  tbody.innerHTML = _raServicos.map(function(s) {
    var cat = catMap[s.categoria_id] || {};
    return '<tr>' +
      '<td class="mono" style="font-weight:600">' + s.codigo + '</td>' +
      '<td>' + s.descricao + '</td>' +
      '<td>' + (linhaNomes[s.linha_produto] || s.linha_produto) + '</td>' +
      '<td><span class="badge badge-blue">' + (cat.nome || s.categoria) + '</span></td>' +
      '<td class="mono right">' + raFmt(s.valor) + '</td>' +
      '<td class="mono right">' + raFmt(cat.valor_teto || s.teto_categoria) + '</td>' +
      '<td>' + (s.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarServico(' + s.id + ')">✏️</button> <button class="btn-icon" onclick="raToggleServico(' + s.id + ',' + !s.ativo + ')">' + (s.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

// gera próximo código automático: STN-{prefixo}{nn}
function raGerarCodigo(categoriaId) {
  var cat = _raCategorias.find(function(c) { return c.id === categoriaId; });
  if (!cat) return '';
  var prefixo = 'STN-' + cat.prefixo_codigo;
  var existentes = _raServicos.filter(function(s) { return s.codigo && s.codigo.indexOf(prefixo) === 0; });
  var maxNum = 0;
  existentes.forEach(function(s) {
    var num = parseInt(s.codigo.replace(prefixo, ''), 10);
    if (num > maxNum) maxNum = num;
  });
  var next = String(maxNum + 1);
  while (next.length < 2) next = '0' + next;
  return prefixo + next;
}

window.raNovoServico = function() {
  // filtrar categorias ativas
  var catOpts = _raCategorias.filter(function(c) { return c.ativo; }).map(function(c) {
    var lnm = {geladeira:'Gel',ar_condicionado:'AR',gerador:'Ger'};
    return '<option value="' + c.id + '">' + (lnm[c.linha_produto]||c.linha_produto) + ' — ' + c.nome + '</option>';
  }).join('');
  if (!catOpts) catOpts = '<option value="">Nenhuma categoria — cadastre primeiro em Configurações</option>';

  raModal('Novo Serviço',
    '<div class="field"><label>Categoria</label><select id="ra-srv-cat" class="filter-select" style="width:100%" onchange="raPreviewCodigo()">' + catOpts + '</select></div>' +
    '<div class="field"><label>Código (automático)</label><input id="ra-srv-codigo" class="search-input" style="width:100%;background:var(--surface2);cursor:not-allowed" readonly></div>' +
    '<div class="field"><label>Descrição</label><input id="ra-srv-desc" class="search-input" style="width:100%" placeholder="Descrição do serviço"></div>' +
    '<div class="field"><label>Valor (R$)</label><input id="ra-srv-valor" class="search-input" style="width:100%" type="number" step="0.01"></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarServico()">Salvar</button>');
  raPreviewCodigo();
};

window.raPreviewCodigo = function() {
  var catId = parseInt(document.getElementById('ra-srv-cat').value);
  var el = document.getElementById('ra-srv-codigo');
  if (catId) { el.value = raGerarCodigo(catId); }
  else { el.value = ''; }
};

window.raSalvarServico = async function(id) {
  var catId = parseInt(document.getElementById('ra-srv-cat').value);
  var cat = _raCategorias.find(function(c) { return c.id === catId; });
  var desc = document.getElementById('ra-srv-desc').value.trim();
  var valor = parseFloat(document.getElementById('ra-srv-valor').value) || 0;
  if (!catId || !cat) { alert('Selecione uma categoria'); return; }
  if (!desc) { alert('Preencha a descrição'); return; }

  var d = {
    descricao: desc,
    linha_produto: cat.linha_produto,
    categoria: cat.slug,
    categoria_id: cat.id,
    valor: valor,
    teto_categoria: cat.valor_teto
  };

  if (id) {
    // edição — mantém código existente
    await raPatch('prt_tabela_servicos', 'id=eq.' + id, d);
    raLog('ACAO','prt_tabela_servicos','EDITAR_SERVICO',String(id),null,d);
  } else {
    // novo — gera código automático
    d.codigo = document.getElementById('ra-srv-codigo').value;
    if (!d.codigo) { alert('Erro ao gerar código'); return; }
    await raPost('prt_tabela_servicos', d);
    raLog('ACAO','prt_tabela_servicos','CRIAR_SERVICO',null,null,d);
  }
  document.getElementById('ra-modal')?.remove();
  raCarregarServicos();
};

window.raEditarServico = function(id) {
  var s = _raServicos.find(function(x) { return x.id === id; });
  if (!s) return;
  var catOpts = _raCategorias.filter(function(c) { return c.ativo; }).map(function(c) {
    var lnm = {geladeira:'Gel',ar_condicionado:'AR',gerador:'Ger'};
    return '<option value="' + c.id + '"' + (c.id === s.categoria_id ? ' selected' : '') + '>' + (lnm[c.linha_produto]||c.linha_produto) + ' — ' + c.nome + '</option>';
  }).join('');

  raModal('Editar Serviço',
    '<div class="field"><label>Código</label><input class="search-input" style="width:100%;background:var(--surface2);cursor:not-allowed" readonly value="' + s.codigo + '"></div>' +
    '<div class="field"><label>Categoria</label><select id="ra-srv-cat" class="filter-select" style="width:100%">' + catOpts + '</select></div>' +
    '<div class="field"><label>Descrição</label><input id="ra-srv-desc" class="search-input" style="width:100%" value="' + (s.descricao || '') + '"></div>' +
    '<div class="field"><label>Valor (R$)</label><input id="ra-srv-valor" class="search-input" style="width:100%" type="number" step="0.01" value="' + (s.valor || '') + '"></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarServico(' + id + ')">Salvar</button>');
};

window.raToggleServico = async function(id, ativo) {
  await raPatch('prt_tabela_servicos', 'id=eq.' + id, { ativo: ativo });
  raLog('ACAO','prt_tabela_servicos',ativo?'ATIVAR_SERVICO':'DESATIVAR_SERVICO',String(id));
  raCarregarServicos();
};

// ═══════════════════════════════════════
// 3. PEÇAS — CRUD (com busca ERP + checkboxes modelos)
// ═══════════════════════════════════════
var _raPecas = [];
var MODELOS_POR_LINHA = {
  'geladeira': ['Stonni ST 18L','Stonni ST 30L','Adventure 25L','Adventure 40L','Adventure 45L Dual Zone','Adventure 55L Dual Zone'],
  'ar_condicionado': ['AR Advantage I','AR Advantage II 24V','AR G2 Night Power 24V S2','AR G3 Truck Night Power 24V','AR G3 RV Night Power 12V','AR Compact','AR Slim / Clean'],
  'gerador': ['Gerador Stonni Autom. Inverter 1800W 24V'],
  'outros': ['Air Fryer 24V 3L','Aquecedor Vela 12V']
};

window.raCarregarPecas = async function() {
  var linha = document.getElementById('ra-pec-linha')?.value || '';
  var url = 'prt_pecas_catalogo?order=nome.asc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raPecas = await raFetch(url);
  if (!Array.isArray(_raPecas)) _raPecas = [];
  var tbody = document.getElementById('ra-pec-tbody');
  var linhaNomes = {geladeira:'Geladeira',ar_condicionado:'AR Condicionado',gerador:'Gerador'};
  if (!_raPecas.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma peça cadastrada</td></tr>'; return; }
  tbody.innerHTML = _raPecas.map(function(p) {
    var aplic = Array.isArray(p.aplicacao) ? p.aplicacao.join(', ') : '';
    return '<tr>' +
      '<td class="mono" style="font-weight:600">' + p.referencia + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + (linhaNomes[p.linha_produto] || p.linha_produto) + '</td>' +
      '<td style="font-size:12px">' + (aplic || '<span style="color:var(--text-muted)">não definida</span>') + '</td>' +
      '<td class="mono right">' + raFmt(p.custo_unitario) + '</td>' +
      '<td>' + (p.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarPeca(' + p.id + ')">✏️</button> <button class="btn-icon" onclick="raTogglePeca(' + p.id + ',' + !p.ativo + ')">' + (p.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

window.raNovaPeca = function(prefill) {
  var p = prefill || {};
  raModal('Nova Peça — Buscar no ERP',
    '<div class="field"><label>Buscar produto no ERP</label><div style="display:flex;gap:6px"><input id="ra-pec-busca-erp" class="search-input" style="flex:1" placeholder="Digite referência ou nome do produto..." value="' + (p.referencia || '') + '"><button class="btn btn-secondary btn-sm" onclick="raBuscarPecaERP()">🔍 Buscar</button></div></div>' +
    '<div id="ra-pec-erp-results" style="max-height:150px;overflow-y:auto;margin-bottom:12px"></div>' +
    '<hr style="border:0;border-top:1px solid var(--border);margin:8px 0">' +
    '<div class="field"><label>Referência</label><input id="ra-pec-ref" class="search-input" style="width:100%" value="' + (p.referencia || '') + '" placeholder="Código ERP"></div>' +
    '<div class="field"><label>Nome (editável)</label><input id="ra-pec-nome" class="search-input" style="width:100%" value="' + (p.nome || '') + '" placeholder="Nome da peça"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-pec-linha-new" class="filter-select" style="width:100%" onchange="raAtualizarCheckboxesModelo(\'pec\')"><option value="geladeira"' + (p.linha_produto === 'geladeira' ? ' selected' : '') + '>Geladeira</option><option value="ar_condicionado"' + (p.linha_produto === 'ar_condicionado' ? ' selected' : '') + '>AR Condicionado</option><option value="gerador"' + (p.linha_produto === 'gerador' ? ' selected' : '') + '>Gerador</option></select></div>' +
      '<div class="field"><label>Custo (R$)</label><input id="ra-pec-custo" class="search-input" style="width:100%" type="number" step="0.01" value="' + (p.custo_unitario || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Aplicação — selecione os modelos</label><div id="ra-pec-checkboxes" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarPeca()">Salvar</button>');
  // renderizar checkboxes
  window._pecaAplic = Array.isArray(p.aplicacao) ? p.aplicacao.slice() : [];
  raAtualizarCheckboxesModelo('pec');
};

window.raBuscarPecaERP = async function() {
  var q = document.getElementById('ra-pec-busca-erp').value.trim();
  if (q.length < 2) { alert('Digite pelo menos 2 caracteres'); return; }
  var box = document.getElementById('ra-pec-erp-results');
  box.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:12px">Buscando...</div>';
  var results = await raFetch('comp_produtos_consolidado?or=(referencia.ilike.*' + q + '*,nome.ilike.*' + q + '*)&order=nome.asc&limit=15&select=referencia,nome,preco_compra');
  if (!Array.isArray(results) || !results.length) { box.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:12px">Nenhum produto encontrado</div>'; return; }
  box.innerHTML = results.map(function(r) {
    return '<div style="padding:6px 8px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px;display:flex;justify-content:space-between" onmouseover="this.style.background=\'var(--blue-pale)\'" onmouseout="this.style.background=\'\'" onclick="raSelecionarPecaERP(\'' + (r.referencia || '').replace(/'/g, "\\'") + '\',\'' + (r.nome || '').replace(/'/g, "\\'") + '\',' + (r.preco_compra || 0) + ')"><span><strong>' + r.referencia + '</strong> — ' + r.nome + '</span><span>' + raFmt(r.preco_compra) + '</span></div>';
  }).join('');
};

window.raSelecionarPecaERP = function(ref, nome, custo) {
  document.getElementById('ra-pec-ref').value = ref;
  document.getElementById('ra-pec-nome').value = nome;
  document.getElementById('ra-pec-custo').value = custo || '';
  document.getElementById('ra-pec-erp-results').innerHTML = '<div style="padding:6px;color:var(--green);font-size:12px">✅ Produto selecionado: ' + ref + '</div>';
};

window.raAtualizarCheckboxesModelo = function(prefix) {
  var linha = document.getElementById('ra-' + prefix + '-linha-new').value;
  var modelos = MODELOS_POR_LINHA[linha] || [];
  var aplic = prefix === 'pec' ? (window._pecaAplic || []) : (window._matAplic || []);
  var box = document.getElementById('ra-' + prefix + '-checkboxes');
  box.innerHTML = modelos.map(function(m) {
    var checked = aplic.indexOf(m) > -1 ? ' checked' : '';
    return '<label style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;border:1px solid var(--border);font-size:12px;cursor:pointer;background:' + (checked ? 'var(--blue-pale)' : 'var(--surface2)') + '"><input type="checkbox" value="' + m + '"' + checked + ' onchange="raToggleModeloCheck(\'' + prefix + '\',this)" style="accent-color:var(--blue-mid)">' + m + '</label>';
  }).join('');
};

window.raToggleModeloCheck = function(prefix, cb) {
  var aplic = prefix === 'pec' ? window._pecaAplic : window._matAplic;
  var v = cb.value;
  var idx = aplic.indexOf(v);
  if (cb.checked && idx === -1) aplic.push(v);
  else if (!cb.checked && idx > -1) aplic.splice(idx, 1);
  cb.parentElement.style.background = cb.checked ? 'var(--blue-pale)' : 'var(--surface2)';
};

window.raSalvarPeca = async function(id) {
  var d = {
    referencia: document.getElementById('ra-pec-ref').value.trim(),
    nome: document.getElementById('ra-pec-nome').value.trim(),
    linha_produto: document.getElementById('ra-pec-linha-new').value,
    custo_unitario: parseFloat(document.getElementById('ra-pec-custo').value) || null,
    aplicacao: window._pecaAplic || []
  };
  if (!d.referencia || !d.nome) { alert('Preencha referência e nome'); return; }
  if (id) { await raPatch('prt_pecas_catalogo', 'id=eq.' + id, d); }
  else { await raPost('prt_pecas_catalogo', d); }
  raLog('ACAO', 'peca', id ? 'EDITAR_PECA' : 'CRIAR_PECA', d.referencia, d.nome);
  document.getElementById('ra-modal')?.remove();
  raCarregarPecas();
};

window.raEditarPeca = function(id) {
  var p = _raPecas.find(function(x) { return x.id === id; });
  if (!p) return;
  raNovaPeca(p);
  document.querySelector('.modal-title').textContent = 'Editar Peça';
  var btns = document.querySelectorAll('.modal .btn-primary');
  btns[btns.length - 1].setAttribute('onclick', 'raSalvarPeca(' + id + ')');
};

window.raTogglePeca = async function(id, ativo) {
  await raPatch('prt_pecas_catalogo', 'id=eq.' + id, { ativo: ativo });
  raLog('ACAO', 'peca', ativo ? 'ATIVAR_PECA' : 'DESATIVAR_PECA', String(id));
  raCarregarPecas();
};

// ═══════════════════════════════════════
// 4. ENVIOS DE PEÇAS
// ═══════════════════════════════════════
window.raCarregarEnvios = async function() {
  var envios = await raFetch('prt_envios_pecas?order=criado_em.desc&select=*,assist_parceiros(nome)');
  if (!Array.isArray(envios)) envios = [];
  var kpis = document.getElementById('ra-env-kpis');
  var env = envios.filter(function(e) { return e.status === 'enviado'; }).length;
  var rec = envios.filter(function(e) { return e.status === 'recebido'; }).length;
  var total = envios.reduce(function(s, e) { return s + (e.quantidade * (parseFloat(e.custo_unitario) || 0)); }, 0);
  if (kpis) kpis.innerHTML =
    '<div class="card"><div class="card-label">Em trânsito</div><div class="card-value orange">' + env + '</div></div>' +
    '<div class="card"><div class="card-label">Recebidos</div><div class="card-value green">' + rec + '</div></div>' +
    '<div class="card"><div class="card-label">Valor total</div><div class="card-value blue">' + raFmt(total) + '</div></div>';
  var tbody = document.getElementById('ra-env-tbody');
  if (!envios.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum envio registrado</td></tr>'; return; }
  var statusBadge = function(s) { return s === 'recebido' ? '<span class="badge badge-green">Recebido</span>' : s === 'devolvido' ? '<span class="badge badge-red">Devolvido</span>' : '<span class="badge badge-orange">Enviado</span>'; };
  tbody.innerHTML = envios.map(function(e) {
    var parc = e.assist_parceiros ? e.assist_parceiros.nome : '#' + e.parceiro_id;
    return '<tr><td>' + parc + '</td><td>' + e.nome_peca + '</td><td class="mono right">' + e.quantidade + '</td><td>' + (e.nf_envio || '—') + '</td><td>' + (e.rastreio || '—') + '</td><td>' + statusBadge(e.status) + '</td><td>' + raDate(e.data_envio) + '</td>' +
      '<td>' + (e.status === 'enviado' ? '<button class="btn-icon" title="Marcar recebido" onclick="raMarcarRecebido(' + e.id + ')">✅</button>' : '') + '</td></tr>';
  }).join('');
};

window.raMarcarRecebido = async function(id) {
  await raPatch('prt_envios_pecas', 'id=eq.' + id, { status: 'recebido', data_recebimento: new Date().toISOString().substring(0, 10) });
  raCarregarEnvios();
};

window.raNovoEnvio = async function() {
  var parceiros = await raFetch('assist_parceiros?credenciado=eq.true&order=nome.asc&select=id,nome');
  if (!Array.isArray(parceiros)) parceiros = [];
  var pecas = await raFetch('prt_pecas_catalogo?ativo=eq.true&order=nome.asc&select=id,referencia,nome,custo_unitario');
  if (!Array.isArray(pecas)) pecas = [];
  raModal('Novo Envio de Peças',
    '<div class="field"><label>Parceiro</label><select id="ra-env-parc" class="filter-select" style="width:100%"><option value="">Selecione...</option>' +
      parceiros.map(function(p) { return '<option value="' + p.id + '">' + p.nome + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Peça</label><select id="ra-env-peca" class="filter-select" style="width:100%"><option value="">Selecione...</option>' +
      pecas.map(function(p) { return '<option value="' + p.id + '" data-ref="' + p.referencia + '" data-nome="' + p.nome + '" data-custo="' + (p.custo_unitario || 0) + '">' + p.referencia + ' — ' + p.nome + '</option>'; }).join('') + '</select></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
      '<div class="field"><label>Quantidade</label><input id="ra-env-qtd" class="search-input" style="width:100%" type="number" value="1" min="1"></div>' +
      '<div class="field"><label>NF Envio</label><input id="ra-env-nf" class="search-input" style="width:100%" placeholder="Número NF"></div>' +
      '<div class="field"><label>Rastreio</label><input id="ra-env-rastreio" class="search-input" style="width:100%" placeholder="Código rastreio"></div>' +
    '</div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarEnvio()">Registrar envio</button>');
};

window.raSalvarEnvio = async function() {
  var parcId = document.getElementById('ra-env-parc').value;
  var pecaSel = document.getElementById('ra-env-peca');
  var opt = pecaSel.options[pecaSel.selectedIndex];
  if (!parcId || !pecaSel.value) { alert('Selecione parceiro e peça'); return; }
  var d = {
    parceiro_id: parseInt(parcId),
    referencia: opt.getAttribute('data-ref'),
    nome_peca: opt.getAttribute('data-nome'),
    quantidade: parseInt(document.getElementById('ra-env-qtd').value) || 1,
    custo_unitario: parseFloat(opt.getAttribute('data-custo')) || null,
    nf_envio: document.getElementById('ra-env-nf').value.trim() || null,
    rastreio: document.getElementById('ra-env-rastreio').value.trim() || null
  };
  await raPost('prt_envios_pecas', d);
  // atualizar estoque do parceiro
  var estoque = await raFetch('prt_estoque_parceiro?parceiro_id=eq.' + d.parceiro_id + '&referencia=eq.' + d.referencia);
  if (Array.isArray(estoque) && estoque.length) {
    await raPatch('prt_estoque_parceiro', 'id=eq.' + estoque[0].id, { quantidade_enviada: estoque[0].quantidade_enviada + d.quantidade, ultimo_envio: new Date().toISOString().substring(0, 10) });
  } else {
    await raPost('prt_estoque_parceiro', { parceiro_id: parseInt(parcId), referencia: d.referencia, nome_peca: d.nome_peca, quantidade_enviada: d.quantidade, custo_unitario: d.custo_unitario, ultimo_envio: new Date().toISOString().substring(0, 10) });
  }
  document.getElementById('ra-modal')?.remove();
  raCarregarEnvios();
};

// ═══════════════════════════════════════
// 5. PAGAMENTOS
// ═══════════════════════════════════════
window.raCarregarPagamentos = async function() {
  // popular select de meses
  var sel = document.getElementById('ra-pag-mes');
  if (sel && !sel.options.length) {
    var now = new Date();
    for (var i = 0; i < 12; i++) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      sel.innerHTML += '<option value="' + val + '">' + val + '</option>';
    }
  }
  var pags = await raFetch('prt_pagamentos?order=mes_referencia.desc,criado_em.desc&select=*,assist_parceiros(nome)');
  if (!Array.isArray(pags)) pags = [];
  var kpis = document.getElementById('ra-pag-kpis');
  var pend = pags.filter(function(p) { return p.status === 'pendente'; });
  var totalPend = pend.reduce(function(s, p) { return s + (parseFloat(p.valor_total) || 0); }, 0);
  var pagos = pags.filter(function(p) { return p.status === 'pago'; });
  var totalPago = pagos.reduce(function(s, p) { return s + (parseFloat(p.valor_total) || 0); }, 0);
  if (kpis) kpis.innerHTML =
    '<div class="card"><div class="card-label">Pendentes</div><div class="card-value orange">' + pend.length + '</div></div>' +
    '<div class="card"><div class="card-label">Valor pendente</div><div class="card-value red">' + raFmt(totalPend) + '</div></div>' +
    '<div class="card"><div class="card-label">Pagos</div><div class="card-value green">' + pagos.length + '</div></div>' +
    '<div class="card"><div class="card-label">Total pago</div><div class="card-value blue">' + raFmt(totalPago) + '</div></div>';
  var tbody = document.getElementById('ra-pag-tbody');
  var statusBadge = function(s) { return s === 'pago' ? '<span class="badge badge-green">Pago</span>' : s === 'aprovado' ? '<span class="badge badge-blue">Aprovado</span>' : '<span class="badge badge-orange">Pendente</span>'; };
  if (!pags.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum pagamento registrado. Use "Gerar fechamento" para consolidar as OS aprovadas.</td></tr>'; return; }
  tbody.innerHTML = pags.map(function(p) {
    var parc = p.assist_parceiros ? p.assist_parceiros.nome : '#' + p.parceiro_id;
    return '<tr><td>' + parc + '</td><td class="mono right">' + p.qtd_os + '</td><td class="mono right">' + raFmt(p.valor_servicos) + '</td><td class="mono right">' + raFmt(p.valor_pecas) + '</td><td class="mono right" style="font-weight:700">' + raFmt(p.valor_total) + '</td><td>' + (p.nf_parceiro || '—') + '</td><td>' + statusBadge(p.status) + '</td>' +
      '<td>' + (p.status === 'pendente' ? '<button class="btn btn-sm btn-success" onclick="raMarcarPago(' + p.id + ')">💰 Pagar</button>' : '') + '</td></tr>';
  }).join('');
};

window.raGerarFechamento = async function() {
  var mes = document.getElementById('ra-pag-mes')?.value;
  if (!mes) { alert('Selecione o mês'); return; }
  if (!confirm('Gerar fechamento de ' + mes + '? Vai consolidar todas as OS aprovadas do mês por parceiro.')) return;
  var osAprovadas = await raFetch('prt_ordens_servico?status=in.(aprovada)&data_servico=gte.' + mes + '-01&data_servico=lte.' + mes + '-31&select=parceiro_id,valor_servico');
  if (!Array.isArray(osAprovadas) || !osAprovadas.length) { alert('Nenhuma OS aprovada encontrada no mês ' + mes); return; }
  var porParceiro = {};
  osAprovadas.forEach(function(o) {
    if (!porParceiro[o.parceiro_id]) porParceiro[o.parceiro_id] = { qtd: 0, valor: 0 };
    porParceiro[o.parceiro_id].qtd++;
    porParceiro[o.parceiro_id].valor += parseFloat(o.valor_servico) || 0;
  });
  for (var pid in porParceiro) {
    var pp = porParceiro[pid];
    await raPost('prt_pagamentos', {
      parceiro_id: parseInt(pid), mes_referencia: mes, qtd_os: pp.qtd,
      valor_servicos: pp.valor, valor_total: pp.valor, status: 'pendente'
    });
  }
  await raPatch('prt_ordens_servico', 'status=eq.aprovada&data_servico=gte.' + mes + '-01&data_servico=lte.' + mes + '-31', { status: 'paga', data_pagamento: new Date().toISOString() });
  raCarregarPagamentos();
};

window.raMarcarPago = async function(id) {
  if (!confirm('Confirma pagamento?')) return;
  await raPatch('prt_pagamentos', 'id=eq.' + id, { status: 'pago', data_pagamento: new Date().toISOString() });
  raCarregarPagamentos();
};

// ═══════════════════════════════════════
// 6. MATERIAIS TÉCNICOS — CRUD
// ═══════════════════════════════════════
var _raMateriais = [];
window.raCarregarMateriais = async function() {
  var linha = document.getElementById('ra-mat-linha')?.value || '';
  var url = 'prt_materiais?order=ordem.asc,criado_em.desc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raMateriais = await raFetch(url);
  if (!Array.isArray(_raMateriais)) _raMateriais = [];
  var tbody = document.getElementById('ra-mat-tbody');
  var tipoIcon = {video:'🎥',pdf:'📄',imagem:'🖼️',link:'🔗'};
  var linhaNomes = {geladeira:'Geladeira',ar_condicionado:'AR Condicionado',gerador:'Gerador'};
  if (!_raMateriais.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum material cadastrado</td></tr>'; return; }
  tbody.innerHTML = _raMateriais.map(function(m) {
    var modelos = Array.isArray(m.aplicacao_modelos) ? m.aplicacao_modelos.join(', ') : (m.modelo || 'Todos');
    return '<tr>' +
      '<td><a href="' + m.url + '" target="_blank" style="color:var(--blue-mid)">' + m.titulo + '</a></td>' +
      '<td>' + (tipoIcon[m.tipo] || '') + ' ' + m.tipo + '</td>' +
      '<td>' + (linhaNomes[m.linha_produto] || m.linha_produto || 'Geral') + '</td>' +
      '<td style="font-size:12px">' + modelos + '</td>' +
      '<td>' + (m.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarMaterial(' + m.id + ')">✏️</button> <button class="btn-icon" onclick="raToggleMaterial(' + m.id + ',' + !m.ativo + ')">' + (m.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

window.raNovoMaterial = function(prefill) {
  var m = prefill || {};
  raModal('Novo Material Técnico',
    '<div class="field"><label>Título</label><input id="ra-mat-titulo" class="search-input" style="width:100%" placeholder="Ex: Instalação AR G2" value="' + (m.titulo || '') + '"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Tipo</label><select id="ra-mat-tipo" class="filter-select" style="width:100%" onchange="raMatTipoChange()"><option value="video"' + (m.tipo === 'video' ? ' selected' : '') + '>🎥 Vídeo (URL)</option><option value="pdf"' + (m.tipo === 'pdf' ? ' selected' : '') + '>📄 PDF (upload)</option><option value="imagem"' + (m.tipo === 'imagem' ? ' selected' : '') + '>🖼️ Imagem (upload)</option><option value="link"' + (m.tipo === 'link' ? ' selected' : '') + '>🔗 Link (URL)</option></select></div>' +
      '<div class="field"><label>Ordem</label><input id="ra-mat-ordem" class="search-input" style="width:100%" type="number" value="' + (m.ordem || 0) + '"></div>' +
    '</div>' +
    '<div id="ra-mat-url-area" class="field"><label>URL</label><input id="ra-mat-url" class="search-input" style="width:100%" placeholder="https://..." value="' + (m.url || '') + '"></div>' +
    '<div id="ra-mat-upload-area" class="field" style="display:none"><label>Upload arquivo</label><input type="file" id="ra-mat-file" accept=".pdf,.png,.jpg,.jpeg,.webp" style="font-size:13px"><div id="ra-mat-upload-status" style="font-size:12px;margin-top:4px"></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-mat-linha-new" class="filter-select" style="width:100%" onchange="raAtualizarCheckboxesModelo(\'mat\')"><option value="">Geral</option><option value="geladeira"' + (m.linha_produto === 'geladeira' ? ' selected' : '') + '>Geladeira</option><option value="ar_condicionado"' + (m.linha_produto === 'ar_condicionado' ? ' selected' : '') + '>AR Condicionado</option><option value="gerador"' + (m.linha_produto === 'gerador' ? ' selected' : '') + '>Gerador</option></select></div>' +
      '<div class="field"><label>Categoria</label><input id="ra-mat-cat" class="search-input" style="width:100%" placeholder="Ex: Instalação, Manutenção..." value="' + (m.categoria || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Modelos aplicáveis</label><div id="ra-mat-checkboxes" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>' +
    '<div class="field"><label>Descrição (opcional)</label><textarea id="ra-mat-desc" class="search-input" style="width:100%;height:60px;resize:vertical" placeholder="Breve descrição...">' + (m.descricao || '') + '</textarea></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarMaterial()">Salvar</button>');
  window._matAplic = Array.isArray(m.aplicacao_modelos) ? m.aplicacao_modelos.slice() : [];
  raAtualizarCheckboxesModelo('mat');
  raMatTipoChange();
};

window.raMatTipoChange = function() {
  var tipo = document.getElementById('ra-mat-tipo')?.value;
  var urlArea = document.getElementById('ra-mat-url-area');
  var uploadArea = document.getElementById('ra-mat-upload-area');
  if (tipo === 'pdf' || tipo === 'imagem') {
    urlArea.style.display = 'none';
    uploadArea.style.display = 'block';
  } else {
    urlArea.style.display = 'block';
    uploadArea.style.display = 'none';
  }
};

window.raSalvarMaterial = async function(id) {
  var tipo = document.getElementById('ra-mat-tipo').value;
  var url = document.getElementById('ra-mat-url').value.trim();
  // Se é upload, fazer upload primeiro
  if ((tipo === 'pdf' || tipo === 'imagem') && !id) {
    var file = document.getElementById('ra-mat-file')?.files[0];
    if (!file && !url) { alert('Selecione um arquivo para upload'); return; }
    if (file) {
      var status = document.getElementById('ra-mat-upload-status');
      status.textContent = 'Enviando...';
      var ext = file.name.split('.').pop().toLowerCase();
      var path = 'mat-' + Date.now() + '.' + ext;
      var r = await fetch(SB_URL + '/storage/v1/object/prt-materiais/' + path, {
        method: 'POST', headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': file.type}, body: file
      });
      if (!r.ok) { status.textContent = 'Erro no upload!'; return; }
      url = SB_URL + '/storage/v1/object/public/prt-materiais/' + path;
      status.textContent = '✅ Upload concluído';
    }
  }
  var d = {
    titulo: document.getElementById('ra-mat-titulo').value.trim(),
    url: url,
    tipo: tipo,
    linha_produto: document.getElementById('ra-mat-linha-new').value || null,
    categoria: document.getElementById('ra-mat-cat').value.trim() || null,
    modelo: (window._matAplic || []).join(', ') || null,
    ordem: parseInt(document.getElementById('ra-mat-ordem').value) || 0,
    descricao: document.getElementById('ra-mat-desc').value.trim() || null
  };
  if (!d.titulo || !d.url) { alert('Preencha título e URL/arquivo'); return; }
  if (id) { await raPatch('prt_materiais', 'id=eq.' + id, d); }
  else { await raPost('prt_materiais', d); }
  raLog('ACAO', 'material', id ? 'EDITAR_MATERIAL' : 'CRIAR_MATERIAL', String(id || ''), d.titulo);
  document.getElementById('ra-modal')?.remove();
  raCarregarMateriais();
};

window.raEditarMaterial = function(id) {
  var m = _raMateriais.find(function(x) { return x.id === id; });
  if (!m) return;
  raNovoMaterial(m);
  document.querySelector('.modal-title').textContent = 'Editar Material';
  var btns = document.querySelectorAll('.modal .btn-primary');
  btns[btns.length - 1].setAttribute('onclick', 'raSalvarMaterial(' + id + ')');
};

window.raToggleMaterial = async function(id, ativo) {
  await raPatch('prt_materiais', 'id=eq.' + id, { ativo: ativo });
  raLog('ACAO', 'material', ativo ? 'ATIVAR_MATERIAL' : 'DESATIVAR_MATERIAL', String(id));
  raCarregarMateriais();
};

// ═══════════════════════════════════════
// 7. CONFIGURAÇÕES — CRUD Categorias de Serviço
// ═══════════════════════════════════════
var _raCfgCategorias = [];

window.raCfgCarregar = async function() {
  var linha = document.getElementById('ra-cfg-linha')?.value || '';
  var url = 'prt_categorias_servico?order=linha_produto.asc,ordem.asc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raCfgCategorias = await raFetch(url);
  if (!Array.isArray(_raCfgCategorias)) _raCfgCategorias = [];
  // contar serviços por categoria
  var servicos = await raFetch('prt_tabela_servicos?select=categoria_id');
  if (!Array.isArray(servicos)) servicos = [];
  var contagem = {};
  servicos.forEach(function(s) { if (s.categoria_id) contagem[s.categoria_id] = (contagem[s.categoria_id] || 0) + 1; });

  var tbody = document.getElementById('ra-cfg-tbody');
  var linhaNomes = {geladeira:'Geladeira',ar_condicionado:'AR Condicionado',gerador:'Gerador'};
  document.getElementById('ra-cfg-count').textContent = _raCfgCategorias.length + ' categorias';

  if (!_raCfgCategorias.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma categoria cadastrada</td></tr>';
    return;
  }
  tbody.innerHTML = _raCfgCategorias.map(function(c) {
    var qtd = contagem[c.id] || 0;
    return '<tr>' +
      '<td style="text-align:center;font-weight:600">' + c.ordem + '</td>' +
      '<td style="font-weight:600">' + c.nome + '</td>' +
      '<td>' + (linhaNomes[c.linha_produto] || c.linha_produto) + '</td>' +
      '<td class="mono">STN-' + c.prefixo_codigo + '</td>' +
      '<td class="mono right" style="font-weight:700">' + raFmt(c.valor_teto) + '</td>' +
      '<td style="text-align:center">' + qtd + '</td>' +
      '<td>' + (c.ativo ? '<span class="badge badge-green">Ativa</span>' : '<span class="badge badge-gray">Inativa</span>') + '</td>' +
      '<td>' +
        '<button class="btn-icon" onclick="raCfgEditar(' + c.id + ')">✏️</button> ' +
        '<button class="btn-icon" onclick="raCfgToggle(' + c.id + ',' + !c.ativo + ')">' + (c.ativo ? '🚫' : '✅') + '</button>' +
      '</td></tr>';
  }).join('');
};

window.raCfgNovaCategoria = function(cat) {
  cat = cat || {};
  raModal(cat.id ? 'Editar Categoria' : 'Nova Categoria',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-cfg-linha-new" class="filter-select" style="width:100%">' +
        '<option value="geladeira"' + (cat.linha_produto === 'geladeira' ? ' selected' : '') + '>Geladeira</option>' +
        '<option value="ar_condicionado"' + (cat.linha_produto === 'ar_condicionado' ? ' selected' : '') + '>AR Condicionado</option>' +
        '<option value="gerador"' + (cat.linha_produto === 'gerador' ? ' selected' : '') + '>Gerador</option>' +
      '</select></div>' +
      '<div class="field"><label>Ordem</label><input id="ra-cfg-ordem" class="search-input" style="width:100%" type="number" min="1" value="' + (cat.ordem || _raCfgCategorias.length + 1) + '"></div>' +
    '</div>' +
    '<div class="field"><label>Nome da categoria</label><input id="ra-cfg-nome" class="search-input" style="width:100%" placeholder="Ex: Intervenções Elétricas" value="' + (cat.nome || '') + '"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Prefixo do código <span style="font-weight:400;color:var(--text-muted)">(2 letras, ex: GE)</span></label><input id="ra-cfg-prefixo" class="search-input" style="width:100%;text-transform:uppercase" maxlength="3" placeholder="GE" value="' + (cat.prefixo_codigo || '') + '"' + (cat.id ? ' readonly style="width:100%;background:var(--surface2);cursor:not-allowed;text-transform:uppercase"' : '') + '></div>' +
      '<div class="field"><label>Teto (R$)</label><input id="ra-cfg-teto" class="search-input" style="width:100%" type="number" step="0.01" value="' + (cat.valor_teto || '') + '"></div>' +
    '</div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raCfgSalvar(' + (cat.id || 0) + ')">Salvar</button>');
};

window.raCfgSalvar = async function(id) {
  var d = {
    linha_produto: document.getElementById('ra-cfg-linha-new').value,
    nome: document.getElementById('ra-cfg-nome').value.trim(),
    prefixo_codigo: document.getElementById('ra-cfg-prefixo').value.trim().toUpperCase(),
    valor_teto: parseFloat(document.getElementById('ra-cfg-teto').value) || 0,
    ordem: parseInt(document.getElementById('ra-cfg-ordem').value) || 1
  };
  if (!d.nome) { alert('Preencha o nome da categoria'); return; }
  if (!d.prefixo_codigo || d.prefixo_codigo.length < 2) { alert('Prefixo precisa ter ao menos 2 letras'); return; }
  // slug a partir do nome normalizado
  d.slug = d.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  if (id) {
    await raPatch('prt_categorias_servico', 'id=eq.' + id, d);
    // atualizar teto nos serviços vinculados
    await raPatch('prt_tabela_servicos', 'categoria_id=eq.' + id, { categoria: d.slug, teto_categoria: d.valor_teto });
    raLog('ACAO','prt_categorias_servico','EDITAR_CATEGORIA',String(id),d.nome,d);
  } else {
    await raPost('prt_categorias_servico', d);
    raLog('ACAO','prt_categorias_servico','CRIAR_CATEGORIA',null,d.nome,d);
  }
  document.getElementById('ra-modal')?.remove();
  raCfgCarregar();
};

window.raCfgEditar = function(id) {
  var c = _raCfgCategorias.find(function(x) { return x.id === id; });
  if (!c) return;
  raCfgNovaCategoria(c);
};

window.raCfgToggle = async function(id, ativo) {
  await raPatch('prt_categorias_servico', 'id=eq.' + id, { ativo: ativo });
  raLog('ACAO','prt_categorias_servico',ativo?'ATIVAR_CATEGORIA':'DESATIVAR_CATEGORIA',String(id));
  raCfgCarregar();
};

// ═══════════════════════════════════════
// SISTEMA DE LOGS — padrão Bononi
// ═══════════════════════════════════════
function raLog(tipo, entidade, acao, idEntidade, nomeEntidade, extra) {
  var usr = window.getUsuario ? window.getUsuario() : {};
  var payload = {
    tipo: tipo, nivel: tipo === 'ERRO' ? 'ERROR' : 'INFO',
    modulo: 'rede-autorizada', acao: acao,
    usuario_email: usr.email || null, usuario_nome: usr.nome || null,
    entidade: entidade, id_entidade: idEntidade || null, nome_entidade: nomeEntidade || null,
    contexto: extra || null, url: window.location.href, user_agent: navigator.userAgent
  };
  fetch(SB_URL + '/rest/v1/prt_logs', {
    method: 'POST', headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  }).catch(function(e) { console.error('Log falhou:', e); });
}

