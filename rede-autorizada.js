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
  raCarregarOS();
};

window.raAprovarOS = async function(id) {
  if (!confirm('Confirma aprovação desta OS?')) return;
  await raPatch('prt_ordens_servico', 'id=eq.' + id, { status: 'aprovada', data_aprovacao: new Date().toISOString(), aprovado_por: (window.getUsuario() || {}).nome || 'gestor' });
  document.getElementById('ra-modal')?.remove();
  raCarregarOS();
};

window.raRecusarOS = function(id) {
  raModal('Recusar OS', '<div class="field"><label>Motivo da recusa</label><textarea id="ra-motivo-recusa" class="search-input" style="width:100%;height:80px;resize:vertical" placeholder="Explique o motivo da recusa..."></textarea></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-danger" onclick="raConfirmarRecusa(' + id + ')">Confirmar recusa</button>');
};

window.raConfirmarRecusa = async function(id) {
  var motivo = document.getElementById('ra-motivo-recusa').value.trim();
  if (!motivo) { alert('Informe o motivo'); return; }
  await raPatch('prt_ordens_servico', 'id=eq.' + id, { status: 'recusada', motivo_recusa: motivo });
  document.getElementById('ra-modal')?.remove();
  raCarregarOS();
};

// ═══════════════════════════════════════
// 2. SERVIÇOS — CRUD
// ═══════════════════════════════════════
var _raServicos = [];
window.raCarregarServicos = async function() {
  var linha = document.getElementById('ra-srv-linha')?.value || '';
  var url = 'prt_tabela_servicos?order=codigo.asc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raServicos = await raFetch(url);
  if (!Array.isArray(_raServicos)) _raServicos = [];
  var tbody = document.getElementById('ra-srv-tbody');
  var linhaNomes = {geladeira:'Geladeira',ar_condicionado:'AR Condicionado',gerador:'Gerador'};
  if (!_raServicos.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum serviço cadastrado</td></tr>'; return; }
  tbody.innerHTML = _raServicos.map(function(s) {
    return '<tr>' +
      '<td class="mono" style="font-weight:600">' + s.codigo + '</td>' +
      '<td>' + s.descricao + '</td>' +
      '<td>' + (linhaNomes[s.linha_produto] || s.linha_produto) + '</td>' +
      '<td><span class="badge badge-blue">' + s.categoria + '</span></td>' +
      '<td class="mono right">' + raFmt(s.valor) + '</td>' +
      '<td class="mono right">' + raFmt(s.teto_categoria) + '</td>' +
      '<td>' + (s.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarServico(' + s.id + ')">✏️</button> <button class="btn-icon" onclick="raToggleServico(' + s.id + ',' + !s.ativo + ')">' + (s.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

window.raNovoServico = function() {
  raModal('Novo Serviço',
    '<div class="field"><label>Código</label><input id="ra-srv-codigo" class="search-input" style="width:100%" placeholder="STN-XX00"></div>' +
    '<div class="field"><label>Descrição</label><input id="ra-srv-desc" class="search-input" style="width:100%" placeholder="Descrição do serviço"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-srv-linha-new" class="filter-select" style="width:100%"><option value="geladeira">Geladeira</option><option value="ar_condicionado">AR Condicionado</option><option value="gerador">Gerador</option></select></div>' +
      '<div class="field"><label>Categoria</label><select id="ra-srv-cat" class="filter-select" style="width:100%"><option value="eletrica">Elétrica</option><option value="frigorifico">Frigorífico</option><option value="outros">Outros</option><option value="outros_servicos">Outros Serviços</option></select></div>' +
      '<div class="field"><label>Valor (R$)</label><input id="ra-srv-valor" class="search-input" style="width:100%" type="number" step="0.01"></div>' +
      '<div class="field"><label>Teto Categoria (R$)</label><input id="ra-srv-teto" class="search-input" style="width:100%" type="number" step="0.01"></div>' +
    '</div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarServico()">Salvar</button>');
};

window.raSalvarServico = async function(id) {
  var d = {
    codigo: document.getElementById('ra-srv-codigo').value.trim(),
    descricao: document.getElementById('ra-srv-desc').value.trim(),
    linha_produto: document.getElementById('ra-srv-linha-new').value,
    categoria: document.getElementById('ra-srv-cat').value,
    valor: parseFloat(document.getElementById('ra-srv-valor').value) || 0,
    teto_categoria: parseFloat(document.getElementById('ra-srv-teto').value) || 0
  };
  if (!d.codigo || !d.descricao) { alert('Preencha código e descrição'); return; }
  if (id) { await raPatch('prt_tabela_servicos', 'id=eq.' + id, d); }
  else { await raPost('prt_tabela_servicos', d); }
  document.getElementById('ra-modal')?.remove();
  raCarregarServicos();
};

window.raEditarServico = function(id) {
  var s = _raServicos.find(function(x) { return x.id === id; });
  if (!s) return;
  raNovoServico();
  document.querySelector('.modal-title').textContent = 'Editar Serviço';
  document.getElementById('ra-srv-codigo').value = s.codigo;
  document.getElementById('ra-srv-desc').value = s.descricao;
  document.getElementById('ra-srv-linha-new').value = s.linha_produto;
  document.getElementById('ra-srv-cat').value = s.categoria;
  document.getElementById('ra-srv-valor').value = s.valor;
  document.getElementById('ra-srv-teto').value = s.teto_categoria;
  // trocar onclick do botão salvar
  var btns = document.querySelectorAll('.modal .btn-primary');
  btns[btns.length - 1].setAttribute('onclick', 'raSalvarServico(' + id + ')');
};

window.raToggleServico = async function(id, ativo) {
  await raPatch('prt_tabela_servicos', 'id=eq.' + id, { ativo: ativo });
  raCarregarServicos();
};

// ═══════════════════════════════════════
// 3. PEÇAS — CRUD
// ═══════════════════════════════════════
var _raPecas = [];
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

window.raNovaPeca = function() {
  raModal('Nova Peça',
    '<div class="field"><label>Referência (código ERP)</label><input id="ra-pec-ref" class="search-input" style="width:100%" placeholder="016186"></div>' +
    '<div class="field"><label>Nome</label><input id="ra-pec-nome" class="search-input" style="width:100%" placeholder="União c/ válvula Schrader"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-pec-linha-new" class="filter-select" style="width:100%"><option value="geladeira">Geladeira</option><option value="ar_condicionado">AR Condicionado</option><option value="gerador">Gerador</option></select></div>' +
      '<div class="field"><label>Custo (R$)</label><input id="ra-pec-custo" class="search-input" style="width:100%" type="number" step="0.01"></div>' +
    '</div>' +
    '<div class="field"><label>Aplicação (modelos — separar por vírgula)</label><input id="ra-pec-aplic" class="search-input" style="width:100%" placeholder="ADV 40L, ADV 45L, ST 30L"></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarPeca()">Salvar</button>');
};

window.raSalvarPeca = async function(id) {
  var aplic = document.getElementById('ra-pec-aplic').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  var d = {
    referencia: document.getElementById('ra-pec-ref').value.trim(),
    nome: document.getElementById('ra-pec-nome').value.trim(),
    linha_produto: document.getElementById('ra-pec-linha-new').value,
    custo_unitario: parseFloat(document.getElementById('ra-pec-custo').value) || null,
    aplicacao: aplic.length ? aplic : []
  };
  if (!d.referencia || !d.nome) { alert('Preencha referência e nome'); return; }
  if (id) { await raPatch('prt_pecas_catalogo', 'id=eq.' + id, d); }
  else { await raPost('prt_pecas_catalogo', d); }
  document.getElementById('ra-modal')?.remove();
  raCarregarPecas();
};

window.raEditarPeca = function(id) {
  var p = _raPecas.find(function(x) { return x.id === id; });
  if (!p) return;
  raNovaPeca();
  document.querySelector('.modal-title').textContent = 'Editar Peça';
  document.getElementById('ra-pec-ref').value = p.referencia;
  document.getElementById('ra-pec-nome').value = p.nome;
  document.getElementById('ra-pec-linha-new').value = p.linha_produto;
  document.getElementById('ra-pec-custo').value = p.custo_unitario || '';
  document.getElementById('ra-pec-aplic').value = Array.isArray(p.aplicacao) ? p.aplicacao.join(', ') : '';
  var btns = document.querySelectorAll('.modal .btn-primary');
  btns[btns.length - 1].setAttribute('onclick', 'raSalvarPeca(' + id + ')');
};

window.raTogglePeca = async function(id, ativo) {
  await raPatch('prt_pecas_catalogo', 'id=eq.' + id, { ativo: ativo });
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
    return '<tr>' +
      '<td><a href="' + m.url + '" target="_blank" style="color:var(--blue-mid)">' + m.titulo + '</a></td>' +
      '<td>' + (tipoIcon[m.tipo] || '') + ' ' + m.tipo + '</td>' +
      '<td>' + (linhaNomes[m.linha_produto] || m.linha_produto || 'Geral') + '</td>' +
      '<td>' + (m.modelo || 'Todos') + '</td>' +
      '<td>' + (m.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarMaterial(' + m.id + ')">✏️</button> <button class="btn-icon" onclick="raToggleMaterial(' + m.id + ',' + !m.ativo + ')">' + (m.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

window.raNovoMaterial = function() {
  raModal('Novo Material Técnico',
    '<div class="field"><label>Título</label><input id="ra-mat-titulo" class="search-input" style="width:100%" placeholder="Ex: Instalação AR G2"></div>' +
    '<div class="field"><label>URL (YouTube, PDF, link)</label><input id="ra-mat-url" class="search-input" style="width:100%" placeholder="https://..."></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Tipo</label><select id="ra-mat-tipo" class="filter-select" style="width:100%"><option value="video">Vídeo</option><option value="pdf">PDF</option><option value="imagem">Imagem</option><option value="link">Link</option></select></div>' +
      '<div class="field"><label>Linha</label><select id="ra-mat-linha-new" class="filter-select" style="width:100%"><option value="">Geral</option><option value="geladeira">Geladeira</option><option value="ar_condicionado">AR Condicionado</option><option value="gerador">Gerador</option></select></div>' +
      '<div class="field"><label>Modelo (opcional)</label><input id="ra-mat-modelo" class="search-input" style="width:100%" placeholder="ADV 40L, G2..."></div>' +
      '<div class="field"><label>Ordem</label><input id="ra-mat-ordem" class="search-input" style="width:100%" type="number" value="0"></div>' +
    '</div>' +
    '<div class="field"><label>Descrição (opcional)</label><textarea id="ra-mat-desc" class="search-input" style="width:100%;height:60px;resize:vertical" placeholder="Breve descrição..."></textarea></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarMaterial()">Salvar</button>');
};

window.raSalvarMaterial = async function(id) {
  var d = {
    titulo: document.getElementById('ra-mat-titulo').value.trim(),
    url: document.getElementById('ra-mat-url').value.trim(),
    tipo: document.getElementById('ra-mat-tipo').value,
    linha_produto: document.getElementById('ra-mat-linha-new').value || null,
    modelo: document.getElementById('ra-mat-modelo').value.trim() || null,
    ordem: parseInt(document.getElementById('ra-mat-ordem').value) || 0,
    descricao: document.getElementById('ra-mat-desc').value.trim() || null
  };
  if (!d.titulo || !d.url) { alert('Preencha título e URL'); return; }
  if (id) { await raPatch('prt_materiais', 'id=eq.' + id, d); }
  else { await raPost('prt_materiais', d); }
  document.getElementById('ra-modal')?.remove();
  raCarregarMateriais();
};

window.raEditarMaterial = function(id) {
  var m = _raMateriais.find(function(x) { return x.id === id; });
  if (!m) return;
  raNovoMaterial();
  document.querySelector('.modal-title').textContent = 'Editar Material';
  document.getElementById('ra-mat-titulo').value = m.titulo;
  document.getElementById('ra-mat-url').value = m.url;
  document.getElementById('ra-mat-tipo').value = m.tipo;
  document.getElementById('ra-mat-linha-new').value = m.linha_produto || '';
  document.getElementById('ra-mat-modelo').value = m.modelo || '';
  document.getElementById('ra-mat-ordem').value = m.ordem || 0;
  document.getElementById('ra-mat-desc').value = m.descricao || '';
  var btns = document.querySelectorAll('.modal .btn-primary');
  btns[btns.length - 1].setAttribute('onclick', 'raSalvarMaterial(' + id + ')');
};

window.raToggleMaterial = async function(id, ativo) {
  await raPatch('prt_materiais', 'id=eq.' + id, { ativo: ativo });
  raCarregarMateriais();
};
