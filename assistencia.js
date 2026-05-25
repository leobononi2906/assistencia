;(function() {
'use strict';

// ══════════════════════════════════════════
// CSS
// ══════════════════════════════════════════
(function() {
  if (document.getElementById('css-assistencia')) return;
  const s = document.createElement('style');
  s.id = 'css-assistencia';
  s.textContent = `
.ast-page { padding: 20px 24px 32px; }
.ast-section-title { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin:22px 0 10px; }

.ast-cards { display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:14px; }
.ast-card  { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;box-shadow:var(--shadow-sm); }
.ast-card-label { font-size:12px;color:var(--text-secondary);margin-bottom:6px; }
.ast-card-value { font-size:26px;font-weight:700;color:var(--text-primary);line-height:1.1; }
.ast-card-value.blue   { color:var(--blue-mid); }
.ast-card-value.green  { color:var(--green); }
.ast-card-value.red    { color:var(--red); }
.ast-card-value.orange { color:var(--orange); }
.ast-card-value.purple { color:#7C3AED; }
.ast-card-sub { font-size:11px;color:var(--text-muted);margin-top:4px; }

.ast-table-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-sm);overflow:hidden; }
.ast-table-header { padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
.ast-table-title { font-size:13px;font-weight:600;color:var(--text-primary); }
.ast-table-wrap  { overflow-x:auto;max-height:500px;overflow-y:auto; }
.ast-table { width:100%;border-collapse:collapse;font-size:13px; }
.ast-table thead th { padding:9px 14px;background:var(--surface2);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;position:sticky;top:0;white-space:nowrap; }
.ast-table thead th.right,.ast-table td.right { text-align:right; }
.ast-table tbody tr { border-top:1px solid var(--border);transition:background .1s; }
.ast-table tbody tr:hover { background:var(--surface2);cursor:pointer; }
.ast-table tbody td { padding:10px 14px;color:var(--text-primary);vertical-align:middle; }
.ast-mono { font-family:'DM Mono',monospace;font-size:12px; }
.ast-loading td { text-align:center;padding:40px;color:var(--text-muted);font-size:13px; }

.ast-badge { display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;white-space:nowrap; }
.ast-badge-novo        { background:var(--blue-pale);color:var(--blue-mid); }
.ast-badge-andamento   { background:var(--orange-bg);color:var(--orange); }
.ast-badge-concluido   { background:var(--green-bg);color:var(--green); }
.ast-badge-cancelado   { background:var(--surface2);color:var(--text-muted); }
.ast-badge-default     { background:var(--surface2);color:var(--text-secondary); }
.ast-badge-alta        { background:var(--red-bg);color:var(--red); }
.ast-badge-media       { background:var(--orange-bg);color:var(--orange); }
.ast-badge-baixa       { background:var(--green-bg);color:var(--green); }
.ast-badge-garantia    { background:#EFF6FF;color:#1D4ED8; }
.ast-badge-nao        { background:var(--surface2);color:var(--text-muted); }

.ast-toggle { display:flex;gap:4px; }
.ast-toggle-btn { padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all .15s;white-space:nowrap; }
.ast-toggle-btn.active { background:var(--blue-dark);border-color:var(--blue-dark);color:#fff; }
.ast-toggle-btn:hover:not(.active) { background:var(--surface2); }

.ast-search { height:32px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);color:var(--text-primary);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;width:220px;transition:border-color .15s; }
.ast-search:focus { border-color:var(--blue-mid); }
.ast-select { height:32px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);color:var(--text-primary);font-family:'DM Sans',sans-serif;font-size:12px;outline:none;cursor:pointer; }

.ast-btn { display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;border:none;white-space:nowrap; }
.ast-btn-primary   { background:var(--blue-dark);color:#fff; }
.ast-btn-primary:hover { background:var(--blue-mid); }
.ast-btn-secondary { background:var(--surface2);color:var(--text-primary);border:1px solid var(--border); }
.ast-btn-secondary:hover { background:var(--border); }
.ast-btn-success   { background:var(--green-bg);color:var(--green);border:1px solid #BBF7D0; }
.ast-btn-danger    { background:var(--red-bg);color:var(--red);border:1px solid #FECACA; }
.ast-btn-warning   { background:#FEF3C7;color:#D97706;border:1px solid #FDE68A; }
.ast-btn-sm        { height:26px;padding:0 10px;font-size:11px; }
.ast-btn:disabled  { opacity:.5;cursor:not-allowed; }

.ast-overlay { display:none;position:fixed;inset:0;background:rgba(15,29,53,.4);z-index:200; }
.ast-overlay.open { display:block; }
.ast-drawer { position:fixed;top:0;right:-760px;width:760px;height:100vh;background:var(--surface);box-shadow:var(--shadow-lg);z-index:201;display:flex;flex-direction:column;transition:right .3s cubic-bezier(.4,0,.2,1);overflow:hidden; }
.ast-drawer.open { right:0; }
.ast-drawer-header { padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0; }
.ast-drawer-title  { font-size:15px;font-weight:700;color:var(--text-primary); }
.ast-drawer-sub    { font-size:12px;color:var(--text-muted);margin-top:3px; }
.ast-drawer-close  { width:32px;height:32px;border:none;background:var(--surface2);border-radius:6px;cursor:pointer;font-size:16px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:12px; }
.ast-drawer-close:hover { background:var(--border);color:var(--text-primary); }
.ast-drawer-body   { flex:1;overflow-y:auto;padding:20px 24px; }
.ast-drawer-tabs   { display:flex;border-bottom:1px solid var(--border);margin-bottom:18px;flex-wrap:wrap; }
.ast-drawer-tab    { padding:9px 16px;font-size:13px;font-weight:500;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap; }
.ast-drawer-tab:hover { color:var(--text-primary); }
.ast-drawer-tab.active { color:var(--blue-mid);border-bottom-color:var(--blue-mid); }
.ast-drawer-tab-content { display:none; }
.ast-drawer-tab-content.active { display:block; }

.ast-stat-row  { display:flex;gap:20px;flex-wrap:wrap;padding:12px 0;border-bottom:1px solid var(--border);margin-bottom:18px; }
.ast-stat-item { display:flex;flex-direction:column;gap:3px; }
.ast-stat-label{ font-size:11px;color:var(--text-muted); }
.ast-stat-val  { font-size:13px;font-weight:600;color:var(--text-primary); }

.ast-detail-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
.ast-detail-field{ display:flex;flex-direction:column;gap:3px; }
.ast-detail-lbl  { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted); }
.ast-detail-val  { font-size:13px;color:var(--text-primary);font-weight:500; }

.ast-fup-list { display:flex;flex-direction:column;gap:8px; }
.ast-fup-item { background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:11px 14px; }
.ast-fup-item.whats  { border-left:3px solid #25D366; }
.ast-fup-item.manual { border-left:3px solid var(--blue-mid); }
.ast-fup-meta { font-size:11px;color:var(--text-muted);margin-bottom:4px;display:flex;gap:6px;flex-wrap:wrap; }
.ast-fup-msg  { font-size:13px;color:var(--text-primary);line-height:1.5;white-space:pre-wrap; }
.ast-fup-form { background:var(--blue-pale);border:1px solid var(--blue-light);border-radius:var(--radius-sm);padding:14px;margin-bottom:14px; }

.ast-kanban       { display:flex;gap:14px;overflow-x:auto;padding-bottom:16px;align-items:flex-start; }
.ast-kanban-col   { min-width:255px;max-width:270px;flex-shrink:0;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius); }
.ast-kanban-hdr   { padding:11px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between; }
.ast-kanban-title { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary); }
.ast-kanban-count { background:var(--border);color:var(--text-muted);font-size:11px;font-weight:700;padding:1px 7px;border-radius:10px; }
.ast-kanban-cards { padding:10px;display:flex;flex-direction:column;gap:8px;min-height:60px; }
.ast-kanban-card  { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:11px 13px;cursor:pointer;transition:all .15s;box-shadow:var(--shadow-sm); }
.ast-kanban-card:hover { box-shadow:var(--shadow-md);transform:translateY(-1px); }
.ast-kanban-card.parado { border-left:3px solid var(--red); }
.ast-kanban-card-name { font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:3px; }
.ast-kanban-card-sub  { font-size:11px;color:var(--text-muted);line-height:1.4; }
.ast-kanban-card-foot { margin-top:8px;display:flex;align-items:center;justify-content:space-between;gap:6px; }

.ast-cfg-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px; }
.ast-cfg-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;box-shadow:var(--shadow-sm); }
.ast-cfg-title{ font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between; }
.ast-cfg-item { display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;gap:8px; }
.ast-cfg-item:last-of-type { border-bottom:none; }
.ast-cfg-name { flex:1;color:var(--text-primary);font-weight:500; }
.ast-cfg-actions { display:flex;gap:4px;flex-shrink:0; }
.ast-cfg-add { display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border); }
.ast-cfg-input { flex:1;height:30px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:12px;background:var(--surface2);outline:none; }
.ast-cfg-input:focus { border-color:var(--blue-mid); }

.ast-modal-ov { display:none;position:fixed;inset:0;background:rgba(15,29,53,.5);z-index:300;align-items:center;justify-content:center; }
.ast-modal-ov.open { display:flex; }
.ast-modal { background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow-lg);width:580px;max-width:96vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden; }
.ast-modal-hdr  { padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0; }
.ast-modal-title{ font-size:15px;font-weight:700;color:var(--text-primary); }
.ast-modal-body { padding:20px 24px;overflow-y:auto;flex:1; }
.ast-modal-foot { padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0; }

.ast-form-row  { display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px; }
.ast-form-row.full { grid-template-columns:1fr; }
.ast-form-field{ display:flex;flex-direction:column;gap:5px; }
.ast-form-lbl  { font-size:12px;font-weight:600;color:var(--text-secondary); }
.ast-form-input,.ast-form-select,.ast-form-textarea { padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text-primary);background:var(--surface2);outline:none;transition:border-color .15s;width:100%; }
.ast-form-input:focus,.ast-form-select:focus,.ast-form-textarea:focus { border-color:var(--blue-mid);background:#fff; }
.ast-form-textarea { resize:vertical;min-height:72px; }
.ast-form-err  { color:var(--red);font-size:12px;margin-top:2px; }

.ast-progress-bar  { height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:5px; }
.ast-progress-fill { height:100%;border-radius:3px;transition:width .4s; }

.ast-rank-item { display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border); }
.ast-rank-item:last-child { border-bottom:none; }
.ast-rank-pos  { width:22px;height:22px;background:var(--surface2);border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--text-muted);flex-shrink:0; }
.ast-rank-pos.g1 { background:#FEF9C3;border-color:#EAB308;color:#A16207; }
.ast-rank-pos.g2 { background:#F1F5F9;border-color:#94A3B8;color:#475569; }
.ast-rank-pos.g3 { background:#FEF3C7;border-color:#D97706;color:#92400E; }
.ast-rank-name { flex:1;font-size:13px;font-weight:500;color:var(--text-primary); }
.ast-rank-sub  { font-size:11px;color:var(--text-muted); }
.ast-rank-val  { font-size:13px;font-weight:700;text-align:right; }

.ast-empty { text-align:center;padding:40px 20px;color:var(--text-muted);font-size:13px; }
.ast-empty-ico { font-size:32px;margin-bottom:10px;opacity:.5; }

.ast-prod-result { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);max-height:200px;overflow-y:auto;margin-top:4px; }
.ast-prod-result-item { padding:9px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);transition:background .1s; }
.ast-prod-result-item:hover { background:var(--blue-pale); }
.ast-prod-result-item:last-child { border-bottom:none; }
.ast-prod-ref { font-size:11px;color:var(--text-muted); }

/* ÍNDICE DEFEITO */
.ast-idx-normal   { color:var(--green);font-weight:700; }
.ast-idx-atencao  { color:var(--orange);font-weight:700; }
.ast-idx-critico  { color:var(--red);font-weight:700; }
.ast-idx-bar-normal  { background:var(--green); }
.ast-idx-bar-atencao { background:var(--orange); }
.ast-idx-bar-critico { background:var(--red); }

/* NATUREZA */
.ast-nat-garantia { background:#DBEAFE;color:#1D4ED8;border:1px solid #BFDBFE; }
.ast-nat-nao      { background:var(--surface2);color:var(--text-muted);border:1px solid var(--border); }

/* HISTÓRICO NÚMERO */
.ast-hist-item { display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s; }
.ast-hist-item:hover { background:var(--surface2);margin:0 -8px;padding:10px 8px;border-radius:var(--radius-sm); }
.ast-hist-item:last-child { border-bottom:none; }

/* BLOQUEADO BANNER */
.ast-bloqueado-banner { background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px; }

/* GESTÃO EXTRA */
.ast-gest-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px; }
.ast-evolucao-bar { display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border); }
.ast-evolucao-bar:last-child { border-bottom:none; }

@media (max-width:768px) {
  .ast-drawer { width:100%;right:-100%; }
  .ast-detail-grid,.ast-form-row,.ast-gest-grid { grid-template-columns:1fr; }
  .ast-modal { width:96vw; }
}
  `;
  document.head.appendChild(s);
})();

// ══════════════════════════════════════════
// PÁGINAS HTML
// ══════════════════════════════════════════
const AST_PAGES = {

'ast-gestao': `<div class="ast-page" id="page-ast-gestao">
  <!-- KPI CARDS -->
  <div class="ast-cards" id="ast-kpi-cards">
    <div class="ast-card"><div class="ast-card-label">Chamados Abertos</div><div class="ast-card-value blue" id="ast-k-abertos">—</div><div class="ast-card-sub">situação atual</div></div>
    <div class="ast-card"><div class="ast-card-label">Concluídos no Mês</div><div class="ast-card-value green" id="ast-k-concluidos">—</div><div class="ast-card-sub">este mês</div></div>
    <div class="ast-card"><div class="ast-card-label">Taxa de Resolução</div><div class="ast-card-value" id="ast-k-taxa">—</div><div class="ast-card-sub">concluídos / total mês</div></div>
    <div class="ast-card"><div class="ast-card-label">Tempo Médio</div><div class="ast-card-value" id="ast-k-tempo">—</div><div class="ast-card-sub">dias até concluir</div></div>
    <div class="ast-card"><div class="ast-card-label">Parados +7 dias</div><div class="ast-card-value red" id="ast-k-parados">—</div><div class="ast-card-sub">sem follow-up</div></div>
    <div class="ast-card"><div class="ast-card-label">Pior Índice Defeito</div><div class="ast-card-value red" id="ast-k-pior-idx" style="font-size:18px;line-height:1.3">—</div><div class="ast-card-sub" id="ast-k-pior-prod">últimos 12 meses</div></div>
  </div>

  <!-- LINHA: SETOR + EVOLUÇÃO -->
  <div class="ast-gest-grid">
    <div class="ast-table-card">
      <div class="ast-table-header"><div class="ast-table-title">Distribuição por Setor</div></div>
      <div style="padding:16px 20px" id="ast-setor-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
    </div>
    <div class="ast-table-card">
      <div class="ast-table-header"><div class="ast-table-title">Evolução Mensal — Abertos vs Concluídos</div></div>
      <div style="padding:16px 20px" id="ast-evolucao-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
    </div>
  </div>

  <!-- ÍNDICE DE DEFEITO -->
  <div class="ast-section-title">Índice de Defeito por Produto — últimos 12 meses</div>
  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title">Chamados de garantia ÷ unidades vendidas</div>
      <div style="display:flex;gap:8px;font-size:11px;color:var(--text-muted);align-items:center">
        <span style="color:var(--green);font-weight:700">● Normal &lt;1%</span>
        <span style="color:var(--orange);font-weight:700">● Atenção 1-3%</span>
        <span style="color:var(--red);font-weight:700">● Crítico &gt;3%</span>
      </div>
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr>
          <th>Produto</th><th class="right">Vendidos 12m</th>
          <th class="right">Chamados</th><th class="right">Índice</th>
          <th class="right">Tempo Médio</th><th>Situação</th>
        </tr></thead>
        <tbody id="ast-indice-body"><tr class="ast-loading"><td colspan="6">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- PARADOS -->
  <div class="ast-section-title">Chamados Parados — Ação Necessária</div>
  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title">Sem follow-up há mais de 7 dias</div>
      <button class="ast-btn ast-btn-primary" onclick="astAbrirModalNovo()">+ Novo Chamado</button>
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr><th>#</th><th>Cliente</th><th>Produto</th><th>Setor</th><th class="right">Dias Parado</th><th>Status</th></tr></thead>
        <tbody id="ast-parados-body"><tr class="ast-loading"><td colspan="6">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- NÚMEROS BLOQUEADOS -->
  <div class="ast-section-title">Números Bloqueados</div>
  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title">Classificados como Não-Garantia — <span id="ast-bloq-count">—</span></div>
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr><th>Telefone</th><th>Motivo</th><th>Bloqueado por</th><th>Data</th><th style="width:80px"></th></tr></thead>
        <tbody id="ast-bloq-body"><tr class="ast-loading"><td colspan="5">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>`,

'ast-chamados': `<div class="ast-page" id="page-ast-chamados">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <div class="ast-toggle" id="ast-view-toggle">
        <button class="ast-toggle-btn active" onclick="astSetView('lista',this)">☰ Lista</button>
        <button class="ast-toggle-btn" onclick="astSetView('kanban',this)">⬜ Kanban</button>
      </div>
      <select class="ast-select" id="ast-fil-status" onchange="astAplicarFiltros()"><option value="">Todos os status</option></select>
      <select class="ast-select" id="ast-fil-setor"  onchange="astAplicarFiltros()"><option value="">Todos os setores</option></select>
      <select class="ast-select" id="ast-fil-prior"  onchange="astAplicarFiltros()">
        <option value="">Todas as prioridades</option>
        <option>Alta</option><option>Media</option><option>Baixa</option>
      </select>
      <input class="ast-search" id="ast-busca" placeholder="Buscar cliente ou produto..." oninput="astAplicarFiltros()">
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);cursor:pointer">
        <input type="checkbox" id="ast-ver-finalizados" onchange="astAplicarFiltros()"> Ver finalizados
      </label>
    </div>
    <button class="ast-btn ast-btn-primary" onclick="astAbrirModalNovo()">+ Novo Chamado</button>
  </div>
  <div id="ast-lista-view">
    <div class="ast-table-card">
      <div class="ast-table-header">
        <div class="ast-table-title">Chamados — <span id="ast-lista-count">—</span></div>
        <div class="ast-toggle">
          <button class="ast-toggle-btn active" onclick="astSetOrdem('recente',this)">Recente</button>
          <button class="ast-toggle-btn" onclick="astSetOrdem('antigo',this)">Antigo</button>
          <button class="ast-toggle-btn" onclick="astSetOrdem('prioridade',this)">Prioridade</button>
          <button class="ast-toggle-btn" onclick="astSetOrdem('parado',this)">Mais parado</button>
        </div>
      </div>
      <div class="ast-table-wrap">
        <table class="ast-table">
          <thead><tr>
            <th>#</th><th>Cliente / Telefone</th><th>Produto</th>
            <th>Natureza</th><th>Status</th><th>Setor</th><th>Prioridade</th>
            <th class="right">Dias</th><th class="right">s/FU</th>
          </tr></thead>
          <tbody id="ast-lista-body"><tr class="ast-loading"><td colspan="9">Carregando...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
  <div id="ast-kanban-view" style="display:none">
    <div class="ast-kanban" id="ast-kanban-board"></div>
  </div>
</div>`,

'ast-produtos': `<div class="ast-page" id="page-ast-produtos">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Produtos da Assistência</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Catálogo curado para atendimentos de garantia</div>
    </div>
    <button class="ast-btn ast-btn-primary" onclick="astAbrirModalProduto()">+ Adicionar Produto</button>
  </div>
  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title">Catálogo — <span id="ast-prod-count">—</span></div>
      <input class="ast-search" id="ast-prod-busca" placeholder="Buscar produto..." oninput="astFiltrarProdutos()">
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr>
          <th>Referência</th><th>Produto</th><th>Grupo</th>
          <th class="right">Vendidos 12m</th><th class="right">Chamados</th>
          <th class="right">Índice Defeito</th><th>Status</th><th style="width:80px"></th>
        </tr></thead>
        <tbody id="ast-prod-body"><tr class="ast-loading"><td colspan="8">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px">
    <div class="ast-table-card">
      <div class="ast-table-header"><div class="ast-table-title">🔴 Mais Chamados</div></div>
      <div style="padding:14px 18px" id="ast-criticos-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
    </div>
    <div class="ast-table-card">
      <div class="ast-table-header"><div class="ast-table-title">🔧 Peças Mais Usadas</div></div>
      <div style="padding:14px 18px" id="ast-pecas-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
    </div>
  </div>
</div>`,

'ast-config': `<div class="ast-page" id="page-ast-config">
  <div style="margin-bottom:20px">
    <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Configurações da Assistência</div>
    <div style="font-size:12px;color:var(--text-muted);margin-top:3px">Gerencie status, setores e demais opções sem precisar de suporte técnico</div>
  </div>
  <div class="ast-cfg-grid" id="ast-cfg-grid">
    <div style="color:var(--text-muted);font-size:13px">Carregando...</div>
  </div>
</div>`
};

// ══════════════════════════════════════════
// ESTADO
// ══════════════════════════════════════════
let _container = null, _iniciado = false, _pagina = null;
let astData = [], astFiltrados = [], astView = 'lista', astOrdem = 'recente';
let astProdAll = [], astIndiceData = [];
let _statusList = [], _setoresList = [], _prioridadeList = [];
let _defeitos = [], _causas = [], _solucoes = [], _procedencias = [];

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
const astFmtDate = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const astDias    = d => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
function astDiasBadge(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 14) return `<span style="color:var(--red);font-weight:700">${n}d</span>`;
  if (n >= 7)  return `<span style="color:var(--orange);font-weight:700">${n}d</span>`;
  if (n >= 3)  return `<span style="color:var(--yellow);font-weight:600">${n}d</span>`;
  return `<span style="color:var(--text-muted)">${n}d</span>`;
}
function astStatusBadge(nome) {
  if (!nome) return '<span class="ast-badge ast-badge-novo">Novo</span>';
  const n = nome.toLowerCase();
  const cls = n.includes('conclu') ? 'concluido' : n.includes('cancel') ? 'cancelado'
    : n.includes('andamento') || n.includes('atendimento') ? 'andamento' : 'novo';
  return `<span class="ast-badge ast-badge-${cls}">${nome}</span>`;
}
function astPriorBadge(nome) {
  if (!nome) return '';
  const n = nome.toLowerCase();
  return `<span class="ast-badge ast-badge-${n.includes('alta')?'alta':n.includes('media')||n.includes('média')?'media':'baixa'}">${nome}</span>`;
}
function astNaturezaBadge(n) {
  if (!n || n === 'garantia') return '<span class="ast-badge ast-nat-garantia">🔴 Garantia</span>';
  return '<span class="ast-badge ast-nat-nao">⚫ Não-Garantia</span>';
}
function astIndiceCls(pct, tipo) {
  const v = parseFloat(pct);
  const c = v > 3 ? 'critico' : v > 1 ? 'atencao' : 'normal';
  return tipo === 'text' ? `ast-idx-${c}` : `ast-idx-bar-${c}`;
}
const astEhFinalizado = r => r.finaliza_chamado === true || r.concluido === true;
const astSelectOptions = (lista, val) => lista.map(i =>
  `<option value="${i.id}" ${i.id == val ? 'selected' : ''}>${i.nome}</option>`).join('');

// ══════════════════════════════════════════
// PRÉ-CARGA LOOKUPS
// ══════════════════════════════════════════
async function astCarregarLookups() {
  if (_statusList.length) return;
  const [s, se, p, d, c, so, pr] = await Promise.allSettled([
    window.sb.from('assist_status').select('id,nome,finaliza_chamado,ordem').eq('ativo',true).order('ordem'),
    window.sb.from('assist_setores').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_prioridades').select('id,nome,ordem').eq('ativo',true).order('ordem'),
    window.sb.from('assist_defeitos').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_causas').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_solucoes').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_procedencias').select('id,nome').eq('ativo',true).order('nome'),
  ]);
  _statusList    = s.status  ==='fulfilled'?(s.value.data ||[]):[];
  _setoresList   = se.status ==='fulfilled'?(se.value.data||[]):[];
  _prioridadeList= p.status  ==='fulfilled'?(p.value.data ||[]):[];
  _defeitos      = d.status  ==='fulfilled'?(d.value.data ||[]):[];
  _causas        = c.status  ==='fulfilled'?(c.value.data ||[]):[];
  _solucoes      = so.status ==='fulfilled'?(so.value.data||[]):[];
  _procedencias  = pr.status ==='fulfilled'?(pr.value.data||[]):[];
}

// ══════════════════════════════════════════
// GESTÃO
// ══════════════════════════════════════════
async function astLoadGestao() {
  await Promise.all([
    astLoadKPIs(),
    astLoadSetorDistrib(),
    astLoadEvolucao(),
    astLoadIndiceDefeito(),
    astLoadParados(),
    astLoadBloqueados(),
  ]);
  window.setLastUpdate?.();
}

async function astLoadKPIs() {
  try {
    const { data } = await window.sb.from('assist_kpis').select('*').single();
    if (!data) return;
    const ab = data.chamados_abertos || 0;
    const co = data.chamados_concluidos_mes || 0;
    const taxa = (ab + co) > 0 ? Math.round(co / (ab + co) * 100) : 0;
    document.getElementById('ast-k-abertos').textContent   = ab;
    document.getElementById('ast-k-concluidos').textContent= co;
    document.getElementById('ast-k-taxa').textContent      = `${taxa}%`;
    document.getElementById('ast-k-taxa').className        = `ast-card-value ${taxa >= 70 ? 'green' : taxa >= 40 ? 'orange' : 'red'}`;
    document.getElementById('ast-k-tempo').textContent     = data.tempo_medio_resolucao_dias != null
      ? `${parseFloat(data.tempo_medio_resolucao_dias).toFixed(1)}d` : '—';
    document.getElementById('ast-k-parados').textContent   = data.chamados_parados || 0;
  } catch(e) {}
}

async function astLoadSetorDistrib() {
  const el = document.getElementById('ast-setor-list');
  if (!el) return;
  try {
    const { data } = await window.sb.from('assist_kanban')
      .select('setor_responsavel,concluido,finaliza_chamado,natureza').range(0,9999);
    const map = {};
    (data||[]).forEach(r => {
      if (astEhFinalizado(r) || r.natureza === 'nao_garantia') return;
      const k = r.setor_responsavel || 'Sem setor';
      map[k] = (map[k]||0) + 1;
    });
    const total = Object.values(map).reduce((a,v) => a+v, 0);
    if (!total) { el.innerHTML = '<div class="ast-empty">Nenhum chamado aberto</div>'; return; }
    el.innerHTML = Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([s,n]) => `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
          <span style="font-weight:500">${s}</span>
          <span style="color:var(--text-muted)">${n} chamados</span>
        </div>
        <div class="ast-progress-bar">
          <div class="ast-progress-fill" style="width:${Math.round(n/total*100)}%;background:var(--blue-mid)"></div>
        </div>
      </div>`).join('');
  } catch(e) { el.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Erro</div>'; }
}

async function astLoadEvolucao() {
  const el = document.getElementById('ast-evolucao-list');
  if (!el) return;
  try {
    // Busca chamados dos últimos 6 meses
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 5);
    desde.setDate(1);
    const { data } = await window.sb.from('assist_chamados')
      .select('data_abertura,data_conclusao,concluido,natureza')
      .gte('data_abertura', desde.toISOString().slice(0,10))
      .eq('natureza','garantia').range(0,9999);

    // Agrupa por mês
    const meses = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
      const k = d.toISOString().slice(0,7);
      meses[k] = { abertos: 0, concluidos: 0 };
    }
    (data||[]).forEach(r => {
      const k = (r.data_abertura||'').slice(0,7);
      if (meses[k]) meses[k].abertos++;
      if (r.concluido && r.data_conclusao) {
        const kc = r.data_conclusao.slice(0,7);
        if (meses[kc]) meses[kc].concluidos++;
      }
    });
    const maxVal = Math.max(...Object.values(meses).map(m => Math.max(m.abertos, m.concluidos)), 1);
    el.innerHTML = Object.entries(meses).map(([k, m]) => {
      const [ano, mes] = k.split('-');
      const nomeMes = new Date(ano, parseInt(mes)-1).toLocaleString('pt-BR',{month:'short'});
      return `
        <div class="ast-evolucao-bar">
          <div style="width:32px;font-size:11px;color:var(--text-muted);flex-shrink:0">${nomeMes}</div>
          <div style="flex:1">
            <div style="display:flex;gap:4px;align-items:center;margin-bottom:3px">
              <div style="height:10px;border-radius:2px;background:var(--blue-mid);width:${Math.round(m.abertos/maxVal*100)}%;min-width:2px"></div>
              <span style="font-size:11px;color:var(--text-muted)">${m.abertos}</span>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <div style="height:10px;border-radius:2px;background:var(--green);width:${Math.round(m.concluidos/maxVal*100)}%;min-width:2px"></div>
              <span style="font-size:11px;color:var(--text-muted)">${m.concluidos}</span>
            </div>
          </div>
        </div>`;
    }).join('') + `
      <div style="display:flex;gap:16px;margin-top:10px;font-size:11px;color:var(--text-muted)">
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--blue-mid);border-radius:2px;margin-right:4px"></span>Abertos</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--green);border-radius:2px;margin-right:4px"></span>Concluídos</span>
      </div>`;
  } catch(e) { el.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Sem dados</div>'; }
}

async function astLoadIndiceDefeito() {
  const tbody = document.getElementById('ast-indice-body');
  if (!tbody) return;
  try {
    const { data } = await window.sb.from('assist_indice_defeito')
      .select('*').order('indice_defeito_pct', { ascending: false }).range(0,49);
    astIndiceData = data || [];

    // Card pior índice
    if (data?.length) {
      const pior = data[0];
      const el = document.getElementById('ast-k-pior-idx');
      const ep = document.getElementById('ast-k-pior-prod');
      if (el) { el.textContent = `${pior.indice_defeito_pct}%`; el.className = `ast-card-value ${astIndiceCls(pior.indice_defeito_pct,'text').replace('ast-idx-','')}`; }
      if (ep) ep.textContent = pior.produto_nome?.slice(0,30) || '—';
    }

    if (!data?.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="ast-empty"><div class="ast-empty-ico">📊</div>Nenhum dado ainda — vincule produtos ao catálogo da assistência</div></td></tr>';
      return;
    }
    const maxPct = Math.max(...data.map(r => parseFloat(r.indice_defeito_pct)||0), 1);
    tbody.innerHTML = data.map(r => {
      const pct = parseFloat(r.indice_defeito_pct)||0;
      const clsT = astIndiceCls(pct,'text');
      const clsB = astIndiceCls(pct,'bar');
      return `<tr>
        <td>
          <div style="font-weight:500">${r.produto_nome||'—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">${r.referencia||''} ${r.grupo?'· '+r.grupo:''}</div>
        </td>
        <td class="right">${parseInt(r.qtd_vendida_12m||0).toLocaleString('pt-BR')}</td>
        <td class="right">${r.chamados_garantia||0}</td>
        <td class="right">
          <span class="${clsT}">${pct.toFixed(2)}%</span>
          <div class="ast-progress-bar" style="width:80px;display:inline-block;vertical-align:middle;margin-left:6px">
            <div class="ast-progress-fill ${clsB}" style="width:${Math.round(pct/maxPct*100)}%"></div>
          </div>
        </td>
        <td class="right">${r.tempo_medio_dias||0}d</td>
        <td>${r.chamados_abertos>0?`<span style="color:var(--orange);font-weight:600">${r.chamados_abertos} abertos</span>`:'<span style="color:var(--green)">✅ Todos resolvidos</span>'}</td>
      </tr>`;
    }).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);padding:20px;text-align:center">Sem dados de índice — adicione produtos ao catálogo e registre chamados</td></tr>';
  }
}

async function astLoadParados() {
  const tbody = document.getElementById('ast-parados-body');
  if (!tbody) return;
  try {
    const { data } = await window.sb.from('assist_kanban')
      .select('id,nome_contato,cliente_nome,produto_nome,status_nome,setor_responsavel,dias_sem_followup')
      .gte('dias_sem_followup',7).eq('natureza','garantia')
      .order('dias_sem_followup',{ascending:false}).range(0,49);
    if (!data?.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--green);font-size:13px">✅ Nenhum chamado parado</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr onclick="astAbrirDetalhe(${r.id})">
        <td class="ast-mono" style="color:var(--text-muted)">#${r.id}</td>
        <td><div style="font-weight:500">${r.cliente_nome||r.nome_contato||'—'}</div></td>
        <td style="color:var(--text-secondary)">${r.produto_nome||'—'}</td>
        <td>${r.setor_responsavel||'—'}</td>
        <td class="right">${astDiasBadge(r.dias_sem_followup)}</td>
        <td>${astStatusBadge(r.status_nome)}</td>
      </tr>`).join('');
  } catch(e) {}
}

async function astLoadBloqueados() {
  const tbody = document.getElementById('ast-bloq-body');
  const count = document.getElementById('ast-bloq-count');
  if (!tbody) return;
  try {
    const { data } = await window.sb.from('assist_numeros_bloqueados')
      .select('*').eq('ativo',true).order('bloqueado_em',{ascending:false}).range(0,99);
    if (count) count.textContent = `${(data||[]).length} números`;
    if (!data?.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">Nenhum número bloqueado</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td class="ast-mono">${r.telefone||r.telefone_norm}</td>
        <td style="color:var(--text-muted)">${r.motivo||'—'}</td>
        <td style="color:var(--text-muted)">${r.bloqueado_por||'—'}</td>
        <td style="color:var(--text-muted)">${astFmtDate(r.bloqueado_em)}</td>
        <td>
          <button class="ast-btn ast-btn-success ast-btn-sm" onclick="astDesbloquear(${r.id},'${(r.telefone||'').replace(/'/g,"\\'")}')">✅ Desbloquear</button>
        </td>
      </tr>`).join('');
  } catch(e) {}
}

window.astDesbloquear = async function(id, tel) {
  if (!confirm(`Desbloquear ${tel}? O número voltará a criar chamados.`)) return;
  const usuario = window.getUsuario?.();
  await window.sb.from('assist_numeros_bloqueados').update({
    ativo: false,
    desbloqueado_por: usuario?.nome || null,
    desbloqueado_em: new Date().toISOString(),
  }).eq('id', id);
  await astLoadBloqueados();
};

// ══════════════════════════════════════════
// CHAMADOS
// ══════════════════════════════════════════
async function astLoadChamados() {
  try {
    const { data } = await window.sb.from('assist_kanban').select('*')
      .order('data_abertura',{ascending:false}).range(0,9999);
    astData = data || [];
    astPopularSelectsFiltro();
    astAplicarFiltros();
    window.setLastUpdate?.();
  } catch(e) {
    const b = document.getElementById('ast-lista-body');
    if (b) b.innerHTML = '<tr><td colspan="9" style="color:var(--red);padding:20px">Erro ao carregar</td></tr>';
  }
}

function astPopularSelectsFiltro() {
  const sSet = new Set(), seSet = new Set();
  astData.forEach(r => { if(r.status_nome) sSet.add(r.status_nome); if(r.setor_responsavel) seSet.add(r.setor_responsavel); });
  const ss = document.getElementById('ast-fil-status');
  const se = document.getElementById('ast-fil-setor');
  if (ss) ss.innerHTML = '<option value="">Todos os status</option>' + [...sSet].sort().map(s=>`<option>${s}</option>`).join('');
  if (se) se.innerHTML = '<option value="">Todos os setores</option>' + [...seSet].sort().map(s=>`<option>${s}</option>`).join('');
}

window.astAplicarFiltros = function() {
  const status  = document.getElementById('ast-fil-status')?.value||'';
  const setor   = document.getElementById('ast-fil-setor')?.value||'';
  const prior   = document.getElementById('ast-fil-prior')?.value||'';
  const busca   = (document.getElementById('ast-busca')?.value||'').toLowerCase();
  const verFin  = document.getElementById('ast-ver-finalizados')?.checked;

  astFiltrados = astData.filter(r => {
    if (r.natureza === 'nao_garantia') return false; // nunca aparecem por padrão
    if (!verFin && astEhFinalizado(r)) return false;
    if (status && r.status_nome !== status) return false;
    if (setor  && r.setor_responsavel !== setor) return false;
    if (prior  && (r.prioridade||'').toLowerCase() !== prior.toLowerCase()) return false;
    if (busca) {
      const h = `${r.cliente_nome||''} ${r.nome_contato||''} ${r.produto_nome||''} ${r.telefone||''}`.toLowerCase();
      if (!h.includes(busca)) return false;
    }
    return true;
  });

  const pOrd = {'alta':0,'media':1,'média':1,'baixa':2};
  if      (astOrdem==='antigo')    astFiltrados.sort((a,b)=>new Date(a.data_abertura)-new Date(b.data_abertura));
  else if (astOrdem==='prioridade') astFiltrados.sort((a,b)=>(pOrd[(a.prioridade||'').toLowerCase()]??9)-(pOrd[(b.prioridade||'').toLowerCase()]??9));
  else if (astOrdem==='parado')    astFiltrados.sort((a,b)=>(b.dias_sem_followup||0)-(a.dias_sem_followup||0));
  else                             astFiltrados.sort((a,b)=>new Date(b.data_abertura)-new Date(a.data_abertura));

  if (astView==='lista') astRenderLista(); else astRenderKanban();
};

function astRenderLista() {
  const tbody = document.getElementById('ast-lista-body');
  const count = document.getElementById('ast-lista-count');
  if (!tbody) return;
  if (count) count.textContent = `${astFiltrados.length} chamados`;
  if (!astFiltrados.length) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="ast-empty"><div class="ast-empty-ico">🔍</div>Nenhum chamado encontrado</div></td></tr>';
    return;
  }
  tbody.innerHTML = astFiltrados.map(r => {
    const parado = (r.dias_sem_followup||0) >= 7 && !astEhFinalizado(r);
    return `<tr onclick="astAbrirDetalhe(${r.id})" ${parado?'style="background:var(--red-bg)"':''}>
      <td class="ast-mono" style="color:var(--text-muted)">#${r.id}</td>
      <td><div style="font-weight:500">${r.cliente_nome||r.nome_contato||'—'}</div>
          <div style="font-size:11px;color:var(--text-muted)">${r.telefone||''}</div></td>
      <td style="color:var(--text-secondary)">${r.produto_nome||'—'}</td>
      <td>${astNaturezaBadge(r.natureza)}</td>
      <td>${astStatusBadge(r.status_nome)}</td>
      <td style="font-size:12px">${r.setor_responsavel||'—'}</td>
      <td>${astPriorBadge(r.prioridade)}</td>
      <td class="right">${astDiasBadge(astDias(r.data_abertura))}</td>
      <td class="right">${r.dias_sem_followup!=null?astDiasBadge(r.dias_sem_followup):'—'}</td>
    </tr>`;
  }).join('');
}

function astRenderKanban() {
  const board = document.getElementById('ast-kanban-board');
  if (!board) return;
  const colunas = {};
  _statusList.forEach(s => { if (!s.finaliza_chamado) colunas[s.nome] = {meta:s,items:[]}; });
  astFiltrados.forEach(r => {
    const k = r.status_nome||'Sem status';
    if (!colunas[k]) colunas[k] = {meta:{},items:[]};
    colunas[k].items.push(r);
  });
  const cols = Object.entries(colunas).filter(([,v]) => v.items.length > 0 || !v.meta.finaliza_chamado);
  if (!cols.length) { board.innerHTML = '<div class="ast-empty"><div class="ast-empty-ico">✅</div>Nenhum chamado ativo</div>'; return; }
  board.innerHTML = cols.map(([status,v]) => `
    <div class="ast-kanban-col">
      <div class="ast-kanban-hdr"><div class="ast-kanban-title">${status}</div><div class="ast-kanban-count">${v.items.length}</div></div>
      <div class="ast-kanban-cards">
        ${v.items.length===0
          ? '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:12px 0">Vazio</div>'
          : v.items.map(r => {
              const parado = (r.dias_sem_followup||0)>=7 && !astEhFinalizado(r);
              return `<div class="ast-kanban-card ${parado?'parado':''}" onclick="astAbrirDetalhe(${r.id})">
                <div class="ast-kanban-card-name">${r.cliente_nome||r.nome_contato||'—'}</div>
                <div class="ast-kanban-card-sub">${r.produto_nome||'—'}<br>${r.setor_responsavel||''}</div>
                <div class="ast-kanban-card-foot">
                  ${astPriorBadge(r.prioridade)}
                  <span style="font-size:11px;color:var(--text-muted)">${r.dias_sem_followup!=null?astDiasBadge(r.dias_sem_followup)+' s/FU':astFmtDate(r.data_abertura)}</span>
                </div>
              </div>`;
            }).join('')}
      </div>
    </div>`).join('');
}

window.astSetView = function(v,btn) {
  astView = v;
  document.getElementById('ast-view-toggle')?.querySelectorAll('.ast-toggle-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('ast-lista-view').style.display  = v==='lista' ?'':'none';
  document.getElementById('ast-kanban-view').style.display = v==='kanban'?'':'none';
  astAplicarFiltros();
};
window.astSetOrdem = function(o,btn) {
  astOrdem=o;
  btn.closest('.ast-toggle')?.querySelectorAll('.ast-toggle-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); astAplicarFiltros();
};

// ══════════════════════════════════════════
// DRAWER — DETALHE
// ══════════════════════════════════════════
function astCriarDrawer() {
  if (document.getElementById('ast-overlay')) return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="ast-overlay" id="ast-overlay" onclick="astFecharDetalhe()"></div>
    <div class="ast-drawer" id="ast-drawer">
      <div class="ast-drawer-header">
        <div><div class="ast-drawer-title" id="ast-drw-title">Chamado</div><div class="ast-drawer-sub" id="ast-drw-sub"></div></div>
        <button class="ast-drawer-close" onclick="astFecharDetalhe()">✕</button>
      </div>
      <div class="ast-drawer-body" id="ast-drw-body"><div style="text-align:center;padding:40px;color:var(--text-muted)">⏳</div></div>
    </div>`);
}

window.astAbrirDetalhe = async function(id) {
  astCriarDrawer();
  await astCarregarLookups();
  document.getElementById('ast-overlay').classList.add('open');
  document.getElementById('ast-drawer').classList.add('open');
  document.getElementById('ast-drw-title').textContent = `Chamado #${id}`;
  document.getElementById('ast-drw-sub').textContent   = 'Carregando...';
  document.getElementById('ast-drw-body').innerHTML    = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳</div>';

  try {
    const [{ data: det }, { data: fups }, { data: pecas }] = await Promise.all([
      window.sb.from('assist_chamados_detalhe').select('*').eq('id',id).single(),
      window.sb.from('assist_followups').select('*').eq('chamado_id',id).order('criado_em',{ascending:false}).range(0,99),
      window.sb.from('assist_chamado_pecas').select('*').eq('id_chamado',id).order('criado_em',{ascending:false}),
    ]);
    if (!det) throw new Error('Não encontrado');

    // Histórico do número
    const telNorm = det.telefone_normalizado || (det.telefone||'').replace(/\D/g,'');
    const { data: historico } = await window.sb.from('assist_kanban')
      .select('id,data_abertura,produto_nome,status_nome,concluido,natureza,dias_aberto')
      .eq('telefone_normalizado', telNorm)
      .neq('id', id)
      .order('data_abertura',{ascending:false}).range(0,9);

    // Verifica se número está bloqueado
    const { data: bloqData } = await window.sb.from('assist_numeros_bloqueados')
      .select('id,motivo,bloqueado_por').eq('telefone_norm', telNorm).eq('ativo',true).maybeSingle();

    document.getElementById('ast-drw-sub').textContent =
      `${det.cliente_nome_erp||det.nome_contato||'—'} · ${det.produto_nome||det.produto_manual||'Produto não vinculado'}`;

    const fupsList  = fups  || [];
    const pecasList = pecas || [];
    const histList  = historico || [];

    // Separa conversa WhatsApp de acompanhamento manual
    const conv = fupsList.filter(f => f.origem === 'whatsapp');
    const acomp= fupsList.filter(f => f.origem !== 'whatsapp');

    document.getElementById('ast-drw-body').innerHTML = `
      ${bloqData ? `
        <div class="ast-bloqueado-banner">
          <div>🚫 <strong>Número bloqueado</strong> — ${bloqData.motivo||'Classificado como Não-Garantia'} por ${bloqData.bloqueado_por||'—'}</div>
          <button class="ast-btn ast-btn-success ast-btn-sm" onclick="astDesbloquear(${bloqData.id},'${det.telefone||''}')">Desbloquear</button>
        </div>` : ''}

      <!-- NATUREZA + AÇÕES RÁPIDAS -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--text-muted);font-weight:600">NATUREZA:</span>
        <button class="ast-btn ast-btn-sm ${det.natureza==='garantia'?'ast-btn-primary':'ast-btn-secondary'}"
          onclick="astSetNatureza(${id},'garantia',this)">🔴 Garantia</button>
        <button class="ast-btn ast-btn-sm ${det.natureza==='nao_garantia'?'ast-btn-danger':'ast-btn-secondary'}"
          onclick="astSetNatureza(${id},'nao_garantia',this)">⚫ Não é Garantia</button>
        ${histList.length ? `<span style="font-size:12px;color:var(--orange);font-weight:600">⚠️ ${histList.length} chamado(s) anterior(es)</span>` : '<span style="font-size:12px;color:var(--text-muted)">Primeiro contato</span>'}
      </div>

      <!-- EDIÇÃO STATUS/SETOR/PRIORIDADE -->
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;margin-bottom:18px;display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="ast-form-field" style="flex:1;min-width:130px">
          <label class="ast-form-lbl">Status</label>
          <select class="ast-form-select" id="drw-sel-status">${astSelectOptions(_statusList,det.status_id)}</select>
        </div>
        <div class="ast-form-field" style="flex:1;min-width:130px">
          <label class="ast-form-lbl">Setor</label>
          <select class="ast-form-select" id="drw-sel-setor"><option value="">Sem setor</option>${astSelectOptions(_setoresList,det.setor_responsavel_id)}</select>
        </div>
        <div class="ast-form-field" style="flex:1;min-width:110px">
          <label class="ast-form-lbl">Prioridade</label>
          <select class="ast-form-select" id="drw-sel-prior"><option value="">—</option>${astSelectOptions(_prioridadeList,det.prioridade_id)}</select>
        </div>
        <button class="ast-btn ast-btn-success" onclick="astSalvarEdicao(${id})">💾 Salvar</button>
      </div>

      <!-- STATS -->
      <div class="ast-stat-row">
        <div class="ast-stat-item"><div class="ast-stat-label">Aberto em</div><div class="ast-stat-val">${astFmtDate(det.data_abertura)}</div></div>
        <div class="ast-stat-item"><div class="ast-stat-label">Dias aberto</div><div class="ast-stat-val">${astDias(det.data_abertura)??'—'}d</div></div>
        <div class="ast-stat-item"><div class="ast-stat-label">Acompanhamentos</div><div class="ast-stat-val">${acomp.length}</div></div>
        <div class="ast-stat-item"><div class="ast-stat-label">Msgs WhatsApp</div><div class="ast-stat-val">${conv.length}</div></div>
        <div class="ast-stat-item"><div class="ast-stat-label">Próxima ação</div><div class="ast-stat-val">${astFmtDate(det.data_proxima_acao)}</div></div>
      </div>

      <!-- TABS -->
      <div class="ast-drawer-tabs">
        <div class="ast-drawer-tab active" onclick="astDrwTab('info',this)">Informações</div>
        <div class="ast-drawer-tab" onclick="astDrwTab('acomp',this)">📋 Acompanhamento (${acomp.length})</div>
        <div class="ast-drawer-tab" onclick="astDrwTab('conv',this)">💬 Conversa WA (${conv.length})</div>
        <div class="ast-drawer-tab" onclick="astDrwTab('pecas',this)">Peças (${pecasList.length})</div>
        <div class="ast-drawer-tab" onclick="astDrwTab('diagnostico',this)">Diagnóstico</div>
        <div class="ast-drawer-tab" onclick="astDrwTab('historico',this)">📞 Histórico (${histList.length})</div>
      </div>

      <!-- TAB INFO -->
      <div class="ast-drawer-tab-content active" id="ast-tab-info">
        <div class="ast-detail-grid">
          <div class="ast-detail-field"><div class="ast-detail-lbl">Cliente ERP</div><div class="ast-detail-val">${det.cliente_nome_erp||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Contato</div><div class="ast-detail-val">${det.nome_contato||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Telefone</div><div class="ast-detail-val">${det.telefone||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Cidade / UF</div><div class="ast-detail-val">${det.cidade&&det.uf?`${det.cidade} / ${det.uf}`:'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Produto</div><div class="ast-detail-val">${det.produto_nome||det.produto_manual||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Atendente</div><div class="ast-detail-val">${det.responsavel_nome||'—'}</div></div>
        </div>
        ${det.descricao_inicial?`
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
            <div class="ast-detail-lbl">Descrição inicial</div>
            <div style="font-size:13px;color:var(--text-primary);margin-top:6px;line-height:1.6;white-space:pre-wrap">${det.descricao_inicial}</div>
          </div>`:''}
      </div>

      <!-- TAB ACOMPANHAMENTO -->
      <div class="ast-drawer-tab-content" id="ast-tab-acomp">
        <div class="ast-fup-form">
          <div style="font-size:12px;font-weight:700;color:var(--blue-dark);margin-bottom:10px">➕ Novo Acompanhamento</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div class="ast-form-field">
              <label class="ast-form-lbl">Tipo</label>
              <select class="ast-form-select" id="fup-tipo" style="height:32px">
                <option>Retorno ao cliente</option><option>Aguardando cliente</option>
                <option>Enviado para análise</option><option>Peça enviada</option>
                <option>Agendamento</option><option>Atualização interna</option><option>Outros</option>
              </select>
            </div>
            <div class="ast-form-field">
              <label class="ast-form-lbl">Próxima ação</label>
              <input type="date" class="ast-form-input" id="fup-proxima" style="height:32px">
            </div>
          </div>
          <textarea class="ast-form-textarea" id="fup-msg" placeholder="O que foi feito ou combinado..." style="min-height:60px;margin-bottom:10px"></textarea>
          <button class="ast-btn ast-btn-primary" onclick="astSalvarFup(${id})">Registrar</button>
          <span id="fup-status" style="font-size:12px;margin-left:10px;color:var(--text-muted)"></span>
        </div>
        <div class="ast-fup-list" id="ast-fup-acomp-list">
          ${acomp.length ? acomp.map(f => `
            <div class="ast-fup-item manual">
              <div class="ast-fup-meta">
                <span style="font-weight:600">${f.tipo||'Manual'}</span><span>·</span>
                <span>${f.usuario_nome||'—'}</span><span>·</span>
                <span>${f.criado_em?new Date(f.criado_em).toLocaleString('pt-BR'):'—'}</span>
              </div>
              <div class="ast-fup-msg">${f.mensagem||'—'}</div>
            </div>`).join('')
            : '<div class="ast-empty"><div class="ast-empty-ico">📋</div>Nenhum acompanhamento ainda</div>'}
        </div>
      </div>

      <!-- TAB CONVERSA WHATSAPP -->
      <div class="ast-drawer-tab-content" id="ast-tab-conv">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius-sm)">
          💬 Histórico de mensagens recebidas via WhatsApp/Umbler — somente leitura
        </div>
        <div class="ast-fup-list">
          ${conv.length ? conv.map(f => `
            <div class="ast-fup-item whats">
              <div class="ast-fup-meta">
                <span style="color:#25D366;font-weight:600">WhatsApp</span><span>·</span>
                <span>${f.usuario_nome||det.nome_contato||'—'}</span><span>·</span>
                <span>${f.criado_em?new Date(f.criado_em).toLocaleString('pt-BR'):'—'}</span>
              </div>
              <div class="ast-fup-msg">${f.mensagem||'—'}</div>
            </div>`).join('')
            : '<div class="ast-empty"><div class="ast-empty-ico">💬</div>Nenhuma mensagem WhatsApp</div>'}
        </div>
      </div>

      <!-- TAB PEÇAS -->
      <div class="ast-drawer-tab-content" id="ast-tab-pecas">
        ${pecasList.length ? `
          <table class="ast-table">
            <thead><tr><th>Peça</th><th>Código</th><th class="right">Qtd</th><th>Obs</th></tr></thead>
            <tbody>${pecasList.map(p=>`
              <tr><td>${p.peca_nome||'—'}</td>
              <td class="ast-mono" style="color:var(--text-muted)">${p.codigo_peca||'—'}</td>
              <td class="right">${p.quantidade||1}</td>
              <td style="color:var(--text-muted)">${p.observacao||'—'}</td></tr>`).join('')}
            </tbody>
          </table>`
          : '<div class="ast-empty"><div class="ast-empty-ico">🔧</div>Nenhuma peça registrada</div>'}
      </div>

      <!-- TAB DIAGNÓSTICO -->
      <div class="ast-drawer-tab-content" id="ast-tab-diagnostico">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="ast-form-field"><label class="ast-form-lbl">Defeito</label>
            <select class="ast-form-select" id="diag-defeito"><option value="">Selecione...</option>${astSelectOptions(_defeitos,det.defeito_id)}</select></div>
          <div class="ast-form-field"><label class="ast-form-lbl">Causa</label>
            <select class="ast-form-select" id="diag-causa"><option value="">Selecione...</option>${astSelectOptions(_causas,det.causa_id)}</select></div>
          <div class="ast-form-field"><label class="ast-form-lbl">Solução</label>
            <select class="ast-form-select" id="diag-solucao"><option value="">Selecione...</option>${astSelectOptions(_solucoes,det.solucao_id)}</select></div>
          <div class="ast-form-field"><label class="ast-form-lbl">Procedência</label>
            <select class="ast-form-select" id="diag-procedencia"><option value="">Selecione...</option>${astSelectOptions(_procedencias,det.procedencia_id)}</select></div>
        </div>
        <div class="ast-form-field" style="margin-top:14px"><label class="ast-form-lbl">Observação Interna</label>
          <textarea class="ast-form-textarea" id="diag-obs">${det.observacao_interna||''}</textarea></div>
        <div style="margin-top:12px;display:flex;gap:10px;align-items:center">
          <button class="ast-btn ast-btn-success" onclick="astSalvarDiagnostico(${id})">💾 Salvar Diagnóstico</button>
          <span id="diag-status" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
      </div>

      <!-- TAB HISTÓRICO DO NÚMERO -->
      <div class="ast-drawer-tab-content" id="ast-tab-historico">
        ${histList.length===0
          ? '<div class="ast-empty"><div class="ast-empty-ico">📞</div>Primeiro atendimento deste número</div>'
          : `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${histList.length} chamado(s) anterior(es) deste número</div>
             ${histList.map(h => `
              <div class="ast-hist-item" onclick="astAbrirDetalhe(${h.id})">
                <div style="font-size:22px">${h.concluido?'✅':'🔄'}</div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary)">#${h.id} · ${h.produto_nome||'Produto não informado'}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${astFmtDate(h.data_abertura)} · ${astNaturezaBadge(h.natureza)}</div>
                </div>
                <div style="text-align:right">
                  ${astStatusBadge(h.status_nome)}
                  <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${h.dias_aberto||0}d aberto</div>
                </div>
              </div>`).join('')}`}
      </div>
    `;
  } catch(e) {
    console.error(e);
    document.getElementById('ast-drw-body').innerHTML =
      `<div style="padding:20px;color:var(--red)">Erro ao carregar #${id}: ${e.message}</div>`;
  }
};

window.astDrwTab = function(tab,btn) {
  document.querySelectorAll('.ast-drawer-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.ast-drawer-tab-content').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`ast-tab-${tab}`)?.classList.add('active');
};
window.astFecharDetalhe = function() {
  document.getElementById('ast-overlay')?.classList.remove('open');
  document.getElementById('ast-drawer')?.classList.remove('open');
};

// Salvar status/setor/prioridade
window.astSalvarEdicao = async function(id) {
  const statusId = document.getElementById('drw-sel-status')?.value;
  const setorId  = document.getElementById('drw-sel-setor')?.value;
  const priorId  = document.getElementById('drw-sel-prior')?.value;
  const statusObj= _statusList.find(s=>s.id==statusId);
  const btn = document.querySelector(`[onclick="astSalvarEdicao(${id})"]`);
  if (btn) { btn.textContent='Salvando...'; btn.disabled=true; }
  const payload = {
    status_id:            statusId?parseInt(statusId):null,
    setor_responsavel_id: setorId ?parseInt(setorId) :null,
    prioridade_id:        priorId ?parseInt(priorId) :null,
    atualizado_em:        new Date().toISOString(),
    concluido:            statusObj?.finaliza_chamado||false,
  };
  if (statusObj?.finaliza_chamado) payload.data_conclusao = new Date().toISOString();
  const { error } = await window.sb.from('assist_chamados').update(payload).eq('id',id);
  if (error) { alert('Erro: '+error.message); }
  else {
    if (btn) { btn.textContent='✅ Salvo!'; btn.disabled=false; }
    setTimeout(()=>{ if(btn) btn.textContent='💾 Salvar'; },2000);
    const idx = astData.findIndex(r=>r.id===id);
    if (idx>=0) {
      if (statusObj) { astData[idx].status_nome=statusObj.nome; astData[idx].finaliza_chamado=statusObj.finaliza_chamado; astData[idx].concluido=statusObj.finaliza_chamado; }
      astAplicarFiltros();
    }
  }
  if (btn) btn.disabled=false;
};

// Classificar natureza
window.astSetNatureza = async function(id, natureza, btn) {
  if (natureza === 'nao_garantia') {
    if (!confirm('Classificar como NÃO-GARANTIA?\n\nO chamado será fechado e o número bloqueado — não criará mais chamados automaticamente.')) return;
  }
  btn.disabled = true;
  const usuario = window.getUsuario?.();
  const det = await window.sb.from('assist_chamados').select('telefone,telefone_normalizado,nome_contato').eq('id',id).single();
  const payload = { natureza, atualizado_em: new Date().toISOString() };
  if (natureza === 'nao_garantia') { payload.concluido = true; payload.data_conclusao = new Date().toISOString(); }
  await window.sb.from('assist_chamados').update(payload).eq('id',id);
  if (natureza === 'nao_garantia' && det.data) {
    const telNorm = det.data.telefone_normalizado || (det.data.telefone||'').replace(/\D/g,'');
    await window.sb.from('assist_numeros_bloqueados').upsert({
      telefone: det.data.telefone||telNorm,
      telefone_norm: telNorm,
      motivo: 'Classificado como Não-Garantia',
      bloqueado_por: usuario?.nome||null,
    }, { onConflict: 'telefone_norm' });
  }
  // Atualiza UI
  const idx = astData.findIndex(r=>r.id===id);
  if (idx>=0) { astData[idx].natureza=natureza; if(natureza==='nao_garantia') astData[idx].concluido=true; astAplicarFiltros(); }
  astFecharDetalhe();
  btn.disabled=false;
};

// Follow-up manual
window.astSalvarFup = async function(chamadoId) {
  const tipo    = document.getElementById('fup-tipo')?.value;
  const msg     = document.getElementById('fup-msg')?.value.trim();
  const proxima = document.getElementById('fup-proxima')?.value;
  const statusEl= document.getElementById('fup-status');
  if (!msg) { if(statusEl) statusEl.textContent='⚠️ Escreva uma mensagem'; return; }
  if (statusEl) statusEl.textContent='Salvando...';
  const usuario = window.getUsuario?.();
  const { error } = await window.sb.from('assist_followups').insert({
    chamado_id: chamadoId, tipo, mensagem: msg,
    origem: 'manual', usuario_nome: usuario?.nome||null,
    criado_em: new Date().toISOString(),
  });
  if (error) { if(statusEl) statusEl.textContent='❌ '+error.message; return; }
  const upd = { data_ultimo_followup: new Date().toISOString(), atualizado_em: new Date().toISOString() };
  if (proxima) upd.data_proxima_acao = proxima;
  await window.sb.from('assist_chamados').update(upd).eq('id',chamadoId);
  if (statusEl) statusEl.textContent='✅ Registrado!';
  document.getElementById('fup-msg').value='';
  document.getElementById('fup-proxima').value='';
  const lista = document.getElementById('ast-fup-acomp-list');
  if (lista) {
    lista.insertAdjacentHTML('afterbegin',`
      <div class="ast-fup-item manual">
        <div class="ast-fup-meta"><span style="font-weight:600">${tipo}</span><span>·</span>
          <span>${usuario?.nome||'—'}</span><span>·</span><span>${new Date().toLocaleString('pt-BR')}</span></div>
        <div class="ast-fup-msg">${msg}</div>
      </div>`);
    const tabBtn = document.querySelector('.ast-drawer-tab[onclick*="acomp"]');
    if (tabBtn) { const n=parseInt(tabBtn.textContent.match(/\d+/)?.[0]||0); tabBtn.textContent=`📋 Acompanhamento (${n+1})`; }
  }
  setTimeout(()=>{ if(statusEl) statusEl.textContent=''; },3000);
};

// Diagnóstico
window.astSalvarDiagnostico = async function(id) {
  const v = id => document.getElementById(id)?.value;
  const payload = {
    defeito_id:     v('diag-defeito')    ?parseInt(v('diag-defeito'))    :null,
    causa_id:       v('diag-causa')      ?parseInt(v('diag-causa'))      :null,
    solucao_id:     v('diag-solucao')    ?parseInt(v('diag-solucao'))    :null,
    procedencia_id: v('diag-procedencia')?parseInt(v('diag-procedencia')):null,
    observacao_interna: v('diag-obs')||null,
    atualizado_em: new Date().toISOString(),
  };
  const el = document.getElementById('diag-status');
  if (el) el.textContent='Salvando...';
  const { error } = await window.sb.from('assist_chamados').update(payload).eq('id',id);
  if (error) { if(el) el.textContent='❌ '+error.message; return; }
  if (el) { el.textContent='✅ Salvo!'; setTimeout(()=>el.textContent='',3000); }
};

// ══════════════════════════════════════════
// MODAL NOVO CHAMADO
// ══════════════════════════════════════════
function astCriarModalNovo() {
  if (document.getElementById('ast-modal-novo')) return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="ast-modal-ov" id="ast-modal-novo">
      <div class="ast-modal">
        <div class="ast-modal-hdr"><div class="ast-modal-title">Novo Chamado</div>
          <button class="ast-drawer-close" onclick="astFecharModalNovo()">✕</button></div>
        <div class="ast-modal-body">
          <div id="novo-bloq-aviso" style="display:none" class="ast-bloqueado-banner">
            🚫 <strong>Número bloqueado</strong> — <span id="novo-bloq-motivo"></span>
            <button class="ast-btn ast-btn-success ast-btn-sm" onclick="astDesbloquearNoModal()">Desbloquear</button>
          </div>
          <div id="novo-hist-aviso" style="display:none;background:var(--orange-bg);border:1px solid #FDE68A;border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--orange)"></div>
          <div class="ast-form-row">
            <div class="ast-form-field">
              <label class="ast-form-lbl">Telefone *</label>
              <input class="ast-form-input" id="novo-tel" placeholder="(00) 00000-0000" oninput="astVerificarTelefone()">
            </div>
            <div class="ast-form-field">
              <label class="ast-form-lbl">Nome do Contato</label>
              <input class="ast-form-input" id="novo-nome" placeholder="Nome do cliente">
            </div>
          </div>
          <div class="ast-form-row full" style="margin-bottom:6px">
            <div class="ast-form-field">
              <label class="ast-form-lbl">Produto</label>
              <input class="ast-form-input" id="novo-prod-busca" placeholder="Digite para buscar produto do catálogo..." autocomplete="off" oninput="astBuscarProdutoModal()">
              <div id="novo-prod-results" class="ast-prod-result" style="display:none"></div>
              <input type="hidden" id="novo-prod-id">
              <div id="novo-prod-sel" style="font-size:12px;color:var(--blue-mid);margin-top:4px"></div>
            </div>
          </div>
          <div class="ast-form-row">
            <div class="ast-form-field"><label class="ast-form-lbl">Setor</label>
              <select class="ast-form-select" id="novo-setor"><option value="">Selecione...</option></select></div>
            <div class="ast-form-field"><label class="ast-form-lbl">Prioridade</label>
              <select class="ast-form-select" id="novo-prior"><option value="">Selecione...</option></select></div>
          </div>
          <div class="ast-form-row">
            <div class="ast-form-field"><label class="ast-form-lbl">Status Inicial</label>
              <select class="ast-form-select" id="novo-status"></select></div>
            <div class="ast-form-field"><label class="ast-form-lbl">Próxima ação</label>
              <input type="date" class="ast-form-input" id="novo-proxima"></div>
          </div>
          <div class="ast-form-row full">
            <div class="ast-form-field"><label class="ast-form-lbl">Descrição do Problema</label>
              <textarea class="ast-form-textarea" id="novo-desc" placeholder="Descreva o defeito relatado..."></textarea></div>
          </div>
          <div id="novo-erro" class="ast-form-err"></div>
        </div>
        <div class="ast-modal-foot">
          <button class="ast-btn ast-btn-secondary" onclick="astFecharModalNovo()">Cancelar</button>
          <button class="ast-btn ast-btn-primary" id="novo-btn" onclick="astSalvarNovo()">Salvar Chamado</button>
        </div>
      </div>
    </div>`);
}

let _novoBloqId = null;
window.astVerificarTelefone = async function() {
  const tel = (document.getElementById('novo-tel')?.value||'').replace(/\D/g,'');
  if (tel.length < 10) return;
  const avisoB = document.getElementById('novo-bloq-aviso');
  const avisoH = document.getElementById('novo-hist-aviso');
  const btn    = document.getElementById('novo-btn');
  _novoBloqId  = null;

  const [{ data: bloq }, { data: hist }, { data: cliente }] = await Promise.all([
    window.sb.from('assist_numeros_bloqueados').select('id,motivo,bloqueado_por').eq('telefone_norm',tel).eq('ativo',true).maybeSingle(),
    window.sb.from('assist_kanban').select('id,status_nome,produto_nome,data_abertura').eq('telefone_normalizado',tel).order('data_abertura',{ascending:false}).range(0,4),
    window.sb.from('assist_clientes_telefone_lookup').select('id_cliente,nome_cliente')
      .or(`telefone_norm1.eq.${tel},telefone_norm2.eq.${tel},telefone_norm3.eq.${tel}`).limit(1),
  ]);

  if (bloq) {
    _novoBloqId = bloq.id;
    if (avisoB) { avisoB.style.display=''; document.getElementById('novo-bloq-motivo').textContent=`${bloq.motivo||'Não-Garantia'} · por ${bloq.bloqueado_por||'—'}`; }
    if (btn) btn.disabled=true;
  } else {
    if (avisoB) avisoB.style.display='none';
    if (btn) btn.disabled=false;
  }

  if (hist?.length && avisoH) {
    avisoH.style.display='';
    avisoH.innerHTML=`⚠️ Este número tem <strong>${hist.length} chamado(s) anterior(es)</strong>:<br>${hist.slice(0,3).map(h=>`#${h.id} · ${h.produto_nome||'—'} · ${astStatusBadge(h.status_nome)}`).join('<br>')}`;
  } else if (avisoH) { avisoH.style.display='none'; }

  if (cliente?.data?.[0]) {
    const nome = document.getElementById('novo-nome');
    if (nome && !nome.value) nome.value = cliente.data[0].nome_cliente||'';
  }
};

window.astDesbloquearNoModal = async function() {
  if (!_novoBloqId) return;
  const usuario = window.getUsuario?.();
  await window.sb.from('assist_numeros_bloqueados').update({
    ativo:false, desbloqueado_por:usuario?.nome||null, desbloqueado_em:new Date().toISOString()
  }).eq('id',_novoBloqId);
  _novoBloqId=null;
  document.getElementById('novo-bloq-aviso').style.display='none';
  document.getElementById('novo-btn').disabled=false;
};

window.astAbrirModalNovo = async function() {
  astCriarModalNovo();
  await astCarregarLookups();
  const el = id => document.getElementById(id);
  if (el('novo-setor'))  el('novo-setor').innerHTML  = '<option value="">Selecione...</option>'+astSelectOptions(_setoresList,null);
  if (el('novo-prior'))  el('novo-prior').innerHTML  = '<option value="">Selecione...</option>'+astSelectOptions(_prioridadeList,null);
  if (el('novo-status')) el('novo-status').innerHTML = astSelectOptions(_statusList,_statusList[0]?.id);
  document.getElementById('ast-modal-novo').classList.add('open');
};
window.astFecharModalNovo = function() {
  document.getElementById('ast-modal-novo')?.classList.remove('open');
};

let _buscaProdTimer=null;
window.astBuscarProdutoModal = function() {
  clearTimeout(_buscaProdTimer);
  _buscaProdTimer=setTimeout(async()=>{
    const q=(document.getElementById('novo-prod-busca')?.value||'').trim();
    const res=document.getElementById('novo-prod-results');
    if (!res) return;
    if (q.length<2) { res.style.display='none'; return; }
    const {data}=await window.sb.from('assist_produtos').select('id,referencia,nome,grupo').eq('ativo',true)
      .or(`nome.ilike.%${q}%,referencia.ilike.%${q}%`).order('nome').range(0,14);
    if (!data?.length) { res.innerHTML='<div class="ast-prod-result-item" style="color:var(--text-muted)">Nenhum produto encontrado</div>'; res.style.display=''; return; }
    res.style.display='';
    res.innerHTML=data.map(p=>`
      <div class="ast-prod-result-item" onclick="astSelecionarProdModal(${p.id},'${(p.referencia||'').replace(/'/g,"\\'")}','${p.nome.replace(/'/g,"\\'")}')">
        <div>${p.nome}</div><div class="ast-prod-ref">${p.referencia||''} ${p.grupo?'· '+p.grupo:''}</div>
      </div>`).join('');
  },300);
};
window.astSelecionarProdModal = function(id,ref,nome) {
  document.getElementById('novo-prod-id').value=id;
  document.getElementById('novo-prod-busca').value=nome;
  document.getElementById('novo-prod-sel').textContent=`✅ ${ref?ref+' — ':''}${nome}`;
  document.getElementById('novo-prod-results').style.display='none';
};

window.astSalvarNovo = async function() {
  const v = id => document.getElementById(id)?.value;
  const tel=v('novo-tel')?.trim();
  const erro=document.getElementById('novo-erro');
  if (!tel) { if(erro) erro.textContent='⚠️ Telefone é obrigatório'; return; }
  if (erro) erro.textContent='';
  const btn=document.getElementById('novo-btn');
  if (btn) { btn.textContent='Salvando...'; btn.disabled=true; }
  try {
    const telNum=tel.replace(/\D/g,'');
    // Verifica bloqueio antes de salvar
    const {data:bloq}=await window.sb.from('assist_numeros_bloqueados').select('id').eq('telefone_norm',telNum).eq('ativo',true).maybeSingle();
    if (bloq) { if(erro) erro.textContent='🚫 Número bloqueado. Desbloqueie antes de criar.'; if(btn){btn.textContent='Salvar Chamado';btn.disabled=false;} return; }

    const prodId=v('novo-prod-id');
    let prodNome=v('novo-prod-busca')||null, prodCod=null, prodIdErp=null;
    if (prodId) {
      const {data:pd}=await window.sb.from('assist_produtos').select('nome,referencia,id_produto_erp').eq('id',parseInt(prodId)).single();
      if (pd) { prodNome=pd.nome; prodCod=pd.referencia; prodIdErp=pd.id_produto_erp; }
    }
    const {data:lk}=await window.sb.from('assist_clientes_telefone_lookup').select('id_cliente,nome_cliente')
      .or(`telefone_norm1.eq.${telNum},telefone_norm2.eq.${telNum},telefone_norm3.eq.${telNum}`).limit(1);
    const cli=lk?.[0];
    const statusObj=_statusList.find(s=>s.id==v('novo-status'));
    const usuario=window.getUsuario?.();
    const payload={
      telefone:tel, telefone_normalizado:telNum,
      nome_contato:v('novo-nome')||cli?.nome_cliente||null,
      cliente_id_erp:cli?.id_cliente?parseInt(cli.id_cliente):null,
      cliente_nome_erp:cli?.nome_cliente||null,
      produto_id_erp:prodIdErp?parseInt(prodIdErp):null,
      produto_codigo:prodCod||null, produto_nome:prodNome||null,
      status_id:v('novo-status')?parseInt(v('novo-status')):(_statusList[0]?.id||null),
      setor_responsavel_id:v('novo-setor')?parseInt(v('novo-setor')):null,
      prioridade_id:v('novo-prior')?parseInt(v('novo-prior')):null,
      descricao_inicial:v('novo-desc')||null,
      data_proxima_acao:v('novo-proxima')||null,
      responsavel_nome:usuario?.nome||null,
      natureza:'garantia',
      concluido:statusObj?.finaliza_chamado||false,
    };
    const {data:novo,error}=await window.sb.from('assist_chamados').insert(payload).select().single();
    if (error) throw error;
    if (v('novo-desc')&&novo?.id) {
      await window.sb.from('assist_followups').insert({
        chamado_id:novo.id, tipo:'Abertura', mensagem:v('novo-desc'),
        origem:'manual', usuario_nome:usuario?.nome||null,
      });
    }
    astFecharModalNovo();
    await astLoadChamados();
    ['novo-tel','novo-nome','novo-prod-busca','novo-prod-id','novo-desc','novo-proxima'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    const s=document.getElementById('novo-prod-sel'); if(s) s.textContent='';
  } catch(e) {
    if(erro) erro.textContent='❌ '+e.message;
  } finally {
    if(btn){btn.textContent='Salvar Chamado';btn.disabled=false;}
  }
};

// ══════════════════════════════════════════
// PRODUTOS — catálogo + análise
// ══════════════════════════════════════════
async function astLoadProdutos() {
  try {
    const [{data:prods},{data:indice}]=await Promise.all([
      window.sb.from('assist_produtos').select('*').order('nome').range(0,9999),
      window.sb.from('assist_indice_defeito').select('id_produto,chamados_garantia,qtd_vendida_12m,indice_defeito_pct,classificacao').range(0,9999),
    ]);
    astProdAll=prods||[];
    const idxMap={};
    (indice||[]).forEach(r=>{ idxMap[r.id_produto]=r; });
    const c=document.getElementById('ast-prod-count');
    if(c) c.textContent=`${astProdAll.filter(p=>p.ativo).length} ativos`;
    astRenderProdTabela(astProdAll, idxMap);
  } catch(e) {}

  try {
    const {data}=await window.sb.from('assist_produtos_criticos').select('*').order('total_chamados',{ascending:false}).range(0,9);
    const el=document.getElementById('ast-criticos-list');
    if (el&&data?.length) {
      const max=data[0].total_chamados||1;
      el.innerHTML=data.map((r,i)=>`
        <div class="ast-rank-item">
          <div class="ast-rank-pos ${i===0?'g1':i===1?'g2':i===2?'g3':''}">${i+1}</div>
          <div style="flex:1"><div class="ast-rank-name">${r.produto_nome||'—'}</div>
            <div class="ast-progress-bar"><div class="ast-progress-fill" style="width:${Math.round(r.total_chamados/max*100)}%;background:var(--red)"></div></div>
          </div>
          <div class="ast-rank-val">${r.total_chamados}<div class="ast-rank-sub">${r.chamados_abertos||0} abertos</div></div>
        </div>`).join('');
    } else if(el) el.innerHTML='<div class="ast-empty">Sem dados</div>';
  } catch(e) {}

  try {
    const {data}=await window.sb.from('assist_pecas_utilizadas_resumo').select('*').order('qtd_total_usada',{ascending:false}).range(0,9);
    const el=document.getElementById('ast-pecas-list');
    if (el&&data?.length) {
      const max=data[0].qtd_total_usada||1;
      el.innerHTML=data.map((r,i)=>`
        <div class="ast-rank-item">
          <div class="ast-rank-pos ${i===0?'g1':i===1?'g2':i===2?'g3':''}">${i+1}</div>
          <div style="flex:1"><div class="ast-rank-name">${r.peca_nome||'—'}</div>
            <div class="ast-progress-bar"><div class="ast-progress-fill" style="width:${Math.round(r.qtd_total_usada/max*100)}%;background:var(--blue-mid)"></div></div>
          </div>
          <div class="ast-rank-val">${r.qtd_total_usada}un<div class="ast-rank-sub">${r.qtd_chamados||0} chamados</div></div>
        </div>`).join('');
    } else if(el) el.innerHTML='<div class="ast-empty">Sem peças</div>';
  } catch(e) {}
  window.setLastUpdate?.();
}

function astRenderProdTabela(data, idxMap={}) {
  const tbody=document.getElementById('ast-prod-body');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML='<tr><td colspan="8"><div class="ast-empty"><div class="ast-empty-ico">📦</div>Nenhum produto. Clique em "+ Adicionar Produto".</div></td></tr>';
    return;
  }
  tbody.innerHTML=data.map(p=>{
    const idx=idxMap[p.id_produto_erp];
    const pct=idx?parseFloat(idx.indice_defeito_pct):null;
    const idxHtml=pct!=null
      ? `<span class="${astIndiceCls(pct,'text')}">${pct.toFixed(2)}%</span>`
      : '<span style="color:var(--text-muted)">—</span>';
    return `<tr>
      <td class="ast-mono" style="color:var(--text-muted)">${p.referencia||'—'}</td>
      <td style="font-weight:500">${p.nome}</td>
      <td style="color:var(--text-secondary)">${p.grupo||'—'}</td>
      <td class="right">${idx?parseInt(idx.qtd_vendida_12m).toLocaleString('pt-BR'):'—'}</td>
      <td class="right">${idx?idx.chamados_garantia:'—'}</td>
      <td class="right">${idxHtml}</td>
      <td>${p.ativo!==false?'<span class="ast-badge ast-badge-concluido">Ativo</span>':'<span class="ast-badge ast-badge-cancelado">Inativo</span>'}</td>
      <td><button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astToggleProduto(${p.id},${!p.ativo})">${p.ativo!==false?'🚫 Desativar':'✅ Ativar'}</button></td>
    </tr>`;
  }).join('');
}

window.astFiltrarProdutos=function(){
  const q=(document.getElementById('ast-prod-busca')?.value||'').toLowerCase();
  astRenderProdTabela(q?astProdAll.filter(p=>p.nome.toLowerCase().includes(q)||(p.referencia||'').toLowerCase().includes(q)):astProdAll);
};
window.astToggleProduto=async function(id,novoAtivo){
  await window.sb.from('assist_produtos').update({ativo:novoAtivo,atualizado_em:new Date().toISOString()}).eq('id',id);
  const idx=astProdAll.findIndex(p=>p.id===id);
  if(idx>=0) astProdAll[idx].ativo=novoAtivo;
  astRenderProdTabela(astProdAll);
};

// Modal adicionar produto do ERP
function astCriarModalProduto(){
  if(document.getElementById('ast-modal-prod')) return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="ast-modal-ov" id="ast-modal-prod">
      <div class="ast-modal">
        <div class="ast-modal-hdr"><div class="ast-modal-title">Adicionar Produto do ERP</div>
          <button class="ast-drawer-close" onclick="astFecharModalProduto()">✕</button></div>
        <div class="ast-modal-body">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">Busque na base de produtos do ERP e adicione ao catálogo da assistência.</div>
          <div class="ast-form-field" style="margin-bottom:10px">
            <label class="ast-form-lbl">Buscar no ERP</label>
            <input class="ast-form-input" id="mp-busca" placeholder="Nome ou referência..." oninput="astBuscarERP()">
          </div>
          <div id="mp-results" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);display:none"></div>
          <div id="mp-sel" style="display:none;background:var(--blue-pale);border:1px solid var(--blue-light);border-radius:var(--radius-sm);padding:12px 14px;margin-top:12px">
            <div style="font-size:12px;font-weight:600;color:var(--blue-dark);margin-bottom:4px">Selecionado:</div>
            <div id="mp-sel-nome" style="font-size:14px;font-weight:600"></div>
            <div id="mp-sel-ref"  style="font-size:12px;color:var(--text-muted)"></div>
          </div>
          <input type="hidden" id="mp-id-erp"><input type="hidden" id="mp-ref">
          <input type="hidden" id="mp-nome"><input type="hidden" id="mp-grupo"><input type="hidden" id="mp-sub">
          <div id="mp-erro" class="ast-form-err" style="margin-top:8px"></div>
        </div>
        <div class="ast-modal-foot">
          <button class="ast-btn ast-btn-secondary" onclick="astFecharModalProduto()">Cancelar</button>
          <button class="ast-btn ast-btn-primary" id="mp-btn" onclick="astAdicionarProduto()" disabled>Adicionar ao Catálogo</button>
        </div>
      </div>
    </div>`);
}
window.astAbrirModalProduto=function(){ astCriarModalProduto(); document.getElementById('ast-modal-prod').classList.add('open'); };
window.astFecharModalProduto=function(){ document.getElementById('ast-modal-prod')?.classList.remove('open'); };

let _erpTimer=null;
window.astBuscarERP=function(){
  clearTimeout(_erpTimer);
  _erpTimer=setTimeout(async()=>{
    const q=(document.getElementById('mp-busca')?.value||'').trim();
    const res=document.getElementById('mp-results');
    if(!res||q.length<2){if(res)res.style.display='none';return;}
    res.style.display=''; res.innerHTML='<div style="padding:12px;color:var(--text-muted);font-size:13px">Buscando...</div>';
    const {data}=await window.sb.from('comp_produtos_consolidado').select('id_produto,referencia,nome,grupo,subgrupo')
      .or(`nome.ilike.%${q}%,referencia.ilike.%${q}%`).order('nome').range(0,29);
    if(!data?.length){res.innerHTML='<div style="padding:12px;color:var(--text-muted);font-size:13px">Nenhum produto</div>';return;}
    res.innerHTML=data.map(p=>`
      <div class="ast-prod-result-item" onclick="astSelecionarERP(${p.id_produto},'${(p.referencia||'').replace(/'/g,"\\'")}','${p.nome.replace(/'/g,"\\'")}','${(p.grupo||'').replace(/'/g,"\\'")}','${(p.subgrupo||'').replace(/'/g,"\\'")}')">
        <div style="font-weight:500">${p.nome}</div>
        <div class="ast-prod-ref">${p.referencia||''} ${p.grupo?'· '+p.grupo:''}</div>
      </div>`).join('');
  },350);
};
window.astSelecionarERP=function(idErp,ref,nome,grupo,sub){
  ['mp-id-erp','mp-ref','mp-nome','mp-grupo','mp-sub'].forEach((id,i)=>{
    const e=document.getElementById(id); if(e) e.value=[idErp,ref,nome,grupo,sub][i];
  });
  document.getElementById('mp-sel-nome').textContent=nome;
  document.getElementById('mp-sel-ref').textContent=`Ref: ${ref||'—'} · ${grupo||''}`;
  document.getElementById('mp-sel').style.display='';
  document.getElementById('mp-results').style.display='none';
  const btn=document.getElementById('mp-btn'); if(btn) btn.disabled=false;
};
window.astAdicionarProduto=async function(){
  const v=id=>document.getElementById(id)?.value;
  const nome=v('mp-nome'); const erro=document.getElementById('mp-erro');
  if(!nome){if(erro)erro.textContent='Selecione um produto';return;}
  const {data:existe}=await window.sb.from('assist_produtos').select('id').eq('id_produto_erp',parseInt(v('mp-id-erp'))).maybeSingle();
  if(existe){if(erro)erro.textContent='⚠️ Produto já está no catálogo';return;}
  const btn=document.getElementById('mp-btn'); if(btn){btn.textContent='Adicionando...';btn.disabled=true;}
  const usuario=window.getUsuario?.();
  const {error}=await window.sb.from('assist_produtos').insert({
    id_produto_erp:parseInt(v('mp-id-erp')),referencia:v('mp-ref')||null,
    nome,grupo:v('mp-grupo')||null,subgrupo:v('mp-sub')||null,ativo:true,criado_por:usuario?.nome||null,
  });
  if(error){if(erro)erro.textContent='❌ '+error.message;if(btn){btn.textContent='Adicionar ao Catálogo';btn.disabled=false;}return;}
  astFecharModalProduto();
  await astLoadProdutos();
};

// ══════════════════════════════════════════
// CONFIGURAÇÕES — CRUD
// ══════════════════════════════════════════
const CFG_TABLES=[
  {id:'status',      tabela:'assist_status',      titulo:'📋 Status',        extra:'finaliza_chamado'},
  {id:'setores',     tabela:'assist_setores',      titulo:'🏢 Setores'},
  {id:'prioridades', tabela:'assist_prioridades',  titulo:'⚡ Prioridades'},
  {id:'defeitos',    tabela:'assist_defeitos',     titulo:'🔴 Defeitos'},
  {id:'causas',      tabela:'assist_causas',       titulo:'🔍 Causas'},
  {id:'solucoes',    tabela:'assist_solucoes',     titulo:'✅ Soluções'},
  {id:'procedencias',tabela:'assist_procedencias', titulo:'📦 Procedências'},
];
async function astLoadConfig(){
  const grid=document.getElementById('ast-cfg-grid');
  if(!grid) return;
  grid.innerHTML='<div style="color:var(--text-muted);font-size:13px">Carregando...</div>';
  const results=await Promise.allSettled(CFG_TABLES.map(c=>window.sb.from(c.tabela).select('*').order('nome')));
  grid.innerHTML=CFG_TABLES.map((c,i)=>{
    const rows=(results[i].status==='fulfilled'?results[i].value.data:null)||[];
    const items=rows.map(r=>`
      <div class="ast-cfg-item" id="cfg-item-${c.id}-${r.id}">
        <span class="ast-cfg-name" id="cfg-nm-${c.id}-${r.id}">${r.nome}</span>
        ${c.extra==='finaliza_chamado'?`<span style="font-size:10px;color:var(--text-muted)">${r.finaliza_chamado?'Finaliza':''}</span>`:''}
        <span class="ast-badge ${r.ativo!==false?'ast-badge-novo':'ast-badge-cancelado'}" style="font-size:10px">${r.ativo!==false?'Ativo':'Inativo'}</span>
        <div class="ast-cfg-actions">
          <button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astCfgEditar('${c.id}',${r.id},'${c.tabela}','${r.nome.replace(/'/g,"\\'")}')">✏️</button>
          <button class="ast-btn ${r.ativo!==false?'ast-btn-danger':'ast-btn-success'} ast-btn-sm" onclick="astCfgToggle('${c.tabela}',${r.id},${!r.ativo})">${r.ativo!==false?'🚫':'✅'}</button>
        </div>
      </div>`).join('');
    return `<div class="ast-cfg-card">
      <div class="ast-cfg-title">${c.titulo}<span style="font-size:11px;color:var(--text-muted);font-weight:400">${rows.length} itens</span></div>
      ${items||'<div style="color:var(--text-muted);font-size:12px;padding:6px 0">Nenhum item</div>'}
      <div class="ast-cfg-add">
        <input class="ast-cfg-input" id="cfg-new-${c.id}" placeholder="Novo item..." onkeydown="if(event.key==='Enter')astCfgAdicionar('${c.tabela}','${c.id}')">
        <button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astCfgAdicionar('${c.tabela}','${c.id}')">+ Add</button>
      </div>
    </div>`;
  }).join('');
  window.setLastUpdate?.();
}
window.astCfgAdicionar=async function(tabela,cfgId){
  const input=document.getElementById(`cfg-new-${cfgId}`);
  const nome=input?.value.trim(); if(!nome) return;
  const{error}=await window.sb.from(tabela).insert({nome});
  if(error){alert('Erro: '+error.message);return;}
  input.value=''; _statusList=[];_setoresList=[];_prioridadeList=[];
  await astLoadConfig();
};
window.astCfgToggle=async function(tabela,id,novoAtivo){
  await window.sb.from(tabela).update({ativo:novoAtivo,atualizado_em:new Date().toISOString()}).eq('id',id);
  _statusList=[];_setoresList=[];_prioridadeList=[];
  await astLoadConfig();
};
window.astCfgEditar=function(cfgId,rowId,tabela,nomeAtual){
  const el=document.getElementById(`cfg-nm-${cfgId}-${rowId}`); if(!el) return;
  el.innerHTML=`<input class="ast-cfg-input" style="width:100%" value="${nomeAtual}" id="cfg-edit-${cfgId}-${rowId}"
    onkeydown="if(event.key==='Enter')astCfgSalvarEdit('${tabela}','${cfgId}',${rowId});if(event.key==='Escape')astLoadConfig()">
    <button class="ast-btn ast-btn-success ast-btn-sm" style="margin-top:4px" onclick="astCfgSalvarEdit('${tabela}','${cfgId}',${rowId})">✅</button>
    <button class="ast-btn ast-btn-secondary ast-btn-sm" style="margin-top:4px" onclick="astLoadConfig()">✕</button>`;
  document.getElementById(`cfg-edit-${cfgId}-${rowId}`)?.focus();
};
window.astCfgSalvarEdit=async function(tabela,cfgId,rowId){
  const novoNome=document.getElementById(`cfg-edit-${cfgId}-${rowId}`)?.value.trim(); if(!novoNome) return;
  await window.sb.from(tabela).update({nome:novoNome,atualizado_em:new Date().toISOString()}).eq('id',rowId);
  _statusList=[];_setoresList=[];_prioridadeList=[];
  await astLoadConfig();
};

// ══════════════════════════════════════════
// ROTEADOR
// ══════════════════════════════════════════
const AST_LOADERS={
  'ast-gestao':   astLoadGestao,
  'ast-chamados': astLoadChamados,
  'ast-produtos': astLoadProdutos,
  'ast-config':   astLoadConfig,
};

window.ModuloAssistencia={
  showPage(pageId,container){
    _container=container; _pagina=pageId;
    if(!_iniciado){
      const w=document.createElement('div'); w.id='ast-pages';
      Object.entries(AST_PAGES).forEach(([pid,html])=>{
        const t=document.createElement('div'); t.innerHTML=html;
        if(t.firstElementChild) w.appendChild(t.firstElementChild);
      });
      container.innerHTML=''; container.appendChild(w); _iniciado=true;
    }
    container.querySelectorAll('.ast-page').forEach(p=>p.style.display='none');
    container.querySelector(`#page-${pageId}`)?.style.setProperty('display','');
    AST_LOADERS[pageId]?.();
  },
  onFiltroChange(){},
  destroy(){
    _iniciado=false;_pagina=null;
    astData=[];astFiltrados=[];astProdAll=[];astIndiceData=[];
    _statusList=[];_setoresList=[];_prioridadeList=[];
  }
};

})();
