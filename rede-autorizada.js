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
      </select>
      <button class="btn btn-secondary btn-sm" onclick="raAbrirModalPdfServicos()">📄 Gerar PDF</button>
      <button class="btn btn-primary btn-sm" onclick="raNovoServico()">+ Novo serviço</button>
    </div>
  </div>
  <div class="table-card">
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Código</th><th>Descrição</th><th>Linha</th><th>Categoria</th><th>Valor</th><th>Teto</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-srv-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
  </div>
</div>`,

'ra-pecas': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Peças</div>
  </div>
  <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:0;overflow-x:auto">
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2)" id="ra-pec-tab-estoque" onclick="raPecTab('estoque')">📦 Estoque parceiro</button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2);position:relative" id="ra-pec-tab-compras" onclick="raPecTab('compras')">🛒 Compras parceiro <span id="ra-badge-compras" style="display:none;background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:4px;min-width:16px;text-align:center"></span></button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--primary);color:#fff;position:relative" id="ra-pec-tab-reposicao" onclick="raPecTab('reposicao')">🔄 Reposição garantia <span id="ra-badge-reposicao" style="display:none;background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:4px;min-width:16px;text-align:center"></span></button>
  </div>
  <div id="ra-pec-content"></div>
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

'ra-config': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Configurações</div>
  </div>
  <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:0;overflow-x:auto">
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--primary);color:#fff" id="ra-cfg-tab-servicos" onclick="raCfgTab('servicos')">🔧 Serviços</button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2)" id="ra-cfg-tab-pecas" onclick="raCfgTab('pecas')">⚙ Peças</button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2)" id="ra-cfg-tab-materiais" onclick="raCfgTab('materiais')">📚 Materiais</button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2)" id="ra-cfg-tab-linhas" onclick="raCfgTab('linhas')">📦 Linhas e Modelos</button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2)" id="ra-cfg-tab-financeiro" onclick="raCfgTab('financeiro')">💰 Financeiro</button>
    <button class="btn btn-sm" style="border-radius:8px 8px 0 0;border:1px solid var(--border);border-bottom:none;background:var(--surface2)" id="ra-cfg-tab-empresa" onclick="raCfgTab('empresa')">🏢 Empresa</button>
  </div>
  <div id="ra-cfg-content"></div>
</div>`,

'ra-parceiros': `<div class="page-content active" style="padding:20px 24px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
    <div class="section-title" style="margin:0">Parceiros Autorizados</div>
    <div style="display:flex;gap:8px">
      <input class="search-input" id="ra-parc-busca" placeholder="Buscar parceiro..." oninput="raFiltrarParceiros()" style="width:200px">
      <button class="btn btn-primary btn-sm" onclick="raCredenciarNovo()">⭐ Credenciar novo</button>
    </div>
  </div>
  <div class="cards-grid cards-grid-3" id="ra-parc-kpis"></div>
  <div class="table-card">
    <div class="table-card-header"><span class="table-card-title">Autorizadas ativas</span><span id="ra-parc-count" style="font-size:12px;color:var(--text-muted)"></span></div>
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Parceiro</th><th>Cidade/UF</th><th>Responsável</th><th>WhatsApp</th><th>Login</th><th>Senha</th><th>Credenciado em</th><th></th></tr></thead><tbody id="ra-parc-tbody"><tr><td colspan="8" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>
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
      case 'ra-pecas':      raPecTab('reposicao'); break;
      case 'ra-pagamentos': raCarregarPagamentos(); break;
      case 'ra-config':     raCfgTab('servicos'); break;
      case 'ra-parceiros':  raCarregarParceiros(); break;
    }
    raAtualizarBadgesPecas();
  }
};

// ═══ HELPERS ═══
var SB_URL = 'https://vishxwdxqiygbxmtpfoy.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc2h4d2R4cWl5Z2J4bXRwZm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njg2MjIsImV4cCI6MjA4ODA0NDYyMn0.J647m3ieDHahNQYBWMRESl0aPFXsT_zt_7ZcDvyB-SA';

// ═══ BADGES DE ALERTA — PEÇAS ═══
async function raAtualizarBadgesPecas() {
  try {
    // Contar reposições pendentes
    var repResp = await fetch(SB_URL + '/rest/v1/prt_reposicao_pecas?status=eq.pendente&select=id', {
      headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Prefer': 'count=exact', 'Range': '0-0'}
    });
    var repCount = parseInt(repResp.headers.get('content-range')?.split('/')[1]) || 0;

    // Contar compras pendentes
    var cprResp = await fetch(SB_URL + '/rest/v1/prt_compras_pecas?status=eq.pendente&select=id', {
      headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Prefer': 'count=exact', 'Range': '0-0'}
    });
    var cprCount = parseInt(cprResp.headers.get('content-range')?.split('/')[1]) || 0;

    // Badge da sub-aba Reposição
    var badgeRep = document.getElementById('ra-badge-reposicao');
    if (badgeRep) {
      if (repCount > 0) { badgeRep.textContent = repCount; badgeRep.style.display = 'inline-block'; }
      else { badgeRep.style.display = 'none'; }
    }

    // Badge da sub-aba Compras
    var badgeCpr = document.getElementById('ra-badge-compras');
    if (badgeCpr) {
      if (cprCount > 0) { badgeCpr.textContent = cprCount; badgeCpr.style.display = 'inline-block'; }
      else { badgeCpr.style.display = 'none'; }
    }

    // Badge na sidebar "Peças" — total pendentes
    var totalPend = repCount + cprCount;
    var navPecas = document.querySelector('a[data-pagina="ra-pecas"]');
    if (navPecas) {
      var existBadge = navPecas.querySelector('.ra-nav-badge');
      if (totalPend > 0) {
        if (!existBadge) {
          existBadge = document.createElement('span');
          existBadge.className = 'ra-nav-badge';
          existBadge.style.cssText = 'background:#ef4444;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:auto;min-width:16px;text-align:center;line-height:16px';
          navPecas.appendChild(existBadge);
        }
        existBadge.textContent = totalPend;
      } else if (existBadge) {
        existBadge.remove();
      }
    }
  } catch(e) { console.error('Badge pecas:', e); }
}
// Atualizar badges ao carregar o módulo e a cada 60s
setInterval(raAtualizarBadgesPecas, 60000);
setTimeout(raAtualizarBadgesPecas, 2000);

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
function raEsc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function raDate(d) { if (!d) return '—'; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); if (m) return m[3] + '/' + m[2] + '/' + m[1]; return new Date(d).toLocaleDateString('pt-BR'); }
function raToast(msg) { alert(msg); } // simplificado — usa o toast do index se existir
function raModal(title, bodyHtml, footerHtml, size) {
  var el = document.createElement('div');
  el.className = 'modal-overlay';
  el.id = 'ra-modal';
  el.onclick = function(e) { if (e.target === el) el.remove(); };
  var modalW = size === 'lg' ? 'max-width:900px' : '';
  el.innerHTML = '<div class="modal" style="' + modalW + '"><div class="modal-header"><span class="modal-title">' + title + '</span><button class="btn-icon" onclick="document.getElementById(\'ra-modal\').remove()">✕</button></div><div class="modal-body">' + bodyHtml + '</div>' + (footerHtml ? '<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">' + footerHtml + '</div>' : '') + '</div>';
  document.body.appendChild(el);
}

// ═══════════════════════════════════════
// LINHAS E MODELOS — dinâmicos (prt_linhas_produto / prt_modelos_produto)
// Antes hardcoded em selects e em MODELOS_POR_LINHA. Agora vêm do banco, com cache.
// ═══════════════════════════════════════
var _raLinhas = null;   // cache: [{id, slug, nome, nome_curto, ordem, ativo}]
var _raModelos = null;  // cache: [{id, linha_id, nome, ordem, ativo}]

async function raGetLinhas(incluirInativas) {
  if (!_raLinhas) {
    var l = await raFetch('prt_linhas_produto?order=ordem.asc,nome.asc&select=*');
    _raLinhas = Array.isArray(l) ? l : [];
  }
  return incluirInativas ? _raLinhas : _raLinhas.filter(function(x) { return x.ativo; });
}

async function raGetModelos(incluirInativos) {
  if (!_raModelos) {
    var m = await raFetch('prt_modelos_produto?order=ordem.asc,nome.asc&select=*');
    _raModelos = Array.isArray(m) ? m : [];
  }
  return incluirInativos ? _raModelos : _raModelos.filter(function(x) { return x.ativo; });
}

function raInvalidarLinhasCache() { _raLinhas = null; _raModelos = null; }

// Nome de exibição a partir do slug (usa cache já carregado; fallback = slug)
function raLinhaNome(slug) {
  var l = (_raLinhas || []).find(function(x) { return x.slug === slug; });
  return l ? l.nome : (slug || '');
}
function raLinhaNomeCurto(slug) {
  var l = (_raLinhas || []).find(function(x) { return x.slug === slug; });
  return l ? (l.nome_curto || l.nome) : (slug || '');
}

// Resolve o slug a partir de um valor gravado na OS (pode vir como nome de exibição ou como slug)
async function raLinhaSlugDe(valor) {
  if (!valor) return '';
  var linhas = await raGetLinhas(true);
  var v = String(valor).toLowerCase();
  var l = linhas.find(function(x) { return x.slug.toLowerCase() === v || (x.nome || '').toLowerCase() === v; });
  return l ? l.slug : '';
}

// Nomes dos modelos ativos de uma linha (por slug)
async function raModelosDaLinha(slug) {
  var linhas = await raGetLinhas(true);
  var l = linhas.find(function(x) { return x.slug === slug; });
  if (!l) return [];
  var mods = await raGetModelos();
  return mods.filter(function(m) { return m.linha_id === l.id; }).map(function(m) { return m.nome; });
}

// Popula um <select> de linhas preservando o valor atual (seguro para chamadas repetidas)
async function raPopularSelectLinhas(elId, placeholder) {
  var el = document.getElementById(elId);
  if (!el) return;
  var linhas = await raGetLinhas();
  var atual = el.value;
  var html = (placeholder !== undefined ? '<option value="">' + placeholder + '</option>' : '') +
    linhas.map(function(l) { return '<option value="' + l.slug + '">' + raEsc(l.nome) + '</option>'; }).join('');
  if (el.getAttribute('data-linhas-html') !== html) {
    el.innerHTML = html;
    el.setAttribute('data-linhas-html', html);
  }
  if (atual && el.querySelector('option[value="' + atual + '"]')) el.value = atual;
}

// Options de linhas para montar select em modal (com selecionada)
async function raLinhaOptionsHtml(selecionada, placeholder) {
  var linhas = await raGetLinhas();
  return (placeholder !== undefined ? '<option value="">' + placeholder + '</option>' : '') +
    linhas.map(function(l) {
      return '<option value="' + l.slug + '"' + (l.slug === selecionada ? ' selected' : '') + '>' + raEsc(l.nome) + '</option>';
    }).join('');
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
      '<td>' + raEsc(o.cliente_nome) + '</td>' +
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
  var parcCidade = o.assist_parceiros ? (o.assist_parceiros.cidade || '') + '/' + (o.assist_parceiros.uf || '') : '';
  // Carregar serviços detalhados da OS
  var servicosOS = [];
  try { servicosOS = await raFetch('prt_os_servicos?os_id=eq.' + id + '&select=*'); if (!Array.isArray(servicosOS)) servicosOS = []; } catch(e) {}
  // Carregar peças da OS
  var pecasOS = [];
  try { pecasOS = await raFetch('prt_os_pecas?os_id=eq.' + id + '&select=*'); if (!Array.isArray(pecasOS)) pecasOS = []; } catch(e) {}
  // Carregar teto do produto
  var tetoProduto = 0;
  try {
    var linhaSlug = await raLinhaSlugDe(o.produto_linha) || o.produto_linha || '';
    if (linhaSlug) {
      var tp = await raFetch('prt_teto_produto?linha_produto=eq.' + linhaSlug + '&select=valor_maximo');
      if (Array.isArray(tp) && tp.length) tetoProduto = parseFloat(tp[0].valor_maximo) || 0;
    }
  } catch(e) {}

  // ─── CABEÇALHO: Protocolo + Status ───
  var statusBadge = { enviada: 'badge-blue', aprovada: 'badge-green', recusada: 'badge-red', paga: 'badge-purple', rascunho: 'badge-gray' };
  var body = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="font-size:20px;font-weight:700;color:var(--text)">' + (o.protocolo || '#' + o.id) + '</div><span class="badge ' + (statusBadge[o.status] || 'badge-gray') + '">' + (o.status || '').toUpperCase() + '</span></div>';

  // ─── DADOS DO PARCEIRO ───
  body += '<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;font-size:13px">' +
    '<div style="font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">PARCEIRO AUTORIZADO</div>' +
    '<div style="font-weight:600">' + raEsc(parc) + '</div>' +
    (parcCidade ? '<div style="color:var(--text-muted);font-size:12px">' + raEsc(parcCidade) + '</div>' : '') + '</div>';

  // ─── DADOS DO CLIENTE ───
  body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:12px;background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px">' +
    '<div style="grid-column:span 2;font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase">CLIENTE</div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Nome</span><div style="font-weight:600">' + (raEsc(o.cliente_nome) || '-') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Telefone</span><div>' + (raEsc(o.cliente_telefone) || '-') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Cidade/UF</span><div>' + (o.cliente_cidade || '') + '/' + (o.cliente_uf || '') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">E-mail</span><div>' + (raEsc(o.cliente_email) || '-') + '</div></div>' +
    '</div>';

  // ─── PRODUTO ───
  body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:12px;background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px">' +
    '<div style="grid-column:span 2;font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase">PRODUTO</div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Linha</span><div style="font-weight:600">' + raEsc(o.produto_linha || '-') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Modelo</span><div style="font-weight:600">' + raEsc(o.produto_modelo || '-') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Nº Série</span><div>' + (o.numero_serie || '-') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">NF Compra</span><div>' + (o.numero_nf || '-') + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Data Compra</span><div>' + raDate(o.data_compra) + '</div></div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Data Serviço</span><div>' + raDate(o.data_servico) + '</div></div>' +
    '</div>';

  // ─── DIAGNÓSTICO ───
  body += '<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;font-size:13px">' +
    '<div style="font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">DIAGNÓSTICO</div>' +
    '<div style="margin-bottom:6px"><span style="color:var(--text-muted);font-size:11px">Cód. Erro:</span> <strong>' + (o.codigo_erro || '-') + '</strong></div>' +
    '<div style="margin-bottom:6px"><span style="color:var(--text-muted);font-size:11px">Defeito:</span> ' + (raEsc(o.defeito_descricao) || '-') + '</div>' +
    '<div style="margin-bottom:6px"><span style="color:var(--text-muted);font-size:11px">Diagnóstico:</span> ' + (raEsc(o.diagnostico) || '-') + '</div>' +
    '<div><span style="color:var(--text-muted);font-size:11px">Solução:</span> ' + ((o.solucao_tipo || '').replace(/_/g, ' ')) + '</div></div>';

  // ─── SERVIÇOS REALIZADOS (detalhados) ───
  body += '<div style="border:2px solid var(--primary);border-radius:var(--radius-sm);padding:12px;margin-bottom:12px">' +
    '<div style="font-weight:700;font-size:11px;color:var(--primary);text-transform:uppercase;margin-bottom:8px">SERVIÇOS REALIZADOS</div>';
  if (servicosOS.length) {
    // Agrupar por categoria
    var porCat = {};
    servicosOS.forEach(function(s) {
      var cn = s.categoria_nome || 'Serviços';
      if (!porCat[cn]) porCat[cn] = { items: [], catId: s.categoria_id };
      porCat[cn].items.push(s);
    });
    var somaRaw = 0;
    for (var catNome in porCat) {
      var g = porCat[catNome];
      var somaCat = g.items.reduce(function(s, x) { return s + (parseFloat(x.valor) || 0); }, 0);
      somaRaw += somaCat;
      // Buscar teto da categoria
      var tetoCat = 0;
      if (g.catId) {
        try {
          var catData = await raFetch('prt_categorias_servico?id=eq.' + g.catId + '&select=valor_teto');
          if (Array.isArray(catData) && catData.length) tetoCat = parseFloat(catData[0].valor_teto) || 0;
        } catch(e) {}
      }
      var catCapado = tetoCat > 0 && somaCat > tetoCat;
      body += '<div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-top:8px;margin-bottom:4px;display:flex;justify-content:space-between">' +
        '<span>' + raEsc(catNome) + '</span>' +
        (tetoCat ? '<span>teto ' + raFmt(tetoCat) + '</span>' : '') + '</div>';
      g.items.forEach(function(s) {
        body += '<div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:13px;border-bottom:1px solid #f0f0f0;align-items:center">' +
          '<div><span style="font-family:monospace;font-weight:700;color:var(--primary);font-size:11px;margin-right:8px">' + raEsc(s.codigo) + '</span>' + raEsc(s.descricao) + '</div>' +
          '<div style="font-weight:600;white-space:nowrap">' + raFmt(s.valor) + '</div></div>';
      });
      if (catCapado) {
        body += '<div style="text-align:right;font-size:12px;padding:2px 8px;color:var(--text-muted)">Soma: <span style="text-decoration:line-through">' + raFmt(somaCat) + '</span> → <strong style="color:var(--primary)">' + raFmt(tetoCat) + '</strong> (teto)</div>';
      }
    }
  } else if (o.codigo_servico) {
    body += '<div style="padding:4px 0;font-size:13px"><span style="font-weight:700">' + (o.codigo_servico || '-') + '</span></div>';
  }
  body += '</div>';

  // ─── VALOR TOTAL A PAGAR ───
  var valorFinal = parseFloat(o.valor_servico) || 0;
  body += '<div style="background:var(--primary-bg);border:2px solid var(--primary);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">' +
    '<div><div style="font-weight:700;font-size:11px;color:var(--primary);text-transform:uppercase">VALOR TOTAL A PAGAR</div>' +
    (tetoProduto ? '<div style="font-size:11px;color:var(--text-muted)">Teto do produto: ' + raFmt(tetoProduto) + '</div>' : '') + '</div>' +
    '<div style="font-size:24px;font-weight:800;color:var(--primary)">' + raFmt(valorFinal) + '</div></div>';

  // ─── PEÇAS UTILIZADAS ───
  if (pecasOS.length) {
    body += '<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px">' +
      '<div style="font-weight:700;font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px">PEÇAS UTILIZADAS (' + pecasOS.length + ')</div>';
    pecasOS.forEach(function(p) {
      body += '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid #e8e8e8"><span><strong>' + raEsc(p.referencia) + '</strong> — ' + raEsc(p.nome_peca) + '</span><span style="font-weight:600">x' + p.quantidade + '</span></div>';
    });
    body += '</div>';
  }

  // ─── FOTOS ───
  if (o.foto_nf || o.foto_equipamento) {
    body += '<div style="display:flex;gap:12px;margin-bottom:12px">';
    if (o.foto_nf) body += '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">FOTO NF</label><br><img src="' + o.foto_nf + '" style="max-width:200px;max-height:150px;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="window.open(\'' + o.foto_nf + '\')"></div>';
    if (o.foto_equipamento) body += '<div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">EQUIPAMENTO</label><br><img src="' + o.foto_equipamento + '" style="max-width:200px;max-height:150px;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="window.open(\'' + o.foto_equipamento + '\')"></div>';
    body += '</div>';
  }
  if (o.motivo_recusa) body += '<div class="alert alert-error" style="margin-top:12px"><strong>Motivo recusa:</strong> ' + raEsc(o.motivo_recusa) + '</div>';

  var footer = '<button class="btn btn-secondary" onclick="raImprimirOS(' + o.id + ')">🖨 Imprimir</button>';
  if (o.status === 'enviada') {
    footer += '<button class="btn btn-secondary" onclick="raEditarServicoOS(' + o.id + ')">✏️ Alterar serviço</button>' +
             '<button class="btn btn-danger" onclick="raRecusarOS(' + o.id + ')">Recusar</button>' +
             '<button class="btn btn-success" onclick="raAprovarOS(' + o.id + ')">✓ Aprovar</button>';
  } else if (o.status === 'aprovada') {
    footer += '<button class="btn btn-secondary" onclick="raEditarServicoOS(' + o.id + ')">✏️ Alterar serviço</button>';
  }
  raModal('OS ' + (o.protocolo || '#' + o.id), body, footer);
};

// ═══ IMPRIMIR OS ═══
window.raImprimirOS = async function(id) {
  var o = _raOS.find(function(x) { return x.id === id; });
  if (!o) return;
  var parc = o.assist_parceiros ? o.assist_parceiros.nome : '';
  var parcCidade = o.assist_parceiros ? (o.assist_parceiros.cidade || '') + '/' + (o.assist_parceiros.uf || '') : '';
  var servicosOS = [];
  try { servicosOS = await raFetch('prt_os_servicos?os_id=eq.' + id + '&select=*'); if (!Array.isArray(servicosOS)) servicosOS = []; } catch(e) {}
  var pecasOS = [];
  try { pecasOS = await raFetch('prt_os_pecas?os_id=eq.' + id + '&select=*'); if (!Array.isArray(pecasOS)) pecasOS = []; } catch(e) {}

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OS ' + (o.protocolo || '#' + o.id) + '</title><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:24px;color:#222;font-size:12px}' +
    '.header{text-align:center;border-bottom:3px solid #0B1426;padding-bottom:12px;margin-bottom:16px}' +
    '.header h1{font-size:22px;color:#0B1426;letter-spacing:2px}' +
    '.header .proto{font-size:16px;font-weight:700;margin-top:6px}' +
    '.header .status{display:inline-block;padding:2px 12px;border-radius:10px;font-size:11px;font-weight:700;margin-top:4px}' +
    '.section{margin-bottom:14px;border:1px solid #ddd;border-radius:4px;overflow:hidden}' +
    '.section-title{background:#0B1426;color:#fff;padding:6px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}' +
    '.section-body{padding:10px 12px}' +
    '.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}' +
    '.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 16px}' +
    '.field .lbl{font-size:9px;text-transform:uppercase;color:#888;font-weight:700}.field .val{font-size:12px}' +
    '.srv-table{width:100%;border-collapse:collapse}.srv-table th{text-align:left;font-size:9px;color:#888;padding:4px 8px;border-bottom:1px solid #ddd;text-transform:uppercase}' +
    '.srv-table td{padding:4px 8px;border-bottom:1px solid #eee;font-size:11px}.srv-table .cod{font-family:Consolas,monospace;font-weight:700;font-size:10px}' +
    '.srv-table .val{text-align:right;font-weight:700}' +
    '.cat-row{background:#f0f3f7;font-weight:700;font-size:10px}' +
    '.total-box{border:3px solid #0B1426;border-radius:6px;padding:14px 16px;margin-top:14px;display:flex;justify-content:space-between;align-items:center}' +
    '.total-box .label{font-size:12px;font-weight:700;text-transform:uppercase;color:#0B1426}.total-box .amount{font-size:28px;font-weight:800;color:#0B1426}' +
    '.footer{margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}' +
    '@media print{body{padding:12px}}' +
    '</style></head><body>';

  // Header
  var statusLabel = (o.status || '').toUpperCase();
  var statusColor = o.status === 'aprovada' ? '#065F46;background:#d1fae5' : o.status === 'recusada' ? '#991b1b;background:#fee2e2' : '#1e40af;background:#dbeafe';
  html += '<div class="header"><h1>STONNI</h1><div style="font-size:10px;color:#666">Rede de Assistência Técnica Autorizada</div>' +
    '<div class="proto">' + (o.protocolo || '#' + o.id) + '</div>' +
    '<span class="status" style="color:' + statusColor + '">' + statusLabel + '</span></div>';

  // Parceiro
  html += '<div class="section"><div class="section-title">Parceiro Autorizado</div><div class="section-body">' +
    '<strong>' + raEsc(parc) + '</strong>' + (parcCidade ? ' — ' + raEsc(parcCidade) : '') + '</div></div>';

  // Cliente
  html += '<div class="section"><div class="section-title">Cliente</div><div class="section-body"><div class="grid">' +
    '<div class="field"><div class="lbl">Nome</div><div class="val"><strong>' + (raEsc(o.cliente_nome) || '-') + '</strong></div></div>' +
    '<div class="field"><div class="lbl">Telefone</div><div class="val">' + (raEsc(o.cliente_telefone) || '-') + '</div></div>' +
    '<div class="field"><div class="lbl">Cidade/UF</div><div class="val">' + (o.cliente_cidade || '') + '/' + (o.cliente_uf || '') + '</div></div>' +
    '<div class="field"><div class="lbl">E-mail</div><div class="val">' + (raEsc(o.cliente_email) || '-') + '</div></div>' +
    '</div></div></div>';

  // Produto
  html += '<div class="section"><div class="section-title">Produto</div><div class="section-body"><div class="grid3">' +
    '<div class="field"><div class="lbl">Linha</div><div class="val"><strong>' + raEsc(o.produto_linha || '-') + '</strong></div></div>' +
    '<div class="field"><div class="lbl">Modelo</div><div class="val"><strong>' + raEsc(o.produto_modelo || '-') + '</strong></div></div>' +
    '<div class="field"><div class="lbl">Nº Série</div><div class="val">' + (o.numero_serie || '-') + '</div></div>' +
    '<div class="field"><div class="lbl">NF Compra</div><div class="val">' + (o.numero_nf || '-') + '</div></div>' +
    '<div class="field"><div class="lbl">Data Compra</div><div class="val">' + raDate(o.data_compra) + '</div></div>' +
    '<div class="field"><div class="lbl">Data Serviço</div><div class="val">' + raDate(o.data_servico) + '</div></div>' +
    '</div></div></div>';

  // Diagnóstico
  html += '<div class="section"><div class="section-title">Diagnóstico</div><div class="section-body">' +
    '<div class="grid" style="margin-bottom:6px">' +
    '<div class="field"><div class="lbl">Cód. Erro</div><div class="val"><strong>' + (o.codigo_erro || '-') + '</strong></div></div>' +
    '<div class="field"><div class="lbl">Solução</div><div class="val">' + ((o.solucao_tipo || '').replace(/_/g, ' ')) + '</div></div></div>' +
    '<div class="field" style="margin-bottom:4px"><div class="lbl">Defeito</div><div class="val">' + (raEsc(o.defeito_descricao) || '-') + '</div></div>' +
    '<div class="field"><div class="lbl">Diagnóstico</div><div class="val">' + (raEsc(o.diagnostico) || '-') + '</div></div>' +
    '</div></div>';

  // Serviços
  html += '<div class="section"><div class="section-title">Serviços Realizados</div><div class="section-body">';
  if (servicosOS.length) {
    html += '<table class="srv-table"><thead><tr><th style="width:80px">Código</th><th>Descrição</th><th>Categoria</th><th style="width:90px;text-align:right">Valor</th></tr></thead><tbody>';
    var somaRaw = 0;
    servicosOS.forEach(function(s) {
      somaRaw += parseFloat(s.valor) || 0;
      html += '<tr><td class="cod">' + raEsc(s.codigo) + '</td><td>' + raEsc(s.descricao) + '</td><td style="font-size:10px;color:#666">' + raEsc(s.categoria_nome || '') + '</td><td class="val">R$ ' + (parseFloat(s.valor) || 0).toFixed(2).replace('.', ',') + '</td></tr>';
    });
    html += '</tbody></table>';
    if (somaRaw !== (parseFloat(o.valor_servico) || 0)) {
      html += '<div style="text-align:right;font-size:11px;margin-top:4px;color:#666">Soma bruta: R$ ' + somaRaw.toFixed(2).replace('.', ',') + ' → Valor efetivo (com tetos): <strong>R$ ' + (parseFloat(o.valor_servico) || 0).toFixed(2).replace('.', ',') + '</strong></div>';
    }
  } else {
    html += '<div>' + (o.codigo_servico || '-') + '</div>';
  }
  html += '</div></div>';

  // Peças
  if (pecasOS.length) {
    html += '<div class="section"><div class="section-title">Peças Utilizadas (' + pecasOS.length + ')</div><div class="section-body">';
    html += '<table class="srv-table"><thead><tr><th>Referência</th><th>Peça</th><th style="width:60px;text-align:right">Qtd</th></tr></thead><tbody>';
    pecasOS.forEach(function(p) {
      html += '<tr><td class="cod">' + raEsc(p.referencia) + '</td><td>' + raEsc(p.nome_peca) + '</td><td class="val">' + p.quantidade + '</td></tr>';
    });
    html += '</tbody></table></div></div>';
  }

  // Total
  html += '<div class="total-box"><div class="label">Valor Total a Pagar</div><div class="amount">R$ ' + (parseFloat(o.valor_servico) || 0).toFixed(2).replace('.', ',') + '</div></div>';

  html += '<div class="footer">Stonni — Rede de Assistência Técnica Autorizada — Emitido em ' + new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR') + '</div>';
  html += '</body></html>';

  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(function() { w.print(); }, 600);
  raLog('ACAO', 'os', 'IMPRIMIR_OS', String(id));
};

window.raEditarServicoOS = async function(osId) {
  var o = _raOS.find(function(x) { return x.id === osId; });
  if (!o) return;
  var linhaDb = await raLinhaSlugDe(o.produto_linha) || o.produto_linha || '';
  // buscar categorias da nova tabela
  var categorias = await raFetch('prt_categorias_servico?ativo=eq.true&order=ordem.asc&select=*' + (linhaDb ? '&linha_produto=eq.' + linhaDb : ''));
  if (!Array.isArray(categorias)) categorias = [];
  var catMap = {};
  categorias.forEach(function(c) { catMap[c.id] = c; });
  var servicos = await raFetch('prt_tabela_servicos?ativo=eq.true&order=codigo.asc&select=*' + (linhaDb ? '&linha_produto=eq.' + linhaDb : ''));
  if (!Array.isArray(servicos)) servicos = [];
  // agrupar por categoria_id
  var porCat = {};
  servicos.forEach(function(s) {
    var cid = s.categoria_id || 0;
    if (!porCat[cid]) porCat[cid] = [];
    porCat[cid].push(s);
  });
  var html = '<p style="margin-bottom:12px;font-size:13px">Serviço atual: <strong>' + (o.codigo_servico || 'nenhum') + '</strong> — ' + raFmt(o.valor_servico) + '</p>';
  categorias.forEach(function(cat) {
    var items = porCat[cat.id] || [];
    if (!items.length) return;
    html += '<div style="margin-bottom:12px"><div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">' + cat.nome + ' <span style="font-weight:400">(teto: ' + raFmt(cat.valor_teto) + ')</span></div>';
    items.forEach(function(s) {
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
  raLog('ACAO','os','ALTERAR_SERVICO_OS',String(osId),null,{codigo:codigo,valor:valor});
  raCarregarOS();
};

window.raAprovarOS = async function(id) {
  if (!confirm('Confirma aprovação desta OS?')) return;
  var o = _raOS.find(function(x) { return x.id === id; }) || {};
  await raPatch('prt_ordens_servico', 'id=eq.' + id, { status: 'aprovada', data_aprovacao: new Date().toISOString(), aprovado_por: (window.getUsuario() || {}).nome || 'gestor' });
  // baixar estoque do parceiro: incrementa quantidade_usada das peças da OS
  // + criar reposição automática na fila
  try {
    var pecas = await raFetch('prt_os_pecas?os_id=eq.' + id + '&select=referencia,nome_peca,quantidade');
    // peças já enviadas antecipadamente (antes do serviço) — não gerar reposição de novo
    var repAntecip = await raFetch('prt_reposicao_pecas?os_id=eq.' + id + '&tipo=eq.antecipada&select=referencia');
    var refsAntecip = Array.isArray(repAntecip) ? repAntecip.map(function(r) { return r.referencia; }) : [];
    if (Array.isArray(pecas) && pecas.length && o.parceiro_id) {
      var reposCriadas = 0;
      for (var i = 0; i < pecas.length; i++) {
        var pe = pecas[i];
        // baixar estoque
        var est = await raFetch('prt_estoque_parceiro?parceiro_id=eq.' + o.parceiro_id + '&referencia=eq.' + encodeURIComponent(pe.referencia));
        if (Array.isArray(est) && est.length) {
          await raPatch('prt_estoque_parceiro', 'id=eq.' + est[0].id, { quantidade_usada: (est[0].quantidade_usada || 0) + (pe.quantidade || 1), atualizado_em: new Date().toISOString() });
        }
        // peça já enviada antecipada para esta OS → não repor de novo (evita envio em dobro)
        if (refsAntecip.indexOf(pe.referencia) !== -1) continue;
        // criar reposição automática (garantia) — com verificação de resposta
        var repResp = await fetch(SB_URL + '/rest/v1/prt_reposicao_pecas', {
          method: 'POST',
          headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
          body: JSON.stringify({
            parceiro_id: o.parceiro_id, os_id: id,
            referencia: pe.referencia, nome_peca: pe.nome_peca || pe.referencia,
            quantidade: pe.quantidade || 1, status: 'pendente', tipo: 'garantia'
          })
        });
        if (repResp.ok) { reposCriadas++; }
        else { var errBody = await repResp.text(); console.error('Reposição falhou para ' + pe.referencia + ':', repResp.status, errBody); raLog('ERRO', 'reposicao', 'CRIAR_REPOSICAO_FALHOU', String(id), pe.referencia, {status: repResp.status, erro: errBody}); }
      }
      if (reposCriadas > 0) { raToast('OS aprovada! ' + reposCriadas + ' reposição(ões) criada(s) na fila.'); }
      else { raToast('OS aprovada, mas reposição de peças falhou. Verifique o console.'); }
    } else if (Array.isArray(pecas) && !pecas.length) {
      // OS sem peças — só aprova normalmente
    } else if (!o.parceiro_id) {
      console.error('OS sem parceiro_id — reposição não criada'); raLog('ERRO', 'reposicao', 'OS_SEM_PARCEIRO', String(id));
    }
  } catch (e) { console.error('Baixa de estoque/reposição falhou:', e); raLog('ERRO', 'estoque', 'BAIXA_ESTOQUE_FALHOU', String(id), null, {erro: String(e)}); }
  document.getElementById('ra-modal')?.remove();
  raLog('ACAO','os','APROVAR_OS',String(id));raCarregarOS();raAtualizarBadgesPecas();
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
  raLog('ACAO','os','RECUSAR_OS',String(id),null,{motivo:motivo});
  document.getElementById('ra-modal')?.remove();
  raCarregarOS();
};

// ═══════════════════════════════════════
// 2. SERVIÇOS — CRUD (com categorias da nova tabela + código automático)
// ═══════════════════════════════════════
var _raServicos = [];
var _raCategorias = [];

window.raCarregarServicos = async function() {
  await raPopularSelectLinhas('ra-srv-linha', 'Todas as linhas');
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
  // map de categorias por id
  var catMap = {};
  _raCategorias.forEach(function(c) { catMap[c.id] = c; });
  if (!_raServicos.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum serviço cadastrado</td></tr>'; return; }
  tbody.innerHTML = _raServicos.map(function(s) {
    var cat = catMap[s.categoria_id] || {};
    return '<tr>' +
      '<td class="mono" style="font-weight:600">' + s.codigo + '</td>' +
      '<td>' + s.descricao + '</td>' +
      '<td>' + raLinhaNome(s.linha_produto) + '</td>' +
      '<td><span class="badge badge-blue">' + (cat.nome || s.categoria) + '</span></td>' +
      '<td class="mono right">' + raFmt(s.valor) + '</td>' +
      '<td class="mono right">' + raFmt(cat.valor_teto || s.teto_categoria) + '</td>' +
      '<td>' + (s.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarServico(' + s.id + ')">✏️</button> <button class="btn-icon" onclick="raToggleServico(' + s.id + ',' + !s.ativo + ')">' + (s.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

// gera próximo código automático: STN-{prefixo}{nn} — consulta o banco para nunca duplicar
async function raGerarCodigo(categoriaId) {
  var cat = _raCategorias.find(function(c) { return c.id === categoriaId; });
  if (!cat) return '';
  var prefixo = 'STN-' + cat.prefixo_codigo;
  var existentes = await raFetch('prt_tabela_servicos?select=codigo&codigo=like.' + encodeURIComponent(prefixo) + '*');
  if (!Array.isArray(existentes)) existentes = [];
  var maxNum = 0;
  existentes.forEach(function(s) {
    var num = parseInt(String(s.codigo).replace(prefixo, ''), 10);
    if (num > maxNum) maxNum = num;
  });
  var next = String(maxNum + 1);
  while (next.length < 2) next = '0' + next;
  return prefixo + next;
}

window.raNovoServico = function() {
  // filtrar categorias ativas
  var catOpts = _raCategorias.filter(function(c) { return c.ativo; }).map(function(c) {
    return '<option value="' + c.id + '">' + raLinhaNomeCurto(c.linha_produto) + ' — ' + c.nome + '</option>';
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

window.raPreviewCodigo = async function() {
  var catId = parseInt(document.getElementById('ra-srv-cat').value);
  var el = document.getElementById('ra-srv-codigo');
  if (catId) { el.value = '...'; el.value = await raGerarCodigo(catId); }
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

  // Validar: valor não pode ultrapassar o teto da categoria
  var teto = parseFloat(cat.valor_teto) || 0;
  if (teto > 0 && valor > teto) {
    alert('Valor do serviço (R$ ' + valor.toFixed(2).replace('.',',') + ') ultrapassa o teto da categoria "' + cat.nome + '" (R$ ' + teto.toFixed(2).replace('.',',') + ').\n\nReduz o valor ou aumente o teto da categoria primeiro.');
    return;
  }

  if (id) {
    // edição — mantém código existente
    await raPatch('prt_tabela_servicos', 'id=eq.' + id, d);
    raLog('ACAO','prt_tabela_servicos','EDITAR_SERVICO',String(id),null,d);
  } else {
    // novo — gera código automático direto do banco no momento de salvar
    d.codigo = await raGerarCodigo(catId);
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
    return '<option value="' + c.id + '"' + (c.id === s.categoria_id ? ' selected' : '') + '>' + raLinhaNomeCurto(c.linha_produto) + ' — ' + c.nome + '</option>';
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
// Modelos por linha agora vêm do banco (prt_modelos_produto) — ver raModelosDaLinha()

window.raCarregarPecas = async function() {
  await raPopularSelectLinhas('ra-pec-linha', 'Todas as linhas');
  var linha = document.getElementById('ra-pec-linha')?.value || '';
  var url = 'prt_pecas_catalogo?order=nome.asc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raPecas = await raFetch(url);
  if (!Array.isArray(_raPecas)) _raPecas = [];
  var tbody = document.getElementById('ra-pec-tbody');
  if (!_raPecas.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma peça cadastrada</td></tr>'; return; }
  tbody.innerHTML = _raPecas.map(function(p) {
    var aplic = Array.isArray(p.aplicacao) ? p.aplicacao.join(', ') : '';
    return '<tr>' +
      '<td class="mono" style="font-weight:600">' + p.referencia + '</td>' +
      '<td>' + p.nome + '</td>' +
      '<td>' + raLinhaNome(p.linha_produto) + '</td>' +
      '<td style="font-size:12px">' + (aplic || '<span style="color:var(--text-muted)">não definida</span>') + '</td>' +
      '<td class="mono right">' + raFmt(p.preco_venda || p.custo_unitario) + '</td>' +
      '<td>' + (p.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>') + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarPeca(' + p.id + ')">✏️</button> <button class="btn-icon" onclick="raTogglePeca(' + p.id + ',' + !p.ativo + ')">' + (p.ativo ? '🚫' : '✅') + '</button></td></tr>';
  }).join('');
};

window.raNovaPeca = async function(prefill) {
  var p = prefill || {};
  var linhas = await raGetLinhas();
  var linhaSel = p.linha_produto || (linhas[0] ? linhas[0].slug : '');
  var linhaOpts = linhas.map(function(l) {
    return '<option value="' + l.slug + '"' + (l.slug === linhaSel ? ' selected' : '') + '>' + raEsc(l.nome) + '</option>';
  }).join('');
  raModal('Nova Peça — Buscar no ERP',
    '<div class="field"><label>Buscar produto no ERP</label><div style="display:flex;gap:6px"><input id="ra-pec-busca-erp" class="search-input" style="flex:1" placeholder="Digite referência ou nome do produto..." value="' + (p.referencia || '') + '"><button class="btn btn-secondary btn-sm" onclick="raBuscarPecaERP()">🔍 Buscar</button></div></div>' +
    '<div id="ra-pec-erp-results" style="max-height:150px;overflow-y:auto;margin-bottom:12px"></div>' +
    '<hr style="border:0;border-top:1px solid var(--border);margin:8px 0">' +
    '<div class="field"><label>Referência</label><input id="ra-pec-ref" class="search-input" style="width:100%" value="' + (p.referencia || '') + '" placeholder="Código ERP"></div>' +
    '<div class="field"><label>Nome (editável)</label><input id="ra-pec-nome" class="search-input" style="width:100%" value="' + (p.nome || '') + '" placeholder="Nome da peça"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-pec-linha-new" class="filter-select" style="width:100%" onchange="raAtualizarCheckboxesModelo(\'pec\')">' + linhaOpts + '</select></div>' +
      '<div class="field"><label>Preço venda (R$)</label><input id="ra-pec-custo" class="search-input" style="width:100%" type="number" step="0.01" value="' + (p.preco_venda || p.custo_unitario || '') + '" placeholder="Bononi SC"></div>' +
      '<div class="field"><label>IPI (%)</label><input id="ra-pec-ipi" class="search-input" style="width:100%" type="number" step="0.01" value="' + (p.ipi_perc || '') + '" placeholder="0"></div>' +
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
  var qe = encodeURIComponent(q);
  var results = await raFetch('comp_produtos_consolidado?or=(referencia.ilike.*' + qe + '*,nome.ilike.*' + qe + '*)&subgrupo=in.(REPARO AR STONNI,RP. GELADEIRA,REPOSICAO GERADOR)&order=nome.asc&limit=15&select=referencia,nome,subgrupo,estoque_total,preco_compra');
  if (!Array.isArray(results) || !results.length) { box.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:12px">Nenhuma peça encontrada</div>'; return; }
  // Buscar preço Bononi SC para cada resultado
  var refs = results.map(function(r) { return r.referencia; });
  var precoMap = {};
  try {
    var pr = await raFetch('geral_pecas_preco_bononi_sc?referencia=in.(' + refs.join(',') + ')&select=referencia,preco_venda,ipi_saida');
    if (Array.isArray(pr)) pr.forEach(function(p) { precoMap[p.referencia] = { preco: p.preco_venda || 0, ipi: p.ipi_saida || 0 }; });
  } catch(e) {}
  box.innerHTML = results.map(function(r) {
    var bp = precoMap[r.referencia] || { preco: 0, ipi: 0 };
    return '<div style="padding:6px 8px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px;display:flex;justify-content:space-between" onmouseover="this.style.background=\'var(--blue-pale)\'" onmouseout="this.style.background=\'\'" onclick="raSelecionarPecaERP(\'' + (r.referencia || '').replace(/'/g, "\\'") + '\',\'' + (r.nome || '').replace(/'/g, "\\'") + '\',' + bp.preco + ',' + bp.ipi + ',' + (r.estoque_total || 0) + ')"><div><strong>' + r.referencia + '</strong> — ' + r.nome + '<div style="font-size:10px;color:var(--text-muted)">' + (r.subgrupo || '') + ' · Estoque: ' + (r.estoque_total || 0) + '</div></div><span>' + (bp.preco ? raFmt(bp.preco) + (bp.ipi ? ' +IPI ' + bp.ipi + '%' : '') : '<em style="color:var(--text-muted)">sem preço SC</em>') + '</span></div>';
  }).join('');
};

window.raSelecionarPecaERP = function(ref, nome, preco, ipi, estoque) {
  document.getElementById('ra-pec-ref').value = ref;
  document.getElementById('ra-pec-nome').value = nome;
  document.getElementById('ra-pec-custo').value = preco || '';
  var ipiEl = document.getElementById('ra-pec-ipi');
  if (ipiEl) ipiEl.value = ipi || '';
  document.getElementById('ra-pec-erp-results').innerHTML = '<div style="padding:6px;color:var(--green);font-size:12px">✅ ' + ref + ' — ' + (preco ? raFmt(preco) : 'sem preço SC') + (estoque !== undefined ? ' · Estoque geral: ' + estoque : '') + '</div>';
};

window.raAtualizarCheckboxesModelo = async function(prefix) {
  var linha = document.getElementById('ra-' + prefix + '-linha-new').value;
  var box = document.getElementById('ra-' + prefix + '-checkboxes');
  if (!box) return;
  if (!linha) { box.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Selecione uma linha para listar os modelos</span>'; return; }
  box.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Carregando modelos...</span>';
  var modelos = await raModelosDaLinha(linha);
  // inclui modelos legados marcados na peça que não estão mais na lista (para não sumirem sem aviso)
  var aplic = prefix === 'pec' ? (window._pecaAplic || []) : (window._matAplic || []);
  aplic.forEach(function(a) { if (modelos.indexOf(a) === -1) modelos.push(a); });
  if (!modelos.length) { box.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Nenhum modelo cadastrado para esta linha — cadastre em Configurações → Linhas e Modelos</span>'; return; }
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
  var precoVal = parseFloat(document.getElementById('ra-pec-custo').value) || 0;
  var ipiVal = parseFloat((document.getElementById('ra-pec-ipi') || {}).value) || 0;
  var d = {
    referencia: document.getElementById('ra-pec-ref').value.trim(),
    nome: document.getElementById('ra-pec-nome').value.trim(),
    linha_produto: document.getElementById('ra-pec-linha-new').value,
    custo_unitario: precoVal || null,
    preco_venda: precoVal || null,
    ipi_perc: ipiVal || null,
    aplicacao: window._pecaAplic || []
  };
  if (!d.referencia || !d.nome) { alert('Preencha referência e nome'); return; }
  if (id) { await raPatch('prt_pecas_catalogo', 'id=eq.' + id, d); }
  else { await raPost('prt_pecas_catalogo', d); }
  raLog('ACAO', 'peca', id ? 'EDITAR_PECA' : 'CRIAR_PECA', d.referencia, d.nome);
  document.getElementById('ra-modal')?.remove();
  raCarregarPecas();
};

window.raEditarPeca = async function(id) {
  var p = _raPecas.find(function(x) { return x.id === id; });
  if (!p) return;
  await raNovaPeca(p);
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
  // Buscar itens de envio para expandir multi-peça
  var envioIds = envios.map(function(e){return e.id});
  var todosItens = [];
  if (envioIds.length) {
    try { todosItens = await raFetch('prt_envio_itens?envio_id=in.(' + envioIds.join(',') + ')&order=criado_em.asc&select=*'); if(!Array.isArray(todosItens)) todosItens=[]; } catch(e){}
  }
  var itensPorEnvio = {};
  todosItens.forEach(function(it) { if(!itensPorEnvio[it.envio_id]) itensPorEnvio[it.envio_id]=[]; itensPorEnvio[it.envio_id].push(it); });

  tbody.innerHTML = envios.map(function(e) {
    var parc = e.assist_parceiros ? e.assist_parceiros.nome : '#' + e.parceiro_id;
    var itens = itensPorEnvio[e.id] || [];
    var isMulti = itens.length > 1;
    var pecaCol = isMulti
      ? '<span style="cursor:pointer;color:var(--primary);font-weight:600" onclick="var row=document.getElementById(\'ra-env-det-'+e.id+'\');row.style.display=row.style.display===\'none\'?\'table-row\':\'none\'">' + itens.length + ' peças ▸</span>'
      : raEsc(e.nome_peca);
    var subRow = '';
    if (isMulti) {
      subRow = '<tr id="ra-env-det-' + e.id + '" style="display:none"><td colspan="8" style="padding:0 0 0 24px;background:var(--surface2)"><table style="width:100%;font-size:11px;border-collapse:collapse"><thead><tr style="background:var(--border)"><th style="padding:3px 8px">Referência</th><th style="padding:3px 8px">Peça</th><th style="padding:3px 8px;text-align:center">Qtd</th></tr></thead><tbody>' +
        itens.map(function(it) { return '<tr><td style="padding:3px 8px" class="mono">' + raEsc(it.referencia) + '</td><td style="padding:3px 8px">' + raEsc(it.nome_peca) + '</td><td style="padding:3px 8px;text-align:center">' + it.quantidade + '</td></tr>'; }).join('') +
        '</tbody></table></td></tr>';
    }
    return '<tr><td>' + parc + '</td><td>' + pecaCol + '</td><td class="mono right">' + e.quantidade + '</td><td>' + (e.nf_envio || '—') + '</td><td>' + (e.rastreio || '—') + '</td><td>' + statusBadge(e.status) + '</td><td>' + raDate(e.data_envio) + '</td>' +
      '<td>' + (e.status === 'enviado' ? '<button class="btn-icon" title="Marcar recebido" onclick="raMarcarRecebido(' + e.id + ')">✅</button>' : '') + '</td></tr>' + subRow;
  }).join('');
};

window.raMarcarRecebido = async function(id) {
  await raPatch('prt_envios_pecas', 'id=eq.' + id, { status: 'recebido', data_recebimento: new Date().toISOString().substring(0, 10) });
  raCarregarEnvios();
};

var _raEnvioItens = [];
var _raEnvioPecasCatalogo = [];
var _raEnvioRepIds = {};

window.raNovoEnvio = async function(preParc, preRef, preNome, preQtd, repId) {
  _raEnvioItens = [];
  _raEnvioRepIds = {};
  var parceiros = await raFetch('assist_parceiros?credenciado=eq.true&order=nome.asc&select=id,nome');
  if (!Array.isArray(parceiros)) parceiros = [];
  _raEnvioPecasCatalogo = await raFetch('prt_pecas_catalogo?ativo=eq.true&order=nome.asc&select=id,referencia,nome,custo_unitario,preco_venda');
  if (!Array.isArray(_raEnvioPecasCatalogo)) _raEnvioPecasCatalogo = [];
  // Se veio com peça pré-selecionada, adicionar
  if (preRef) {
    _raEnvioItens.push({ ref: preRef, nome: preNome || preRef, qtd: preQtd || 1, custo: 0 });
    if (repId) _raEnvioRepIds[preRef] = repId;
    var catPeca = _raEnvioPecasCatalogo.find(function(p) { return p.referencia === preRef; });
    if (catPeca) _raEnvioItens[0].custo = parseFloat(catPeca.custo_unitario || catPeca.preco_venda) || 0;
  }
  raModal('Novo Envio de Peças',
    '<div class="field"><label>Parceiro</label><select id="ra-env-parc" class="filter-select" style="width:100%"><option value="">Selecione...</option>' +
      parceiros.map(function(p) { return '<option value="' + p.id + '"' + (preParc && p.id == preParc ? ' selected' : '') + '>' + p.nome + '</option>'; }).join('') + '</select></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
      '<div class="field"><label>NF Envio</label><input id="ra-env-nf" class="search-input" style="width:100%" placeholder="Número NF"></div>' +
      '<div class="field"><label>Transportadora</label><input id="ra-env-transp" class="search-input" style="width:100%" placeholder="Ex: Jadlog, Correios"></div>' +
      '<div class="field"><label>Rastreio</label><input id="ra-env-rastreio" class="search-input" style="width:100%" placeholder="Código rastreio"></div>' +
    '</div>' +
    '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><label style="font-weight:600">Peças do envio</label><button class="btn btn-secondary btn-sm" onclick="raEnvioAdicionarPeca()">+ Adicionar peça</button></div>' +
    '<div id="ra-envio-itens-area"></div></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarEnvio()">Registrar envio</button>');
  raEnvioRenderItens();
};

window.raEnvioRenderItens = function() {
  var box = document.getElementById('ra-envio-itens-area');
  if (!box) return;
  if (!_raEnvioItens.length) { box.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">Nenhuma peça adicionada</div>'; return; }
  var html = '<table class="data-table" style="font-size:12px"><thead><tr><th>Referência</th><th>Peça</th><th style="width:70px">Qtd</th><th></th></tr></thead><tbody>';
  _raEnvioItens.forEach(function(it, i) {
    html += '<tr><td class="mono" style="font-weight:600">' + raEsc(it.ref) + '</td><td>' + raEsc(it.nome) + '</td><td><input type="number" min="1" value="' + it.qtd + '" style="width:60px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;text-align:center" onchange="_raEnvioItens[' + i + '].qtd=parseInt(this.value)||1"></td><td><button class="btn-icon" style="color:var(--red)" onclick="_raEnvioItens.splice(' + i + ',1);raEnvioRenderItens()">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  html += '<div style="text-align:right;font-size:12px;margin-top:4px;color:var(--text-muted)">' + _raEnvioItens.length + ' peça(s), ' + _raEnvioItens.reduce(function(s,x){return s+x.qtd},0) + ' unidade(s)</div>';
  box.innerHTML = html;
};

window.raEnvioAdicionarPeca = function() {
  var box = document.getElementById('ra-envio-itens-area');
  if (!box) return;
  // Inserir formulário inline no topo
  var existForm = document.getElementById('ra-envio-add-form');
  if (existForm) { existForm.remove(); return; }
  var opts = _raEnvioPecasCatalogo.map(function(p) { return '<option value="' + p.referencia + '">' + p.referencia + ' — ' + p.nome + '</option>'; }).join('');
  var form = document.createElement('div');
  form.id = 'ra-envio-add-form';
  form.style.cssText = 'background:var(--primary-bg);border:1px solid var(--primary);border-radius:var(--radius-sm);padding:10px;margin-bottom:8px;display:flex;gap:8px;align-items:end;flex-wrap:wrap';
  form.innerHTML = '<div style="flex:1;min-width:200px"><label style="font-size:11px;font-weight:600">Peça</label><select id="ra-envio-sel-peca" class="filter-select" style="width:100%"><option value="">Selecione...</option>' + opts + '</select></div>' +
    '<div style="width:70px"><label style="font-size:11px;font-weight:600">Qtd</label><input id="ra-envio-sel-qtd" type="number" min="1" value="1" class="search-input" style="width:100%"></div>' +
    '<button class="btn btn-primary btn-sm" onclick="raEnvioConfirmarAdicao()">Adicionar</button>';
  box.insertBefore(form, box.firstChild);
};

window.raEnvioConfirmarAdicao = function() {
  var sel = document.getElementById('ra-envio-sel-peca');
  var qtd = parseInt(document.getElementById('ra-envio-sel-qtd').value) || 1;
  if (!sel || !sel.value) { alert('Selecione uma peça'); return; }
  var ref = sel.value;
  var catPeca = _raEnvioPecasCatalogo.find(function(p) { return p.referencia === ref; });
  // Verificar se já existe — merge
  var existe = _raEnvioItens.find(function(x) { return x.ref === ref; });
  if (existe) { existe.qtd += qtd; }
  else { _raEnvioItens.push({ ref: ref, nome: catPeca ? catPeca.nome : ref, qtd: qtd, custo: catPeca ? (parseFloat(catPeca.custo_unitario || catPeca.preco_venda) || 0) : 0 }); }
  document.getElementById('ra-envio-add-form')?.remove();
  raEnvioRenderItens();
};

window.raSalvarEnvio = async function() {
  var parcId = document.getElementById('ra-env-parc').value;
  if (!parcId) { alert('Selecione o parceiro'); return; }
  if (!_raEnvioItens.length) { alert('Adicione pelo menos uma peça'); return; }
  var nf = document.getElementById('ra-env-nf').value.trim();
  var transp = (document.getElementById('ra-env-transp') ? document.getElementById('ra-env-transp').value.trim() : '');
  var rastreio = document.getElementById('ra-env-rastreio').value.trim();
  var qtdTotal = _raEnvioItens.reduce(function(s,x){return s+x.qtd},0);
  // Header do envio
  var d = {
    parceiro_id: parseInt(parcId),
    referencia: _raEnvioItens.length === 1 ? _raEnvioItens[0].ref : 'MULTI',
    nome_peca: _raEnvioItens.length === 1 ? _raEnvioItens[0].nome : _raEnvioItens.length + ' peças',
    quantidade: qtdTotal,
    custo_unitario: _raEnvioItens.length === 1 ? _raEnvioItens[0].custo : null,
    nf_envio: nf || null,
    transportadora: transp || null,
    rastreio: rastreio || null,
    status: 'enviado',
    data_envio: new Date().toISOString(),
    enviado_por: (window.getUsuario() || {}).nome || 'gestor'
  };
  var envResp = await fetch(SB_URL + '/rest/v1/prt_envios_pecas', {
    method: 'POST', headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
    body: JSON.stringify(d)
  });
  var envData = await envResp.json();
  var envioId = Array.isArray(envData) && envData.length ? envData[0].id : (envData && envData.id ? envData.id : null);
  // Gravar itens em prt_envio_itens
  for (var i = 0; i < _raEnvioItens.length; i++) {
    var it = _raEnvioItens[i];
    var repId = _raEnvioRepIds[it.ref] || null;
    await raPost('prt_envio_itens', { envio_id: envioId, referencia: it.ref, nome_peca: it.nome, quantidade: it.qtd, custo_unitario: it.custo || 0, reposicao_id: repId });
    // Atualizar estoque parceiro
    var est = await raFetch('prt_estoque_parceiro?parceiro_id=eq.' + parcId + '&referencia=eq.' + encodeURIComponent(it.ref));
    if (Array.isArray(est) && est.length) {
      await raPatch('prt_estoque_parceiro', 'id=eq.' + est[0].id, { quantidade_enviada: (est[0].quantidade_enviada || 0) + it.qtd, ultimo_envio: new Date().toISOString(), atualizado_em: new Date().toISOString() });
    } else {
      await raPost('prt_estoque_parceiro', { parceiro_id: parseInt(parcId), referencia: it.ref, nome_peca: it.nome, quantidade_enviada: it.qtd, quantidade_usada: 0, custo_unitario: it.custo || 0, ultimo_envio: new Date().toISOString() });
    }
    // Se tem reposição vinculada, marcar como enviada
    if (repId) {
      await raPatch('prt_reposicao_pecas', 'id=eq.' + repId, { status: 'enviada', envio_id: envioId, atualizado_em: new Date().toISOString() });
    }
  }
  document.getElementById('ra-modal')?.remove();
  raLog('ACAO', 'envio', 'ENVIO_PECAS', parcId, nf, { itens: _raEnvioItens.length, qtd: qtdTotal });
  raToast(qtdTotal + ' peça(s) enviada(s) com sucesso!');
  raCarregarEnvios();raAtualizarBadgesPecas();
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
    sel.innerHTML += '<option value="">Todos os meses</option>';
  }
  var mesSel = sel ? sel.value : '';
  var pagUrl = 'prt_pagamentos?order=mes_referencia.desc,criado_em.desc&select=*,assist_parceiros(nome)';
  if (mesSel) pagUrl += '&mes_referencia=eq.' + mesSel;
  var pags = await raFetch(pagUrl);
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

// primeiro dia do mês seguinte (para filtro de período sem data inválida tipo 2026-06-31)
function raProximoMes(mes) {
  var p = mes.split('-');
  var y = parseInt(p[0], 10), m = parseInt(p[1], 10) + 1;
  if (m > 12) { m = 1; y++; }
  return y + '-' + String(m).padStart(2, '0') + '-01';
}

window.raGerarFechamento = async function() {
  var mes = document.getElementById('ra-pag-mes')?.value;
  if (!mes) { alert('Selecione o mês'); return; }
  if (!confirm('Gerar fechamento de ' + mes + '? Vai consolidar as OS aprovadas do mês por parceiro.')) return;
  var fim = raProximoMes(mes);
  // só OS aprovadas que ainda não entraram em nenhum fechamento
  var osAprovadas = await raFetch('prt_ordens_servico?status=eq.aprovada&pagamento_id=is.null&data_servico=gte.' + mes + '-01&data_servico=lt.' + fim + '&select=id,parceiro_id,valor_servico');
  if (!Array.isArray(osAprovadas) || !osAprovadas.length) { alert('Nenhuma OS aprovada (fora de fechamento) encontrada no mês ' + mes); return; }
  var porParceiro = {};
  osAprovadas.forEach(function(o) {
    if (!porParceiro[o.parceiro_id]) porParceiro[o.parceiro_id] = { qtd: 0, valor: 0, ids: [] };
    porParceiro[o.parceiro_id].qtd++;
    porParceiro[o.parceiro_id].valor += parseFloat(o.valor_servico) || 0;
    porParceiro[o.parceiro_id].ids.push(o.id);
  });
  for (var pid in porParceiro) {
    var pp = porParceiro[pid];
    var novo = await raPost('prt_pagamentos', {
      parceiro_id: parseInt(pid), mes_referencia: mes, qtd_os: pp.qtd,
      valor_servicos: pp.valor, valor_pecas: 0, valor_total: pp.valor, status: 'pendente'
    });
    var pagRow = Array.isArray(novo) ? novo[0] : novo;
    if (pagRow && pagRow.id) {
      // vincula as OS ao fechamento (status continua 'aprovada' até o pagamento real)
      await raPatch('prt_ordens_servico', 'id=in.(' + pp.ids.join(',') + ')', { pagamento_id: pagRow.id });
      raLog('ACAO', 'pagamento', 'GERAR_FECHAMENTO', String(pagRow.id), mes, { parceiro_id: parseInt(pid), qtd_os: pp.qtd, valor: pp.valor });
    }
  }
  raCarregarPagamentos();
};

window.raMarcarPago = async function(id) {
  if (!confirm('Confirma pagamento?')) return;
  var agora = new Date().toISOString();
  await raPatch('prt_pagamentos', 'id=eq.' + id, { status: 'pago', data_pagamento: agora });
  // marca como pagas as OS vinculadas a este fechamento
  await raPatch('prt_ordens_servico', 'pagamento_id=eq.' + id, { status: 'paga', data_pagamento: agora });
  raLog('ACAO', 'pagamento', 'MARCAR_PAGO', String(id));
  raCarregarPagamentos();
};

// ═══════════════════════════════════════
// 6. MATERIAIS TÉCNICOS — CRUD
// ═══════════════════════════════════════
var _raMateriais = [];
// ═══ MATERIAIS (agora dentro de Configurações) ═══
function raCfgMateriais(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
    '<div style="font-weight:600">Materiais Técnicos</div>' +
    '<div style="display:flex;gap:8px">' +
    '<select class="filter-select" id="ra-mat-linha" onchange="raCarregarMateriais()"><option value="">Todas as linhas</option></select>' +
    '<button class="btn btn-primary btn-sm" onclick="raNovoMaterial()">+ Novo material</button></div></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Título</th><th>Tipo</th><th>Linha</th><th>Modelo</th><th></th></tr></thead><tbody id="ra-mat-tbody"><tr><td colspan="5" class="loading-row"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div></div>';
  raCarregarMateriais();
}

window.raCarregarMateriais = async function() {
  await raPopularSelectLinhas('ra-mat-linha', 'Todas as linhas');
  var linha = document.getElementById('ra-mat-linha')?.value || '';
  var url = 'prt_materiais?order=ordem.asc,criado_em.desc&select=*';
  if (linha) url += '&linha_produto=eq.' + linha;
  _raMateriais = await raFetch(url);
  if (!Array.isArray(_raMateriais)) _raMateriais = [];
  var tbody = document.getElementById('ra-mat-tbody');
  var tipoIcon = {video:'🎥',pdf:'📄',imagem:'🖼️',link:'🔗'};
  if (!_raMateriais.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum material cadastrado</td></tr>'; return; }
  tbody.innerHTML = _raMateriais.map(function(m) {
    var modelos = m.modelo || 'Todos';
    return '<tr>' +
      '<td><a href="' + m.url + '" target="_blank" style="color:var(--blue-mid)">' + m.titulo + '</a></td>' +
      '<td>' + (tipoIcon[m.tipo] || '') + ' ' + m.tipo + '</td>' +
      '<td>' + (m.linha_produto ? raLinhaNome(m.linha_produto) : 'Geral') + '</td>' +
      '<td style="font-size:12px">' + modelos + '</td>' +
      '<td><button class="btn-icon" onclick="raEditarMaterial(' + m.id + ')">✏️</button> <button class="btn-icon" title="Excluir" onclick="raExcluirMaterial(' + m.id + ',\'' + raEsc(m.titulo).replace(/'/g, "\\'") + '\')">🗑️</button></td></tr>';
  }).join('');
};

window.raNovoMaterial = async function(prefill) {
  var m = prefill || {};
  var linhaOptsMat = await raLinhaOptionsHtml(m.linha_produto || '', 'Geral');
  raModal('Novo Material Técnico',
    '<div class="field"><label>Título</label><input id="ra-mat-titulo" class="search-input" style="width:100%" placeholder="Ex: Instalação AR G2" value="' + (m.titulo || '') + '"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Tipo</label><select id="ra-mat-tipo" class="filter-select" style="width:100%" onchange="raMatTipoChange()"><option value="video"' + (m.tipo === 'video' ? ' selected' : '') + '>🎥 Vídeo (URL)</option><option value="pdf"' + (m.tipo === 'pdf' ? ' selected' : '') + '>📄 PDF (upload)</option><option value="imagem"' + (m.tipo === 'imagem' ? ' selected' : '') + '>🖼️ Imagem (upload)</option><option value="link"' + (m.tipo === 'link' ? ' selected' : '') + '>🔗 Link (URL)</option></select></div>' +
      '<div class="field"><label>Ordem</label><input id="ra-mat-ordem" class="search-input" style="width:100%" type="number" value="' + (m.ordem || 0) + '"></div>' +
    '</div>' +
    '<div id="ra-mat-url-area" class="field"><label>URL</label><input id="ra-mat-url" class="search-input" style="width:100%" placeholder="https://..." value="' + (m.url || '') + '"></div>' +
    '<div id="ra-mat-upload-area" class="field" style="display:none"><label>Upload arquivo</label><input type="file" id="ra-mat-file" accept=".pdf,.png,.jpg,.jpeg,.webp" style="font-size:13px"><div id="ra-mat-upload-status" style="font-size:12px;margin-top:4px"></div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-mat-linha-new" class="filter-select" style="width:100%" onchange="raAtualizarCheckboxesModelo(\'mat\')">' + linhaOptsMat + '</select></div>' +
      '<div class="field"><label>Categoria</label><input id="ra-mat-cat" class="search-input" style="width:100%" placeholder="Ex: Instalação, Manutenção..." value="' + (m.categoria || '') + '"></div>' +
    '</div>' +
    '<div class="field"><label>Modelos aplicáveis</label><div id="ra-mat-checkboxes" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>' +
    '<div class="field"><label>Descrição (opcional)</label><textarea id="ra-mat-desc" class="search-input" style="width:100%;height:60px;resize:vertical" placeholder="Breve descrição...">' + (m.descricao || '') + '</textarea></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raSalvarMaterial()">Salvar</button>');
  window._matAplic = m.modelo ? String(m.modelo).split(',').map(function(s){return s.trim();}).filter(Boolean) : [];
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
  // Se é upload, fazer upload primeiro (também na edição, se um novo arquivo foi selecionado)
  if (tipo === 'pdf' || tipo === 'imagem') {
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

window.raEditarMaterial = async function(id) {
  var m = _raMateriais.find(function(x) { return x.id === id; });
  if (!m) return;
  await raNovoMaterial(m);
  document.querySelector('.modal-title').textContent = 'Editar Material';
  var btns = document.querySelectorAll('.modal .btn-primary');
  btns[btns.length - 1].setAttribute('onclick', 'raSalvarMaterial(' + id + ')');
};

window.raExcluirMaterial = async function(id, titulo) {
  if (!confirm('Excluir o material "' + titulo + '"?\nEssa ação não pode ser desfeita.')) return;
  await fetch(SB_URL + '/rest/v1/prt_materiais?id=eq.' + id, {
    method: 'DELETE',
    headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY}
  });
  raLog('ACAO', 'material', 'EXCLUIR_MATERIAL', String(id), titulo);
  raCarregarMateriais();
};

// ═══════════════════════════════════════
// 7. PEÇAS — SUB-ABAS (Estoque, Compras, Reposição)
// ═══════════════════════════════════════
var _raPecSubTab = 'reposicao';

window.raPecTab = function(tab) {
  _raPecSubTab = tab;
  ['estoque','compras','reposicao'].forEach(function(t) {
    var btn = document.getElementById('ra-pec-tab-' + t);
    if (btn) { btn.style.background = t === tab ? 'var(--primary)' : 'var(--surface2)'; btn.style.color = t === tab ? '#fff' : ''; }
  });
  var box = document.getElementById('ra-pec-content');
  if (!box) return;
  switch(tab) {
    case 'estoque': raPecEstoque(box); break;
    case 'compras': raPecCompras(box); break;
    case 'reposicao': raPecReposicao(box); break;
  }
};

async function raPecEstoque(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px"><span style="font-weight:600">Estoque dos parceiros</span><button class="btn btn-primary btn-sm" onclick="raNovoEnvio()">+ Novo envio</button></div>' +
    '<div class="cards-grid cards-grid-3" id="ra-env-kpis"></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Parceiro</th><th>Peça</th><th>Qtd</th><th>NF</th><th>Rastreio</th><th>Status</th><th>Data</th><th></th></tr></thead><tbody id="ra-env-tbody"><tr><td colspan="8"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div></div>';
  raCarregarEnvios();
}

async function raPecCompras(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:600">Pedidos de compra dos parceiros</span></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Código</th><th>Parceiro</th><th>Itens</th><th>Total</th><th>Status</th><th>Data</th><th></th></tr></thead><tbody id="ra-cpr-tbody"></tbody></table></div></div>';
  var compras = [];
  try {
    compras = await raFetch('prt_compras_pecas?order=criado_em.desc&select=*,assist_parceiros(nome)');
    if (!Array.isArray(compras)) {
      compras = await raFetch('prt_compras_pecas?order=criado_em.desc&select=*');
      if (!Array.isArray(compras)) compras = [];
    }
  } catch(e) { console.error('Fetch compras falhou:', e); compras = []; }
  // Lookup parceiros se join falhou
  var parcMap = {};
  var temJoin = compras.length > 0 && compras[0].assist_parceiros;
  if (!temJoin && compras.length) {
    var parcIds = [];
    compras.forEach(function(c) { if (c.parceiro_id && parcIds.indexOf(c.parceiro_id) < 0) parcIds.push(c.parceiro_id); });
    if (parcIds.length) {
      try { var pp = await raFetch('assist_parceiros?id=in.(' + parcIds.join(',') + ')&select=id,nome'); if (Array.isArray(pp)) pp.forEach(function(p) { parcMap[p.id] = p.nome; }); } catch(e) {}
    }
  }
  var tbody = document.getElementById('ra-cpr-tbody');
  if (!compras.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum pedido de compra</td></tr>'; return; }
  var statusBadge = {pendente:'badge-blue',aprovado:'badge-green',faturado:'badge-purple',cancelado:'badge-gray'};
  tbody.innerHTML = compras.map(function(c) {
    var parcNome = c.assist_parceiros ? c.assist_parceiros.nome : (parcMap[c.parceiro_id] || '—');
    return '<tr><td class="mono" style="font-weight:600">' + (c.codigo || '#' + c.id) + '</td><td>' + raEsc(parcNome) + '</td><td style="text-align:center">—</td><td class="mono right">' + raFmt(c.valor_final) + '</td><td><span class="badge ' + (statusBadge[c.status] || '') + '">' + c.status + '</span></td><td>' + raDate(c.criado_em) + '</td><td>' +
      (c.status === 'pendente' ? '<button class="btn-icon" onclick="raAprovarCompra(' + c.id + ')">✓</button>' : '') + '</td></tr>';
  }).join('');
}

async function raPecReposicao(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px"><span style="font-weight:600">Reposição de peças de garantia</span>' +
    '<button class="btn btn-primary btn-sm" id="ra-rep-enviar-lote" style="display:none" onclick="raEnviarReposicaoLote()">📦 Enviar selecionados (<span id="ra-rep-sel-count">0</span>)</button></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th style="width:36px"><input type="checkbox" id="ra-rep-check-all" onchange="raToggleAllReposicao(this.checked)"></th><th>Parceiro</th><th>OS</th><th>Peça</th><th>Qtd</th><th>Tipo</th><th>Status</th><th>Data</th><th></th></tr></thead><tbody id="ra-rep-tbody"></tbody></table></div></div>';
  var reps = [];
  try {
    reps = await raFetch('prt_reposicao_pecas?order=criado_em.desc&select=*,assist_parceiros(nome),prt_ordens_servico(protocolo)');
    if (!Array.isArray(reps)) {
      reps = await raFetch('prt_reposicao_pecas?order=criado_em.desc&select=*');
      if (!Array.isArray(reps)) reps = [];
    }
  } catch(e) { console.error('Fetch reposição falhou:', e); reps = []; }
  // Se os joins falharam, buscar nomes de parceiros e protocolos separadamente
  var parcMap = {}, osMap = {};
  var temJoin = reps.length > 0 && reps[0].assist_parceiros;
  if (!temJoin && reps.length) {
    var parcIds = [], osIds = [];
    reps.forEach(function(r) { if (r.parceiro_id && parcIds.indexOf(r.parceiro_id) < 0) parcIds.push(r.parceiro_id); if (r.os_id && osIds.indexOf(r.os_id) < 0) osIds.push(r.os_id); });
    if (parcIds.length) {
      try { var pp = await raFetch('assist_parceiros?id=in.(' + parcIds.join(',') + ')&select=id,nome'); if (Array.isArray(pp)) pp.forEach(function(p) { parcMap[p.id] = p.nome; }); } catch(e) {}
    }
    if (osIds.length) {
      try { var oo = await raFetch('prt_ordens_servico?id=in.(' + osIds.join(',') + ')&select=id,protocolo'); if (Array.isArray(oo)) oo.forEach(function(o) { osMap[o.id] = o.protocolo; }); } catch(e) {}
    }
  }
  var tbody = document.getElementById('ra-rep-tbody');
  window._raReposicoes = reps;
  window._raRepParcMap = parcMap;
  if (!reps.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma reposição pendente</td></tr>'; return; }
  var statusBadge = {pendente:'badge-blue',enviada:'badge-green',recebida:'badge-purple'};
  tbody.innerHTML = reps.map(function(r) {
    var parcNome = r.assist_parceiros ? r.assist_parceiros.nome : (parcMap[r.parceiro_id] || '—');
    var proto = r.prt_ordens_servico ? r.prt_ordens_servico.protocolo : (osMap[r.os_id] || '—');
    var isPend = r.status === 'pendente';
    var tipoBadge = r.tipo === 'antecipada' ? '<span class="badge badge-orange">Antecipada</span>' : '<span class="badge badge-gray">Garantia</span>';
    return '<tr><td>' + (isPend ? '<input type="checkbox" class="ra-rep-check" data-id="' + r.id + '" data-parceiro="' + r.parceiro_id + '" data-ref="' + raEsc(r.referencia) + '" data-nome="' + raEsc(r.nome_peca) + '" data-qtd="' + r.quantidade + '" onchange="raAtualizarSelReposicao()">' : '') + '</td><td>' + raEsc(parcNome) + '</td><td class="mono">' + proto + '</td><td>' + raEsc(r.referencia) + ' — ' + raEsc(r.nome_peca) + '</td><td style="text-align:center">' + r.quantidade + '</td><td>' + tipoBadge + '</td><td><span class="badge ' + (statusBadge[r.status] || '') + '">' + r.status + '</span></td><td>' + raDate(r.criado_em) + '</td><td>' +
      (isPend ? '<button class="btn btn-secondary btn-sm" onclick="raEnviarReposicao(' + r.id + ',' + r.parceiro_id + ',\'' + raEsc(r.referencia) + '\',\'' + raEsc(r.nome_peca) + '\',' + r.quantidade + ')">Enviar</button>' : '') + '</td></tr>';
  }).join('');
}

window.raToggleAllReposicao = function(checked) {
  document.querySelectorAll('.ra-rep-check').forEach(function(c) { c.checked = checked; });
  raAtualizarSelReposicao();
};

window.raAtualizarSelReposicao = function() {
  var sel = document.querySelectorAll('.ra-rep-check:checked');
  var btn = document.getElementById('ra-rep-enviar-lote');
  var cnt = document.getElementById('ra-rep-sel-count');
  if (btn) btn.style.display = sel.length > 0 ? '' : 'none';
  if (cnt) cnt.textContent = sel.length;
};

window.raEnviarReposicaoLote = async function() {
  var checks = document.querySelectorAll('.ra-rep-check:checked');
  if (!checks.length) return;
  var porParceiro = {};
  checks.forEach(function(c) {
    var pid = c.dataset.parceiro;
    if (!porParceiro[pid]) porParceiro[pid] = [];
    porParceiro[pid].push({ id: parseInt(c.dataset.id), ref: c.dataset.ref, nome: c.dataset.nome, qtd: parseInt(c.dataset.qtd) });
  });
  var parceiros = Object.keys(porParceiro);
  if (parceiros.length > 1) { alert('Selecione peças de apenas um parceiro por envio.'); return; }
  // Usar o novo raNovoEnvio com multi-peça
  var pid = parceiros[0];
  var itens = porParceiro[pid];
  _raEnvioItens = [];
  _raEnvioRepIds = {};
  itens.forEach(function(it) {
    _raEnvioItens.push({ ref: it.ref, nome: it.nome, qtd: it.qtd, custo: 0 });
    _raEnvioRepIds[it.ref] = it.id;
  });
  // Buscar custos do catálogo
  _raEnvioPecasCatalogo = await raFetch('prt_pecas_catalogo?ativo=eq.true&order=nome.asc&select=id,referencia,nome,custo_unitario,preco_venda');
  if (!Array.isArray(_raEnvioPecasCatalogo)) _raEnvioPecasCatalogo = [];
  _raEnvioItens.forEach(function(it) {
    var catP = _raEnvioPecasCatalogo.find(function(p){return p.referencia===it.ref});
    if (catP) it.custo = parseFloat(catP.custo_unitario || catP.preco_venda) || 0;
  });
  raNovoEnvio(parseInt(pid));
};

window.raAprovarCompra = async function(id) {
  if (!confirm('Aprovar pedido de compra?')) return;
  await raPatch('prt_compras_pecas', 'id=eq.' + id, { status: 'aprovado', aprovado_por: (window.getUsuario() || {}).nome || 'gestor', data_aprovacao: new Date().toISOString() });
  raLog('ACAO','compra_peca','APROVAR_COMPRA',String(id));
  raPecTab('compras');raAtualizarBadgesPecas();
};

window.raEnviarReposicao = async function(repId, parceiroId, ref, nome, qtd) {
  raNovoEnvio(parceiroId, ref, nome, qtd, repId);
};

// ═══════════════════════════════════════
// 8. CONFIGURAÇÕES — SUB-ABAS
// ═══════════════════════════════════════
var _raCfgSubTab = 'servicos';

window.raCfgTab = function(tab) {
  _raCfgSubTab = tab;
  ['servicos','pecas','materiais','linhas','financeiro','empresa'].forEach(function(t) {
    var btn = document.getElementById('ra-cfg-tab-' + t);
    if (btn) { btn.style.background = t === tab ? 'var(--primary)' : 'var(--surface2)'; btn.style.color = t === tab ? '#fff' : ''; }
  });
  var box = document.getElementById('ra-cfg-content');
  if (!box) return;
  switch(tab) {
    case 'servicos': raCfgServicos(box); break;
    case 'pecas': raCfgPecas(box); break;
    case 'materiais': raCfgMateriais(box); break;
    case 'linhas': raCfgLinhas(box); break;
    case 'financeiro': raCfgFinanceiro(box); break;
    case 'empresa': raCfgEmpresaGeral(box); break;
  }
};

function raCfgServicos(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
    '<div style="display:flex;gap:8px"><select class="filter-select" id="ra-srv-linha" onchange="raCarregarServicos()"><option value="">Todas as linhas</option></select></div>' +
    '<div style="display:flex;gap:8px"><button class="btn btn-secondary btn-sm" onclick="raCfgCarregarCategorias()">📂 Categorias</button><button class="btn btn-secondary btn-sm" onclick="raAbrirModalPdfServicos()">📄 Gerar PDF</button><button class="btn btn-primary btn-sm" onclick="raNovoServico()">+ Novo serviço</button></div></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Código</th><th>Descrição</th><th>Linha</th><th>Categoria</th><th>Valor</th><th>Teto</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-srv-tbody"></tbody></table></div></div>';
  raCarregarServicos();
}

window.raCfgCarregarCategorias = async function() {
  await raGetLinhas();
  var linhaOpts = await raLinhaOptionsHtml('');
  raModal('📂 Categorias de Serviço',
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
    '<div style="display:flex;gap:8px;align-items:center"><select class="filter-select" id="ra-cfg-linha" onchange="raCfgCarregar()" style="width:180px"><option value="">Todas as linhas</option>' + linhaOpts.replace(/^<option value="">.*?<\/option>/, '') + '</select><span id="ra-cfg-count" style="font-size:12px;color:var(--text-muted)"></span></div>' +
    '<button class="btn btn-primary btn-sm" onclick="raCfgNovaCategoria()">+ Nova categoria</button></div>' +
    '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th style="width:50px">Ordem</th><th>Nome</th><th>Linha</th><th>Prefixo</th><th>Teto</th><th>Serviços</th><th>Ativa</th><th></th></tr></thead><tbody id="ra-cfg-tbody"><tr><td colspan="8"><div class="module-placeholder" style="height:auto;padding:20px"><div class="spinner"></div></div></td></tr></tbody></table></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Fechar</button>', 'lg');
  raCfgCarregar();
};

function raCfgPecas(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
    '<div style="display:flex;gap:8px"><select class="filter-select" id="ra-pec-linha" onchange="raCarregarPecas()"><option value="">Todas as linhas</option></select></div>' +
    '<button class="btn btn-primary btn-sm" onclick="raNovaPeca()">+ Nova peça</button></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Referência</th><th>Nome</th><th>Linha</th><th>Aplicação</th><th>Preço</th><th>IPI</th><th>Ativo</th><th></th></tr></thead><tbody id="ra-pec-tbody"></tbody></table></div></div>';
  raCarregarPecas();
}

// ═══ FINANCEIRO (junta Preços parceiro + Garantia) ═══
async function raCfgFinanceiro(box) {
  var cfg = await raFetch('prt_configuracoes?select=*');
  if (!Array.isArray(cfg)) cfg = [];
  var cfgMap = {}; cfg.forEach(function(c) { cfgMap[c.chave] = c.valor; });
  var desconto = cfgMap.desconto_autorizada_perc || '15';
  var prazoDia = cfgMap.prazo_pagamento_dia || '10';
  var tetos = await raFetch('prt_teto_produto?order=linha_produto.asc&select=*');
  if (!Array.isArray(tetos)) tetos = [];
  var gars = await raFetch('prt_garantia?ativo=eq.true&order=linha_produto.asc,modelo.asc&select=*');
  if (!Array.isArray(gars)) gars = [];
  await raGetLinhas();

  box.innerHTML = '<div style="font-weight:700;font-size:15px;margin-bottom:16px">Regras Financeiras e Comerciais</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">' +
    '<div class="table-card" style="padding:16px"><label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">Desconto compra peças (%)</label><div style="display:flex;gap:8px;margin-top:6px"><input id="ra-cfg-desconto" class="search-input" type="number" style="width:100px" value="' + desconto + '"><button class="btn btn-primary btn-sm" onclick="raCfgSalvarConfig(\'desconto_autorizada_perc\',document.getElementById(\'ra-cfg-desconto\').value)">Salvar</button></div></div>' +
    '<div class="table-card" style="padding:16px"><label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">Dia pagamento (mês seguinte)</label><div style="display:flex;gap:8px;margin-top:6px"><input id="ra-cfg-prazo" class="search-input" type="number" style="width:100px" value="' + prazoDia + '"><button class="btn btn-primary btn-sm" onclick="raCfgSalvarConfig(\'prazo_pagamento_dia\',document.getElementById(\'ra-cfg-prazo\').value)">Salvar</button></div></div></div>' +
    '<div style="font-weight:600;margin-bottom:12px">Teto de serviço por linha de produto</div>' +
    '<div class="table-card" style="margin-bottom:24px"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Linha</th><th>Valor máximo</th><th></th></tr></thead><tbody>' +
    tetos.map(function(t) {
      return '<tr><td>' + raLinhaNome(t.linha_produto) + '</td><td><input class="search-input" type="number" step="0.01" style="width:120px" value="' + (t.valor_maximo || 0) + '" id="ra-teto-' + t.id + '"></td><td><button class="btn btn-primary btn-sm" onclick="raCfgSalvarTeto(' + t.id + ')">Salvar</button></td></tr>';
    }).join('') + '</tbody></table></div></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:600">Prazo de garantia por linha / modelo</span><button class="btn btn-primary btn-sm" onclick="raCfgNovaGarantia()">+ Adicionar</button></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Linha</th><th>Modelo</th><th>Prazo (meses)</th><th>Descrição</th><th></th></tr></thead><tbody id="ra-gar-tbody"></tbody></table></div></div>';

  var tbody = document.getElementById('ra-gar-tbody');
  if (!gars.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma configuração</td></tr>'; return; }
  tbody.innerHTML = gars.map(function(g) {
    return '<tr><td>' + raLinhaNome(g.linha_produto) + '</td><td>' + (g.modelo || '<em>Toda a linha</em>') + '</td><td style="text-align:center;font-weight:600">' + g.prazo_meses + '</td><td>' + raEsc(g.descricao || '') + '</td><td><button class="btn-icon" onclick="raCfgEditarGarantia(' + g.id + ')">✏️</button></td></tr>';
  }).join('');
}

async function raCfgGarantia(box) {
  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span style="font-weight:600">Prazo de garantia por linha / modelo</span><button class="btn btn-primary btn-sm" onclick="raCfgNovaGarantia()">+ Adicionar</button></div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Linha</th><th>Modelo</th><th>Prazo (meses)</th><th>Descrição</th><th></th></tr></thead><tbody id="ra-gar-tbody"></tbody></table></div></div>';
  var gars = await raFetch('prt_garantia?ativo=eq.true&order=linha_produto.asc,modelo.asc&select=*');
  if (!Array.isArray(gars)) gars = [];
  await raGetLinhas();
  var tbody = document.getElementById('ra-gar-tbody');
  if (!gars.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma configuração</td></tr>'; return; }
  tbody.innerHTML = gars.map(function(g) {
    return '<tr><td>' + raLinhaNome(g.linha_produto) + '</td><td>' + (g.modelo || '<em>Toda a linha</em>') + '</td><td style="text-align:center;font-weight:600">' + g.prazo_meses + '</td><td>' + raEsc(g.descricao || '') + '</td><td><button class="btn-icon" onclick="raCfgEditarGarantia(' + g.id + ')">✏️</button></td></tr>';
  }).join('');
}

window.raCfgNovaGarantia = async function(g) {
  g = g || {};
  var linhas = await raGetLinhas();
  var linhaSel = g.linha_produto || (linhas[0] ? linhas[0].slug : '');
  var linhaOpts = linhas.map(function(l) {
    return '<option value="' + l.slug + '"' + (l.slug === linhaSel ? ' selected' : '') + '>' + raEsc(l.nome) + '</option>';
  }).join('');
  raModal(g.id ? 'Editar Garantia' : 'Nova Garantia',
    '<div class="field"><label>Linha</label><select id="ra-gar-linha" class="filter-select" style="width:100%" onchange="raGarPopularModelos()">' + linhaOpts + '</select></div>' +
    '<div class="field"><label>Modelo <span style="font-weight:400;color:var(--text-muted)">(Toda a linha = vale para todos os modelos)</span></label><select id="ra-gar-modelo" class="filter-select" style="width:100%"></select></div>' +
    '<div class="field"><label>Prazo (meses)</label><input id="ra-gar-prazo" class="search-input" style="width:100%" type="number" value="' + (g.prazo_meses || 12) + '"></div>' +
    '<div class="field"><label>Descrição</label><input id="ra-gar-desc" class="search-input" style="width:100%" value="' + raEsc(g.descricao || '') + '"></div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raCfgSalvarGarantia(' + (g.id || 0) + ')">Salvar</button>');
  await raGarPopularModelos(g.modelo || '');
};

// popula o select de modelos da garantia conforme a linha escolhida
window.raGarPopularModelos = async function(modeloAtual) {
  var linha = document.getElementById('ra-gar-linha')?.value || '';
  var sel = document.getElementById('ra-gar-modelo');
  if (!sel) return;
  var modelos = linha ? await raModelosDaLinha(linha) : [];
  // preserva valor legado (texto livre antigo) que não esteja na lista
  if (modeloAtual && modelos.indexOf(modeloAtual) === -1) modelos.push(modeloAtual);
  sel.innerHTML = '<option value="">Toda a linha</option>' + modelos.map(function(m) {
    return '<option value="' + raEsc(m) + '"' + (m === modeloAtual ? ' selected' : '') + '>' + raEsc(m) + '</option>';
  }).join('');
};
window.raCfgSalvarGarantia = async function(id) {
  var d = { linha_produto: document.getElementById('ra-gar-linha').value, modelo: document.getElementById('ra-gar-modelo').value || null, prazo_meses: parseInt(document.getElementById('ra-gar-prazo').value) || 12, descricao: document.getElementById('ra-gar-desc').value.trim() || null };
  if (id) { await raPatch('prt_garantia', 'id=eq.' + id, d); } else { await raPost('prt_garantia', d); }
  document.getElementById('ra-modal')?.remove();
  raCfgTab('financeiro');
};
window.raCfgEditarGarantia = async function(id) {
  var gars = await raFetch('prt_garantia?id=eq.' + id); var g = Array.isArray(gars) && gars[0] ? gars[0] : {};
  raCfgNovaGarantia(g);
};

async function raCfgPrecos(box) {
  var cfg = await raFetch('prt_configuracoes?select=*');
  if (!Array.isArray(cfg)) cfg = [];
  var cfgMap = {}; cfg.forEach(function(c) { cfgMap[c.chave] = c.valor; });
  var desconto = cfgMap.desconto_autorizada_perc || '15';
  var prazoDia = cfgMap.prazo_pagamento_dia || '10';
  var tetos = await raFetch('prt_teto_produto?order=linha_produto.asc&select=*');
  if (!Array.isArray(tetos)) tetos = [];
  await raGetLinhas();

  box.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">' +
    '<div class="table-card" style="padding:16px"><label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">Desconto compra peças (%)</label><div style="display:flex;gap:8px;margin-top:6px"><input id="ra-cfg-desconto" class="search-input" type="number" style="width:100px" value="' + desconto + '"><button class="btn btn-primary btn-sm" onclick="raCfgSalvarConfig(\'desconto_autorizada_perc\',document.getElementById(\'ra-cfg-desconto\').value)">Salvar</button></div></div>' +
    '<div class="table-card" style="padding:16px"><label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted)">Dia pagamento (mês seguinte)</label><div style="display:flex;gap:8px;margin-top:6px"><input id="ra-cfg-prazo" class="search-input" type="number" style="width:100px" value="' + prazoDia + '"><button class="btn btn-primary btn-sm" onclick="raCfgSalvarConfig(\'prazo_pagamento_dia\',document.getElementById(\'ra-cfg-prazo\').value)">Salvar</button></div></div></div>' +
    '<div style="font-weight:600;margin-bottom:12px">Teto de serviço por linha de produto</div>' +
    '<div class="table-card"><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Linha</th><th>Valor máximo</th><th></th></tr></thead><tbody>' +
    tetos.map(function(t) {
      return '<tr><td>' + raLinhaNome(t.linha_produto) + '</td><td><input class="search-input" type="number" step="0.01" style="width:120px" value="' + (t.valor_maximo || 0) + '" id="ra-teto-' + t.id + '"></td><td><button class="btn btn-primary btn-sm" onclick="raCfgSalvarTeto(' + t.id + ')">Salvar</button></td></tr>';
    }).join('') + '</tbody></table></div></div>';
}

window.raCfgSalvarConfig = async function(chave, valor) {
  await raPatch('prt_configuracoes', 'chave=eq.' + chave, { valor: valor, atualizado_em: new Date().toISOString() });
  raLog('ACAO','config','SALVAR_CONFIG',chave,valor);
  alert('Salvo!');
};

window.raCfgSalvarTeto = async function(id) {
  var val = parseFloat(document.getElementById('ra-teto-' + id).value) || 0;
  await raPatch('prt_teto_produto', 'id=eq.' + id, { valor_maximo: val });
  raLog('ACAO','config','SALVAR_TETO',String(id),null,{valor:val});
  alert('Teto atualizado!');
};

// helper raCfgCarregar — agora é sub-modal dentro de servicos
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
  await raGetLinhas();
  document.getElementById('ra-cfg-count').textContent = _raCfgCategorias.length + ' categorias';

  if (!_raCfgCategorias.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma categoria cadastrada</td></tr>';
    return;
  }
  tbody.innerHTML = _raCfgCategorias.map(function(c) {
    var qtd = contagem[c.id] || 0;
    return '<tr>' +
      '<td style="text-align:center;font-weight:600">' + c.ordem + '</td>' +
      '<td style="font-weight:600;cursor:pointer;color:var(--primary)" onclick="raCfgNovaCategoria(_raCfgCategorias.find(function(x){return x.id===' + c.id + '}))" title="Editar">' + c.nome + ' ✏️</td>' +
      '<td>' + raLinhaNome(c.linha_produto) + '</td>' +
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

window.raCfgNovaCategoria = async function(cat) {
  cat = cat || {};
  var linhaOptsCat = await raLinhaOptionsHtml(cat.linha_produto || '');
  raModal(cat.id ? 'Editar Categoria' : 'Nova Categoria',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Linha</label><select id="ra-cfg-linha-new" class="filter-select" style="width:100%">' + linhaOptsCat + '</select></div>' +
      '<div class="field"><label>Ordem</label><input id="ra-cfg-ordem" class="search-input" style="width:100%" type="number" min="1" value="' + (cat.ordem || _raCfgCategorias.length + 1) + '"></div>' +
    '</div>' +
    '<div class="field"><label>Nome da categoria</label><input id="ra-cfg-nome" class="search-input" style="width:100%" placeholder="Ex: Intervenções Elétricas" value="' + (cat.nome || '') + '"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div class="field"><label>Prefixo do código <span style="font-weight:400;color:var(--text-muted)">(2 letras, ex: GE)</span></label><input id="ra-cfg-prefixo" class="search-input" maxlength="3" placeholder="GE" value="' + (cat.prefixo_codigo || '') + '"' + (cat.id ? ' readonly style="width:100%;background:var(--surface2);cursor:not-allowed;text-transform:uppercase"' : ' style="width:100%;text-transform:uppercase"') + '></div>' +
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

  // Validar teto: não pode ser menor que o maior serviço do grupo
  if (id && d.valor_teto > 0) {
    var servicos = await raFetch('prt_tabela_servicos?categoria_id=eq.' + id + '&ativo=eq.true&select=valor,descricao&order=valor.desc&limit=1');
    if (Array.isArray(servicos) && servicos.length) {
      var maiorValor = parseFloat(servicos[0].valor) || 0;
      if (d.valor_teto < maiorValor) {
        alert('Teto não pode ser menor que o maior serviço do grupo!\n\nServiço mais caro: ' + servicos[0].descricao + ' — ' + raFmt(maiorValor) + '\nTeto informado: ' + raFmt(d.valor_teto) + '\n\nAumente o teto para no mínimo ' + raFmt(maiorValor));
        return;
      }
    }
  }

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
// SUB-ABA: LINHAS E MODELOS — CRUD
// ═══════════════════════════════════════
async function raCfgLinhas(box) {
  raInvalidarLinhasCache();
  var linhas = await raGetLinhas(true);
  var modelos = await raGetModelos(true);

  // agrupar modelos por linha_id
  var modelosPorLinha = {};
  modelos.forEach(function(m) { if (!modelosPorLinha[m.linha_id]) modelosPorLinha[m.linha_id] = []; modelosPorLinha[m.linha_id].push(m); });

  var cards = linhas.map(function(l) {
    var mods = modelosPorLinha[l.id] || [];
    var ativosCount = mods.filter(function(m) { return m.ativo; }).length;
    return '<div class="table-card" style="padding:16px;margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<div>' +
          '<span style="font-weight:700;font-size:15px">' + raEsc(l.nome) + '</span>' +
          (l.nome_curto ? ' <span style="color:var(--text-muted);font-size:12px">(' + raEsc(l.nome_curto) + ')</span>' : '') +
          ' <span class="mono" style="font-size:11px;color:var(--text-muted)">' + l.slug + '</span>' +
          (!l.ativo ? ' <span class="badge badge-gray" style="margin-left:4px">Inativa</span>' : '') +
        '</div>' +
        '<div style="display:flex;gap:4px">' +
          '<button class="btn-icon" title="Editar linha" onclick="raCfgEditarLinha(' + l.id + ')">✏️</button>' +
          '<button class="btn-icon" title="' + (l.ativo ? 'Desativar' : 'Ativar') + '" onclick="raCfgToggleLinha(' + l.id + ',' + !l.ativo + ')">' + (l.ativo ? '🚫' : '✅') + '</button>' +
          '<button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="raCfgNovoModelo(' + l.id + ')">+ Modelo</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        (mods.length ? mods.map(function(m) {
          return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;border:1px solid ' + (m.ativo ? 'var(--blue-mid)' : 'var(--border)') + ';font-size:12px;background:' + (m.ativo ? 'var(--blue-pale)' : 'var(--surface2)') + ';' + (!m.ativo ? 'opacity:.5;text-decoration:line-through' : '') + '">' + raEsc(m.nome) +
            ' <button class="btn-icon" style="font-size:10px;padding:0" onclick="raCfgEditarModelo(' + m.id + ')">✏️</button>' +
            ' <button class="btn-icon" style="font-size:10px;padding:0" onclick="raCfgToggleModelo(' + m.id + ',' + !m.ativo + ')">' + (m.ativo ? '🚫' : '✅') + '</button></span>';
        }).join('') : '<span style="font-size:12px;color:var(--text-muted)">Nenhum modelo cadastrado</span>') +
      '</div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-top:8px">' + ativosCount + ' modelo' + (ativosCount !== 1 ? 's' : '') + ' ativo' + (ativosCount !== 1 ? 's' : '') + ' · Ordem: ' + l.ordem + '</div>' +
    '</div>';
  }).join('');

  box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
    '<span style="font-weight:600">Linhas de produto e modelos</span>' +
    '<button class="btn btn-primary btn-sm" onclick="raCfgNovaLinha()">+ Nova linha</button></div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Estas linhas e modelos alimentam todos os selects e checkboxes do portal e da gestão. Alterações são refletidas imediatamente.</p>' +
    cards;
}

// CRUD Linha
window.raCfgNovaLinha = function(l) {
  l = l || {};
  raModal(l.id ? 'Editar Linha' : 'Nova Linha',
    '<div class="field"><label>Nome</label><input id="ra-lp-nome" class="search-input" style="width:100%" value="' + raEsc(l.nome || '') + '" placeholder="Ex: Ar Condicionado"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">' +
      '<div class="field"><label>Slug <span style="font-weight:400;color:var(--text-muted)">(chave única)</span></label><input id="ra-lp-slug" class="search-input" style="width:100%;' + (l.id ? 'background:var(--surface2);cursor:not-allowed' : '') + '" value="' + raEsc(l.slug || '') + '" placeholder="ar_condicionado"' + (l.id ? ' readonly' : '') + '></div>' +
      '<div class="field"><label>Nome curto</label><input id="ra-lp-curto" class="search-input" style="width:100%" value="' + raEsc(l.nome_curto || '') + '" placeholder="AR"></div>' +
      '<div class="field"><label>Ordem</label><input id="ra-lp-ordem" class="search-input" style="width:100%" type="number" value="' + (l.ordem || '') + '"></div>' +
    '</div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raCfgSalvarLinha(' + (l.id || 0) + ')">Salvar</button>');
};

window.raCfgSalvarLinha = async function(id) {
  var nome = document.getElementById('ra-lp-nome').value.trim();
  var slug = document.getElementById('ra-lp-slug').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  var curto = document.getElementById('ra-lp-curto').value.trim() || null;
  var ordem = parseInt(document.getElementById('ra-lp-ordem').value) || 1;
  if (!nome || !slug) { alert('Nome e slug são obrigatórios'); return; }
  var d = { nome: nome, slug: slug, nome_curto: curto, ordem: ordem };
  if (id) { await raPatch('prt_linhas_produto', 'id=eq.' + id, d); }
  else { await raPost('prt_linhas_produto', d); }
  raLog('ACAO', 'linha_produto', id ? 'EDITAR_LINHA' : 'CRIAR_LINHA', String(id || ''), nome, d);
  raInvalidarLinhasCache();
  document.getElementById('ra-modal')?.remove();
  raCfgTab('linhas');
};

window.raCfgEditarLinha = async function(id) {
  var linhas = await raGetLinhas(true);
  var l = linhas.find(function(x) { return x.id === id; });
  if (!l) return;
  raCfgNovaLinha(l);
};

window.raCfgToggleLinha = async function(id, ativo) {
  await raPatch('prt_linhas_produto', 'id=eq.' + id, { ativo: ativo });
  raLog('ACAO', 'linha_produto', ativo ? 'ATIVAR_LINHA' : 'DESATIVAR_LINHA', String(id));
  raInvalidarLinhasCache();
  raCfgTab('linhas');
};

// CRUD Modelo
window.raCfgNovoModelo = function(linhaId, m) {
  m = m || {};
  raModal(m.id ? 'Editar Modelo' : 'Novo Modelo',
    '<div class="field"><label>Nome do modelo</label><input id="ra-mp-nome" class="search-input" style="width:100%" value="' + raEsc(m.nome || '') + '" placeholder="Ex: Adventure 45L Dual Zone"></div>' +
    '<div class="field"><label>Ordem</label><input id="ra-mp-ordem" class="search-input" style="width:100%" type="number" value="' + (m.ordem || '') + '"></div>' +
    '<input type="hidden" id="ra-mp-linha-id" value="' + (m.linha_id || linhaId || '') + '">',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raCfgSalvarModelo(' + (m.id || 0) + ')">Salvar</button>');
};

window.raCfgSalvarModelo = async function(id) {
  var nome = document.getElementById('ra-mp-nome').value.trim();
  var ordem = parseInt(document.getElementById('ra-mp-ordem').value) || 1;
  var linhaId = parseInt(document.getElementById('ra-mp-linha-id').value);
  if (!nome) { alert('Nome é obrigatório'); return; }
  var d = { nome: nome, ordem: ordem, linha_id: linhaId };
  if (id) { await raPatch('prt_modelos_produto', 'id=eq.' + id, d); }
  else { await raPost('prt_modelos_produto', d); }
  raLog('ACAO', 'modelo_produto', id ? 'EDITAR_MODELO' : 'CRIAR_MODELO', String(id || ''), nome, d);
  raInvalidarLinhasCache();
  document.getElementById('ra-modal')?.remove();
  raCfgTab('linhas');
};

window.raCfgEditarModelo = async function(id) {
  var modelos = await raGetModelos(true);
  var m = modelos.find(function(x) { return x.id === id; });
  if (!m) return;
  raCfgNovoModelo(m.linha_id, m);
};

window.raCfgToggleModelo = async function(id, ativo) {
  await raPatch('prt_modelos_produto', 'id=eq.' + id, { ativo: ativo });
  raLog('ACAO', 'modelo_produto', ativo ? 'ATIVAR_MODELO' : 'DESATIVAR_MODELO', String(id));
  raInvalidarLinhasCache();
  raCfgTab('linhas');
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



// ===== PDF DA TABELA DE SERVIÇOS =====
window.raAbrirModalPdfServicos = async function() {
  await raGetLinhas();
  var categorias = await raFetch('prt_categorias_servico?ativo=eq.true&order=linha_produto.asc,ordem.asc&select=*');
  if (!Array.isArray(categorias) || !categorias.length) { alert('Nenhuma categoria cadastrada'); return; }
  var tetos = await raFetch('prt_teto_produto?ativo=eq.true&select=*');
  if (!Array.isArray(tetos)) tetos = [];
  var tetoMap = {}; tetos.forEach(function(t) { tetoMap[t.linha_produto] = t.valor_maximo; });

  // Agrupar categorias por linha
  var porLinha = {};
  categorias.forEach(function(c) {
    if (!porLinha[c.linha_produto]) porLinha[c.linha_produto] = [];
    porLinha[c.linha_produto].push(c);
  });

  var html = '<div style="margin-bottom:16px;font-size:13px;color:var(--text-muted)">Selecione as categorias que deseja incluir no PDF:</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:16px"><button class="btn btn-secondary btn-sm" onclick="document.querySelectorAll(\'.ra-pdf-cat-check\').forEach(function(c){c.checked=true})">Selecionar tudo</button><button class="btn btn-secondary btn-sm" onclick="document.querySelectorAll(\'.ra-pdf-cat-check\').forEach(function(c){c.checked=false})">Desmarcar tudo</button></div>';

  for (var linha in porLinha) {
    var cats = porLinha[linha];
    var tetoLinha = tetoMap[linha] || 0;
    html += '<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--primary);color:#fff;border-radius:var(--radius-sm);margin-bottom:6px">';
    html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600;font-size:13px"><input type="checkbox" class="ra-pdf-linha-check" data-linha="' + linha + '" checked onchange="raToggleLinhaPdf(this,\'' + linha + '\')"> ' + raLinhaNome(linha) + '</label>';
    html += (tetoLinha ? '<span style="font-size:11px;opacity:.8">Teto produto: ' + raFmt(tetoLinha) + '</span>' : '') + '</div>';
    cats.forEach(function(c) {
      html += '<label style="display:flex;align-items:center;gap:8px;padding:4px 10px 4px 24px;cursor:pointer;font-size:13px"><input type="checkbox" class="ra-pdf-cat-check" data-cat-id="' + c.id + '" data-linha="' + c.linha_produto + '" checked> ' + c.nome + ' <span style="color:var(--text-muted);font-size:11px">(teto ' + raFmt(c.valor_teto) + ')</span></label>';
    });
    html += '</div>';
  }

  raModal('Gerar PDF — Tabela de Serviços', html,
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raGerarPdfServicos()">📄 Gerar PDF</button>'
  );
};

window.raToggleLinhaPdf = function(el, linha) {
  var checks = document.querySelectorAll('.ra-pdf-cat-check[data-linha="' + linha + '"]');
  checks.forEach(function(c) { c.checked = el.checked; });
};

window.raGerarPdfServicos = async function() {
  // Pegar categorias selecionadas do modal
  var catChecks = document.querySelectorAll('.ra-pdf-cat-check:checked');
  var catIdsSelecionados = [];
  catChecks.forEach(function(c) { catIdsSelecionados.push(parseInt(c.dataset.catId)); });

  if (!catIdsSelecionados.length) { alert('Selecione pelo menos uma categoria'); return; }

  document.getElementById('ra-modal')?.remove();

  await raGetLinhas();
  var todasLinhas = (_raLinhas || []).filter(function(x) { return x.ativo; });

  var categorias = await raFetch('prt_categorias_servico?ativo=eq.true&order=ordem.asc&select=*');
  if (!Array.isArray(categorias)) categorias = [];
  // Filtrar só as selecionadas
  categorias = categorias.filter(function(c) { return catIdsSelecionados.indexOf(c.id) >= 0; });

  var servicos = await raFetch('prt_tabela_servicos?ativo=eq.true&order=codigo.asc&select=*');
  if (!Array.isArray(servicos)) servicos = [];

  // Linhas que têm pelo menos uma categoria selecionada
  var linhasUsadas = {};
  categorias.forEach(function(c) { linhasUsadas[c.linha_produto] = true; });
  var linhas = todasLinhas.filter(function(l) { return linhasUsadas[l.slug]; }).map(function(l) { return l.slug; });

  var porLinha = {};
  linhas.forEach(function(l) { porLinha[l] = []; });
  categorias.forEach(function(c) {
    if (!porLinha[c.linha_produto]) return;
    var items = servicos.filter(function(s) {
      return (s.categoria_id === c.id) || (s.linha_produto === c.linha_produto && s.categoria === c.slug);
    });
    if (items.length) porLinha[c.linha_produto].push({ cat: c, items: items });
  });

  var totalCats = categorias.length;
  var titulo = totalCats === 1 ? categorias[0].nome : (linhas.length === 1 ? raLinhaNome(linhas[0]) : 'Seleção Personalizada');
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tabela de Serviços Stonni — ' + titulo + '</title><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#222;padding:20px 25px}' +
    '@page{size:A4;margin:15mm 12mm}' +
    '.header{text-align:center;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #0B1426}' +
    '.header h1{font-size:18px;color:#0B1426;letter-spacing:1px}' +
    '.header p{font-size:11px;color:#666;margin-top:4px}' +
    '.header .subtitle{font-size:13px;font-weight:bold;color:#0B1426;margin-top:8px}' +
    '.linha-header{background:#0B1426;color:#fff;padding:8px 12px;font-size:14px;font-weight:700;margin-top:20px;margin-bottom:0;border-radius:4px 4px 0 0}' +
    '.cat-header{background:#E8EDF3;padding:6px 12px;font-size:11px;font-weight:700;color:#0B1426;border-bottom:1px solid #ccc;display:flex;justify-content:space-between;align-items:center}' +
    '.cat-header .teto{background:#0B1426;color:#4FC3F7;padding:2px 10px;border-radius:10px;font-size:10px}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:2px}' +
    'table th{text-align:left;padding:5px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:1px solid #ddd;background:#fafafa}' +
    'table td{padding:5px 8px;border-bottom:1px solid #eee;font-size:11px}' +
    '.codigo{font-weight:700;color:#0B1426;font-family:Consolas,monospace;font-size:10px}' +
    '.valor{text-align:right;font-weight:700;color:#0B1426;font-size:12px}' +
    '.resumo{margin-top:24px;border:2px solid #0B1426;border-radius:6px;padding:12px 16px;page-break-inside:avoid}' +
    '.resumo h3{font-size:12px;color:#0B1426;margin-bottom:8px}' +
    '.resumo-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}' +
    '.resumo-item{background:#f5f8fa;padding:8px 12px;border-radius:4px;text-align:center;min-width:120px}' +
    '.resumo-item .label{font-size:9px;text-transform:uppercase;color:#888;font-weight:700}' +
    '.resumo-item .value{font-size:16px;font-weight:700;color:#0B1426;margin-top:2px}' +
    '.footer{margin-top:30px;text-align:center;font-size:9px;color:#999;border-top:1px solid #ddd;padding-top:8px}' +
    '.confidencial{text-align:center;font-size:9px;color:#c00;font-weight:700;margin-top:6px}' +
    '@media print{body{padding:0}}' +
  '</style></head><body>';

  html += '<div class="header"><h1>STONNI</h1><p>Rede de Assistência Técnica Autorizada</p>' +
    '<div class="subtitle">Tabela de Serviços e Valores — ' + titulo + '</div>' +
    '<p>Vigência: Julho/2026 | Documento confidencial</p></div>';

  var totalServicos = 0;
  linhas.forEach(function(linha) {
    var grupos = porLinha[linha];
    if (!grupos || !grupos.length) return;
    html += '<div class="linha-header">📦 ' + raLinhaNome(linha).toUpperCase() + '</div>';
    grupos.forEach(function(g) {
      var teto = parseFloat(g.cat.valor_teto) || 0;
      html += '<div class="cat-header"><span>' + g.cat.nome + ' (' + g.items.length + ' serviços)</span><span class="teto">Teto: R$ ' + teto.toFixed(2).replace('.', ',') + '</span></div>';
      html += '<table><thead><tr><th style="width:90px">Código</th><th>Descrição</th><th style="width:100px;text-align:right">Valor</th></tr></thead><tbody>';
      g.items.forEach(function(s) {
        html += '<tr><td class="codigo">' + s.codigo + '</td><td>' + s.descricao + '</td><td class="valor">R$ ' + (parseFloat(s.valor) || 0).toFixed(2).replace('.', ',') + '</td></tr>';
        totalServicos++;
      });
      html += '</tbody></table>';
    });
  });

  html += '<div class="confidencial">DOCUMENTO CONFIDENCIAL — USO EXCLUSIVO DA REDE AUTORIZADA STONNI</div>';
  html += '<div class="footer">Stonni — Grupo Bononi Acessórios — ' + totalServicos + ' serviços — Emitido em ' + new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR') + '</div>';
  html += '</body></html>';

  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(function() { w.print(); }, 600);
  raLog('ACAO', 'servico', 'GERAR_PDF_SERVICOS', linhaFiltro || 'todas');
};

// ═══════════════════════════════════════
// PARCEIROS AUTORIZADOS — credenciamento + login/senha
// ═══════════════════════════════════════
var _raParceiros = [];
var _raParceirosLogin = {};

// Abre o drawer completo do parceiro (mesmo da aba Assistência > Parceiros)
window.raAbrirDrawerParceiro = async function(id) {
  if (!window.astParceiros) { raToast('Módulo de parceiros não carregado', 'erro'); return; }
  if (!Array.isArray(astParceiros._dados) || !astParceiros._dados.length) {
    var results = await Promise.all([
      raFetch('assist_parceiros?order=nome.asc&select=*&limit=10000'),
      raFetch('assist_parceiro_tags?ativo=eq.true&order=nome.asc&select=*'),
      raFetch('assist_parceiro_produtos?select=*&limit=10000')
    ]);
    var parceiros = Array.isArray(results[0]) ? results[0] : [];
    var tags = Array.isArray(results[1]) ? results[1] : [];
    var prods = Array.isArray(results[2]) ? results[2] : [];
    astParceiros._dados = parceiros.map(function(p) {
      p.tags = prods.filter(function(pr) { return pr.parceiro_id === p.id; }).map(function(pr) { return pr.produto_tag; });
      return p;
    });
    astParceiros._tagsList = tags;
  }
  astParceiros.abrirDrawer(id);
};

window.raCarregarParceiros = async function() {
  var parceiros = await raFetch('assist_parceiros?credenciado=eq.true&order=nome.asc&select=id,nome,responsavel,cidade,uf,telefone,whatsapp,email,data_credenciamento,credenciado');
  _raParceiros = Array.isArray(parceiros) ? parceiros : [];
  
  // Buscar logins de todos credenciados
  var logins = await raFetch('prt_usuarios?ativo=eq.true&select=parceiro_id,senha_inicial,perfil');
  _raParceirosLogin = {};
  if (Array.isArray(logins)) logins.forEach(function(l) { _raParceirosLogin[l.parceiro_id] = l; });

  // KPIs
  var kpis = document.getElementById('ra-parc-kpis');
  if (kpis) kpis.innerHTML =
    '<div class="card"><div class="card-label">Autorizadas ativas</div><div class="card-value green">' + _raParceiros.length + '</div></div>' +
    '<div class="card"><div class="card-label">Com login criado</div><div class="card-value blue">' + Object.keys(_raParceirosLogin).length + '</div></div>' +
    '<div class="card"><div class="card-label">Total parceiros</div><div class="card-value">' + 252 + '</div></div>';

  raFiltrarParceiros();
};

window.raFiltrarParceiros = function() {
  var busca = (document.getElementById('ra-parc-busca')?.value || '').toLowerCase();
  var lista = _raParceiros.filter(function(p) {
    if (busca && (p.nome + ' ' + (p.cidade||'') + ' ' + (p.responsavel||'')).toLowerCase().indexOf(busca) === -1) return false;
    return true;
  });
  var count = document.getElementById('ra-parc-count');
  if (count) count.textContent = lista.length + ' parceiros';
  var tbody = document.getElementById('ra-parc-tbody');
  if (!lista.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum parceiro autorizado ainda. Use "Credenciar novo" para começar.</td></tr>'; return; }
  tbody.innerHTML = lista.map(function(p) {
    var login = _raParceirosLogin[p.id];
    var senha = login ? login.senha_inicial : '—';
    return '<tr>' +
      '<td style="font-weight:600;cursor:pointer" title="Ver detalhes do parceiro" onclick="raAbrirDrawerParceiro(' + p.id + ')">⭐ ' + p.nome + '</td>' +
      '<td>' + (p.cidade||'') + '/' + (p.uf||'') + '</td>' +
      '<td>' + (p.responsavel||'—') + '</td>' +
      '<td>' + (p.whatsapp ? '<a href="https://wa.me/' + (p.whatsapp||'').replace(/\D/g,'') + '" target="_blank" style="color:var(--green)">' + p.whatsapp + '</a>' : (p.telefone||'—')) + '</td>' +
      '<td style="font-size:12px">' + (p.email||'—') + '</td>' +
      '<td style="font-family:monospace;font-weight:700;letter-spacing:1px">' + senha + ' ' +
        (senha !== '—' ? '<button class="btn-icon" title="Copiar senha" onclick="navigator.clipboard.writeText(\'' + senha + '\');this.textContent=\'✅\'">📋</button>' : '') + '</td>' +
      '<td style="font-size:12px">' + raDate(p.data_credenciamento) + '</td>' +
      '<td><button class="btn-icon" title="Copiar msg boas-vindas" onclick="raCopiarBoasVindas(\'' + raEsc(p.nome) + '\',\'' + raEsc(p.email) + '\',\'' + raEsc(senha) + '\')">📋</button> ' +
        (p.whatsapp ? '<button class="btn-icon" title="Enviar WhatsApp" onclick="raEnviarWhatsBoasVindas(\'' + raEsc(p.whatsapp) + '\',\'' + raEsc(p.nome) + '\',\'' + raEsc(p.email) + '\',\'' + raEsc(senha) + '\')">📱</button> ' : '') +
        '<button class="btn-icon" title="Descredenciar" onclick="raDescredenciar(' + p.id + ',\'' + raEsc(p.nome) + '\')">❌</button></td></tr>';
  }).join('');
};

window.raCredenciarNovo = async function() {
  // Buscar parceiros NÃO credenciados
  var todos = await raFetch('assist_parceiros?credenciado=eq.false&status=eq.ativo&order=nome.asc&select=id,nome,cidade,uf,email,responsavel');
  if (!Array.isArray(todos)) todos = [];
  
  var listaHtml = todos.length
    ? '<div style="max-height:300px;overflow-y:auto">' + todos.map(function(p) {
        return '<div style="padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:13px" onmouseover="this.style.background=\'var(--blue-pale)\'" onmouseout="this.style.background=\'\'" onclick="raIniciarCredenciamento(' + p.id + ')">' +
          '<div><strong>' + p.nome + '</strong><br><span style="font-size:11px;color:var(--text-muted)">' + (p.cidade||'') + '/' + (p.uf||'') + ' · ' + (p.responsavel||'') + '</span></div>' +
          '<button class="btn btn-primary btn-sm" style="font-size:11px">⭐ Credenciar</button></div>';
      }).join('') + '</div>'
    : '<div style="padding:20px;text-align:center;color:var(--text-muted)">Nenhum parceiro ativo disponível para credenciamento</div>';

  raModal('Credenciar Parceiro', 
    '<div class="field"><label>Buscar</label><input class="search-input" id="ra-cred-busca" style="width:100%" placeholder="Nome do parceiro..." oninput="raFiltrarCredBusca()"></div>' +
    '<div id="ra-cred-lista">' + listaHtml + '</div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Fechar</button>');
  
  // Guardar lista pra filtro
  window._raCredTodos = todos;
};

window.raFiltrarCredBusca = function() {
  var busca = (document.getElementById('ra-cred-busca')?.value || '').toLowerCase();
  var todos = window._raCredTodos || [];
  var filtrados = busca ? todos.filter(function(p) { return (p.nome + ' ' + (p.cidade||'')).toLowerCase().indexOf(busca) > -1; }) : todos;
  var box = document.getElementById('ra-cred-lista');
  if (!filtrados.length) { box.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">Nenhum resultado</div>'; return; }
  box.innerHTML = '<div style="max-height:300px;overflow-y:auto">' + filtrados.map(function(p) {
    return '<div style="padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-size:13px" onmouseover="this.style.background=\'var(--blue-pale)\'" onmouseout="this.style.background=\'\'" onclick="raIniciarCredenciamento(' + p.id + ')">' +
      '<div><strong>' + p.nome + '</strong><br><span style="font-size:11px;color:var(--text-muted)">' + (p.cidade||'') + '/' + (p.uf||'') + '</span></div>' +
      '<button class="btn btn-primary btn-sm" style="font-size:11px">⭐ Credenciar</button></div>';
  }).join('') + '</div>';
};

window.raIniciarCredenciamento = function(id) {
  var p = (window._raCredTodos || []).find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById('ra-modal')?.remove();
  
  raModal('Credenciar: ' + p.nome,
    '<div style="font-size:13px;margin-bottom:16px">' +
      '<p><strong>' + p.nome + '</strong></p>' +
      '<p style="color:var(--text-muted)">' + (p.cidade||'') + '/' + (p.uf||'') + ' · ' + (p.responsavel||'') + '</p>' +
    '</div>' +
    '<div class="field"><label>E-mail para login (obrigatório)</label><input class="search-input" id="ra-cred-email" style="width:100%" placeholder="email@parceiro.com" value="' + (p.email || '') + '"></div>' +
    '<div style="background:var(--surface2);border-radius:8px;padding:12px;margin-top:12px;font-size:12px;color:var(--text-muted)">' +
      '🔑 Uma senha será gerada automaticamente e ficará visível aqui na gestão.<br>' +
      '📧 O parceiro usará o e-mail + senha para acessar <strong>parceiro-stonni.vercel.app</strong>' +
    '</div>',
    '<button class="btn btn-secondary" onclick="document.getElementById(\'ra-modal\').remove()">Cancelar</button>' +
    '<button class="btn btn-primary" onclick="raConfirmarCredenciamento(' + id + ')">⭐ Confirmar credenciamento</button>');
};

window.raConfirmarCredenciamento = async function(id) {
  var email = document.getElementById('ra-cred-email')?.value?.trim();
  if (!email || email.indexOf('@') === -1) { alert('Informe um e-mail válido'); return; }

  // Gerar senha legível
  var palavras = ['Stonni','Solar','Truck','Road','Cool','Frost','Power','Drive','Fleet','Route'];
  var senha = palavras[Math.floor(Math.random()*palavras.length)] + Math.floor(100 + Math.random()*900) + '!';

  try {
    // 1. Criar usuário no Supabase Auth via Edge Function (admin, sem envio de e-mail)
    // Manda o token da SESSÃO do usuário logado (não a anon key) — a function só
    // credencia se quem chamou for admin ou tiver o módulo 'assistencia'.
    var _sess = await sb.auth.getSession();
    var _tk = _sess && _sess.data && _sess.data.session && _sess.data.session.access_token;
    if (!_tk) throw new Error('Sessão expirada — saia e entre de novo na Gestão');

    var authRes = await fetch(SB_URL + '/functions/v1/credenciar-parceiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + _tk },
      body: JSON.stringify({ email: email, password: senha })
    });
    var authData = await authRes.json();
    if (!authRes.ok || authData.error) throw new Error(authData.error || 'Erro ao criar usuário');
    var userId = authData.user_id;
    if (!userId) throw new Error('User ID não retornado');

    // 2. Vincular na prt_usuarios com senha salva
    await raPost('prt_usuarios', { user_id: userId, parceiro_id: id, perfil: 'parceiro', senha_inicial: senha });

    // 3. Marcar como credenciado
    await raPatch('assist_parceiros', 'id=eq.' + id, {
      credenciado: true, data_credenciamento: new Date().toISOString(), email: email
    });

    raLog('ACAO', 'parceiro', 'CREDENCIAR', String(id), email, { senha: senha });

    document.getElementById('ra-modal')?.remove();

    // Mostrar resultado com senha
    raModal('✅ Parceiro credenciado!',
      '<div style="text-align:center;padding:12px">' +
        '<div style="font-size:40px;margin-bottom:12px">⭐</div>' +
        '<div style="font-size:15px;font-weight:700;margin-bottom:16px">Acesso criado com sucesso</div>' +
        '<div style="background:var(--surface2);border-radius:8px;padding:16px;text-align:left;font-size:14px">' +
          '<div style="margin-bottom:8px">📧 Login: <strong>' + email + '</strong></div>' +
          '<div style="margin-bottom:8px;display:flex;align-items:center;gap:8px">🔑 Senha: <strong style="font-family:monospace;font-size:16px;letter-spacing:1px">' + senha + '</strong> <button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="navigator.clipboard.writeText(\'' + senha + '\');this.textContent=\'✅ Copiada!\'">📋 Copiar</button></div>' +
          '<div style="font-size:12px;color:var(--text-muted)">Portal: parceiro-stonni.vercel.app</div>' +
        '</div>' +
      '</div>',
      '<button class="btn btn-primary" onclick="document.getElementById(\'ra-modal\').remove();raCarregarParceiros()">Fechar</button>');

    // Guardar dados pra botões do modal
    window._ultimoCred = { nome: ((window._raCredTodos||[]).find(function(x){return x.id===id})||{}).nome || '', email: email, senha: senha, whatsapp: ((window._raCredTodos||[]).find(function(x){return x.id===id})||{}).whatsapp || '' };

    // Adicionar botões de mensagem no modal
    var modalBody = document.querySelector('#ra-modal .modal-body');
    if (modalBody) {
      var btnsDiv = document.createElement('div');
      btnsDiv.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:16px';
      btnsDiv.innerHTML = '<button class="btn btn-secondary btn-sm" onclick="raCopiarBoasVindas(window._ultimoCred.nome,window._ultimoCred.email,window._ultimoCred.senha)">📋 Copiar msg boas-vindas</button>' +
        (window._ultimoCred.whatsapp ? '<button class="btn btn-sm" style="background:#25D366;color:#fff" onclick="raEnviarWhatsBoasVindas(window._ultimoCred.whatsapp,window._ultimoCred.nome,window._ultimoCred.email,window._ultimoCred.senha)">📱 Enviar WhatsApp</button>' : '');
      modalBody.appendChild(btnsDiv);
    }

  } catch(e) {
    console.error('Credenciamento:', e);
    alert('Erro ao credenciar: ' + e.message);
  }
};

window.raDescredenciar = async function(id, nome) {
  if (!confirm('Remover credenciamento de ' + nome + '?\nO login será desativado.')) return;
  await raPatch('prt_usuarios', 'parceiro_id=eq.' + id, { ativo: false });
  await raPatch('assist_parceiros', 'id=eq.' + id, { credenciado: false });
  raLog('ACAO', 'parceiro', 'DESCREDENCIAR', String(id), nome);
  raCarregarParceiros();
};

// ═══════════════════════════════════════
// CONFIG: DADOS DA EMPRESA
// ═══════════════════════════════════════
// ═══ EMPRESA GERAL (junta Dados Empresa + Textos/Prazos + Boas-vindas) ═══
async function raCfgEmpresaGeral(box) {
  box.innerHTML = '<div class="loading-full"><span class="spinner"></span> Carregando...</div>';
  // Buscar todas as configs de uma vez
  var cfgs = {};
  try {
    var r = await raFetch('prt_configuracoes?select=chave,valor');
    if (Array.isArray(r)) r.forEach(function(c) { cfgs[c.chave] = c.valor || ''; });
  } catch(e) {}
  var template = cfgs.msg_boas_vindas || _raBoasVindasDefault;

  var html = '<div style="font-weight:700;font-size:15px;margin-bottom:16px">Configurações Gerais</div>';

  // ── Seção 1: Dados da Empresa ──
  html += '<div class="card" style="max-width:700px;margin-bottom:24px">' +
    '<div style="font-weight:600;margin-bottom:12px">🏢 Dados da Empresa</div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Usados nos PDFs, relatórios e comunicações.</p>' +
    '<div class="field"><label>Razão Social</label><input type="text" id="ra-emp-razao" class="search-input" value="' + raEsc(cfgs.empresa_razao_social || '') + '" placeholder="Ex: Bononi Acessórios Ltda"></div>' +
    '<div class="field"><label>Nome Fantasia</label><input type="text" id="ra-emp-fantasia" class="search-input" value="' + raEsc(cfgs.empresa_nome_fantasia || '') + '" placeholder="Ex: Stonni"></div>' +
    '<div class="field"><label>CNPJ</label><input type="text" id="ra-emp-cnpj" class="search-input" value="' + raEsc(cfgs.empresa_cnpj || '') + '" placeholder="00.000.000/0000-00"></div>' +
    '<div class="field"><label>Endereço</label><input type="text" id="ra-emp-endereco" class="search-input" value="' + raEsc(cfgs.empresa_endereco || '') + '" placeholder="Rua, nº, cidade/UF, CEP"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    '<div class="field"><label>Telefone</label><input type="text" id="ra-emp-telefone" class="search-input" value="' + raEsc(cfgs.empresa_telefone || '') + '" placeholder="(44) 3333-0000"></div>' +
    '<div class="field"><label>E-mail</label><input type="text" id="ra-emp-email" class="search-input" value="' + raEsc(cfgs.empresa_email || '') + '" placeholder="contato@stonni.com.br"></div></div>' +
    '<div class="field"><label>Site</label><input type="text" id="ra-emp-site" class="search-input" value="' + raEsc(cfgs.empresa_site || '') + '" placeholder="www.stonni.com.br"></div>' +
    '<button class="btn btn-primary" onclick="raSalvarEmpresa()">Salvar dados da empresa</button></div>';

  // ── Seção 2: Textos e Prazos ──
  html += '<div class="card" style="max-width:700px;margin-bottom:24px">' +
    '<div style="font-weight:600;margin-bottom:12px">⏱ Textos e Prazos Operacionais</div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Estes valores aparecem no portal do parceiro e na mensagem de boas-vindas. Use <code style="background:var(--surface2);padding:1px 4px;border-radius:3px;font-size:11px">{chave}</code> para variáveis dinâmicas.</p>';
  _raPrazosConfig.forEach(function(p) {
    var val = cfgs[p.chave] || '';
    if (p.tipo === 'number') {
      html += '<div class="field"><label>' + p.label + '</label><input type="number" id="ra-prazo-' + p.chave + '" class="search-input" value="' + raEsc(val) + '" placeholder="' + p.placeholder + '" style="width:120px" min="1"></div>';
    } else {
      html += '<div class="field"><label>' + p.label + '</label><input type="text" id="ra-prazo-' + p.chave + '" class="search-input" value="' + raEsc(val) + '" placeholder="' + p.placeholder + '"></div>';
    }
  });
  html += '<button class="btn btn-primary" onclick="raSalvarPrazos()">Salvar textos e prazos</button></div>';

  // ── Seção 3: Boas-vindas ──
  html += '<div class="card" style="max-width:700px">' +
    '<div style="font-weight:600;margin-bottom:12px">💬 Mensagem de Boas-Vindas (WhatsApp)</div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Enviada ao parceiro quando credenciado. Edite à vontade.</p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">' +
    '<code style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:10px;cursor:help" title="Primeiro nome">{primeiro_nome}</code>' +
    '<code style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:10px;cursor:help" title="E-mail">{email}</code>' +
    '<code style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:10px;cursor:help" title="Senha">{senha}</code>' +
    '<code style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:10px;cursor:help" title="Prazo OS">{prazo_resposta_os_dias}</code>' +
    '<code style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:10px;cursor:help" title="Prazo peça">{prazo_envio_peca_dias}</code>' +
    '<code style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:10px;cursor:help" title="Dia pagamento">{prazo_pagamento_dia}</code></div>' +
    '<textarea id="ra-bv-template" style="width:100%;height:400px;font-family:monospace;font-size:11px;line-height:1.4;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);resize:vertical">' + raEsc(template) + '</textarea>' +
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary" onclick="raSalvarBoasVindas()">Salvar mensagem</button>' +
    '<button class="btn btn-secondary" onclick="raPreviewBoasVindas()">👁 Preview</button>' +
    '<button class="btn btn-secondary" style="color:var(--text-muted)" onclick="raResetBoasVindas()">↺ Restaurar padrão</button></div></div>' +
    '<div id="ra-bv-preview" style="margin-top:16px;display:none"></div>';

  box.innerHTML = html;
}

async function raCfgEmpresa(box) {
  box.innerHTML = '<div class="loading-full"><span class="spinner"></span> Carregando...</div>';
  var chaves = ['empresa_razao_social','empresa_nome_fantasia','empresa_cnpj','empresa_endereco','empresa_telefone','empresa_email','empresa_site'];
  var cfgs = {};
  try {
    var r = await raFetch('prt_configuracoes?chave=in.(' + chaves.join(',') + ')&select=chave,valor');
    if (Array.isArray(r)) r.forEach(function(c) { cfgs[c.chave] = c.valor || ''; });
  } catch(e) {}
  box.innerHTML = '<div style="font-weight:600;margin-bottom:16px">Dados da Empresa</div>' +
    '<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Usados nos PDFs, relatórios e comunicações com parceiros.</p>' +
    '<div class="card" style="max-width:600px">' +
    '<div class="field"><label>Razão Social</label><input type="text" id="ra-emp-razao" class="search-input" value="' + raEsc(cfgs.empresa_razao_social || '') + '" placeholder="Ex: Bononi Acessórios Ltda"></div>' +
    '<div class="field"><label>Nome Fantasia</label><input type="text" id="ra-emp-fantasia" class="search-input" value="' + raEsc(cfgs.empresa_nome_fantasia || '') + '" placeholder="Ex: Stonni"></div>' +
    '<div class="field"><label>CNPJ</label><input type="text" id="ra-emp-cnpj" class="search-input" value="' + raEsc(cfgs.empresa_cnpj || '') + '" placeholder="00.000.000/0000-00"></div>' +
    '<div class="field"><label>Endereço</label><input type="text" id="ra-emp-endereco" class="search-input" value="' + raEsc(cfgs.empresa_endereco || '') + '" placeholder="Rua, nº, cidade/UF, CEP"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    '<div class="field"><label>Telefone</label><input type="text" id="ra-emp-telefone" class="search-input" value="' + raEsc(cfgs.empresa_telefone || '') + '" placeholder="(44) 3333-0000"></div>' +
    '<div class="field"><label>E-mail</label><input type="text" id="ra-emp-email" class="search-input" value="' + raEsc(cfgs.empresa_email || '') + '" placeholder="contato@stonni.com.br"></div></div>' +
    '<div class="field"><label>Site</label><input type="text" id="ra-emp-site" class="search-input" value="' + raEsc(cfgs.empresa_site || '') + '" placeholder="www.stonni.com.br"></div>' +
    '<button class="btn btn-primary mt-16" onclick="raSalvarEmpresa()">Salvar dados</button></div>';
}

window.raSalvarEmpresa = async function() {
  var campos = {
    empresa_razao_social: document.getElementById('ra-emp-razao').value.trim(),
    empresa_nome_fantasia: document.getElementById('ra-emp-fantasia').value.trim(),
    empresa_cnpj: document.getElementById('ra-emp-cnpj').value.trim(),
    empresa_endereco: document.getElementById('ra-emp-endereco').value.trim(),
    empresa_telefone: document.getElementById('ra-emp-telefone').value.trim(),
    empresa_email: document.getElementById('ra-emp-email').value.trim(),
    empresa_site: document.getElementById('ra-emp-site').value.trim()
  };
  try {
    for (var chave in campos) {
      var existe = await raFetch('prt_configuracoes?chave=eq.' + chave + '&select=id');
      if (Array.isArray(existe) && existe.length) {
        await raPatch('prt_configuracoes', 'chave=eq.' + chave, { valor: campos[chave] });
      } else {
        await raPost('prt_configuracoes', { chave: chave, valor: campos[chave], descricao: chave.replace(/empresa_/g, '').replace(/_/g, ' ') });
      }
    }
    raLog('ACAO', 'config', 'SALVAR_DADOS_EMPRESA');
    alert('Dados da empresa salvos!');
  } catch(e) { console.error(e); alert('Erro ao salvar: ' + e.message); }
};

// ═══════════════════════════════════════
// CONFIG: TEXTOS E PRAZOS OPERACIONAIS
// ═══════════════════════════════════════
var _raPrazosConfig = [
  { chave: 'prazo_resposta_os_dias', label: 'Prazo de resposta da OS (dias úteis)', placeholder: '3', tipo: 'number' },
  { chave: 'prazo_envio_peca_dias', label: 'Prazo de envio de peça de reposição (dias úteis)', placeholder: '5', tipo: 'number' },
  { chave: 'prazo_pagamento_dia', label: 'Dia do pagamento (mês seguinte)', placeholder: '10', tipo: 'number' },
  { chave: 'texto_os_enviada', label: 'Mensagem ao enviar OS (toast no portal)', placeholder: 'Nossa equipe analisará e retornará em até {prazo_resposta_os_dias} dias úteis.', tipo: 'text' },
  { chave: 'texto_financeiro_banner', label: 'Banner no Financeiro do parceiro', placeholder: 'Os pagamentos são realizados até o dia {prazo_pagamento_dia} do mês seguinte. Após o fechamento, envie sua NF para liberação do pagamento.', tipo: 'text' },
  { chave: 'texto_reposicao_info', label: 'Info de reposição de peças (boas-vindas)', placeholder: 'O envio da peça de reposição acontece em até {prazo_envio_peca_dias} dias úteis após a aprovação.', tipo: 'text' }
];

async function raCfgPrazos(box) {
  box.innerHTML = '<div class="loading-full"><span class="spinner"></span> Carregando...</div>';
  var chaves = _raPrazosConfig.map(function(p) { return p.chave; });
  var cfgs = {};
  try {
    var r = await raFetch('prt_configuracoes?chave=in.(' + chaves.join(',') + ')&select=chave,valor');
    if (Array.isArray(r)) r.forEach(function(c) { cfgs[c.chave] = c.valor || ''; });
  } catch(e) {}
  var html = '<div style="font-weight:600;margin-bottom:8px">Textos e Prazos Operacionais</div>' +
    '<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Estes valores aparecem no portal do parceiro e na mensagem de boas-vindas. Use <code style="background:var(--surface2);padding:1px 4px;border-radius:3px;font-size:12px">{chave}</code> nos textos para inserir valores dinâmicos.</p>' +
    '<div class="card" style="max-width:700px">';
  _raPrazosConfig.forEach(function(p) {
    var val = cfgs[p.chave] || '';
    if (p.tipo === 'number') {
      html += '<div class="field"><label>' + p.label + '</label><input type="number" id="ra-prazo-' + p.chave + '" class="search-input" value="' + raEsc(val) + '" placeholder="' + p.placeholder + '" style="width:120px" min="1"></div>';
    } else {
      html += '<div class="field"><label>' + p.label + '</label><input type="text" id="ra-prazo-' + p.chave + '" class="search-input" value="' + raEsc(val) + '" placeholder="' + p.placeholder + '"></div>';
    }
  });
  html += '<button class="btn btn-primary mt-16" onclick="raSalvarPrazos()">Salvar textos e prazos</button></div>';
  box.innerHTML = html;
}

window.raSalvarPrazos = async function() {
  try {
    for (var i = 0; i < _raPrazosConfig.length; i++) {
      var p = _raPrazosConfig[i];
      var el = document.getElementById('ra-prazo-' + p.chave);
      if (!el) continue;
      var val = el.value.trim();
      var existe = await raFetch('prt_configuracoes?chave=eq.' + p.chave + '&select=id');
      if (Array.isArray(existe) && existe.length) {
        await raPatch('prt_configuracoes', 'chave=eq.' + p.chave, { valor: val });
      } else {
        await raPost('prt_configuracoes', { chave: p.chave, valor: val, descricao: p.label });
      }
    }
    raLog('ACAO', 'config', 'SALVAR_PRAZOS');
    alert('Textos e prazos salvos!');
  } catch(e) { console.error(e); alert('Erro ao salvar: ' + e.message); }
};

// ═══════════════════════════════════════
// CONFIG: MENSAGEM DE BOAS-VINDAS
// ═══════════════════════════════════════
var _raBoasVindasDefault = 'Olá {primeiro_nome}! 👋\n' +
  'Seja bem-vindo(a) à *Rede de Assistência Técnica Autorizada Stonni!*\n\n' +
  'A partir de agora, você faz parte de um grupo seleto de parceiros que atendem nossos clientes em todo o Brasil.\n\n' +
  'Preparamos um portal exclusivo para facilitar todo o seu trabalho com a Stonni. Veja como funciona:\n\n' +
  '🔗 *Acesse o portal:*\nparceiro-stonni.vercel.app\n\n' +
  '👤 *Seu login:*\nE-mail: {email}\nSenha: {senha}\n' +
  '(Recomendamos trocar a senha no primeiro acesso)\n\n' +
  '━━━━━━━━━━━━━━━\n' +
  '📋 *COMO ABRIR UMA OS*\n\n' +
  '1️⃣ Acesse o portal e clique em *Nova OS*\n' +
  '2️⃣ Preencha os dados do cliente e do produto (tenha a NF de compra em mãos — vai precisar tirar foto dela)\n' +
  '3️⃣ Registre o diagnóstico, selecione o serviço realizado e tire fotos do equipamento\n' +
  '4️⃣ Revise tudo e envie\n\n' +
  'Nossa equipe analisa e responde em até *{prazo_resposta_os_dias} dias úteis*.\n\n' +
  '━━━━━━━━━━━━━━━\n' +
  '🔧 *PEÇAS DE REPOSIÇÃO*\n\n' +
  'Quando você utilizar uma peça em uma OS de garantia, ao aprovarmos a OS a reposição já é gerada automaticamente. {texto_reposicao_info}\n\n' +
  'Você acompanha tudo pelo portal, na aba *Meu Estoque*.\n\n' +
  '━━━━━━━━━━━━━━━\n' +
  '💰 *PAGAMENTOS*\n\n' +
  'O fechamento é feito *mensalmente*:\n' +
  '• No início do mês, consolidamos todas as OS aprovadas do mês anterior\n' +
  '• Enviamos o relatório para você\n' +
  '• Você emite a NF de serviço com base no valor informado\n' +
  '• O pagamento é realizado *até o dia {prazo_pagamento_dia}*\n\n' +
  'Tudo fica visível na aba *Financeiro* do portal.\n\n' +
  '━━━━━━━━━━━━━━━\n' +
  '📚 *MATERIAL TÉCNICO*\n\n' +
  'No portal você encontra vídeos, manuais e documentos técnicos por linha de produto. Consulte sempre antes de iniciar um atendimento.\n\n' +
  '━━━━━━━━━━━━━━━\n\n' +
  'Qualquer dúvida, pode chamar aqui neste número.\n' +
  'Bem-vindo(a) à Stonni! 💙❄️';

async function raCfgBoasVindas(box) {
  box.innerHTML = '<div class="loading-full"><span class="spinner"></span> Carregando...</div>';
  var template = '';
  try {
    var r = await raFetch('prt_configuracoes?chave=eq.msg_boas_vindas&select=valor');
    if (Array.isArray(r) && r.length && r[0].valor) template = r[0].valor;
  } catch(e) {}
  if (!template) template = _raBoasVindasDefault;
  box.innerHTML = '<div style="font-weight:600;margin-bottom:8px">Mensagem de Boas-Vindas (WhatsApp)</div>' +
    '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Esta mensagem é enviada ao parceiro quando credenciado. Edite à vontade — use as variáveis abaixo que serão substituídas automaticamente.</p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Primeiro nome do parceiro">{primeiro_nome}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="E-mail de login">{email}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Senha gerada">{senha}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Nome completo do parceiro">{nome_completo}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Prazo de resposta da OS">{prazo_resposta_os_dias}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Prazo de envio de peça">{prazo_envio_peca_dias}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Dia do pagamento">{prazo_pagamento_dia}</code>' +
    '<code style="background:var(--surface2);padding:2px 8px;border-radius:4px;font-size:11px;cursor:help" title="Texto de reposição configurado">{texto_reposicao_info}</code></div>' +
    '<div class="card" style="max-width:700px"><textarea id="ra-bv-template" style="width:100%;height:500px;font-family:monospace;font-size:12px;line-height:1.5;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);resize:vertical">' + raEsc(template) + '</textarea>' +
    '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-primary" onclick="raSalvarBoasVindas()">Salvar mensagem</button>' +
    '<button class="btn btn-secondary" onclick="raPreviewBoasVindas()">👁 Preview</button>' +
    '<button class="btn btn-secondary" style="color:var(--text-muted)" onclick="raResetBoasVindas()">↺ Restaurar padrão</button></div></div>' +
    '<div id="ra-bv-preview" style="margin-top:16px;display:none"></div>';
}

window.raSalvarBoasVindas = async function() {
  var template = document.getElementById('ra-bv-template').value;
  if (!template.trim()) { alert('A mensagem não pode ficar vazia'); return; }
  try {
    var existe = await raFetch('prt_configuracoes?chave=eq.msg_boas_vindas&select=id');
    if (Array.isArray(existe) && existe.length) {
      await raPatch('prt_configuracoes', 'chave=eq.msg_boas_vindas', { valor: template });
    } else {
      await raPost('prt_configuracoes', { chave: 'msg_boas_vindas', valor: template, descricao: 'Template da mensagem de boas-vindas WhatsApp' });
    }
    raLog('ACAO', 'config', 'SALVAR_BOAS_VINDAS');
    alert('Mensagem salva!');
  } catch(e) { console.error(e); alert('Erro: ' + e.message); }
};

window.raPreviewBoasVindas = async function() {
  var template = document.getElementById('ra-bv-template').value;
  var preview = await raSubstituirVariaveisMsg(template, 'João da Silva', 'joao@email.com', 'Abc@1234');
  var el = document.getElementById('ra-bv-preview');
  el.style.display = 'block';
  el.innerHTML = '<div class="card" style="max-width:700px;background:#DCF8C6;border-color:#b5d6a0"><div style="font-weight:600;margin-bottom:8px;font-size:12px;color:#128C7E">📱 Preview (exemplo)</div><pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:13px;margin:0;color:#111">' + raEsc(preview) + '</pre></div>';
};

window.raResetBoasVindas = function() {
  if (!confirm('Restaurar a mensagem padrão? A edição atual será perdida.')) return;
  document.getElementById('ra-bv-template').value = _raBoasVindasDefault;
};

// Helper: buscar configurações e substituir variáveis na mensagem
async function raSubstituirVariaveisMsg(template, nome, email, senha) {
  var cfgs = {};
  try {
    var r = await raFetch('prt_configuracoes?select=chave,valor');
    if (Array.isArray(r)) r.forEach(function(c) { cfgs[c.chave] = c.valor || ''; });
  } catch(e) {}
  var primeiro = (nome || '').split(' ')[0] || 'Parceiro';
  var vars = {
    primeiro_nome: primeiro,
    nome_completo: nome || 'Parceiro',
    email: email || '',
    senha: senha || '',
    prazo_resposta_os_dias: cfgs.prazo_resposta_os_dias || '3',
    prazo_envio_peca_dias: cfgs.prazo_envio_peca_dias || '5',
    prazo_pagamento_dia: cfgs.prazo_pagamento_dia || '10',
    texto_reposicao_info: cfgs.texto_reposicao_info || 'O envio da peça de reposição acontece em até ' + (cfgs.prazo_envio_peca_dias || '5') + ' dias úteis após a aprovação.'
  };
  var result = template;
  for (var key in vars) { result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), vars[key]); }
  return result;
}

// ═══════════════════════════════════════
// MENSAGEM DE BOAS-VINDAS WHATSAPP
// ═══════════════════════════════════════
window.raGerarMsgBoasVindas = async function(nome, email, senha) {
  // Buscar template do banco, fallback para padrão
  var template = '';
  try {
    var r = await raFetch('prt_configuracoes?chave=eq.msg_boas_vindas&select=valor');
    if (Array.isArray(r) && r.length && r[0].valor) template = r[0].valor;
  } catch(e) {}
  if (!template) template = _raBoasVindasDefault;
  return await raSubstituirVariaveisMsg(template, nome, email, senha);
};

window.raCopiarBoasVindas = async function(nome, email, senha) {
  var msg = await raGerarMsgBoasVindas(nome, email, senha);
  navigator.clipboard.writeText(msg).then(function() {
    var btn = event.target;
    var original = btn.textContent;
    btn.textContent = '✅ Copiada!';
    setTimeout(function() { btn.textContent = original; }, 2000);
  });
};

window.raEnviarWhatsBoasVindas = async function(whatsapp, nome, email, senha) {
  var msg = await raGerarMsgBoasVindas(nome, email, senha);
  var fone = (whatsapp || '').replace(/\D/g, '');
  if (!fone) { alert('Parceiro sem WhatsApp cadastrado'); return; }
  if (fone.length <= 11) fone = '55' + fone;
  window.open('https://wa.me/' + fone + '?text=' + encodeURIComponent(msg), '_blank');
};
