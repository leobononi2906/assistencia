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
.ast-card-sub { font-size:11px;color:var(--text-muted);margin-top:4px; }
.ast-table-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-sm);overflow:hidden; }
.ast-table-header { padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
.ast-table-title { font-size:13px;font-weight:600;color:var(--text-primary); }
.ast-table-wrap  { overflow-x:auto;max-height:520px;overflow-y:auto; }
.ast-table { width:100%;border-collapse:collapse;font-size:13px; }
.ast-table thead th { padding:9px 14px;background:var(--surface2);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left;position:sticky;top:0;white-space:nowrap; }
.ast-table thead th.right,.ast-table td.right { text-align:right; }
.ast-table tbody tr { border-top:1px solid var(--border);transition:background .1s; }
.ast-table tbody tr:hover { background:var(--surface2);cursor:pointer; }
.ast-table tbody td { padding:10px 14px;color:var(--text-primary);vertical-align:middle; }
.ast-mono { font-family:'DM Mono',monospace;font-size:12px; }
.ast-loading td { text-align:center;padding:40px;color:var(--text-muted);font-size:13px; }
.ast-badge { display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;white-space:nowrap; }
.ast-badge-novo      { background:var(--blue-pale);color:var(--blue-mid); }
.ast-badge-andamento { background:var(--orange-bg);color:var(--orange); }
.ast-badge-concluido { background:var(--green-bg);color:var(--green); }
.ast-badge-cancelado { background:var(--surface2);color:var(--text-muted); }
.ast-badge-alta      { background:var(--red-bg);color:var(--red); }
.ast-badge-media     { background:var(--orange-bg);color:var(--orange); }
.ast-badge-baixa     { background:var(--green-bg);color:var(--green); }
.ast-badge-garantia  { background:#EFF6FF;color:#1D4ED8; }
.ast-badge-nao       { background:var(--surface2);color:var(--text-muted); }
.ast-badge-stonni    { background:#F5F3FF;color:#7C3AED; }
.ast-alerta-novo     { background:#DBEAFE;color:#1E40AF;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px; }
.ast-alerta-parado   { background:#FEF0EF;color:var(--red);font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px; }
.ast-alerta-vencendo { background:#FEF9C3;color:#A16207;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px; }
.ast-banner-novos { background:linear-gradient(135deg,#1D4ED8,#0077CC);border-radius:var(--radius);padding:14px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap; }
.ast-banner-novos-txt { color:#fff;font-size:13px;font-weight:600; }
.ast-banner-novos-sub { color:rgba(255,255,255,.75);font-size:12px;margin-top:2px; }
.ast-toggle { display:flex;gap:4px; }
.ast-toggle-btn { padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all .15s;white-space:nowrap; }
.ast-toggle-btn.active { background:var(--blue-dark);border-color:var(--blue-dark);color:#fff; }
.ast-toggle-btn:hover:not(.active) { background:var(--surface2); }
.ast-search { height:32px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--surface2);color:var(--text-primary);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;width:200px;transition:border-color .15s; }
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
.ast-overlay { display:none;position:fixed;inset:0;background:rgba(15,29,53,.4);z-index:1001; }
.ast-overlay.open { display:block; }
.ast-drawer { position:fixed;top:0;right:-800px;width:800px;height:100vh;background:var(--surface);box-shadow:var(--shadow-lg);z-index:1002;display:flex;flex-direction:column;transition:right .3s cubic-bezier(.4,0,.2,1);overflow:hidden; }
.ast-drawer.open { right:0; }
.ast-drawer-header { padding:16px 24px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0; }
.ast-drawer-title  { font-size:15px;font-weight:700;color:var(--text-primary); }
.ast-drawer-sub    { font-size:12px;color:var(--text-muted);margin-top:2px; }
.ast-drawer-close  { width:32px;height:32px;border:none;background:var(--surface2);border-radius:6px;cursor:pointer;font-size:16px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:12px; }
.ast-drawer-close:hover { background:var(--border);color:var(--text-primary); }
.ast-drawer-body   { flex:1;overflow-y:auto; }
.ast-drw-section { padding:16px 24px;border-bottom:1px solid var(--border); }
.ast-drw-section:last-child { border-bottom:none; }
.ast-drw-section-title { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:10px; }
.ast-stat-row  { display:flex;gap:18px;flex-wrap:wrap; }
.ast-stat-item { display:flex;flex-direction:column;gap:3px; }
.ast-stat-label{ font-size:11px;color:var(--text-muted); }
.ast-stat-val  { font-size:13px;font-weight:600;color:var(--text-primary); }
.ast-detail-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
.ast-detail-field{ display:flex;flex-direction:column;gap:3px; }
.ast-detail-lbl  { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted); }
.ast-detail-val  { font-size:13px;color:var(--text-primary);font-weight:500; }
.ast-form-row  { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px; }
.ast-form-row.full { grid-template-columns:1fr; }
.ast-form-field{ display:flex;flex-direction:column;gap:4px; }
.ast-form-lbl  { font-size:12px;font-weight:600;color:var(--text-secondary); }
.ast-form-input,.ast-form-select,.ast-form-textarea { padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text-primary);background:var(--surface2);outline:none;transition:border-color .15s;width:100%; }
.ast-form-input:focus,.ast-form-select:focus,.ast-form-textarea:focus { border-color:var(--blue-mid);background:#fff; }
.ast-form-textarea { resize:vertical;min-height:64px; }
.ast-form-err  { color:var(--red);font-size:12px;margin-top:2px; }
.ast-fup-form { background:var(--blue-pale);border:1px solid var(--blue-light);border-radius:var(--radius-sm);padding:14px; }
.ast-fup-list { display:flex;flex-direction:column;gap:8px; }
.ast-fup-item { background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 13px; }
.ast-fup-item.manual { border-left:3px solid var(--blue-mid); }
.ast-fup-item.whats  { border-left:3px solid #25D366; }
.ast-fup-meta { font-size:11px;color:var(--text-muted);margin-bottom:4px;display:flex;gap:5px;flex-wrap:wrap; }
.ast-fup-msg  { font-size:13px;color:var(--text-primary);line-height:1.5;white-space:pre-wrap; }
.ast-os-box { background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;display:flex;align-items:center;gap:12px; }
.ast-os-box-info { flex:1; }
.ast-os-stonni { border-left:3px solid #7C3AED; }
.ast-os-loja   { border-left:3px solid var(--blue-mid); }
.ast-prod-result { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);max-height:180px;overflow-y:auto;margin-top:4px;box-shadow:var(--shadow-md); }
.ast-prod-result-item { padding:8px 12px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);transition:background .1s; }
.ast-prod-result-item:hover { background:var(--blue-pale); }
.ast-prod-result-item:last-child { border-bottom:none; }
.ast-prod-ref { font-size:11px;color:var(--text-muted); }
.ast-sec-tabs { display:flex;border-bottom:1px solid var(--border);margin-bottom:14px;flex-wrap:wrap; }
.ast-sec-tab  { padding:8px 12px;font-size:12px;font-weight:500;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap; }
.ast-sec-tab:hover { color:var(--text-primary); }
.ast-sec-tab.active { color:var(--blue-mid);border-bottom-color:var(--blue-mid); }
.ast-sec-content { display:none; }
.ast-sec-content.active { display:block; }
.ast-hist-item { display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s; }
.ast-hist-item:hover { background:var(--surface2);margin:0 -4px;padding:9px 4px;border-radius:var(--radius-sm); }
.ast-hist-item:last-child { border-bottom:none; }
.ast-progress-bar  { height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:4px; }
.ast-progress-fill { height:100%;border-radius:3px; }
.ast-rank-item { display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border); }
.ast-rank-item:last-child { border-bottom:none; }
.ast-rank-pos  { width:22px;height:22px;background:var(--surface2);border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--text-muted);flex-shrink:0; }
.ast-rank-pos.g1 { background:#FEF9C3;border-color:#EAB308;color:#A16207; }
.ast-rank-pos.g2 { background:#F1F5F9;border-color:#94A3B8;color:#475569; }
.ast-rank-pos.g3 { background:#FEF3C7;border-color:#D97706;color:#92400E; }
.ast-rank-name { flex:1;font-size:13px;font-weight:500;color:var(--text-primary); }
.ast-rank-val  { font-size:13px;font-weight:700;text-align:right; }
.ast-cfg-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px; }
.ast-cfg-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;box-shadow:var(--shadow-sm); }
.ast-cfg-title{ font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between; }
.ast-cfg-item { display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;gap:8px; }
.ast-cfg-item:last-of-type { border-bottom:none; }
.ast-cfg-name { flex:1;color:var(--text-primary);font-weight:500; }
.ast-cfg-add  { display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border); }
.ast-cfg-input{ flex:1;height:30px;padding:0 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:12px;background:var(--surface2);outline:none; }
.ast-cfg-input:focus { border-color:var(--blue-mid); }
.ast-modal-ov { display:none;position:fixed;inset:0;background:rgba(15,29,53,.5);z-index:300;align-items:center;justify-content:center; }
.ast-modal-ov.open { display:flex; }
.ast-modal { background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow-lg);width:580px;max-width:96vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden; }
.ast-modal-hdr  { padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0; }
.ast-modal-title{ font-size:15px;font-weight:700;color:var(--text-primary); }
.ast-modal-body { padding:18px 22px;overflow-y:auto;flex:1; }
.ast-modal-foot { padding:13px 22px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0; }
.ast-bloqueado-banner { background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px; }
.ast-empty { text-align:center;padding:32px 20px;color:var(--text-muted);font-size:13px; }
.ast-empty-ico { font-size:28px;margin-bottom:8px;opacity:.5; }
.ast-idx-normal  { color:var(--green);font-weight:700; }
.ast-idx-atencao { color:var(--orange);font-weight:700; }
.ast-idx-critico { color:var(--red);font-weight:700; }
.ast-gest-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px; }
.ast-evolucao-bar { display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border); }
.ast-evolucao-bar:last-child { border-bottom:none; }
.ast-kanban       { display:flex;gap:14px;overflow-x:auto;padding-bottom:16px;align-items:flex-start; }
.ast-kanban-col   { min-width:248px;max-width:262px;flex-shrink:0;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius); }
.ast-kanban-hdr   { padding:10px 13px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between; }
.ast-kanban-title { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary); }
.ast-kanban-count { background:var(--border);color:var(--text-muted);font-size:11px;font-weight:700;padding:1px 7px;border-radius:10px; }
.ast-kanban-cards { padding:9px;display:flex;flex-direction:column;gap:7px;min-height:60px; }
.ast-kanban-card  { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;cursor:pointer;transition:all .15s;box-shadow:var(--shadow-sm); }
.ast-kanban-card:hover { box-shadow:var(--shadow-md);transform:translateY(-1px); }
.ast-kanban-card.parado { border-left:3px solid var(--red); }
.ast-kanban-card.novo   { border-left:3px solid var(--blue-mid); }
.ast-kanban-card-name { font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:2px; }
.ast-kanban-card-sub  { font-size:11px;color:var(--text-muted);line-height:1.3; }
.ast-kanban-card-foot { margin-top:7px;display:flex;align-items:center;justify-content:space-between;gap:4px; }
@media (max-width:768px) {
  .ast-drawer { width:100%;right:-100%; }
  .ast-detail-grid,.ast-form-row,.ast-gest-grid { grid-template-columns:1fr; }
  .ast-modal { width:96vw; }
}
  `;
  document.head.appendChild(s);
})();
// ══════════════════════════════════════════
// HTML DAS PÁGINAS
// ══════════════════════════════════════════
const AST_PAGES = {
'ast-chamados': `<div class="ast-page" id="page-ast-chamados">
  <div id="ast-banner-novos" style="display:none" class="ast-banner-novos">
    <div>
      <div class="ast-banner-novos-txt">🔵 <span id="ast-novos-qtd">0</span> chamados novos aguardando atendimento</div>
      <div class="ast-banner-novos-sub">Chegaram via WhatsApp e ainda não foram abertos</div>
    </div>
    <button class="ast-btn ast-btn-sm" style="background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3)" onclick="astFiltrarNovos()">Ver apenas novos</button>
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <div class="ast-toggle" id="ast-view-toggle">
        <button class="ast-toggle-btn" onclick="astSetView('lista',this)">☰ Lista</button>
        <button class="ast-toggle-btn active" onclick="astSetView('kanban',this)">⬜ Kanban</button>
      </div>
      <div class="ast-toggle" id="ast-ordem-toggle">
        <button class="ast-toggle-btn active" onclick="astSetOrdem('antigo',this)" title="Mais antigo primeiro">⬆ Mais antigo</button>
        <button class="ast-toggle-btn" onclick="astSetOrdem('recente',this)" title="Mais recente primeiro">⬇ Mais recente</button>
      </div>
      <select class="ast-select" id="ast-fil-status" onchange="astAplicarFiltros()"><option value="">Todos os status</option></select>
      <select class="ast-select" id="ast-fil-setor"  onchange="astAplicarFiltros()"><option value="">Todos os setores</option></select>
      <input class="ast-search" id="ast-busca" placeholder="Buscar cliente ou produto..." oninput="astAplicarFiltros()">
      <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-secondary);cursor:pointer">
        <input type="checkbox" id="ast-ver-finalizados" onchange="astAplicarFiltros()"> Finalizados
      </label>
    </div>
    <button class="ast-btn ast-btn-primary" onclick="astAbrirModalNovo()">+ Novo Chamado</button>
  </div>
  <div id="ast-lista-view" style="display:none">
    <div class="ast-table-card">
      <div class="ast-table-header">
        <div class="ast-table-title">Chamados — <span id="ast-lista-count">—</span></div>
        <div class="ast-toggle">
          <button class="ast-toggle-btn active" onclick="astSetOrdem('recente',this)">Recente</button>
          <button class="ast-toggle-btn" onclick="astSetOrdem('antigo',this)">Antigo</button>
          <button class="ast-toggle-btn" onclick="astSetOrdem('parado',this)">Mais parado</button>
        </div>
      </div>
      <div class="ast-table-wrap">
        <table class="ast-table">
          <thead><tr><th>#</th><th>Cliente / Telefone</th><th>Produto</th><th>Status</th><th>Setor</th><th class="right">Dias</th><th>Alertas</th></tr></thead>
          <tbody id="ast-lista-body"><tr class="ast-loading"><td colspan="7">Carregando...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
  <div id="ast-kanban-view">
    <div class="ast-kanban" id="ast-kanban-board"></div>
  </div>
</div>`,

'ast-gestao': `<div class="ast-page" id="page-ast-gestao">
  <div class="ast-cards">
    <div class="ast-card"><div class="ast-card-label">Chamados Abertos</div><div class="ast-card-value blue" id="ast-k-abertos">—</div><div class="ast-card-sub">situação atual</div></div>
    <div class="ast-card"><div class="ast-card-label">Concluídos no Mês</div><div class="ast-card-value green" id="ast-k-concluidos">—</div><div class="ast-card-sub">este mês</div></div>
    <div class="ast-card"><div class="ast-card-label">Taxa de Resolução</div><div class="ast-card-value" id="ast-k-taxa">—</div><div class="ast-card-sub">concluídos / total mês</div></div>
    <div class="ast-card"><div class="ast-card-label">Tempo Médio</div><div class="ast-card-value" id="ast-k-tempo">—</div><div class="ast-card-sub">dias até concluir</div></div>
    <div class="ast-card"><div class="ast-card-label">Parados +7 dias</div><div class="ast-card-value red" id="ast-k-parados">—</div><div class="ast-card-sub">sem follow-up</div></div>
    <div class="ast-card"><div class="ast-card-label">Pior Índice Defeito</div><div class="ast-card-value red" id="ast-k-pior-idx" style="font-size:18px;line-height:1.3">—</div><div class="ast-card-sub" id="ast-k-pior-prod">últimos 12 meses</div></div>
  </div>
  <div class="ast-table-card" style="margin-top:16px">
    <div class="ast-table-header">
      <div class="ast-table-title">📅 Atendimentos por Dia — <span id="ast-k-mes-nome"></span></div>
      <div style="display:flex;gap:14px;font-size:11px;color:var(--text-muted)">
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--blue-mid);border-radius:2px;margin-right:3px"></span>Abertos</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--green);border-radius:2px;margin-right:3px"></span>Concluídos</span>
      </div>
    </div>
    <div style="padding:14px 18px;overflow-x:auto" id="ast-grafico-dia"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
  </div>
  <div class="ast-gest-grid" style="margin-top:16px">
    <div class="ast-table-card">
      <div class="ast-table-header"><div class="ast-table-title">Distribuição por Setor</div></div>
      <div style="padding:14px 18px" id="ast-setor-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
    </div>
    <div class="ast-table-card">
      <div class="ast-table-header"><div class="ast-table-title">Evolução Mensal</div></div>
      <div style="padding:14px 18px" id="ast-evolucao-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
    </div>
  </div>
  <div class="ast-table-card" style="margin-top:16px">
    <div class="ast-table-header">
      <div class="ast-table-title">💰 Custo Garantia por Mês</div>
      <div style="display:flex;gap:14px;font-size:11px;color:var(--text-muted)">
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--red);border-radius:2px;margin-right:3px"></span>Produtos (custo)</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:var(--orange);border-radius:2px;margin-right:3px"></span>Frete CTe</span>
      </div>
    </div>
    <div style="padding:14px 18px" id="ast-custo-garantia-chart"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
  </div>
  <div class="ast-section-title">Índice de Defeito — últimos 12 meses</div>
  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title">Chamados garantia ÷ unidades vendidas</div>
      <div style="display:flex;gap:10px;font-size:11px;align-items:center">
        <span style="color:var(--green);font-weight:700">● &lt;1% normal</span>
        <span style="color:var(--orange);font-weight:700">● 1-3% atenção</span>
        <span style="color:var(--red);font-weight:700">● &gt;3% crítico</span>
      </div>
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr><th>Produto</th><th class="right">Vendidos 12m</th><th class="right">Chamados</th><th class="right">Índice</th><th class="right">Tempo Médio</th><th>Situação</th></tr></thead>
        <tbody id="ast-indice-body"><tr class="ast-loading"><td colspan="6">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
  <div class="ast-section-title">Chamados Parados</div>
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
  <div class="ast-section-title">Números Bloqueados</div>
  <div class="ast-table-card">
    <div class="ast-table-header"><div class="ast-table-title">Classificados como Não-Garantia — <span id="ast-bloq-count">—</span></div></div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr><th>Telefone</th><th>Motivo</th><th>Bloqueado por</th><th>Data</th><th style="width:80px"></th></tr></thead>
        <tbody id="ast-bloq-body"><tr class="ast-loading"><td colspan="5">Carregando...</td></tr></tbody>
      </table>
    </div>
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
        <thead><tr><th>Referência</th><th>Produto</th><th>Grupo</th><th class="right">Vendidos 12m</th><th class="right">Chamados</th><th class="right">Índice</th><th>Status</th><th style="width:80px"></th></tr></thead>
        <tbody id="ast-prod-body"><tr class="ast-loading"><td colspan="8">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px">
    <div class="ast-table-card"><div class="ast-table-header"><div class="ast-table-title">🔴 Mais Chamados</div></div><div style="padding:12px 16px" id="ast-criticos-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div></div>
    <div class="ast-table-card"><div class="ast-table-header"><div class="ast-table-title">🔧 Peças Mais Usadas</div></div><div style="padding:12px 16px" id="ast-pecas-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div></div>
  </div>
</div>`,

'ast-entregas': `<div class="ast-page" id="page-ast-entregas">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
    <div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">🚚 Entregas — Departamento Garantia</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">NFs emitidas pelo departamento de Garantia do ERP</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input class="ast-search" id="ast-ent-busca" placeholder="Buscar cliente ou NF..." oninput="astEntregas.filtrar()" style="width:220px">
      <select class="ast-select" id="ast-ent-status" onchange="astEntregas.filtrar()">
        <option value="todas">Todas</option>
        <option value="nao_entregues">Não entregues</option>
        <option value="entregues">Entregues</option>
      </select>
      <select class="ast-select" id="ast-ent-mes" onchange="astEntregas.carregar()">
        <option value="0">Mês atual</option>
        <option value="1">Mês anterior</option>
        <option value="3">Últimos 3 meses</option>
        <option value="6">Últimos 6 meses</option>
      </select>
    </div>
  </div>
  <div class="ast-cards" style="margin-bottom:16px">
    <div class="ast-card"><div class="ast-card-label">Total de NFs</div><div class="ast-card-value blue" id="ast-ent-k-total">—</div><div class="ast-card-sub">no período</div></div>
    <div class="ast-card"><div class="ast-card-label">Valor Total</div><div class="ast-card-value" id="ast-ent-k-valor">—</div><div class="ast-card-sub">faturamento NFs</div></div>
    <div class="ast-card"><div class="ast-card-label">Frete Total</div><div class="ast-card-value orange" id="ast-ent-k-frete">—</div><div class="ast-card-sub">custo transporte</div></div>
    <div class="ast-card"><div class="ast-card-label">Clientes Atendidos</div><div class="ast-card-value green" id="ast-ent-k-clientes">—</div><div class="ast-card-sub">únicos no período</div></div>
  </div>
  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title">NFs emitidas — <span id="ast-ent-count">—</span></div>
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table">
        <thead><tr><th>NF</th><th>Data</th><th>Cliente</th><th>Transportadora</th><th class="right">Valor NF</th><th class="right">Frete</th><th>CTe / Rastreio</th></tr></thead>
        <tbody id="ast-ent-body"><tr class="ast-loading"><td colspan="7">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>`,

'ast-mov-garantia': `<div class="ast-page" id="page-ast-mov-garantia">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
    <div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">🔧 Movimentação — Garantia</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Saídas e entradas de estoque nas OS do departamento Garantia</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <select class="ast-select" id="ast-mg-mes" onchange="astMovGarantia.carregar()">
        ${(()=>{const opts=[];const hoje=new Date();for(let i=0;i<12;i++){const d=new Date(hoje.getFullYear(),hoje.getMonth()-i,1);const val=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');const lbl=d.toLocaleString('pt-BR',{month:'long',year:'numeric'});opts.push('<option value="'+val+'"'+(i===0?' selected':'')+'>'+lbl.charAt(0).toUpperCase()+lbl.slice(1)+'</option>');}return opts.join('');})()}
      </select>
      <div class="ast-toggle" id="ast-mg-tipo-toggle">
        <button class="ast-toggle-btn" onclick="astMovGarantia.setTipo('saidas',this)">⬆ Saídas</button>
        <button class="ast-toggle-btn" onclick="astMovGarantia.setTipo('entradas',this)">⬇ Entradas</button>
        <button class="ast-toggle-btn active" onclick="astMovGarantia.setTipo('saldo',this)">⇅ Saldo</button>
      </div>
      <input class="ast-search" id="ast-mg-busca" placeholder="Buscar produto..." oninput="astMovGarantia.filtrar()" style="width:200px">
    </div>
  </div>

  <div class="ast-cards" style="margin-bottom:16px" id="ast-mg-kpis">
    <div class="ast-card"><div class="ast-card-label">Saídas (qtd)</div><div class="ast-card-value blue" id="ast-mg-k-qtd-s">—</div><div class="ast-card-sub" id="ast-mg-k-prod-s">— produtos</div></div>
    <div class="ast-card"><div class="ast-card-label">Custo Saídas</div><div class="ast-card-value red" id="ast-mg-k-custo-s">—</div><div class="ast-card-sub">custo total saído</div></div>
    <div class="ast-card"><div class="ast-card-label">Devoluções (qtd)</div><div class="ast-card-value green" id="ast-mg-k-qtd-e">—</div><div class="ast-card-sub" id="ast-mg-k-prod-e">— itens</div></div>
    <div class="ast-card"><div class="ast-card-label">Custo Devoluções</div><div class="ast-card-value" id="ast-mg-k-custo-e">—</div><div class="ast-card-sub">custo total entrado</div></div>
    <div class="ast-card"><div class="ast-card-label">Consumo Líquido</div><div class="ast-card-value orange" id="ast-mg-k-saldo">—</div><div class="ast-card-sub">saídas − devoluções</div></div>
  </div>

  <div class="ast-table-card">
    <div class="ast-table-header">
      <div class="ast-table-title" id="ast-mg-table-title">Saídas de estoque — <span id="ast-mg-count">—</span></div>
    </div>
    <div class="ast-table-wrap">
      <table class="ast-table" id="ast-mg-table">
        <thead id="ast-mg-thead"></thead>
        <tbody id="ast-mg-tbody"><tr class="ast-loading"><td colspan="7">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>`,

'ast-parceiros': `<div class="ast-page" id="page-ast-parceiros">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
    <div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">🗺️ Rede de Assistência Técnica</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Parceiros autorizados — <span id="ast-par-count">—</span></div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <div class="ast-toggle" id="ast-par-tag-filter">
        <button class="ast-toggle-btn active" onclick="astParceiros.filtrarTag('',this)">Todos</button>
        <button class="ast-toggle-btn" onclick="astParceiros.filtrarTag('Ar Condicionado',this)">❄️ Ar</button>
        <button class="ast-toggle-btn" onclick="astParceiros.filtrarTag('Geladeira',this)">🧊 Geladeira</button>
        <button class="ast-toggle-btn" onclick="astParceiros.filtrarTag('Gerador',this)">⚡ Gerador</button>
      </div>
      <select class="ast-select" id="ast-par-uf" onchange="astParceiros.aplicarFiltros()">
        <option value="">Todos os estados</option>
        <option>AC</option><option>AL</option><option>AM</option><option>AP</option>
        <option>BA</option><option>CE</option><option>DF</option><option>ES</option>
        <option>GO</option><option>MA</option><option>MG</option><option>MS</option>
        <option>MT</option><option>PA</option><option>PB</option><option>PE</option>
        <option>PI</option><option>PR</option><option>RJ</option><option>RN</option>
        <option>RO</option><option>RR</option><option>RS</option><option>SC</option>
        <option>SE</option><option>SP</option><option>TO</option>
      </select>
      <select class="ast-select" id="ast-par-status" onchange="astParceiros.aplicarFiltros()">
        <option value="">Todos os status</option>
        <option value="ativo">Ativo</option>
        <option value="teste">Em teste</option>
        <option value="suspenso">Suspenso</option>
        <option value="inativo">Inativo</option>
      </select>
      <input class="ast-search" id="ast-par-busca" placeholder="Buscar parceiro..." oninput="astParceiros.aplicarFiltros()" style="width:200px">
      <button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astParceiros.abrirNovo()">+ Novo</button>
    </div>
  </div>
  <div id="ast-par-mapa" style="height:420px;border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;background:var(--surface2)">
    <div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">
      <div class="ast-loading-spinner"></div> Carregando mapa...
    </div>
  </div>
  <div id="ast-par-lista" style="margin-top:12px">
    <div class="ast-table-card">
      <div class="ast-table-header">
        <div class="ast-table-title">📋 Lista — <span id="ast-par-lista-count">—</span></div>
      </div>
      <div class="ast-table-wrap">
        <table class="ast-table">
          <thead><tr>
            <th>Nome</th><th>Responsável</th><th>Telefone</th>
            <th>Cidade</th><th>UF</th><th>Avaliação</th><th>Status</th><th>Produtos</th>
          </tr></thead>
          <tbody id="ast-par-lista-tbody">
            <tr class="ast-loading"><td colspan="6">Carregando...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`,

'ast-config': `<div class="ast-page" id="page-ast-config">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
    <div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Configurações</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Gerencie opções sem suporte técnico</div>
    </div>
  </div>
  <div class="ast-toggle" style="margin-bottom:18px" id="ast-cfg-tabs">
    <button class="ast-toggle-btn active" onclick="astCfgMostrarAba('atendimento',this)">🔧 Atendimento</button>
    <button class="ast-toggle-btn" onclick="astCfgMostrarAba('parceiros',this)">🗺️ Parceiros</button>
    <button class="ast-toggle-btn" onclick="astCfgMostrarAba('produtos',this)">📦 Produtos</button>
  </div>
  <div id="ast-cfg-aba-atendimento">
    <div class="ast-cfg-grid" id="ast-cfg-grid"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
  </div>
  <div id="ast-cfg-aba-parceiros" style="display:none">
    <div class="ast-cfg-grid" id="ast-cfg-grid-parceiros"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div>
  </div>
  <div id="ast-cfg-aba-produtos" style="display:none">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text-primary)">Produtos da Assistência</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Catálogo curado para atendimentos de garantia — <span id="ast-prod-count-cfg">—</span></div>
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
          <thead><tr><th>Referência</th><th>Produto</th><th>Grupo</th><th class="right">Vendidos 12m</th><th class="right">Chamados</th><th class="right">Índice</th><th>Status</th><th style="width:80px"></th></tr></thead>
          <tbody id="ast-prod-body"><tr class="ast-loading"><td colspan="8">Carregando...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px">
      <div class="ast-table-card"><div class="ast-table-header"><div class="ast-table-title">🔴 Mais Chamados</div></div><div style="padding:12px 16px" id="ast-criticos-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div></div>
      <div class="ast-table-card"><div class="ast-table-header"><div class="ast-table-title">🔧 Peças Mais Usadas</div></div><div style="padding:12px 16px" id="ast-pecas-list"><div style="color:var(--text-muted);font-size:13px">Carregando...</div></div></div>
    </div>
  </div>
</div>`
};
// ══════════════════════════════════════════
// ESTADO + HELPERS
// ══════════════════════════════════════════
let _container = null, _iniciado = false, _pagina = null;
let astData = [], astFiltrados = [], astView = 'kanban', astOrdem = 'antigo';
let astProdAll = [];
let _statusList = [], _setoresList = [];
let _defeitos = [], _causas = [], _procedencias = [];

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
  if (!n || n === 'garantia') return '<span class="ast-badge ast-badge-garantia">🔴 Garantia</span>';
  return '<span class="ast-badge ast-badge-nao">⚫ Não-Garantia</span>';
}
function astAlertasBadges(r) {
  const bits = [];
  if (!r.visualizado) bits.push('<span class="ast-alerta-novo">🔵 NOVO</span>');
  const dsf = r.dias_sem_followup||0; if (dsf >= 7 && !astEhFinalizado(r)) bits.push(`<span class="ast-alerta-parado">🔴 PARADO ${dsf}d</span>`);
  const d = astDias(r.data_abertura) || 0;
  if (d >= 23 && d <= 35 && !astEhFinalizado(r)) bits.push('<span class="ast-alerta-vencendo">🟡 GARANTIA</span>');
  return bits.join(' ');
}
function astIndiceCls(pct) {
  const v = parseFloat(pct);
  return v > 3 ? 'critico' : v > 1 ? 'atencao' : 'normal';
}
const astEhFinalizado = r => r.finaliza_chamado === true || r.concluido === true;
const astSelectOptions = (lista, val) => lista.map(i =>
  `<option value="${i.id}" ${i.id == val ? 'selected' : ''}>${i.nome}</option>`).join('');

// ══════════════════════════════════════════
// LOOKUPS
// ══════════════════════════════════════════
async function astCarregarLookups() {
  if (_statusList.length) return;
  const [s, se, p, d, c, pr] = await Promise.allSettled([
    window.sb.from('assist_status').select('id,nome,finaliza_chamado,ordem,cor,sla_horas').eq('ativo',true).order('ordem')
      .then(r => r.error ? window.sb.from('assist_status').select('id,nome,finaliza_chamado,ordem').eq('ativo',true).order('ordem') : r),
    window.sb.from('assist_setores').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_prioridades').select('id,nome,ordem').eq('ativo',true).order('ordem'),
    window.sb.from('assist_defeitos').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_causas').select('id,nome').eq('ativo',true).order('nome'),
    window.sb.from('assist_procedencias').select('id,nome').eq('ativo',true).order('nome'),
  ]);
  _statusList    = s.status  ==='fulfilled'?(s.value.data ||[]):[];
  _setoresList   = se.status ==='fulfilled'?(se.value.data||[]):[];
  _defeitos      = d.status  ==='fulfilled'?(d.value.data ||[]):[];
  _causas        = c.status  ==='fulfilled'?(c.value.data ||[]):[];
  _procedencias  = pr.status ==='fulfilled'?(pr.value.data||[]):[];
}
function astInvalidarLookups() { _statusList=[]; _setoresList=[]; }
// ══════════════════════════════════════════
// GESTÃO
// ══════════════════════════════════════════
async function astLoadGestao() {
  await Promise.all([astLoadKPIs(), astLoadSetorDistrib(), astLoadEvolucao(), astLoadGraficoDia(), astLoadIndiceDefeito(), astLoadCustoGarantia(), astLoadParados(), astLoadBloqueados()]);
  window.setLastUpdate?.();
}
async function astLoadKPIs() {
  try {
    const { data } = await window.sb.from('assist_kpis').select('*').single();
    if (!data) return;
    const ab = data.chamados_abertos||0, co = data.chamados_concluidos_mes||0;
    const taxa = (ab+co)>0?Math.round(co/(ab+co)*100):0;
    document.getElementById('ast-k-abertos').textContent    = ab;
    document.getElementById('ast-k-concluidos').textContent = co;
    document.getElementById('ast-k-taxa').textContent       = `${taxa}%`;
    document.getElementById('ast-k-taxa').className         = `ast-card-value ${taxa>=70?'green':taxa>=40?'orange':'red'}`;
    document.getElementById('ast-k-tempo').textContent      = data.tempo_medio_resolucao_dias!=null?`${parseFloat(data.tempo_medio_resolucao_dias).toFixed(1)}d`:'—';
    document.getElementById('ast-k-parados').textContent    = data.chamados_parados||0;
  } catch(e) {}
}
async function astLoadSetorDistrib() {
  const el = document.getElementById('ast-setor-list'); if (!el) return;
  try {
    const { data } = await window.sb.from('assist_kanban').select('setor_responsavel,concluido,finaliza_chamado,natureza').range(0,9999);
    const map = {};
    (data||[]).forEach(r => {
      if (astEhFinalizado(r)||r.natureza==='nao_garantia') return;
      const k = r.setor_responsavel||'Sem setor'; map[k]=(map[k]||0)+1;
    });
    const total = Object.values(map).reduce((a,v)=>a+v,0);
    if (!total) { el.innerHTML='<div class="ast-empty">Nenhum chamado aberto</div>'; return; }
    el.innerHTML = Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px">
          <span style="font-weight:500">${s}</span><span style="color:var(--text-muted)">${n} chamados</span>
        </div>
        <div class="ast-progress-bar"><div class="ast-progress-fill" style="width:${Math.round(n/total*100)}%;background:var(--blue-mid)"></div></div>
      </div>`).join('');
  } catch(e) {}
}
async function astLoadEvolucao() {
  const el = document.getElementById('ast-evolucao-list'); if (!el) return;
  try {
    const desde = new Date(); desde.setMonth(desde.getMonth()-5); desde.setDate(1);
    const { data } = await window.sb.from('assist_chamados').select('data_abertura,data_conclusao,concluido,natureza')
      .gte('data_abertura',desde.toISOString().slice(0,10)).eq('natureza','garantia').range(0,9999);
    const meses = {};
    for (let i=5;i>=0;i--) { const d=new Date();d.setMonth(d.getMonth()-i);d.setDate(1); meses[d.toISOString().slice(0,7)]={ab:0,co:0}; }
    (data||[]).forEach(r => {
      const k=(r.data_abertura||'').slice(0,7); if(meses[k]) meses[k].ab++;
      if(r.concluido&&r.data_conclusao){const kc=r.data_conclusao.slice(0,7);if(meses[kc])meses[kc].co++;}
    });
    const max = Math.max(...Object.values(meses).map(m=>Math.max(m.ab,m.co)),1);
    el.innerHTML = Object.entries(meses).map(([k,m])=>{
      const [ano,mes]=k.split('-');
      const nomeMes=new Date(ano,parseInt(mes)-1).toLocaleString('pt-BR',{month:'short'});
      return `<div class="ast-evolucao-bar">
        <div style="width:28px;font-size:11px;color:var(--text-muted);flex-shrink:0">${nomeMes}</div>
        <div style="flex:1">
          <div style="display:flex;gap:4px;align-items:center;margin-bottom:2px">
            <div style="height:9px;border-radius:2px;background:var(--blue-mid);width:${Math.round(m.ab/max*100)}%;min-width:2px"></div>
            <span style="font-size:11px;color:var(--text-muted)">${m.ab}</span>
          </div>
          <div style="display:flex;gap:4px;align-items:center">
            <div style="height:9px;border-radius:2px;background:var(--green);width:${Math.round(m.co/max*100)}%;min-width:2px"></div>
            <span style="font-size:11px;color:var(--text-muted)">${m.co}</span>
          </div>
        </div>
      </div>`;
    }).join('')+'<div style="display:flex;gap:14px;margin-top:8px;font-size:11px;color:var(--text-muted)"><span><span style="display:inline-block;width:10px;height:10px;background:var(--blue-mid);border-radius:2px;margin-right:3px"></span>Abertos</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--green);border-radius:2px;margin-right:3px"></span>Concluídos</span></div>';
  } catch(e) { el.innerHTML='<div style="color:var(--text-muted);font-size:13px">Sem dados</div>'; }
}

async function astLoadGraficoDia() {
  const el = document.getElementById('ast-grafico-dia');
  const elMes = document.getElementById('ast-k-mes-nome');
  if (!el) return;
  try {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const nomeMes = hoje.toLocaleString('pt-BR', {month:'long', year:'numeric'});
    if (elMes) elMes.textContent = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

    const inicio = new Date(ano, mes, 1).toISOString().slice(0,10);
    const fim    = new Date(ano, mes+1, 0).toISOString().slice(0,10);
    const diasNoMes = new Date(ano, mes+1, 0).getDate();

    // Duas queries separadas — evita OR que traz chamados antigos ainda abertos
    const [{ data: dataAbertos }, { data: dataConcluidos }] = await Promise.all([
      window.sb.from('assist_chamados')
        .select('data_abertura')
        .eq('natureza','garantia')
        .not('umbler_conversa_id','is',null)
        .gte('data_abertura', inicio)
        .lte('data_abertura', fim + 'T23:59:59')
        .range(0,9999),
      window.sb.from('assist_chamados')
        .select('data_conclusao')
        .eq('natureza','garantia')
        .not('umbler_conversa_id','is',null)
        .eq('concluido', true)
        .gte('data_conclusao', inicio)
        .lte('data_conclusao', fim + 'T23:59:59')
        .range(0,9999),
    ]);

    // Montar arrays por dia
    const abertos    = new Array(diasNoMes).fill(0);
    const concluidos = new Array(diasNoMes).fill(0);

    (dataAbertos||[]).forEach(r => {
      const d = new Date(r.data_abertura);
      if (d.getFullYear()===ano && d.getMonth()===mes) abertos[d.getDate()-1]++;
    });
    (dataConcluidos||[]).forEach(r => {
      const d = new Date(r.data_conclusao);
      if (d.getFullYear()===ano && d.getMonth()===mes) concluidos[d.getDate()-1]++;
    });

    const maxVal = Math.max(...abertos, ...concluidos, 1);
    const barH = 52; // altura máxima px das barras
    const diaHoje = hoje.getDate();

    const html = `
      <div style="display:flex;align-items:flex-end;gap:3px;height:${barH+28}px;overflow-x:auto;padding-bottom:4px">
        ${Array.from({length:diasNoMes},(_,i)=>{
          const dia = i+1;
          const ab  = abertos[i];
          const co  = concluidos[i];
          const hAb = ab  ? Math.max(Math.round(ab /maxVal*barH), 3) : 0;
          const hCo = co  ? Math.max(Math.round(co /maxVal*barH), 3) : 0;
          const isHoje = dia===diaHoje;
          const isFut  = dia>diaHoje;
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;min-width:18px;flex:1;max-width:32px;opacity:${isFut?0.35:1}">
            <div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:1px;height:${barH}px">
              ${ab?`<div title="${ab} abertos" style="width:100%;height:${hAb}px;background:var(--blue-mid);border-radius:2px 2px 0 0"></div>`:''}
              ${co?`<div title="${co} concluídos" style="width:100%;height:${hCo}px;background:var(--green);border-radius:2px 2px 0 0"></div>`:''}
              ${!ab&&!co?`<div style="width:100%;height:2px;background:var(--border);border-radius:2px;margin-top:auto"></div>`:''}
            </div>
            <div style="font-size:9px;color:${isHoje?'var(--blue-mid)':'var(--text-muted)'};font-weight:${isHoje?'700':'400'};white-space:nowrap">${dia}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">
        <span>Total abertos no mês: <strong style="color:var(--blue-mid)">${abertos.reduce((a,b)=>a+b,0)}</strong></span>
        <span>Total concluídos: <strong style="color:var(--green)">${concluidos.reduce((a,b)=>a+b,0)}</strong></span>
      </div>`;
    el.innerHTML = html;
  } catch(e) { el.innerHTML='<div style="color:var(--text-muted);font-size:13px">Sem dados</div>'; }
}

async function astLoadIndiceDefeito() {
  const tbody = document.getElementById('ast-indice-body'); if (!tbody) return;
  try {
    const { data } = await window.sb.from('assist_indice_defeito').select('*').order('indice_defeito_pct',{ascending:false}).range(0,49);
    if (data?.length) {
      const pior = data[0];
      const el=document.getElementById('ast-k-pior-idx'), ep=document.getElementById('ast-k-pior-prod');
      if(el){el.textContent=`${pior.indice_defeito_pct}%`;el.className='ast-card-value red';}
      if(ep)ep.textContent=(pior.produto_nome||'—').slice(0,28);
    }
    if (!data?.length) { tbody.innerHTML='<tr><td colspan="6"><div class="ast-empty">Sem dados — adicione produtos ao catálogo</div></td></tr>'; return; }
    const maxPct = Math.max(...data.map(r=>parseFloat(r.indice_defeito_pct)||0),1);
    tbody.innerHTML = data.map(r => {
      const pct=parseFloat(r.indice_defeito_pct)||0, cls=astIndiceCls(pct);
      return `<tr>
        <td><div style="font-weight:500">${r.produto_nome||'—'}</div><div style="font-size:11px;color:var(--text-muted)">${r.referencia||''}</div></td>
        <td class="right">${parseInt(r.qtd_vendida_12m||0).toLocaleString('pt-BR')}</td>
        <td class="right">${r.chamados_garantia||0}</td>
        <td class="right"><span class="ast-idx-${cls}">${pct.toFixed(2)}%</span>
          <div class="ast-progress-bar" style="width:70px;display:inline-block;vertical-align:middle;margin-left:6px">
            <div class="ast-progress-fill" style="width:${Math.round(pct/maxPct*100)}%;background:${pct>3?'var(--red)':pct>1?'var(--orange)':'var(--green)'}"></div>
          </div></td>
        <td class="right">${r.tempo_medio_dias||0}d</td>
        <td>${r.chamados_abertos>0?`<span style="color:var(--orange);font-weight:600">${r.chamados_abertos} abertos</span>`:'<span style="color:var(--green)">✅ OK</span>'}</td>
      </tr>`;
    }).join('');
  } catch(e) {}
}
async function astLoadParados() {
  const tbody = document.getElementById('ast-parados-body'); if (!tbody) return;
  try {
    const { data } = await window.sb.from('assist_kanban').select('id,nome_contato,cliente_nome,produto_nome,status_nome,setor_responsavel,dias_sem_followup')
      .gte('dias_sem_followup',7).eq('natureza','garantia').order('dias_sem_followup',{ascending:false}).range(0,49);
    if (!data?.length) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--green);font-size:13px">✅ Nenhum chamado parado</td></tr>'; return; }
    tbody.innerHTML = data.map(r=>`
      <tr onclick="astAbrirDetalhe(${r.id})">
        <td class="ast-mono" style="color:var(--text-muted)">#${r.id}</td>
        <td style="font-weight:500">${r.cliente_nome||r.nome_contato||'—'}</td>
        <td style="color:var(--text-secondary)">${r.produto_nome||'—'}</td>
        <td>${r.setor_responsavel||'—'}</td>
        <td class="right">${astDiasBadge(r.dias_sem_followup)}</td>
        <td>${astStatusBadge(r.status_nome)}</td>
      </tr>`).join('');
  } catch(e) {}
}
async function astLoadBloqueados() {
  const tbody = document.getElementById('ast-bloq-body'), count = document.getElementById('ast-bloq-count');
  if (!tbody) return;
  try {
    const { data } = await window.sb.from('assist_numeros_bloqueados').select('*').eq('ativo',true).order('bloqueado_em',{ascending:false}).range(0,99);
    if (count) count.textContent=`${(data||[]).length} números`;
    if (!data?.length) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">Nenhum número bloqueado</td></tr>'; return; }
    tbody.innerHTML = data.map(r=>`
      <tr>
        <td class="ast-mono">${r.telefone||r.telefone_norm}</td>
        <td style="color:var(--text-muted)">${r.motivo||'—'}</td>
        <td style="color:var(--text-muted)">${r.bloqueado_por||'—'}</td>
        <td style="color:var(--text-muted)">${astFmtDate(r.bloqueado_em)}</td>
        <td><button class="ast-btn ast-btn-success ast-btn-sm" onclick="astDesbloquear(${r.id},'${(r.telefone||'').replace(/'/g,"\\'")}')">✅ Desbloquear</button></td>
      </tr>`).join('');
  } catch(e) {}
}
window.astDesbloquear = async function(id, tel) {
  if (!confirm(`Desbloquear ${tel}?`)) return;
  const usuario = window.getUsuario?.();
  await window.sb.from('assist_numeros_bloqueados').update({ ativo:false, desbloqueado_por:usuario?.nome||null, desbloqueado_em:new Date().toISOString() }).eq('id',id);
  await astLoadBloqueados();
};
// ══════════════════════════════════════════
// CHAMADOS
// ══════════════════════════════════════════
async function astLoadChamados() {
  try {
    const { data } = await window.sb.from('assist_kanban').select('*').order('data_abertura',{ascending:false}).range(0,9999);
    astData = data||[];
    astPopularSelectsFiltro();
    const novos = astData.filter(r => !r.visualizado && r.natureza!=='nao_garantia' && !astEhFinalizado(r));
    const banner = document.getElementById('ast-banner-novos');
    const qtdEl  = document.getElementById('ast-novos-qtd');
    if (banner) banner.style.display = novos.length ? '' : 'none';
    if (qtdEl)  qtdEl.textContent = novos.length;
    astAplicarFiltros();
    window.setLastUpdate?.();
  } catch(e) {
    const b = document.getElementById('ast-lista-body');
    if (b) b.innerHTML='<tr><td colspan="7" style="color:var(--red);padding:20px">Erro ao carregar</td></tr>';
  }
}
function astPopularSelectsFiltro() {
  const sSet=new Set(), seSet=new Set();
  astData.forEach(r=>{ if(r.status_nome) sSet.add(r.status_nome); });
  // Setores: usar lista completa de _setoresList (não só os dos chamados)
  const seSetorIds = {};
  _setoresList.forEach(s=>{ seSetorIds[s.id]=s.nome; });
  const ss=document.getElementById('ast-fil-status'), se=document.getElementById('ast-fil-setor');
  if(ss) ss.innerHTML='<option value="">Todos os status</option>'+[...sSet].sort().map(s=>`<option>${s}</option>`).join('');
  // Setor: usar _setoresList para ter id como value
  if(se){ const sv=se.value; se.innerHTML='<option value="">Todos os setores</option>'+(_setoresList||[]).sort((a,b)=>a.nome.localeCompare(b.nome)).map(s=>`<option value="${s.id}">${s.nome}</option>`).join(''); se.value=sv; }
}
window.astAplicarFiltros = function() {
  const status = document.getElementById('ast-fil-status')?.value||'';
  const setor  = document.getElementById('ast-fil-setor')?.value||'';
  const busca  = (document.getElementById('ast-busca')?.value||'').toLowerCase();
  const verFin = document.getElementById('ast-ver-finalizados')?.checked;
  astFiltrados = astData.filter(r => {
    if (r.natureza==='nao_garantia') return false;
    if (!verFin && astEhFinalizado(r)) return false;
    if (status && r.status_nome!==status) return false;
    if (setor  && String(r.setor_responsavel_id)!==String(setor)) return false;
    if (busca) {
      const h=`${r.cliente_nome||''} ${r.nome_contato||''} ${r.produto_nome||''} ${r.telefone||''}`.toLowerCase();
      if (!h.includes(busca)) return false;
    }
    return true;
  });
  if      (astOrdem==='antigo') astFiltrados.sort((a,b)=>new Date(a.data_abertura)-new Date(b.data_abertura));
  else if (astOrdem==='recente') astFiltrados.sort((a,b)=>new Date(b.data_abertura)-new Date(a.data_abertura));
  else if (astOrdem==='parado') astFiltrados.sort((a,b)=>(b.dias_sem_followup||0)-(a.dias_sem_followup||0));
  else    astFiltrados.sort((a,b)=>new Date(a.data_abertura)-new Date(b.data_abertura)); // default antigo
  if (astView==='lista') astRenderLista(); else astRenderKanban();
};
window.astFiltrarNovos = function() {
  document.getElementById('ast-busca').value='';
  document.getElementById('ast-fil-status').value='';
  document.getElementById('ast-fil-setor').value='';
  astFiltrados = astData.filter(r => !r.visualizado && r.natureza!=='nao_garantia' && !astEhFinalizado(r));
  astRenderLista();
};
function astRenderLista() {
  const tbody=document.getElementById('ast-lista-body'), count=document.getElementById('ast-lista-count');
  if (!tbody) return;
  if (count) count.textContent=`${astFiltrados.length} chamados`;
  if (!astFiltrados.length) { tbody.innerHTML='<tr><td colspan="7"><div class="ast-empty"><div class="ast-empty-ico">🔍</div>Nenhum chamado</div></td></tr>'; return; }
  tbody.innerHTML = astFiltrados.map(r => {
    const parado=(r.dias_sem_followup||0)>=7&&!astEhFinalizado(r);
    const isNovo=!r.visualizado;
    return `<tr onclick="astAbrirDetalhe(${r.id})" style="${parado?'background:var(--red-bg)':isNovo?'background:#EFF6FF':''}">
      <td class="ast-mono" style="color:var(--text-muted)">#${r.id}</td>
      <td><div style="font-weight:500">${r.cliente_nome||r.nome_contato||'—'}</div><div style="font-size:11px;color:var(--text-muted)">${r.telefone||''}</div></td>
      <td style="color:var(--text-secondary);font-size:12px">${r.produto_nome||'—'}</td>
      <td>${astStatusBadge(r.status_nome)}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${r.setor_responsavel||'—'}</td>
      <td class="right">${astDiasBadge(astDias(r.data_abertura))}</td>
      <td style="white-space:nowrap">${astAlertasBadges(r)}</td>
    </tr>`;
  }).join('');
}
const AST_KANBAN_ORDER_KEY = 'ast_kanban_col_order';
function astGetColOrder() {
  try { return JSON.parse(localStorage.getItem(AST_KANBAN_ORDER_KEY)||'[]'); } catch { return []; }
}
function astSetColOrder(order) {
  try { localStorage.setItem(AST_KANBAN_ORDER_KEY, JSON.stringify(order)); } catch {}
}
function astRenderKanban() {
  const board=document.getElementById('ast-kanban-board'); if (!board) return;
  const colunas={};
  _statusList.forEach(s=>{ if(!s.finaliza_chamado) colunas[s.nome]={meta:s,items:[]}; });
  astFiltrados.forEach(r=>{
    if (astEhFinalizado(r)) return; // nunca mostrar finalizados no kanban
    const k = r.status_nome || '';
    if (!k) return; // ignorar chamados sem status
    if (!colunas[k]) colunas[k] = { meta: { id: r.status_id, nome: k, cor: null }, items: [] };
    colunas[k].items.push(r);
  });
  // Só colunas com cards
  const colsComCards = Object.entries(colunas).filter(([,v])=>v.items.length>0);
  if (!colsComCards.length) { board.innerHTML='<div class="ast-empty"><div class="ast-empty-ico">✅</div>Nenhum chamado ativo</div>'; return; }
  // Aplicar ordem salva
  const savedOrder = astGetColOrder();
  colsComCards.sort((a,b)=>{
    const ia = savedOrder.indexOf(a[0]);
    const ib = savedOrder.indexOf(b[0]);
    if (ia===-1&&ib===-1) return 0;
    if (ia===-1) return 1;
    if (ib===-1) return -1;
    return ia-ib;
  });
  board.innerHTML = colsComCards.map(([status,v])=>`
    <div class="ast-kanban-col" draggable="true" data-col="${status}"
      ondragstart="astKanbanDragStart(event)"
      ondragover="astKanbanDragOver(event)"
      ondrop="astKanbanDrop(event)"
      ondragend="astKanbanDragEnd(event)">
      <div class="ast-kanban-hdr" style="cursor:grab;border-left:4px solid ${v.meta.cor||'#6B7280'}">
        <div class="ast-kanban-title">${status}</div>
        <div class="ast-kanban-count">${v.items.length}</div>
      </div>
      <div class="ast-kanban-cards"
        data-col-status-id="${v.meta.id||''}"
        data-col-status-nome="${status}"
        ondragover="astCardAreaDragOver(event)"
        ondrop="astCardAreaDrop(event)">
        ${v.items.map(r=>{
          const parado=(r.dias_sem_followup||0)>=7&&!astEhFinalizado(r);
          const slaHoras = v.meta.sla_horas;
          const horasNoStatus = r.data_status_alterado ? astHorasUteis(r.data_status_alterado) : (r.horas_no_status||0);
          const slaVencido = slaHoras && horasNoStatus > slaHoras && !astEhFinalizado(r);
          const cor = v.meta.cor||'#6B7280';
          const dataHora = r.data_abertura ? new Date(r.data_abertura).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
          return `<div class="ast-kanban-card ${parado?'parado':!r.visualizado?'novo':''}"
            draggable="true"
            data-card-id="${r.id}"
            onclick="if(!window._wasDragging)astAbrirDetalhe(${r.id})"
            ondragstart="astCardDragStart(event)"
            ondragend="astCardDragEnd(event)"
            style="border-top:3px solid ${cor};cursor:grab">
            <div class="ast-kanban-card-name">${r.cliente_nome||r.nome_contato||'—'}</div>
            <div class="ast-kanban-card-sub">${r.produto_nome||'—'}<br>${r.setor_responsavel||''}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:3px;display:flex;align-items:center;justify-content:space-between">
              <span>🕐 ${dataHora}</span>
              ${r.id_os?`<span style="font-size:10px;color:var(--blue-mid);font-weight:600">OS #${r.id_os}</span>`:''}
            </div>
            <div class="ast-kanban-card-foot">
              <div style="display:flex;gap:3px;flex-wrap:wrap">${astAlertasBadges(r)}${slaVencido?`<span class="ast-alerta-parado">⏰ SLA ${Math.round(horasNoStatus)}h</span>`:''}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}
// ══════════════════════════════════════════
// DRAG-AND-DROP — COLUNAS
// ══════════════════════════════════════════
let _dragSrcCol  = null;
let _dragSrcCard = null; // card sendo arrastado

window.astKanbanDragStart = function(e) {
  // Só aciona para coluna se NÃO for um card
  if (e.target.closest('[data-card-id]')) return;
  _dragSrcCol = e.currentTarget;
  e.currentTarget.style.opacity='0.5';
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('type','col');
};
window.astKanbanDragOver = function(e) {
  if (window._dragCardEl) return; // card drag tem prioridade
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  const over = e.currentTarget;
  if (_dragSrcCol && over !== _dragSrcCol) {
    const board = over.parentNode;
    const cols = [...board.children];
    const srcIdx = cols.indexOf(_dragSrcCol);
    const tgtIdx = cols.indexOf(over);
    if (srcIdx < tgtIdx) board.insertBefore(_dragSrcCol, over.nextSibling);
    else board.insertBefore(_dragSrcCol, over);
  }
};
window.astKanbanDrop = function(e) { if (window._dragCardEl) return; e.preventDefault(); };
window.astKanbanDragEnd = function(e) {
  if (window._dragCardEl) return;
  e.currentTarget.style.opacity='';
  const board = document.getElementById('ast-kanban-board');
  if (board) {
    const order = [...board.children].map(c=>c.dataset.col).filter(Boolean);
    astSetColOrder(order);
  }
};

// ══════════════════════════════════════════
// DRAG-AND-DROP — CARDS entre colunas
// ══════════════════════════════════════════
window.astCardDragStart = function(e) {
  e.stopPropagation();
  const card = e.currentTarget;
  window._wasDragging = false;
  window._dragCardEl  = card;
  card.style.opacity  = '0.4';
  e.dataTransfer.effectAllowed = 'move';
  // Guardar ID e status atual no dataTransfer (sobrevive ao dragend)
  e.dataTransfer.setData('text/card-id',     card.dataset.cardId);
  e.dataTransfer.setData('text/status-nome', card.closest('.ast-kanban-cards')?.dataset.colStatusNome || '');
};

window.astCardDragEnd = function(e) {
  window._wasDragging = true;
  setTimeout(()=>{ window._wasDragging = false; }, 200);
  if (window._dragCardEl) window._dragCardEl.style.opacity = '';
  window._dragCardEl = null;
  document.querySelectorAll('.ast-kanban-cards').forEach(c => { c.style.outline = ''; });
};

window.astCardAreaDragOver = function(e) {
  // Só aceitar se for drag de card
  if (!window._dragCardEl) return;
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.ast-kanban-cards').forEach(c => { c.style.outline = ''; });
  e.currentTarget.style.outline = '2px dashed var(--blue-mid)';
};

window.astCardAreaDrop = async function(e) {
  e.preventDefault();
  e.stopPropagation();
  window._wasDragging = true;

  // Ler dados do dataTransfer — não depende de _dragSrcCard
  const cardId      = parseInt(e.dataTransfer.getData('text/card-id'));
  if (!cardId || isNaN(cardId)) {
    if (window._dragCardEl) window._dragCardEl.style.opacity = '';
    window._dragCardEl = null;
    return;
  }
  const statusAtual = e.dataTransfer.getData('text/status-nome');
  const area        = e.currentTarget;
  area.style.outline = '';
  const novoStatus   = area.dataset.colStatusNome;
  const novoStatusId = parseInt(area.dataset.colStatusId);

  if (window._dragCardEl) window._dragCardEl.style.opacity = '';
  window._dragCardEl = null;

  if (!cardId || !novoStatus || novoStatus === statusAtual) return;

  if (!cardId || !novoStatus || novoStatus === statusAtual) {
    _dragSrcCard.style.opacity = '';
    _dragSrcCard = null;
    return;
  }

  // Verificar se status finaliza chamado — exigir modal de resolução
  const statusObj = _statusList.find(s => s.id === novoStatusId);
  if (statusObj?.finaliza_chamado) {
    _dragSrcCard.style.opacity = '';
    _dragSrcCard = null;
    // Redirecionar para o drawer com o status já selecionado
    await astAbrirDetalhe(cardId);
    // Selecionar o status no drawer depois de abrir
    setTimeout(() => {
      const sel = document.getElementById('drw-sel-status');
      if (sel) { sel.value = novoStatusId; astMarcarAlterado(); }
    }, 800);
    return;
  }

  // Atualizar status via drag
  const usuario = window.getUsuario?.();
  const { error } = await window.sb.from('assist_chamados').update({
    status_id: novoStatusId,
    data_status_alterado: new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  }).eq('id', cardId);

  if (error) {
    alert('Erro ao mover: ' + error.message);
    _dragSrcCard.style.opacity = '';
    _dragSrcCard = null;
    return;
  }

  // Atualizar local imediatamente
  const idx = astData.findIndex(r => r.id === cardId);
  if (idx >= 0) {
    astData[idx].status_id            = novoStatusId;
    astData[idx].status_nome          = novoStatus;
    astData[idx].status_ordem         = statusObj?.ordem ?? astData[idx].status_ordem;
    astData[idx].finaliza_chamado     = statusObj?.finaliza_chamado ?? false;
    astData[idx].data_status_alterado = new Date().toISOString();
  }
  console.log('[drag] card', cardId, '->', novoStatus, '(id:', novoStatusId, ')');

  _dragSrcCard.style.opacity = '';
  _dragSrcCard = null;

  // Re-renderizar kanban diretamente sem re-filtrar (mantém filtros atuais)
  // Recalcular astFiltrados do astData atualizado
  const filStatus  = document.getElementById('ast-fil-status')?.value || '';
  const filSetor   = document.getElementById('ast-fil-setor')?.value  || '';
  const busca      = (document.getElementById('ast-busca')?.value     || '').toLowerCase();
  const verFin     = document.getElementById('ast-ver-finalizados')?.checked;

  astFiltrados = astData.filter(r => {
    if (r.natureza === 'nao_garantia') return false;
    if (!verFin && r.concluido)        return false;
    if (filStatus && String(r.status_id) !== filStatus) return false;
    if (filSetor  && String(r.setor_responsavel_id) !== filSetor) return false;
    if (busca) {
      const h = `${r.cliente_nome||''} ${r.nome_contato||''} ${r.produto_nome||''} ${r.telefone||''}`.toLowerCase();
      if (!h.includes(busca)) return false;
    }
    return true;
  });

  if (astOrdem==='antigo')  astFiltrados.sort((a,b)=>new Date(a.data_abertura)-new Date(b.data_abertura));
  else if (astOrdem==='recente') astFiltrados.sort((a,b)=>new Date(b.data_abertura)-new Date(a.data_abertura));
  else if (astOrdem==='parado')  astFiltrados.sort((a,b)=>(b.dias_sem_followup||0)-(a.dias_sem_followup||0));

  astRenderKanban();
  // O trigger fn_assist_log_status_change grava o log automaticamente
};
window.astSetView = function(v,btn) {
  astView=v;
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
// DRAWER
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
      <div class="ast-drawer-footer" id="ast-drw-footer" style="display:none;padding:12px 24px;border-top:2px solid var(--blue-mid);background:var(--surface);flex-shrink:0;display:none;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="flex:1;font-size:12px;color:var(--blue-mid);font-weight:600">⚠️ Há alterações não salvas</div>
        <button class="ast-btn ast-btn-secondary" onclick="astDescartarAlteracoes()">Descartar</button>
        <button class="ast-btn ast-btn-success" id="ast-drw-save-btn" onclick="astSalvarTudo()">💾 Salvar alterações</button>
      </div>
    </div>`);
}

// DIRTY TRACKING STATE
let _drwChamadoId = null;
let _drwDirty = false;
window.astMarcarAlterado = function() {
  if (_drwDirty) return;
  _drwDirty = true;
  const footer = document.getElementById('ast-drw-footer');
  if (footer) { footer.style.display = 'flex'; }
}
window.astResetDirty = function() {
  _drwDirty = false;
  const footer = document.getElementById('ast-drw-footer');
  if (footer) { footer.style.display = 'none'; }
}
window.astDescartarAlteracoes = function() {
  if (!confirm('Descartar alterações?')) return;
  astResetDirty();
  if (_drwChamadoId) astAbrirDetalhe(_drwChamadoId);
};
window.astSalvarTudo = async function() {
  if (!_drwChamadoId) return;
  const btn = document.getElementById('ast-drw-save-btn');
  if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }
  try {
    await Promise.all([
      astSalvarEdicao(_drwChamadoId, true),
      astSalvarProdutoDefeitoCausa(_drwChamadoId, true),
    ]);
    astResetDirty();
    if (btn) { btn.textContent = '✅ Salvo!'; setTimeout(()=>{ btn.textContent='💾 Salvar alterações'; btn.disabled=false; }, 1800); }
  } catch(e) {
    alert('Erro ao salvar: ' + e.message);
    if (btn) { btn.textContent = '💾 Salvar alterações'; btn.disabled = false; }
  }
};

window.astAbrirDetalhe = async function(id) {
  _drwChamadoId = id;
  astResetDirty();
  astCriarDrawer();
  await astCarregarLookups();
  document.getElementById('ast-overlay').classList.add('open');
  document.getElementById('ast-drawer').classList.add('open');
  document.getElementById('ast-drw-title').textContent = `Chamado #${id}`;
  document.getElementById('ast-drw-sub').textContent   = 'Carregando...';
  document.getElementById('ast-drw-body').innerHTML    = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳</div>';

  try {
    // Marca visualizado
    const localIdx = astData.findIndex(r=>r.id===id);
    if (localIdx>=0 && !astData[localIdx].visualizado) {
      window.sb.from('assist_chamados').update({ visualizado:true, atualizado_em:new Date().toISOString() }).eq('id',id);
      astData[localIdx].visualizado = true;
    }

    const [{ data: det }, { data: fups }, { data: pecas }, { data: nfsVinculadas }] = await Promise.all([
      window.sb.from('assist_chamados_detalhe').select('*').eq('id',id).single(),
      window.sb.from('assist_followups').select('*').eq('chamado_id',id).order('criado_em',{ascending:false}).range(0,99),
      window.sb.from('assist_chamado_pecas').select('*').eq('chamado_id',id).order('criado_em',{ascending:false}).limit(100).then(r=>({data:r.data||[]})).catch(()=>({data:[]})),
      window.sb.from('assist_chamado_nfs').select('*').eq('chamado_id',id).order('criado_em',{ascending:false}).limit(50).then(r=>({data:r.data||[]})).catch(()=>({data:[]})),
    ]);
    if (!det) throw new Error('Não encontrado');

    const telNorm = det.telefone_normalizado||(det.telefone||'').replace(/\D/g,'');
    const [{ data: historico }, { data: bloqData }, osResp] = await Promise.all([
      window.sb.from('assist_kanban').select('id,data_abertura,produto_nome,status_nome,concluido,natureza,dias_aberto').eq('telefone_normalizado',telNorm).neq('id',id).order('data_abertura',{ascending:false}).range(0,9),
      window.sb.from('assist_numeros_bloqueados').select('id,motivo,bloqueado_por').eq('telefone_norm',telNorm).eq('ativo',true).maybeSingle(),
      det.id_os ? window.sb.from('assist_os_garantia').select('*').eq('id_os',det.id_os).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const osData = osResp.data;

    // Todos os docs ERP do cliente (vendas, NFs, OS)
    let docsErp = [];
    if (det.cliente_id_erp) {
      try {
        const { data: docsErpData } = await window.sb
          .from('vw_comercial_docs_faturados')
          .select('id,id_doc,tipo_doc,num_nf,data_faturamento,tipo_saida,nome_transportadora,valor_frete,faturamento_doc,nome_vendedor')
          .eq('id_cliente', det.cliente_id_erp)
          .order('data_faturamento', {ascending:false})
          .range(0,199);
        const seen = new Set();
        (docsErpData||[]).forEach(r => { if (!seen.has(r.id_doc+'-'+r.tipo_doc)) { seen.add(r.id_doc+'-'+r.tipo_doc); docsErp.push(r); } });
      } catch(e) {}
    }

    // CTes do frete vinculados às NFs manuais do chamado
    let ctesMap = {};
    if (nfsVinculadas?.length) {
      try {
        const nums = nfsVinculadas.map(n=>n.num_nf).filter(Boolean);
        if (nums.length) {
          const { data: ctes } = await window.sb
            .from('frt_conhecimentos')
            .select('id,nome_transportadora,valor_frete_cte,status_auditoria,criado_em,notas_fiscais')
            .range(0,99);
          (ctes||[]).forEach(cte => {
            const nfs = Array.isArray(cte.notas_fiscais) ? cte.notas_fiscais : [];
            nfs.forEach(nf => { if (nums.includes(String(nf.num_nf||''))) ctesMap[nf.num_nf] = cte; });
          });
        }
      } catch(e) {}
    }

    const fupsList  = fups||[];
    const pecasList = pecas||[];
    const histList  = historico||[];
    const conv   = fupsList.filter(f=>f.tipo==='whatsapp'||f.origem==='whatsapp');
    const logs   = fupsList.filter(f=>f.tipo==='log_status');
    const acomp  = fupsList.filter(f=>f.tipo!=='whatsapp'&&f.origem!=='whatsapp'&&f.tipo!=='log_status');
    const diasAb = astDias(det.data_abertura)||0;

    const alertasBits = [
      !det.visualizado ? '<span class="ast-alerta-novo">🔵 NOVO</span>' : '',
      (det.dias_sem_followup||0)>=7 && !det.concluido ? `<span class="ast-alerta-parado">🔴 PARADO ${det.dias_sem_followup}d</span>` : '',
      diasAb>=23 && diasAb<=35 && !det.concluido ? `<span class="ast-alerta-vencendo">🟡 GARANTIA ${diasAb}d</span>` : '',
    ].filter(Boolean);
    const alertasHtml = alertasBits.join(' ');

    document.getElementById('ast-drw-sub').innerHTML =
      `${det.cliente_nome_erp||det.nome_contato||'—'} · ${det.produto_nome||det.produto_manual||'Produto não vinculado'}`
      + (alertasHtml ? `&nbsp;&nbsp;${alertasHtml}` : '');

    document.getElementById('ast-drw-body').innerHTML = `
      ${bloqData ? `<div class="ast-bloqueado-banner">
        <div>🚫 <strong>Número bloqueado</strong> — ${bloqData.motivo||'Não-Garantia'} por ${bloqData.bloqueado_por||'—'}</div>
        <button class="ast-btn ast-btn-success ast-btn-sm" onclick="astDesbloquear(${bloqData.id},'${det.telefone||''}')">Desbloquear</button>
      </div>` : ''}

      <!-- ① NATUREZA + STATUS -->
      <div class="ast-drw-section">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
          <button class="ast-btn ast-btn-sm ${det.natureza==='nao_garantia'?'ast-btn-danger':'ast-btn-secondary'}"
            onclick="astSetNatureza(${id},'nao_garantia',this)">🚫 Descartar — Não é atendimento de garantia</button>
          ${histList.length?`<span style="font-size:12px;color:var(--orange);font-weight:600;margin-left:8px">⚠️ ${histList.length} chamado(s) anterior(es)</span>`:'<span style="font-size:12px;color:var(--text-muted);margin-left:8px">Primeiro contato</span>'}
        </div>
        <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
          <div class="ast-form-field" style="flex:1.5;min-width:130px">
            <label class="ast-form-lbl">Status</label>
            <select class="ast-form-select" id="drw-sel-status" onchange="astMarcarAlterado()">${astSelectOptions(_statusList,det.status_id)}</select>
          </div>
          <div class="ast-form-field" style="flex:1;min-width:120px">
            <label class="ast-form-lbl">Setor</label>
            <select class="ast-form-select" id="drw-sel-setor" onchange="astMarcarAlterado()"><option value="">Sem setor</option>${astSelectOptions(_setoresList,det.setor_responsavel_id)}</select>
          </div>

        </div>
        <div class="ast-stat-row" style="margin-top:12px">
          <div class="ast-stat-item"><div class="ast-stat-label">Aberto em</div><div class="ast-stat-val">${astFmtDate(det.data_abertura)}</div></div>
          <div class="ast-stat-item"><div class="ast-stat-label">Dias aberto</div><div class="ast-stat-val ${diasAb>=14?'red':diasAb>=7?'orange':''}">${diasAb}d</div></div>
          <div class="ast-stat-item"><div class="ast-stat-label">Acompanhamentos</div><div class="ast-stat-val">${acomp.length}</div></div>
          <div class="ast-stat-item"><div class="ast-stat-label">Msgs WA</div><div class="ast-stat-val">${conv.length}</div></div>
          <div class="ast-stat-item"><div class="ast-stat-label">Próxima ação</div><div class="ast-stat-val">${astFmtDate(det.data_proxima_acao)}</div></div>
        </div>
        ${(det.dias_sem_followup||0)>=7&&!det.concluido?`
        <div style="margin-top:10px;background:#FEF0EF;border:1px solid #FECACA;border-radius:var(--radius-sm);padding:10px 14px;display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">🔴</span>
          <div><div style="font-size:13px;font-weight:700;color:var(--red)">Chamado parado há ${det.dias_sem_followup}d sem follow-up</div>
          <div style="font-size:12px;color:var(--text-muted)">Registre um acompanhamento abaixo para atualizar</div></div>
        </div>`:''}
      </div>

      <!-- ② CLIENTE -->
      <div class="ast-drw-section">
        <div class="ast-drw-section-title" style="display:flex;align-items:center;justify-content:space-between">
          <span>Cliente</span>
          <div style="display:flex;gap:6px">
            ${det.cliente_id_erp
              ? `<button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astAbrirModalVincularERP(${id})">✏️ Editar vínculo</button>
                 <button class="ast-btn ast-btn-danger ast-btn-sm" onclick="astRemoverVinculoERP(${id})">✕ Remover</button>`
              : `<button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astAbrirModalVincularERP(${id})">🔗 Vincular ERP</button>`}
          </div>
        </div>
        <div class="ast-detail-grid">
          <div class="ast-detail-field"><div class="ast-detail-lbl">Nome ERP</div><div class="ast-detail-val">${det.cliente_nome_erp||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Código ERP</div><div class="ast-detail-val ast-mono">${det.cliente_id_erp||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Contato (Umbler)</div><div class="ast-detail-val">${det.nome_contato||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Telefone</div><div class="ast-detail-val">${det.telefone||'—'}</div></div>
          <div class="ast-detail-field"><div class="ast-detail-lbl">Cidade / UF</div><div class="ast-detail-val">${det.cidade&&det.uf?`${det.cidade} / ${det.uf}`:'—'}</div></div>
        </div>
      </div>

      <!-- ③ PRODUTO -->
      <div class="ast-drw-section">
        <div class="ast-drw-section-title">Produto</div>
        <div class="ast-form-row full">
          <div class="ast-form-field">
            <label class="ast-form-lbl">Produto reclamado</label>
            <input class="ast-form-input" id="info-prod-busca" placeholder="Buscar no catálogo da assistência..."
              value="${det.produto_nome||det.produto_manual||''}" autocomplete="off" oninput="astMarcarAlterado();astBuscarProdDrawer(${id})">
            <div id="info-prod-results" class="ast-prod-result" style="display:none"></div>
            <input type="hidden" id="info-prod-id" value="${det.produto_id_erp||''}">
            <div id="info-prod-sel" style="font-size:11px;color:var(--blue-mid);margin-top:3px">
              ${det.produto_nome?`✅ ${det.produto_codigo?det.produto_codigo+' — ':''}${det.produto_nome}`:''}
            </div>
          </div>
        </div>
        <div style="height:4px"><span id="info-pdc-status" style="font-size:12px;color:var(--text-muted)"></span></div>
      </div>

      <!-- ④ OS VINCULADA -->
      <div class="ast-drw-section">
        <div class="ast-drw-section-title">OS de Garantia Vinculada</div>
        <div id="ast-os-vinculada">
          ${osData ? `
            <div class="ast-os-box ${osData.tipo_garantia?.includes('Stonni')?'ast-os-stonni':'ast-os-loja'}">
              <div style="font-size:22px">${osData.tipo_garantia?.includes('Stonni')?'🟣':'🔵'}</div>
              <div class="ast-os-box-info">
                <div style="font-size:13px;font-weight:600">OS #${osData.id_os} · ${osData.empresa}</div>
                <div style="font-size:12px;color:var(--text-muted)">${osData.tipo_garantia} · ${osData.situacao_label} · ${astFmtDate(osData.data_entrada)}
                  ${osData.dias_aberta?` · ${osData.dias_aberta}d`:''}
                  ${osData.vl_total&&parseFloat(osData.vl_total)>0?` · R$ ${parseFloat(osData.vl_total).toLocaleString('pt-BR',{minimumFractionDigits:2})}`:''}
                </div>
                <div style="font-size:11px;color:var(--text-muted)">Resp: ${osData.nome_vendedor||'—'}</div>
              </div>
              <button class="ast-btn ast-btn-danger ast-btn-sm" onclick="astDesvincularOS(${id})">Desvincular</button>
            </div>` : `
            <div style="display:flex;gap:8px;align-items:flex-start">
              <div style="flex:1;position:relative">
                <input class="ast-form-input" id="os-busca" placeholder="Nº da OS ou nome do vendedor..." oninput="astBuscarOS()">
                <div id="os-results" class="ast-prod-result" style="display:none;position:absolute;z-index:10;width:100%"></div>
              </div>
              <button class="ast-btn ast-btn-primary ast-btn-sm" style="flex-shrink:0;margin-top:2px" onclick="astVincularOSManual(${id})">Vincular</button>
            </div>
            <input type="hidden" id="os-id-selecionado">
            <div id="os-selecionado-info" style="font-size:12px;color:var(--blue-mid);margin-top:6px"></div>`}
        </div>
      </div>

      <!-- ⑤ ACOMPANHAMENTO -->
      <div class="ast-drw-section">
        <div class="ast-drw-section-title">Acompanhamento da equipe</div>
        <div class="ast-fup-form" style="margin-bottom:14px">
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
          <textarea class="ast-form-textarea" id="fup-msg" placeholder="O que foi feito ou combinado..." style="min-height:56px;margin-bottom:10px"></textarea>
          <button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astSalvarFup(${id})">Registrar</button>
          <span id="fup-status" style="font-size:12px;margin-left:10px;color:var(--text-muted)"></span>
        </div>
        <div class="ast-fup-list" id="ast-fup-acomp-list">
          ${acomp.length ? acomp.map(f=>`
            <div class="ast-fup-item manual">
              <div class="ast-fup-meta"><span style="font-weight:600">${f.tipo||'Manual'}</span><span>·</span><span>${f.usuario_nome||'—'}</span><span>·</span><span>${f.criado_em?new Date(f.criado_em).toLocaleString('pt-BR'):'—'}</span></div>
              <div class="ast-fup-msg">${f.mensagem||'—'}</div>
            </div>`).join('')
            : '<div class="ast-empty" style="padding:12px 0"><div class="ast-empty-ico">📋</div>Nenhum acompanhamento registrado</div>'}
        </div>
        ${conv.length ? `
        <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:2px">
          <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none';this.textContent=this.textContent.includes('▶')?'▼ Conversa WhatsApp (${conv.length})':'▶ Conversa WhatsApp (${conv.length})';"
            style="background:none;border:none;cursor:pointer;font-size:12px;font-weight:700;color:var(--text-muted);padding:10px 0;width:100%;text-align:left;text-transform:uppercase;letter-spacing:.06em">
            ▶ Conversa WhatsApp (${conv.length})
          </button>
          <div style="display:none">
            <div class="ast-fup-list">
              ${[...conv].reverse().map(f=>`
                <div class="ast-fup-item whats">
                  <div class="ast-fup-meta">
                    <span style="color:#25D366;font-weight:600">WhatsApp</span><span>·</span>
                    <span>${f.usuario_nome||det.nome_contato||'—'}</span><span>·</span>
                    <span>${f.criado_em?new Date(f.criado_em).toLocaleString('pt-BR'):'—'}</span>
                  </div>
                  <div class="ast-fup-msg">${f.mensagem||'—'}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>` : ''}
        ${logs.length ? `
        <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:2px">
          <button onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none';this.textContent=this.textContent.includes('▶')?'▼ Log de alterações (${logs.length})':'▶ Log de alterações (${logs.length})';"
            style="background:none;border:none;cursor:pointer;font-size:12px;font-weight:700;color:var(--text-muted);padding:10px 0;width:100%;text-align:left;text-transform:uppercase;letter-spacing:.06em">
            ▶ Log de alterações (${logs.length})
          </button>
          <div style="display:none">
            <div class="ast-fup-list">
              ${[...logs].map(f=>`
                <div class="ast-fup-item" style="border-left:3px solid var(--text-muted);background:var(--surface2)">
                  <div class="ast-fup-meta">
                    <span style="font-weight:600;color:var(--text-secondary)">🔄 Sistema</span><span>·</span>
                    <span>${f.usuario_nome||'Sistema'}</span><span>·</span>
                    <span>${f.criado_em?new Date(f.criado_em).toLocaleString('pt-BR'):'—'}</span>
                  </div>
                  <div class="ast-fup-msg" style="color:var(--text-secondary);font-size:12px">${f.mensagem||'—'}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>` : ''}
      </div>

      <!-- ⑥ HISTÓRICO DO CLIENTE -->
      ${histList.length ? `
      <div class="ast-drw-section">
        <div class="ast-drw-section-title">📞 Histórico do cliente (${histList.length} chamado(s) anterior(es))</div>
        ${histList.map(h=>`
          <div class="ast-hist-item" onclick="astAbrirDetalhe(${h.id})">
            <div style="font-size:20px">${h.concluido?'✅':'🔄'}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600">#${h.id} · ${h.produto_nome||'—'}</div>
              <div style="font-size:11px;color:var(--text-muted)">${astFmtDate(h.data_abertura)}</div>
            </div>
            <div style="text-align:right">${astStatusBadge(h.status_nome)}<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${h.dias_aberto||0}d</div></div>
          </div>`).join('')}
      </div>` : ''}

      <!-- ⑦ ENTREGAS -->
      <div class="ast-drw-section">
        <div class="ast-drw-section-title" style="display:flex;align-items:center;justify-content:space-between">
          <span>🚚 Entregas</span>
          <button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astAbrirModalNF(${id})">+ Vincular NF</button>
        </div>

        ${(nfsVinculadas||[]).length ? `
        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">NFs vinculadas ao chamado</div>
          ${(nfsVinculadas||[]).map(nf => {
            const cte = ctesMap[nf.num_nf];
            return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:11px;font-weight:700;background:${nf.tipo==='remessa'?'var(--blue-pale)':'var(--orange-bg)'};color:${nf.tipo==='remessa'?'var(--blue-mid)':'var(--orange)'};padding:1px 7px;border-radius:10px">${nf.tipo==='remessa'?'📤 Remessa':'📥 Retorno'}</span>
                <span style="font-weight:600;font-size:13px">NF ${nf.num_nf}</span>
                <span style="font-size:11px;color:var(--text-muted)">${new Date(nf.criado_em).toLocaleDateString('pt-BR')}</span>
                <button class="ast-btn ast-btn-danger ast-btn-sm" style="margin-left:auto" onclick="astRemoverNF(${nf.id},${id})">✕</button>
              </div>
              ${cte ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted)">
                🚛 ${cte.nome_transportadora||'—'} · CTe · 
                ${cte.valor_frete_cte?'R$ '+parseFloat(cte.valor_frete_cte).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'} · 
                <span style="color:${cte.status_auditoria==='ok'?'var(--green)':cte.status_auditoria==='divergencia'?'var(--red)':'var(--text-muted)'}">${cte.status_auditoria||'pendente'}</span>
              </div>` : ''}
            </div>`;
          }).join('')}
        </div>` : ''}

        ${docsErp.length ? `
        <div style="margin-top:8px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px">Histórico ERP — ${docsErp.length} documento(s)</div>
          <div style="overflow-x:auto">
            <table class="ast-table" style="font-size:12px">
              <thead><tr><th>Tipo</th><th>Doc/NF</th><th>Data</th><th>Vendedor</th><th>Transp.</th><th class="right">Valor</th></tr></thead>
              <tbody>
                ${docsErp.map(d=>`<tr>
                  <td><span style="font-size:10px;font-weight:600;background:var(--surface2);padding:1px 5px;border-radius:4px">${(d.tipo_doc||'').trim()}</span></td>
                  <td class="ast-mono">${d.num_nf||d.id_doc||'—'}</td>
                  <td style="white-space:nowrap">${d.data_faturamento?new Date(d.data_faturamento+'T00:00:00').toLocaleDateString('pt-BR'):'—'}</td>
                  <td style="color:var(--text-muted);font-size:11px">${d.nome_vendedor||'—'}</td>
                  <td style="color:var(--text-muted);font-size:11px">${d.nome_transportadora||'—'}</td>
                  <td class="right">${d.faturamento_doc?'R$ '+parseFloat(d.faturamento_doc).toLocaleString('pt-BR',{minimumFractionDigits:2}):'—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : `<div class="ast-empty" style="padding:16px 0"><div class="ast-empty-ico">📋</div>${det.cliente_id_erp?'Nenhum documento encontrado para este cliente':'Cliente ERP não vinculado — use o botão Vincular ERP'}</div>`}
      </div>

    `;
  } catch(e) {
    console.error(e);
    document.getElementById('ast-drw-body').innerHTML=`<div style="padding:20px;color:var(--red)">Erro ao carregar #${id}: ${e.message}</div>`;
  }
};
// ══════════════════════════════════════════
// DRAWER — AÇÕES
// ══════════════════════════════════════════
window.astSecTab = function(tab,btn) {
  document.querySelectorAll('.ast-sec-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.ast-sec-content').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`ast-sec-${tab}`)?.classList.add('active');
};
window.astFecharDetalhe = function() {
  astResetDirty();
  document.getElementById('ast-overlay')?.classList.remove('open');
  document.getElementById('ast-drawer')?.classList.remove('open');
};


// ══════════════════════════════════════════
// MODAL — Vincular NF ao chamado
// ══════════════════════════════════════════
window.astAbrirModalNF = function(chamadoId) {
  const old = document.getElementById('ast-modal-nf');
  if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="ast-modal-nf" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center">
      <div style="background:var(--surface);border-radius:var(--radius);padding:24px;width:380px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.3)">
        <div style="font-size:15px;font-weight:700;margin-bottom:16px">🚚 Vincular NF ao chamado</div>
        <div class="ast-form-field" style="margin-bottom:12px">
          <label class="ast-form-lbl">Número da NF</label>
          <input class="ast-form-input" id="modal-nf-num" placeholder="Ex: 12345" type="text">
        </div>
        <div class="ast-form-field" style="margin-bottom:12px">
          <label class="ast-form-lbl">Tipo</label>
          <select class="ast-form-select" id="modal-nf-tipo">
            <option value="remessa">📤 Remessa (produto ao cliente)</option>
            <option value="retorno">📥 Retorno (produto à assistência)</option>
          </select>
        </div>
        <div class="ast-form-field" style="margin-bottom:18px">
          <label class="ast-form-lbl">Chave NF-e (opcional)</label>
          <input class="ast-form-input" id="modal-nf-chave" placeholder="44 dígitos" maxlength="44">
        </div>
        <div id="modal-nf-erro" style="color:var(--red);font-size:12px;margin-bottom:8px"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="ast-btn ast-btn-secondary" onclick="document.getElementById('ast-modal-nf').remove()">Cancelar</button>
          <button class="ast-btn ast-btn-primary" onclick="astSalvarNF(${chamadoId})">Vincular</button>
        </div>
      </div>
    </div>`);
};

window.astSalvarNF = async function(chamadoId) {
  const num = document.getElementById('modal-nf-num')?.value.trim();
  const tipo = document.getElementById('modal-nf-tipo')?.value;
  const chave = document.getElementById('modal-nf-chave')?.value.trim();
  const erro = document.getElementById('modal-nf-erro');
  if (!num) { if(erro) erro.textContent = 'Informe o número da NF'; return; }
  const usuario = window.getUsuario?.();
  const { error } = await window.sb.from('assist_chamado_nfs').insert({
    id_chamado: chamadoId, num_nf: num, tipo, chave_nfe: chave||null, criado_por: usuario?.nome||null
  });
  if (error) { if(erro) erro.textContent = 'Erro: ' + error.message; return; }
  document.getElementById('ast-modal-nf').remove();
  astAbrirDetalhe(chamadoId);
};

window.astRemoverNF = async function(nfId, chamadoId) {
  if (!confirm('Remover esta NF?')) return;
  await window.sb.from('assist_chamado_nfs').delete().eq('id', nfId);
  astAbrirDetalhe(chamadoId);
};

// Modal de resolução ao concluir
function astModalResolucao(chamadoId) {
  return new Promise(resolve => {
    const old = document.getElementById('ast-modal-resolucao');
    if (old) old.remove();

    if (!_procedencias?.length) { resolve(null); return; }
    const opts = _procedencias.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('');
    const prodNome = document.getElementById('info-prod-busca')?.value?.trim() || '';
    const semProduto = !prodNome;

    document.body.insertAdjacentHTML('beforeend',`
      <div id="ast-modal-resolucao" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center">
        <div style="background:var(--surface);border-radius:var(--radius);padding:28px;width:420px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.3)">

          <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px">✅ Concluir chamado</div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Preencha os campos abaixo para finalizar.</div>

          ${semProduto ? `
          <div style="margin-bottom:14px">
            <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:5px">Produto reclamado <span style="color:var(--red)">*</span></label>
            <div style="position:relative">
              <input id="ast-modal-prod-busca" class="ast-form-input" placeholder="Buscar produto no catálogo..."
                autocomplete="off" oninput="astModalBuscarProd(this.value)">
              <div id="ast-modal-prod-results" class="ast-prod-result" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:10"></div>
              <input type="hidden" id="ast-modal-prod-id">
            </div>
            <div id="ast-modal-prod-sel" style="font-size:11px;color:var(--blue-mid);margin-top:3px"></div>
          </div>` : `
          <div style="margin-bottom:14px;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Produto</div>
            <div style="font-size:13px;font-weight:600">✅ ${prodNome}</div>
          </div>`}

          <div style="margin-bottom:20px">
            <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:5px">Como foi resolvido? <span style="color:var(--red)">*</span></label>
            <select id="ast-modal-res-sel" class="ast-form-select">
              <option value="">Selecione o tipo de resolução...</option>${opts}
            </select>
          </div>

          <div id="ast-modal-res-erro" style="color:var(--red);font-size:12px;margin-bottom:10px;display:none"></div>

          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="ast-btn ast-btn-secondary" id="ast-modal-res-cancel">Cancelar</button>
            <button class="ast-btn ast-btn-success" id="ast-modal-res-ok">✅ Confirmar e Concluir</button>
          </div>
        </div>
      </div>`);

    // Busca de produto no modal
    window.astModalBuscarProd = async function(q) {
      const res = document.getElementById('ast-modal-prod-results');
      if (!res) return;
      if (!q || q.length < 2) { res.style.display='none'; return; }
      const { data } = await window.sb.from('assist_produtos').select('id,referencia,nome,id_produto_erp')
        .eq('ativo',true).or(`nome.ilike.%${q}%,referencia.ilike.%${q}%`).order('nome').range(0,9);
      if (!data?.length) { res.innerHTML='<div class="ast-prod-result-item" style="color:var(--text-muted)">Nenhum produto encontrado</div>'; res.style.display=''; return; }
      res.style.display='';
      res.innerHTML = data.map(p=>`
        <div class="ast-prod-result-item" onclick="astModalSelecionarProd(${p.id},'${(p.referencia||'').replace(/'/g,"\'")}','${p.nome.replace(/'/g,"\'")}',${p.id_produto_erp||'null'})">
          <div>${p.nome}</div><div class="ast-prod-ref">${p.referencia||''}</div>
        </div>`).join('');
    };
    window.astModalSelecionarProd = function(id, ref, nome, idErp) {
      const inp = document.getElementById('ast-modal-prod-busca');
      const hid = document.getElementById('ast-modal-prod-id');
      const sel = document.getElementById('ast-modal-prod-sel');
      const res = document.getElementById('ast-modal-prod-results');
      if(inp) inp.value = nome;
      if(hid) hid.value = idErp||id;
      if(sel) sel.textContent = `✅ ${ref?ref+' — ':''}${nome}`;
      if(res) res.style.display='none';
      // Sincroniza com o campo do drawer
      const drwBusca = document.getElementById('info-prod-busca');
      const drwId    = document.getElementById('info-prod-id');
      const drwSel   = document.getElementById('info-prod-sel');
      if(drwBusca) drwBusca.value = nome;
      if(drwId)    drwId.value    = idErp||id;
      if(drwSel)   drwSel.textContent = `✅ ${ref?ref+' — ':''}${nome}`;
    };

    document.getElementById('ast-modal-res-cancel').onclick = () => {
      document.getElementById('ast-modal-resolucao').remove();
      resolve(null);
    };

    document.getElementById('ast-modal-res-ok').onclick = () => {
      const erro = document.getElementById('ast-modal-res-erro');
      const tipo = document.getElementById('ast-modal-res-sel')?.value;
      const prodFinal = document.getElementById('ast-modal-prod-busca')?.value?.trim()
                     || document.getElementById('info-prod-busca')?.value?.trim();

      if (semProduto && !prodFinal) {
        erro.textContent = 'Informe o produto reclamado.';
        erro.style.display = '';
        return;
      }
      if (!tipo) {
        erro.textContent = 'Selecione o tipo de resolução.';
        erro.style.display = '';
        return;
      }
      document.getElementById('ast-modal-resolucao').remove();
      resolve(tipo);
    };
  });
}

// Salvar status/setor
window.astSalvarEdicao = async function(id, _silent) { var silent=!!_silent;
  const statusId = document.getElementById('drw-sel-status')?.value;
  const setorId  = document.getElementById('drw-sel-setor')?.value;
  const statusObj = _statusList.find(s=>s.id==statusId);
  // Verificar se status mudou para atualizar data_status_alterado
  const chamadoAtual = astData.find(r=>r.id===id)||astFiltrados.find(r=>r.id===id);
  const statusMudou = !chamadoAtual || String(chamadoAtual.status_id) !== String(statusId);
  const payload = {
    status_id:            statusId ? parseInt(statusId) : null,
    setor_responsavel_id: setorId  ? parseInt(setorId)  : null,
    atualizado_em:        new Date().toISOString(),
    concluido:            statusObj?.finaliza_chamado||false,
    ...(statusMudou ? { data_status_alterado: new Date().toISOString() } : {}),
  };
  if (statusObj?.finaliza_chamado) {
    // Modal SEMPRE aparece ao concluir — mesmo via astSalvarTudo
    const tipo = await astModalResolucao(id);
    if (tipo === null) { astResetDirty(); return; } // cancelou
    payload.procedencia_id = tipo ? parseInt(tipo) : null;
    payload.data_conclusao = new Date().toISOString();
    // Salvar produto se foi preenchido/alterado no modal
    const prodNomeModal = document.getElementById('info-prod-busca')?.value?.trim();
    const prodIdModal   = document.getElementById('info-prod-id')?.value;
    if (prodNomeModal) {
      payload.produto_manual = prodNomeModal;
      if (prodIdModal) {
        const{data:pd}=await window.sb.from('assist_produtos')
          .select('nome,referencia,id_produto_erp')
          .or(`id.eq.${prodIdModal},id_produto_erp.eq.${prodIdModal}`)
          .limit(1).maybeSingle();
        if(pd){payload.produto_nome=pd.nome;payload.produto_codigo=pd.referencia||null;payload.produto_id_erp=pd.id_produto_erp||null;payload.produto_manual=null;}
      }
    }
  }
  const { error } = await window.sb.from('assist_chamados').update(payload).eq('id',id);
  if (error) { if(!silent) alert('Erro: '+error.message); else throw new Error(error.message); }
  else {
    const idx=astData.findIndex(r=>r.id===id);
    if(idx>=0){
      if(statusObj){
        astData[idx].status_id=parseInt(statusId);
        astData[idx].status_nome=statusObj.nome;
        astData[idx].status_ordem=statusObj.ordem;
        astData[idx].finaliza_chamado=statusObj.finaliza_chamado;
        astData[idx].concluido=statusObj.finaliza_chamado;
      }
      if(setorId){
        astData[idx].setor_responsavel_id=parseInt(setorId);
        const setorObj=_setoresList.find(s=>s.id==setorId);
        astData[idx].setor_responsavel=setorObj?.nome||astData[idx].setor_responsavel;
      } else {
        astData[idx].setor_responsavel_id=null;
        astData[idx].setor_responsavel=null;
      }
      astAplicarFiltros();
    }
  }
};

// Natureza
window.astSetNatureza = async function(id, natureza, btn) {
  if(natureza==='nao_garantia'&&!confirm('Descartar este contato?\nO chamado será encerrado e o número não receberá novos chamados.')) return;
  btn.disabled=true;
  const usuario = window.getUsuario?.();
  const { data: det } = await window.sb.from('assist_chamados').select('telefone,telefone_normalizado').eq('id',id).single();
  const payload = { natureza, atualizado_em: new Date().toISOString() };
  if(natureza==='nao_garantia'){payload.concluido=true;payload.data_conclusao=new Date().toISOString();}
  await window.sb.from('assist_chamados').update(payload).eq('id',id);
  if(natureza==='nao_garantia'&&det){
    const telNorm=det.telefone_normalizado||(det.telefone||'').replace(/\D/g,'');
    await window.sb.from('assist_numeros_bloqueados').upsert({
      telefone:det.telefone||telNorm, telefone_norm:telNorm,
      motivo:'Classificado como Não-Garantia', bloqueado_por:usuario?.nome||null,
    },{onConflict:'telefone_norm'});
  }
  const idx=astData.findIndex(r=>r.id===id);
  if(idx>=0){astData[idx].natureza=natureza;if(natureza==='nao_garantia')astData[idx].concluido=true;astAplicarFiltros();}
  astFecharDetalhe();
  btn.disabled=false;
};

// Produto + Defeito + Causa
let _buscaProdDrwTimer=null;
let _prodErpTimer=null;
window.astBuscarProdDrawer = function(chamadoId) {
  clearTimeout(_buscaProdDrwTimer);
  _buscaProdDrwTimer=setTimeout(async()=>{
    const q=(document.getElementById('info-prod-busca')?.value||'').trim();
    const res=document.getElementById('info-prod-results'); if(!res)return;
    if(q.length<2){res.style.display='none';return;}
    const{data}=await window.sb.from('assist_produtos').select('id,referencia,nome,grupo,id_produto_erp').eq('ativo',true)
      .or(`nome.ilike.%${q}%,referencia.ilike.%${q}%`).order('nome').range(0,14);
    if(!data?.length){res.innerHTML='<div class="ast-prod-result-item" style="color:var(--text-muted)">Nenhum produto</div>';res.style.display='';return;}
    res.style.display='';
    res.innerHTML=data.map(p=>`
      <div class="ast-prod-result-item" onclick="astSelecionarProdDrawer(${p.id},'${(p.referencia||'').replace(/'/g,"\\'")}','${p.nome.replace(/'/g,"\\'")}',${p.id_produto_erp||'null'})">
        <div>${p.nome}</div><div class="ast-prod-ref">${p.referencia||''} ${p.grupo?'· '+p.grupo:''}</div>
      </div>`).join('');
  },300);
};
window.astSelecionarProdDrawer = function(id,ref,nome,idErp) {
  document.getElementById('info-prod-id').value=idErp||id;
  document.getElementById('info-prod-busca').value=nome;
  document.getElementById('info-prod-sel').textContent=`✅ ${ref?ref+' — ':''}${nome}`;
  document.getElementById('info-prod-results').style.display='none';
};
window.astSalvarProdutoDefeitoCausa = async function(id, _silent) { var silent=!!_silent;
  const prodIdErp=document.getElementById('info-prod-id')?.value;
  const prodNome =document.getElementById('info-prod-busca')?.value.trim();
  const el=document.getElementById('info-pdc-status');
  if(el&&!silent)el.textContent='Salvando...';
  let payload={atualizado_em:new Date().toISOString()};
  if(prodNome){
    payload.produto_manual=prodNome;
    if(prodIdErp){
      const{data:pd}=await window.sb.from('assist_produtos').select('nome,referencia,id_produto_erp').or(`id.eq.${prodIdErp},id_produto_erp.eq.${prodIdErp}`).limit(1).maybeSingle();
      if(pd){payload.produto_nome=pd.nome;payload.produto_codigo=pd.referencia||null;payload.produto_id_erp=pd.id_produto_erp||null;payload.produto_manual=null;}
    }
  }
  const{error}=await window.sb.from('assist_chamados').update(payload).eq('id',id);
  if(error){if(el&&!silent)el.textContent='❌ '+error.message;if(silent)throw new Error(error.message);return;}
  if(el&&!silent){el.textContent='✅ Salvo!';setTimeout(()=>el.textContent='',3000);}
  const idx=astData.findIndex(r=>r.id===id);
  if(idx>=0&&prodNome){astData[idx].produto_nome=payload.produto_nome||prodNome;astAplicarFiltros();}
};

// Procedência + Obs
// Follow-up
window.astSalvarFup = async function(chamadoId) {
  const tipo=document.getElementById('fup-tipo')?.value;
  const msg =(document.getElementById('fup-msg')?.value||'').trim();
  const prox=document.getElementById('fup-proxima')?.value;
  const el  =document.getElementById('fup-status');
  if(!msg){if(el)el.textContent='⚠️ Escreva uma mensagem';return;}
  if(el)el.textContent='Salvando...';
  const usuario=window.getUsuario?.();
  const{error}=await window.sb.from('assist_followups').insert({chamado_id:chamadoId,tipo,mensagem:msg,origem:'manual',usuario_nome:usuario?.nome||null,criado_em:new Date().toISOString()});
  if(error){if(el)el.textContent='❌ '+error.message;return;}
  const upd={data_ultimo_followup:new Date().toISOString(),atualizado_em:new Date().toISOString()};
  if(prox)upd.data_proxima_acao=prox;
  await window.sb.from('assist_chamados').update(upd).eq('id',chamadoId);
  if(el)el.textContent='✅ Registrado!';
  document.getElementById('fup-msg').value='';
  document.getElementById('fup-proxima').value='';
  const lista=document.getElementById('ast-fup-acomp-list');
  if(lista){
    lista.insertAdjacentHTML('afterbegin',`<div class="ast-fup-item manual">
      <div class="ast-fup-meta"><span style="font-weight:600">${tipo}</span><span>·</span><span>${usuario?.nome||'—'}</span><span>·</span><span>${new Date().toLocaleString('pt-BR')}</span></div>
      <div class="ast-fup-msg">${msg}</div></div>`);
  }
  // Atualizar dados locais
  const idx=astData.findIndex(r=>r.id===chamadoId);
  if(idx>=0){astData[idx].data_ultimo_followup=new Date().toISOString();astData[idx].dias_sem_followup=0;astAplicarFiltros();}
  setTimeout(()=>{if(el)el.textContent='';},3000);
};


// ══════════════════════════════════════════
// VINCULAR / REMOVER ERP
// ══════════════════════════════════════════
window.astAbrirModalVincularERP = function(chamadoId) {
  const old = document.getElementById('ast-modal-erp');
  if (old) old.remove();
  document.body.insertAdjacentHTML('beforeend',`
    <div id="ast-modal-erp" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center">
      <div style="background:var(--surface);border-radius:var(--radius);padding:24px;width:460px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.3)">
        <div style="font-size:15px;font-weight:700;margin-bottom:16px">🔗 Vincular cliente ERP</div>
        <div style="position:relative;margin-bottom:14px">
          <input class="ast-form-input" id="modal-erp-busca" placeholder="Buscar por nome, telefone ou código..."
            autocomplete="off" oninput="astBuscarClienteERP(this.value)">
          <div id="modal-erp-results" class="ast-prod-result" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:10;max-height:240px"></div>
        </div>
        <div id="modal-erp-selecionado" style="font-size:12px;color:var(--blue-mid);margin-bottom:14px;min-height:18px"></div>
        <input type="hidden" id="modal-erp-id">
        <div id="modal-erp-erro" style="color:var(--red);font-size:12px;margin-bottom:8px"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="ast-btn ast-btn-secondary" onclick="document.getElementById('ast-modal-erp').remove()">Cancelar</button>
          <button class="ast-btn ast-btn-primary" onclick="astConfirmarVinculoERP(${chamadoId})">Vincular</button>
        </div>
      </div>
    </div>`);
};

let _erpTimer = null;
window.astBuscarClienteERP = function(q) {
  clearTimeout(_erpTimer);
  _erpTimer = setTimeout(async () => {
    const res = document.getElementById('modal-erp-results');
    if (!res) return;
    if (!q || q.length < 2) { res.style.display='none'; return; }
    try {
      const isNum = /^\d+$/.test(q.trim());
      let query = window.sb.from('assist_clientes_telefone_lookup')
        .select('id_cliente,nome_cliente,telefone1,cidade,uf')
        .order('nome_cliente').range(0,14);
      if (isNum && q.length <= 6) {
        query = query.eq('id_cliente', parseInt(q));
      } else if (isNum) {
        query = query.or(`tel1_norm.ilike.%${q.replace(/\D/g,'')}%,tel2_norm.ilike.%${q.replace(/\D/g,'')}%`);
      } else {
        query = query.ilike('nome_cliente', `%${q}%`);
      }
      const { data } = await query;
      if (!data?.length) {
        res.innerHTML='<div class="ast-prod-result-item" style="color:var(--text-muted)">Nenhum cliente encontrado</div>';
        res.style.display=''; return;
      }
      res.style.display='';
      res.innerHTML = data.map(c=>`
        <div class="ast-prod-result-item" onclick="astSelecionarClienteERP(${c.id_cliente},'${c.nome_cliente.replace(/'/g,"\'")}','${c.cidade||''}','${c.uf||''}')">
          <div style="font-weight:600">${c.nome_cliente}</div>
          <div class="ast-prod-ref">Cód: ${c.id_cliente} · ${c.cidade||''}${c.uf?' / '+c.uf:''} · ${c.telefone1||'—'}</div>
        </div>`).join('');
    } catch(e) {}
  }, 300);
};

window.astSelecionarClienteERP = function(id, nome, cidade, uf) {
  document.getElementById('modal-erp-id').value = id;
  document.getElementById('modal-erp-selecionado').innerHTML =
    `✅ <strong>${nome}</strong> — Cód: ${id}${cidade?' · '+cidade:''}${uf?' / '+uf:''}`;
  document.getElementById('modal-erp-results').style.display = 'none';
  document.getElementById('modal-erp-busca').value = nome;
};

window.astConfirmarVinculoERP = async function(chamadoId) {
  const idErp = document.getElementById('modal-erp-id')?.value;
  const erro = document.getElementById('modal-erp-erro');
  if (!idErp) { if(erro) erro.textContent = 'Selecione um cliente'; return; }

  // Buscar dados completos do cliente
  const { data: cli } = await window.sb.from('assist_clientes_telefone_lookup')
    .select('id_cliente,nome_cliente,cidade,uf').eq('id_cliente', parseInt(idErp)).maybeSingle();

  const payload = {
    cliente_id_erp: parseInt(idErp),
    cliente_nome_erp: cli?.nome_cliente || null,
    atualizado_em: new Date().toISOString()
  };
  const { error } = await window.sb.from('assist_chamados').update(payload).eq('id', chamadoId);
  if (error) { if(erro) erro.textContent = 'Erro: ' + error.message; return; }

  document.getElementById('ast-modal-erp').remove();
  astAbrirDetalhe(chamadoId);

  // Atualizar local
  const idx = astData.findIndex(r=>r.id===chamadoId);
  if(idx>=0){ astData[idx].cliente_id_erp=parseInt(idErp); astData[idx].cliente_nome=cli?.nome_cliente||null; }
};

window.astRemoverVinculoERP = async function(chamadoId) {
  if (!confirm('Remover vínculo com o cliente ERP?')) return;
  await window.sb.from('assist_chamados').update({
    cliente_id_erp: null, cliente_nome_erp: null, atualizado_em: new Date().toISOString()
  }).eq('id', chamadoId);
  astAbrirDetalhe(chamadoId);
};

// OS — busca e vinculação
let _osTimer=null;
window.astBuscarOS = function() {
  clearTimeout(_osTimer);
  _osTimer=setTimeout(async()=>{
    const q=(document.getElementById('os-busca')?.value||'').trim();
    const res=document.getElementById('os-results'); if(!res)return;
    if(q.length<2){res.style.display='none';return;}
    const isNum=/^\d+$/.test(q);
    let query=window.sb.from('assist_os_garantia').select('id_os,empresa,tipo_garantia,situacao_label,data_entrada,vl_total,nome_vendedor,dias_aberta').order('data_entrada',{ascending:false}).range(0,19);
    if(isNum) query=query.eq('id_os',parseInt(q));
    else      query=query.ilike('nome_vendedor',`%${q}%`);
    const{data}=await query;
    if(!data?.length){res.innerHTML='<div class="ast-prod-result-item" style="color:var(--text-muted)">Nenhuma OS encontrada</div>';res.style.display='';return;}
    res.style.display='';
    res.innerHTML=data.map(o=>`
      <div class="ast-prod-result-item" onclick="astSelecionarOS(${o.id_os},'${o.empresa}','${o.tipo_garantia}','${o.situacao_label}')">
        <div style="font-weight:600">OS #${o.id_os} · ${o.empresa} · ${o.tipo_garantia}</div>
        <div class="ast-prod-ref">${o.situacao_label} · ${astFmtDate(o.data_entrada)} · R$ ${parseFloat(o.vl_total||0).toLocaleString('pt-BR',{minimumFractionDigits:2})} · ${o.nome_vendedor||'—'}</div>
      </div>`).join('');
  },350);
};
window.astSelecionarOS = function(idOs,empresa,tipo,situacao) {
  document.getElementById('os-id-selecionado').value=idOs;
  document.getElementById('os-selecionado-info').textContent=`✅ OS #${idOs} · ${empresa} · ${tipo} · ${situacao}`;
  document.getElementById('os-results').style.display='none';
  document.getElementById('os-busca').value=`OS #${idOs}`;
};
window.astVincularOSManual = async function(chamadoId) {
  const idOs=parseInt(document.getElementById('os-id-selecionado')?.value||'0');
  if(!idOs){alert('Selecione uma OS primeiro');return;}
  const{error}=await window.sb.from('assist_chamados').update({id_os:idOs,atualizado_em:new Date().toISOString()}).eq('id',chamadoId);
  if(error){alert('Erro: '+error.message);return;}
  astAbrirDetalhe(chamadoId);
};
window.astDesvincularOS = async function(chamadoId) {
  if(!confirm('Desvincular a OS deste chamado?'))return;
  await window.sb.from('assist_chamados').update({id_os:null,atualizado_em:new Date().toISOString()}).eq('id',chamadoId);
  astAbrirDetalhe(chamadoId);
};
// ══════════════════════════════════════════
// MODAL NOVO CHAMADO
// ══════════════════════════════════════════
function astCriarModalNovo() {
  if(document.getElementById('ast-modal-novo'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="ast-modal-ov" id="ast-modal-novo">
      <div class="ast-modal">
        <div class="ast-modal-hdr"><div class="ast-modal-title">Novo Chamado</div>
          <button style="width:32px;height:32px;border:none;background:var(--surface2);border-radius:6px;cursor:pointer;font-size:16px;color:var(--text-muted)" onclick="astFecharModalNovo()">✕</button></div>
        <div class="ast-modal-body">
          <div id="novo-bloq-aviso" style="display:none" class="ast-bloqueado-banner">
            🚫 <strong>Número bloqueado</strong> — <span id="novo-bloq-motivo"></span>
            <button class="ast-btn ast-btn-success ast-btn-sm" onclick="astDesbloquearNoModal()">Desbloquear</button>
          </div>
          <div id="novo-hist-aviso" style="display:none;background:var(--orange-bg);border:1px solid #FDE68A;border-radius:var(--radius-sm);padding:9px 13px;margin-bottom:12px;font-size:12px;color:var(--orange)"></div>
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
          <div class="ast-form-row full">
            <div class="ast-form-field">
              <label class="ast-form-lbl">Produto</label>
              <input class="ast-form-input" id="novo-prod-busca" placeholder="Buscar produto do catálogo..." autocomplete="off" oninput="astBuscarProdutoModal()">
              <div id="novo-prod-results" class="ast-prod-result" style="display:none"></div>
              <input type="hidden" id="novo-prod-id">
              <div id="novo-prod-sel" style="font-size:11px;color:var(--blue-mid);margin-top:3px"></div>
            </div>
          </div>
          <div class="ast-form-row">
            <div class="ast-form-field"><label class="ast-form-lbl">Setor</label>
              <select class="ast-form-select" id="novo-setor"><option value="">Selecione...</option></select></div>
            <div class="ast-form-field"><label class="ast-form-lbl">Status Inicial</label>
              <select class="ast-form-select" id="novo-status"></select></div>
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
let _novoBloqId=null;
window.astVerificarTelefone = async function() {
  const tel=(document.getElementById('novo-tel')?.value||'').replace(/\D/g,'');
  if(tel.length<10)return;
  const avisoB=document.getElementById('novo-bloq-aviso'), avisoH=document.getElementById('novo-hist-aviso'), btn=document.getElementById('novo-btn');
  _novoBloqId=null;
  const[{data:bloq},{data:hist},{data:clientes}]=await Promise.all([
    window.sb.from('assist_numeros_bloqueados').select('id,motivo,bloqueado_por').eq('telefone_norm',tel).eq('ativo',true).maybeSingle(),
    window.sb.from('assist_kanban').select('id,status_nome,produto_nome,data_abertura').eq('telefone_normalizado',tel).order('data_abertura',{ascending:false}).range(0,4),
    window.sb.from('assist_clientes_telefone_lookup').select('id_cliente,nome_cliente').or(`telefone_norm1.eq.${tel},telefone_norm2.eq.${tel},telefone_norm3.eq.${tel}`).limit(1),
  ]);
  if(bloq){_novoBloqId=bloq.id;if(avisoB){avisoB.style.display='';document.getElementById('novo-bloq-motivo').textContent=`${bloq.motivo||'Não-Garantia'} · por ${bloq.bloqueado_por||'—'}`;}if(btn)btn.disabled=true;}
  else{if(avisoB)avisoB.style.display='none';if(btn)btn.disabled=false;}
  if(hist?.length&&avisoH){avisoH.style.display='';avisoH.innerHTML=`⚠️ <strong>${hist.length} chamado(s) anterior(es)</strong>: `+hist.slice(0,3).map(h=>`#${h.id} ${astStatusBadge(h.status_nome)}`).join(' · ');}
  else if(avisoH)avisoH.style.display='none';
  if(clientes?.[0]){const n=document.getElementById('novo-nome');if(n&&!n.value)n.value=clientes[0].nome_cliente||'';}
};
window.astDesbloquearNoModal=async function(){
  if(!_novoBloqId)return;
  const usuario=window.getUsuario?.();
  await window.sb.from('assist_numeros_bloqueados').update({ativo:false,desbloqueado_por:usuario?.nome||null,desbloqueado_em:new Date().toISOString()}).eq('id',_novoBloqId);
  _novoBloqId=null;
  document.getElementById('novo-bloq-aviso').style.display='none';
  document.getElementById('novo-btn').disabled=false;
};
window.astAbrirModalNovo=async function(){
  astCriarModalNovo();
  await astCarregarLookups();
  const ss=document.getElementById('novo-setor'), st=document.getElementById('novo-status');
  if(ss)ss.innerHTML='<option value="">Selecione...</option>'+astSelectOptions(_setoresList,null);
  if(st)st.innerHTML=astSelectOptions(_statusList,_statusList[0]?.id);
  document.getElementById('ast-modal-novo').classList.add('open');
};
window.astFecharModalNovo=function(){document.getElementById('ast-modal-novo')?.classList.remove('open');};
let _buscaProdTimer=null;
window.astBuscarProdutoModal=function(){
  clearTimeout(_buscaProdTimer);
  _buscaProdTimer=setTimeout(async()=>{
    const q=(document.getElementById('novo-prod-busca')?.value||'').trim(), res=document.getElementById('novo-prod-results');
    if(!res||q.length<2){if(res)res.style.display='none';return;}
    const{data}=await window.sb.from('assist_produtos').select('id,referencia,nome,grupo').eq('ativo',true).or(`nome.ilike.%${q}%,referencia.ilike.%${q}%`).order('nome').range(0,14);
    if(!data?.length){res.innerHTML='<div class="ast-prod-result-item" style="color:var(--text-muted)">Nenhum produto</div>';res.style.display='';return;}
    res.style.display='';
    res.innerHTML=data.map(p=>`<div class="ast-prod-result-item" onclick="astSelecionarProdModal(${p.id},'${(p.referencia||'').replace(/'/g,"\\'")}','${p.nome.replace(/'/g,"\\'")}')"><div>${p.nome}</div><div class="ast-prod-ref">${p.referencia||''} ${p.grupo?'· '+p.grupo:''}</div></div>`).join('');
  },300);
};
window.astSelecionarProdModal=function(id,ref,nome){
  document.getElementById('novo-prod-id').value=id;
  document.getElementById('novo-prod-busca').value=nome;
  document.getElementById('novo-prod-sel').textContent=`✅ ${ref?ref+' — ':''}${nome}`;
  document.getElementById('novo-prod-results').style.display='none';
};
window.astSalvarNovo=async function(){
  const v=id=>document.getElementById(id)?.value;
  const tel=v('novo-tel')?.trim(), erro=document.getElementById('novo-erro');
  if(!tel){if(erro)erro.textContent='⚠️ Telefone é obrigatório';return;}
  if(erro)erro.textContent='';
  const btn=document.getElementById('novo-btn');
  if(btn){btn.textContent='Salvando...';btn.disabled=true;}
  try{
    const telNum=tel.replace(/\D/g,'');
    const{data:bloq}=await window.sb.from('assist_numeros_bloqueados').select('id').eq('telefone_norm',telNum).eq('ativo',true).maybeSingle();
    if(bloq){if(erro)erro.textContent='🚫 Número bloqueado.';if(btn){btn.textContent='Salvar Chamado';btn.disabled=false;}return;}
    const prodId=v('novo-prod-id');
    let prodNome=v('novo-prod-busca')||null, prodCod=null, prodIdErp=null;
    if(prodId){const{data:pd}=await window.sb.from('assist_produtos').select('nome,referencia,id_produto_erp').eq('id',parseInt(prodId)).single();if(pd){prodNome=pd.nome;prodCod=pd.referencia;prodIdErp=pd.id_produto_erp;}}
    const{data:lk}=await window.sb.from('assist_clientes_telefone_lookup').select('id_cliente,nome_cliente').or(`telefone_norm1.eq.${telNum},telefone_norm2.eq.${telNum},telefone_norm3.eq.${telNum}`).limit(1);
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
      descricao_inicial:v('novo-desc')||null,
      responsavel_nome:usuario?.nome||null,
      natureza:'garantia', visualizado:false,
      concluido:statusObj?.finaliza_chamado||false,
    };
    const{data:novo,error}=await window.sb.from('assist_chamados').insert(payload).select().single();
    if(error)throw error;
    if(v('novo-desc')&&novo?.id){await window.sb.from('assist_followups').insert({chamado_id:novo.id,tipo:'Abertura',mensagem:v('novo-desc'),origem:'manual',usuario_nome:usuario?.nome||null});}
    astFecharModalNovo();
    await astLoadChamados();
    ['novo-tel','novo-nome','novo-prod-busca','novo-prod-id','novo-desc'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
    const s=document.getElementById('novo-prod-sel');if(s)s.textContent='';
  }catch(e){if(erro)erro.textContent='❌ '+e.message;}
  finally{if(btn){btn.textContent='Salvar Chamado';btn.disabled=false;}}
};
// ══════════════════════════════════════════
// PRODUTOS
// ══════════════════════════════════════════
async function astLoadCustoGarantia() {
  const el = document.getElementById('ast-custo-garantia-chart'); if (!el) return;
  try {
    const meses = [];
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push({
        ano: d.getFullYear(),
        mes: d.getMonth(),
        inicio: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,
        fim: new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().substring(0,10),
        label: d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
      });
    }

    // Buscar custo de produtos por mês (mov garantia saídas)
    const { data: movData } = await window.sb
      .from('vw_assist_mov_garantia')
      .select('data_mov,custo_total,tipo_es')
      .eq('tipo_es','S')
      .gte('data_mov', meses[0].inicio)
      .lte('data_mov', meses[5].fim)
      .range(0, 9999);

    // Buscar frete dos CTes (id_vendedor garantia ou custo do período)
    const { data: fretData } = await window.sb
      .from('frt_conhecimentos')
      .select('data_emissao,valor_frete_cte,id_vendedor,departamento')
      .in('id_vendedor', [49766, 69722, 84986])
      .gte('data_emissao', meses[0].inicio)
      .lte('data_emissao', meses[5].fim)
      .range(0, 999);

    // Agregar por mês
    const custoProds = {};
    const custoFrete = {};
    meses.forEach(m => { custoProds[`${m.ano}-${m.mes}`] = 0; custoFrete[`${m.ano}-${m.mes}`] = 0; });

    (movData||[]).forEach(r => {
      const d = new Date(r.data_mov);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (custoProds[k] !== undefined) custoProds[k] += parseFloat(r.custo_total)||0;
    });
    (fretData||[]).forEach(r => {
      const d = new Date(r.data_emissao);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (custoFrete[k] !== undefined) custoFrete[k] += parseFloat(r.valor_frete_cte)||0;
    });

    const valoresP = meses.map(m => custoProds[`${m.ano}-${m.mes}`]);
    const valoresF = meses.map(m => custoFrete[`${m.ano}-${m.mes}`]);
    const maxVal = Math.max(...valoresP.map((v,i)=>v+valoresF[i]), 1);
    const barH = 80;
    const fmtR = v => v > 0 ? 'R$ ' + v.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0}) : '—';
    const totalP = valoresP.reduce((a,b)=>a+b,0);
    const totalF = valoresF.reduce((a,b)=>a+b,0);

    el.innerHTML = `
      <div style="display:flex;align-items:flex-end;gap:6px;height:${barH+48}px;overflow-x:auto;padding-bottom:4px">
        ${meses.map((m,i) => {
          const vP = valoresP[i], vF = valoresF[i], tot = vP + vF;
          const hP = vP ? Math.max(Math.round(vP/maxVal*barH), 3) : 0;
          const hF = vF ? Math.max(Math.round(vF/maxVal*barH), 3) : 0;
          const isAtual = m.ano === hoje.getFullYear() && m.mes === hoje.getMonth();
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:60px;max-width:120px">
            ${tot>0?`<div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">${fmtR(tot)}</div>`:'<div style="font-size:10px;color:var(--border);margin-bottom:2px">—</div>'}
            <div style="width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:1px;height:${barH}px">
              ${vF?`<div title="Frete: ${fmtR(vF)}" style="width:100%;height:${hF}px;background:var(--orange);border-radius:2px 2px 0 0;opacity:.85"></div>`:''}
              ${vP?`<div title="Produtos: ${fmtR(vP)}" style="width:100%;height:${hP}px;background:var(--red);border-radius:${vF?'0':'2px 2px'} 0 0"></div>`:''}
              ${!vP&&!vF?`<div style="width:100%;height:2px;background:var(--border);border-radius:2px;margin-top:auto"></div>`:''}
            </div>
            <div style="font-size:11px;color:${isAtual?'var(--blue-mid)':'var(--text-muted)'};font-weight:${isAtual?'700':'400'};text-align:center;white-space:nowrap">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
        <span>Total produtos: <strong style="color:var(--red)">${fmtR(totalP)}</strong></span>
        <span>Total frete: <strong style="color:var(--orange)">${totalF > 0 ? fmtR(totalF) : '<span title=\"CTes de garantia com id_vendedor pendente de sincronização ERP\">R$ 0 ⚠️</span>'}</strong></span>
        <span>Total geral: <strong>${fmtR(totalP + totalF)}</strong></span>
      </div>`;
  } catch(e) { el.innerHTML='<div style="color:var(--text-muted);font-size:13px">Sem dados</div>'; }
}

async function astLoadProdutos() {
  try {
    const[{data:prods},{data:indice}]=await Promise.all([
      window.sb.from('assist_produtos').select('*').order('nome').range(0,9999),
      window.sb.from('assist_indice_defeito').select('id_produto,chamados_garantia,qtd_vendida_12m,indice_defeito_pct').range(0,9999),
    ]);
    astProdAll=prods||[];
    const idxMap={};(indice||[]).forEach(r=>{idxMap[r.id_produto]=r;});
    const c=document.getElementById('ast-prod-count');if(c)c.textContent=`${astProdAll.filter(p=>p.ativo!==false).length} ativos`;
    astRenderProdTabela(astProdAll,idxMap);
  }catch(e){}
  try{
    const{data}=await window.sb.from('assist_produtos_criticos').select('*').order('total_chamados',{ascending:false}).range(0,9);
    const el=document.getElementById('ast-criticos-list');
    if(el&&data?.length){const max=data[0].total_chamados||1;el.innerHTML=data.map((r,i)=>`<div class="ast-rank-item"><div class="ast-rank-pos ${i===0?'g1':i===1?'g2':i===2?'g3':''}">${i+1}</div><div style="flex:1"><div class="ast-rank-name">${r.produto_nome||'—'}</div><div class="ast-progress-bar"><div class="ast-progress-fill" style="width:${Math.round(r.total_chamados/max*100)}%;background:var(--red)"></div></div></div><div class="ast-rank-val">${r.total_chamados}<div style="font-size:11px;color:var(--text-muted)">${r.chamados_abertos||0} abertos</div></div></div>`).join('');}
    else if(el)el.innerHTML='<div class="ast-empty">Sem dados</div>';
  }catch(e){}
  // Peças mais usadas: removido (view não existe mais)
  window.setLastUpdate?.();
}
function astRenderProdTabela(data,idxMap={}) {
  const tbody=document.getElementById('ast-prod-body');if(!tbody)return;
  if(!data.length){tbody.innerHTML='<tr><td colspan="8"><div class="ast-empty"><div class="ast-empty-ico">📦</div>Nenhum produto. Clique em "+ Adicionar Produto".</div></td></tr>';return;}
  tbody.innerHTML=data.map(p=>{
    const idx=idxMap[p.id_produto_erp], pct=idx?parseFloat(idx.indice_defeito_pct):null;
    const idxHtml=pct!=null?`<span class="ast-idx-${astIndiceCls(pct)}">${pct.toFixed(2)}%</span>`:'<span style="color:var(--text-muted)">—</span>';
    return `<tr>
      <td class="ast-mono" style="color:var(--text-muted)">${p.referencia||'—'}</td>
      <td style="font-weight:500">${p.nome}</td>
      <td style="color:var(--text-secondary)">${p.grupo||'—'}</td>
      <td class="right">${idx?parseInt(idx.qtd_vendida_12m).toLocaleString('pt-BR'):'—'}</td>
      <td class="right">${idx?idx.chamados_garantia:'—'}</td>
      <td class="right">${idxHtml}</td>
      <td>${p.ativo!==false?'<span class="ast-badge ast-badge-concluido">Ativo</span>':'<span class="ast-badge ast-badge-cancelado">Inativo</span>'}</td>
      <td><button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astToggleProduto(${p.id},${p.ativo===false})">${p.ativo!==false?'🚫 Desativar':'✅ Ativar'}</button></td>
    </tr>`;
  }).join('');
}
window.astFiltrarProdutos=function(){const q=(document.getElementById('ast-prod-busca')?.value||'').toLowerCase();astRenderProdTabela(q?astProdAll.filter(p=>p.nome.toLowerCase().includes(q)||(p.referencia||'').toLowerCase().includes(q)):astProdAll);};
window.astToggleProduto=async function(id,novoAtivo){await window.sb.from('assist_produtos').update({ativo:novoAtivo,atualizado_em:new Date().toISOString()}).eq('id',id);const idx=astProdAll.findIndex(p=>p.id===id);if(idx>=0)astProdAll[idx].ativo=novoAtivo;astRenderProdTabela(astProdAll);};

function astCriarModalProduto(){
  if(document.getElementById('ast-modal-prod'))return;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="ast-modal-ov" id="ast-modal-prod">
      <div class="ast-modal">
        <div class="ast-modal-hdr"><div class="ast-modal-title">Adicionar Produto do ERP</div>
          <button style="width:32px;height:32px;border:none;background:var(--surface2);border-radius:6px;cursor:pointer;font-size:16px;color:var(--text-muted)" onclick="astFecharModalProduto()">✕</button></div>
        <div class="ast-modal-body">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Busque na base do ERP e adicione ao catálogo da assistência.</div>
          <div class="ast-form-field" style="margin-bottom:8px"><label class="ast-form-lbl">Buscar</label>
            <input class="ast-form-input" id="mp-busca" placeholder="Nome ou referência do produto..." oninput="astBuscarERP()"></div>
          <div id="mp-results" style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-sm);display:none"></div>
          <div id="mp-sel" style="display:none;background:var(--blue-pale);border:1px solid var(--blue-light);border-radius:var(--radius-sm);padding:10px 13px;margin-top:10px">
            <div style="font-size:12px;font-weight:600;color:var(--blue-dark);margin-bottom:3px">Selecionado:</div>
            <div id="mp-sel-nome" style="font-size:14px;font-weight:600"></div>
            <div id="mp-sel-ref"  style="font-size:12px;color:var(--text-muted)"></div>
          </div>
          <input type="hidden" id="mp-id-erp"><input type="hidden" id="mp-ref"><input type="hidden" id="mp-nome"><input type="hidden" id="mp-grupo"><input type="hidden" id="mp-sub">
          <div id="mp-erro" class="ast-form-err" style="margin-top:8px"></div>
        </div>
        <div class="ast-modal-foot">
          <button class="ast-btn ast-btn-secondary" onclick="astFecharModalProduto()">Cancelar</button>
          <button class="ast-btn ast-btn-primary" id="mp-btn" onclick="astAdicionarProduto()" disabled>Adicionar ao Catálogo</button>
        </div>
      </div>
    </div>`);
}
window.astAbrirModalProduto=function(){astCriarModalProduto();document.getElementById('ast-modal-prod').classList.add('open');};
window.astFecharModalProduto=function(){document.getElementById('ast-modal-prod')?.classList.remove('open');};
window.astBuscarERP=function(){
  clearTimeout(_prodErpTimer);
  _prodErpTimer=setTimeout(async()=>{
    const q=(document.getElementById('mp-busca')?.value||'').trim(), res=document.getElementById('mp-results');
    if(!res||q.length<2){if(res)res.style.display='none';return;}
    res.style.display='';res.innerHTML='<div style="padding:10px;color:var(--text-muted);font-size:13px">Buscando...</div>';
    const{data}=await window.sb.from('comp_produtos_consolidado').select('id_produto,referencia,nome,grupo,subgrupo').or(`nome.ilike.%${q}%,referencia.ilike.%${q}%`).order('nome').range(0,29);
    if(!data?.length){res.innerHTML='<div style="padding:10px;color:var(--text-muted);font-size:13px">Nenhum produto</div>';return;}
    res.innerHTML=data.map(p=>`<div class="ast-prod-result-item" onclick="astSelecionarERP(${p.id_produto},'${(p.referencia||'').replace(/'/g,"\\'")}','${p.nome.replace(/'/g,"\\'")}','${(p.grupo||'').replace(/'/g,"\\'")}','${(p.subgrupo||'').replace(/'/g,"\\'")}')"><div style="font-weight:500">${p.nome}</div><div class="ast-prod-ref">${p.referencia||''} ${p.grupo?'· '+p.grupo:''}</div></div>`).join('');
  },350);
};
window.astSelecionarERP=function(idErp,ref,nome,grupo,sub){
  ['mp-id-erp','mp-ref','mp-nome','mp-grupo','mp-sub'].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.value=[idErp,ref,nome,grupo,sub][i];});
  document.getElementById('mp-sel-nome').textContent=nome;
  document.getElementById('mp-sel-ref').textContent=`Ref: ${ref||'—'} · ${grupo||''}`;
  document.getElementById('mp-sel').style.display='';
  document.getElementById('mp-results').style.display='none';
  const btn=document.getElementById('mp-btn');if(btn)btn.disabled=false;
};
window.astAdicionarProduto=async function(){
  const v=id=>document.getElementById(id)?.value, nome=v('mp-nome'), erro=document.getElementById('mp-erro');
  if(!nome){if(erro)erro.textContent='Selecione um produto';return;}
  const{data:existe}=await window.sb.from('assist_produtos').select('id').eq('id_produto_erp',parseInt(v('mp-id-erp'))).maybeSingle();
  if(existe){if(erro)erro.textContent='⚠️ Produto já no catálogo';return;}
  const btn=document.getElementById('mp-btn');if(btn){btn.textContent='Adicionando...';btn.disabled=true;}
  const usuario=window.getUsuario?.();
  const{error}=await window.sb.from('assist_produtos').insert({id_produto_erp:parseInt(v('mp-id-erp')),referencia:v('mp-ref')||null,nome,grupo:v('mp-grupo')||null,subgrupo:v('mp-sub')||null,ativo:true,criado_por:usuario?.nome||null});
  if(error){if(erro)erro.textContent='❌ '+error.message;if(btn){btn.textContent='Adicionar ao Catálogo';btn.disabled=false;}return;}
  astFecharModalProduto();
  await astLoadProdutos();
};



// ══════════════════════════════════════════
// MOVIMENTAÇÃO GARANTIA — página ast-mov-garantia
// ══════════════════════════════════════════
window.astMovGarantia = {
  _saidas: [],
  _entradas: [],
  _tipo: 'saldo',

  setTipo(tipo, btn) {
    this._tipo = tipo;
    document.querySelectorAll('#ast-mg-tipo-toggle .ast-toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.renderizar();
  },

  getMesRange() {
    const mes = document.getElementById('ast-mg-mes')?.value || '2026-06';
    const [ano, m] = mes.split('-').map(Number);
    const inicio = `${ano}-${String(m).padStart(2,'0')}-01`;
    const ultimo = new Date(ano, m, 0).getDate();
    const fim    = `${ano}-${String(m).padStart(2,'0')}-${String(ultimo).padStart(2,'0')}`;
    return { inicio, fim, label: new Date(ano, m-1, 1).toLocaleString('pt-BR',{month:'long',year:'numeric'}) };
  },

  async carregar() {
    const tbody = document.getElementById('ast-mg-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr class="ast-loading"><td colspan="8">Carregando...</td></tr>';

    const { inicio, fim } = this.getMesRange();

    try {
      // Buscar saídas e entradas diretamente da view
      const [{ data: saidasRaw }, { data: entradasRaw }] = await Promise.all([
        window.sb.from('vw_assist_mov_garantia')
          .select('tipo_es,origem,id_empresa,referencia,produto,grupo,qtd,custo_unit,custo_total,nome_vendedor')
          .eq('tipo_es', 'S')
          .gte('data_mov', inicio)
          .lte('data_mov', fim)
          .range(0, 9999),
        window.sb.from('vw_assist_mov_garantia')
          .select('tipo_es,origem,id_empresa,referencia,produto,grupo,qtd,custo_unit,custo_total,motivo')
          .eq('tipo_es', 'E')
          .gte('data_mov', inicio)
          .lte('data_mov', fim)
          .range(0, 9999),
      ]);

      // Buscar preço de compra para custo zerado
      const chunk2 = (arr, size) => Array.from({length: Math.ceil(arr.length/size)}, (_,i) => arr.slice(i*size,(i+1)*size));
      const refsZero = [...new Set((saidasRaw||[]).filter(r=>!parseFloat(r.custo_unit)&&!parseFloat(r.custo_total)).map(r=>r.referencia).filter(Boolean))];
      let precosMap = {};
      for (const c of chunk2(refsZero, 100)) {
        const { data } = await window.sb.from('comp_produtos_consolidado').select('referencia,preco_compra,estoque_total').in('referencia', c);
        (data||[]).forEach(p => { precosMap[p.referencia] = { preco: parseFloat(p.preco_compra)||0, estoque: parseFloat(p.estoque_total)||0 }; });
      }

      // Buscar estoque de todos os produtos das saídas
      const todasRefs = [...new Set((saidasRaw||[]).map(r=>r.referencia).filter(Boolean))];
      for (const c of chunk2(todasRefs, 100)) {
        const { data } = await window.sb.from('comp_produtos_consolidado').select('referencia,preco_compra,estoque_total').in('referencia', c);
        (data||[]).forEach(p => { precosMap[p.referencia] = { preco: parseFloat(p.preco_compra)||0, estoque: parseFloat(p.estoque_total)||0 }; });
      }

      // Agrupar saídas por produto
      const sMap = {};
      (saidasRaw||[]).forEach(r => {
        const k = r.referencia || r.produto;
        if (!sMap[k]) sMap[k] = { referencia: r.referencia, produto: (r.produto||'').trim(), grupo: (r.grupo||'').trim(), qtd: 0, custo: 0, estoque: precosMap[r.referencia]?.estoque ?? null };
        const qtd = Math.abs(parseFloat(r.qtd)||0);
        const custo = parseFloat(r.custo_total) || (qtd * (parseFloat(r.custo_unit) || precosMap[r.referencia]?.preco || 0));
        sMap[k].qtd   += qtd;
        sMap[k].custo += custo;
      });

      // Agrupar entradas por produto
      const eMap = {};
      (entradasRaw||[]).forEach(r => {
        const k = r.referencia || r.produto;
        if (!eMap[k]) eMap[k] = { referencia: r.referencia, produto: (r.produto||'').trim(), grupo: (r.grupo||'').trim(), qtd: 0, custo: 0, motivo: r.motivo };
        eMap[k].qtd   += Math.abs(parseFloat(r.qtd)||0);
        eMap[k].custo += Math.abs(parseFloat(r.custo_total)||0);
      });

      this._saidas   = Object.values(sMap).sort((a,b) => b.custo - a.custo);
      this._entradas = Object.values(eMap).sort((a,b) => b.custo - a.custo);

      // KPIs
      const totQtdS   = this._saidas.reduce((s,r)=>s+r.qtd,0);
      const totCustoS = this._saidas.reduce((s,r)=>s+r.custo,0);
      const totQtdE   = this._entradas.reduce((s,r)=>s+r.qtd,0);
      const totCustoE = this._entradas.reduce((s,r)=>s+r.custo,0);
      const saldo     = totCustoS - totCustoE;
      const fmt = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      const el = id => document.getElementById(id);
      if(el('ast-mg-k-qtd-s'))   el('ast-mg-k-qtd-s').textContent   = totQtdS.toLocaleString('pt-BR',{maximumFractionDigits:1});
      if(el('ast-mg-k-prod-s'))  el('ast-mg-k-prod-s').textContent  = this._saidas.length + ' produtos';
      if(el('ast-mg-k-custo-s')) el('ast-mg-k-custo-s').textContent = fmt(totCustoS);
      if(el('ast-mg-k-qtd-e'))   el('ast-mg-k-qtd-e').textContent   = totQtdE.toLocaleString('pt-BR',{maximumFractionDigits:1});
      if(el('ast-mg-k-prod-e'))  el('ast-mg-k-prod-e').textContent  = this._entradas.length + ' itens';
      if(el('ast-mg-k-custo-e')) el('ast-mg-k-custo-e').textContent = fmt(totCustoE);
      if(el('ast-mg-k-saldo'))   { el('ast-mg-k-saldo').textContent = fmt(saldo); el('ast-mg-k-saldo').style.color = saldo >= 0 ? 'var(--orange)' : 'var(--green)'; }

      this.filtrar();
      window.setLastUpdate?.();
    } catch(e) {
      if(tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--red)">Erro: ${e.message}</td></tr>`;
    }
  },

  async abrirHistorico(referencia, nomeProduto) {
    if (!referencia) return;
    const { inicio, fim, label } = this.getMesRange();

    // Remover modal anterior
    document.getElementById('ast-mg-historico-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'ast-mg-historico-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(15,29,53,.45)';
    modal.innerHTML = `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow-lg);width:min(760px,95vw);max-height:85vh;display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)">
        <div>
          <div style="font-size:15px;font-weight:700">${nomeProduto}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Ref: ${referencia} · ${label}</div>
        </div>
        <button onclick="document.getElementById('ast-mg-historico-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);padding:4px">✕</button>
      </div>
      <div style="overflow-y:auto;padding:16px 20px" id="ast-mg-hist-body">
        <div style="color:var(--text-muted);font-size:13px">Carregando...</div>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    try {
      const { data } = await window.sb
        .from('vw_assist_mov_garantia')
        .select('tipo_es,origem,id_doc,empresa,data_mov,qtd,custo_unit,custo_total,nome_vendedor,motivo')
        .eq('referencia', referencia)
        .gte('data_mov', inicio)
        .lte('data_mov', fim)
        .order('data_mov', {ascending: false})
        .range(0, 999);

      const body = document.getElementById('ast-mg-hist-body');
      if (!body) return;

      if (!data?.length) {
        body.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px 0;text-align:center">Nenhuma movimentação no período</div>';
        return;
      }

      const fmt = v => v > 0 ? 'R$ ' + parseFloat(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';
      const fmtDt = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

      // Totais
      const saidas   = data.filter(r => r.tipo_es === 'S');
      const entradas = data.filter(r => r.tipo_es === 'E');
      const totS = saidas.reduce((a,r) => a + parseFloat(r.custo_total||0), 0);
      const totE = entradas.reduce((a,r) => a + parseFloat(r.custo_total||0), 0);
      const totQs = saidas.reduce((a,r) => a + parseFloat(r.qtd||0), 0);
      const totQe = entradas.reduce((a,r) => a + parseFloat(r.qtd||0), 0);

      body.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center">
            <div style="font-size:11px;color:var(--text-muted)">Saídas (qtd)</div>
            <div style="font-size:18px;font-weight:700;color:var(--red)">${totQs.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:1})}</div>
          </div>
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center">
            <div style="font-size:11px;color:var(--text-muted)">Custo saídas</div>
            <div style="font-size:18px;font-weight:700;color:var(--red)">${fmt(totS)}</div>
          </div>
          <div style="padding:10px 14px;background:var(--surface2);border-radius:var(--radius-sm);text-align:center">
            <div style="font-size:11px;color:var(--text-muted)">Retornos (qtd)</div>
            <div style="font-size:18px;font-weight:700;color:var(--green)">${totQe.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:1})}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="border-bottom:2px solid var(--border)">
              <th style="padding:6px 8px;text-align:left;color:var(--text-muted);font-weight:600">Tipo</th>
              <th style="padding:6px 8px;text-align:left;color:var(--text-muted);font-weight:600">Data</th>
              <th style="padding:6px 8px;text-align:left;color:var(--text-muted);font-weight:600">Doc / Origem</th>
              <th style="padding:6px 8px;text-align:left;color:var(--text-muted);font-weight:600">Empresa</th>
              <th style="padding:6px 8px;text-align:left;color:var(--text-muted);font-weight:600">Vendedor / Motivo</th>
              <th style="padding:6px 8px;text-align:right;color:var(--text-muted);font-weight:600">Qtd</th>
              <th style="padding:6px 8px;text-align:right;color:var(--text-muted);font-weight:600">Custo Unit.</th>
              <th style="padding:6px 8px;text-align:right;color:var(--text-muted);font-weight:600">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(r => `<tr style="border-bottom:1px solid var(--border)">
              <td style="padding:7px 8px">
                <span style="font-size:11px;font-weight:600;padding:2px 7px;border-radius:8px;background:${r.tipo_es==='S'?'var(--red-bg)':'var(--green-bg)'};color:${r.tipo_es==='S'?'var(--red)':'var(--green)'}">
                  ${r.tipo_es==='S'?'⬆ Saída':'⬇ Entrada'}
                </span>
              </td>
              <td style="padding:7px 8px;white-space:nowrap">${fmtDt(r.data_mov)}</td>
              <td style="padding:7px 8px;font-family:monospace;font-size:11px">${r.id_doc||'—'}<br><span style="color:var(--text-muted)">${r.origem||'—'}</span></td>
              <td style="padding:7px 8px;font-size:11px;color:var(--text-secondary)">${r.empresa||'—'}</td>
              <td style="padding:7px 8px;font-size:11px">${r.nome_vendedor||r.motivo||'—'}</td>
              <td style="padding:7px 8px;text-align:right;font-weight:600">${parseFloat(r.qtd||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2})}</td>
              <td style="padding:7px 8px;text-align:right;color:var(--text-muted)">${fmt(parseFloat(r.custo_unit||0))}</td>
              <td style="padding:7px 8px;text-align:right;font-weight:600;color:${r.tipo_es==='S'?'var(--red)':'var(--green)'}">${fmt(parseFloat(r.custo_total||0))}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } catch(e) {
      const body = document.getElementById('ast-mg-hist-body');
      if (body) body.innerHTML = '<div style="color:var(--red);font-size:13px">Erro ao carregar histórico</div>';
    }
  },

  async filtrar() {
    const busca = (document.getElementById('ast-mg-busca')?.value||'').toLowerCase();
    const dados = this._tipo === 'entradas' ? this._entradas : this._saidas;
    const filtrado = busca ? dados.filter(r => `${r.produto} ${r.referencia} ${r.grupo}`.toLowerCase().includes(busca)) : dados;

    if (this._tipo === 'saldo') {
      await this.renderizarSaldo(busca);
    } else {
      this.renderizar(filtrado);
    }
  },

  renderizar(dados) {
    const tbody = document.getElementById('ast-mg-tbody');
    const thead = document.getElementById('ast-mg-thead');
    const count = document.getElementById('ast-mg-count');
    const title = document.getElementById('ast-mg-table-title');
    if (!tbody) return;

    const { label } = this.getMesRange();
    const isSaida = this._tipo === 'saidas';

    if (title) title.innerHTML = (isSaida ? '⬆ Saídas' : '⬇ Entradas') + ` de estoque — ${label} — <span id="ast-mg-count">${dados.length} produtos</span>`;

    if (thead) thead.innerHTML = isSaida
      ? `<tr><th>Referência</th><th>Produto</th><th>Grupo</th><th class="right">Qtd saída</th><th class="right">Custo</th><th class="right">Estoque atual</th><th class="right">OS</th></tr>`
      : `<tr><th>Referência</th><th>Produto</th><th>Grupo</th><th>Tipo entrada</th><th class="right">Qtd</th><th class="right">Valor</th></tr>`;

    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="ast-empty"><div class="ast-empty-ico">📦</div>Nenhum item encontrado no período</div></td></tr>';
      return;
    }

    const fmt = v => v > 0 ? 'R$ ' + v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';

    tbody.innerHTML = dados.map(r => isSaida ? `<tr style="cursor:pointer" onclick="astMovGarantia.abrirHistorico('${(r.referencia||'').replace(/'/g,"\'")}','${(r.produto||'').replace(/'/g,"\'").substring(0,50)}')">
      <td class="ast-mono" style="color:var(--text-muted)">${r.referencia||'—'}</td>
      <td style="font-weight:500">${r.produto||'—'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${r.grupo||'—'}</td>
      <td class="right">${r.qtd.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2})}</td>
      <td class="right" style="color:var(--red)">${fmt(r.custo)}</td>
      <td class="right" style="font-weight:600;color:${r.estoque===null?'var(--text-muted)':r.estoque<=0?'var(--red)':r.estoque<=5?'var(--orange)':'var(--green)'}">${r.estoque===null?'—':r.estoque.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2})}</td>
      <td class="right" style="font-size:12px;color:var(--text-muted)">${r.os.size} OS</td>
    </tr>` : `<tr style="cursor:pointer" onclick="astMovGarantia.abrirHistorico('${(r.referencia||'').replace(/'/g,"\'")}','${(r.produto||'').replace(/'/g,"\'").substring(0,50)}')">
      <td class="ast-mono" style="color:var(--text-muted)">${r.referencia||'—'}</td>
      <td style="font-weight:500">${r.produto||'—'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${r.grupo||'—'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${r.tipo_entrada||'—'}</td>
      <td class="right">${r.qtd.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2})}</td>
      <td class="right" style="color:var(--green)">${fmt(r.custo)}</td>
    </tr>`).join('');
  },

  async renderizarSaldo(busca) {
    const tbody = document.getElementById('ast-mg-tbody');
    const thead = document.getElementById('ast-mg-thead');
    const title = document.getElementById('ast-mg-table-title');
    if (!tbody) return;

    const { label } = this.getMesRange();
    if (title) title.innerHTML = `⇅ Saldo — ${label}`;

    // Montar mapa combinado
    const keys = new Set([...this._saidas.map(r=>r.referencia), ...this._entradas.map(r=>r.referencia)]);
    let itens = [];
    keys.forEach(k => {
      const s = this._saidas.find(r=>r.referencia===k);
      const e = this._entradas.find(r=>r.referencia===k);
      const produto = s?.produto || e?.produto || '—';
      const grupo   = s?.grupo   || e?.grupo   || '—';
      if (busca && !`${produto} ${k} ${grupo}`.toLowerCase().includes(busca)) return;
      const qtdS = s?.qtd || 0, custoS = s?.custo || 0;
      const qtdE = e?.qtd || 0, custoE = e?.custo || 0;
      itens.push({ referencia: k, produto, grupo, qtdS, custoS, qtdE, custoE, saldo: custoS - custoE });
    });
    itens.sort((a,b) => b.saldo - a.saldo); // maior consumo líquido primeiro

    if (thead) thead.innerHTML = `<tr><th>Referência</th><th>Produto</th><th class="right">Qtd Saída</th><th class="right">Custo Saída</th><th class="right">Qtd Entrada</th><th class="right">Custo Entrada</th><th class="right">Consumo Líquido</th><th class="right">Estoque Atual</th></tr>`;

    const fmt = v => v !== 0 ? 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';

    // Buscar estoque para itens do saldo
    const refsaldo = itens.map(r=>r.referencia).filter(Boolean);
    const estoqueMapSaldo = {};
    const chunk3 = (arr, size) => Array.from({length: Math.ceil(arr.length/size)}, (_,i) => arr.slice(i*size,(i+1)*size));
    await Promise.all(chunk3(refsaldo, 100).map(async c => {
      const { data } = await window.sb.from('comp_produtos_consolidado').select('referencia,estoque_total').in('referencia', c);
      (data||[]).forEach(p => { estoqueMapSaldo[p.referencia] = parseFloat(p.estoque_total)||0; });
    }));

    tbody.innerHTML = itens.map(r => {
      const est = estoqueMapSaldo[r.referencia] ?? null;
      return `<tr style="cursor:pointer" onclick="astMovGarantia.abrirHistorico('${r.referencia?.replace(/'/g,"\'")||''}','${r.produto?.replace(/'/g,"\'").substring(0,50)||''}')">
        <td class="ast-mono" style="color:var(--text-muted)">${r.referencia||'—'}</td>
        <td style="font-weight:500;font-size:12px">${r.produto}</td>
        <td class="right" style="color:var(--red)">${r.qtdS > 0 ? r.qtdS : '—'}</td>
        <td class="right" style="color:var(--red)">${fmt(r.custoS)}</td>
        <td class="right" style="color:var(--green)">${r.qtdE > 0 ? r.qtdE : '—'}</td>
        <td class="right" style="color:var(--green)">${fmt(r.custoE)}</td>
        <td class="right" style="font-weight:700;color:${r.saldo > 0 ? 'var(--red)' : r.saldo < 0 ? 'var(--green)' : 'var(--text-muted)'}">${r.saldo !== 0 ? (r.saldo > 0 ? '-' : '+') + fmt(r.saldo) : '—'}</td>
        <td class="right" style="font-weight:600;color:${est===null?'var(--text-muted)':est<=0?'var(--red)':est<=5?'var(--orange)':'var(--green)'}">${est===null?'—':est.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:1})}</td>
      </tr>`;
    }).join('');
  }
};

// ══════════════════════════════════════════
// ENTREGAS — Departamento Garantia (página)
// ══════════════════════════════════════════
const astEntregas = {
  _dados: [],
  async carregar() {
    const tbody = document.getElementById('ast-ent-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr class="ast-loading"><td colspan="7">Carregando...</td></tr>';

    const mesesAtras = parseInt(document.getElementById('ast-ent-mes')?.value||'0');
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAtras, 1);
    const inicioStr = inicio.toISOString().slice(0,10);

    try {
      // Busca NFs do ERP apenas dos vendedores do departamento GARANTIA
      // Jessica Marques (49766) · Victor Hugo (69722) · Dayllon Euclides (84986)
      const VENDEDORES_GARANTIA = [49766, 69722, 84986];
      const { data } = await window.sb
        .from('vw_comercial_docs_faturados')
        .select('id,id_doc,num_nf,data_faturamento,id_cliente,nome_cliente,nome_transportadora,valor_frete,faturamento_doc,id_vendedor')
        .in('id_vendedor', VENDEDORES_GARANTIA)
        .gte('data_faturamento', inicioStr)
        .order('data_faturamento',{ascending:false})
        .range(0,999);

      // Dedup por id_doc + só NFs com transportadora
      const seen = new Set();
      const nfsBruto = (data||[]).filter(r => {
        if (seen.has(r.id_doc)) return false;
        seen.add(r.id_doc);
        // Só exibe NFs com transportadora informada (precisam de rastreio)
        return r.nome_transportadora && r.nome_transportadora.trim() !== '';
      });

      this._dados = nfsBruto;

      // Buscar CTes para cruzamento
      let ctesMap = {};
      if (nfsBruto.length) {
        const nums = [...new Set(nfsBruto.map(r=>String(r.num_nf||r.id_doc)).filter(Boolean))];
        try {
          const { data: ctes } = await window.sb.from('frt_conhecimentos')
            .select('id,nome_transportadora,valor_frete_cte,status_auditoria,notas_fiscais')
            .range(0,999);
          (ctes||[]).forEach(cte => {
            const nfs = Array.isArray(cte.notas_fiscais) ? cte.notas_fiscais : [];
            nfs.forEach(nf => {
              const k = String(nf.num_nf||'');
              if (nums.includes(k)) ctesMap[k] = cte;
            });
          });
        } catch(e) {}
      }
      this._ctesMap = ctesMap;
      this.filtrar();
      window.setLastUpdate?.();
    } catch(e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--red)">Erro ao carregar: ${e.message}</td></tr>`;
    }
  },
  async filtrar() {
    const busca      = (document.getElementById('ast-ent-busca')?.value||'').toLowerCase();
    const statusFil  = document.getElementById('ast-ent-status')?.value||'todas';
    const dados      = this._dados || [];
    const ctesMap    = this._ctesMap || {};
    let filtrado = dados;
    if (busca) {
      filtrado = filtrado.filter(r =>
        `${r.nome_cliente||''} ${r.num_nf||''} ${r.id_doc||''} ${r.nome_transportadora||''}`.toLowerCase().includes(busca)
      );
    }
    if (statusFil === 'entregues') {
      filtrado = filtrado.filter(r => {
        const numStr = String(r.num_nf||r.id_doc||'');
        const cte = ctesMap[numStr];
        return cte && cte.status_auditoria === 'ok';
      });
    } else if (statusFil === 'nao_entregues') {
      filtrado = filtrado.filter(r => {
        const numStr = String(r.num_nf||r.id_doc||'');
        const cte = ctesMap[numStr];
        return !cte || cte.status_auditoria !== 'ok';
      });
    }
    this.renderizar(filtrado);
  },
  renderizar(dados) {
    const tbody = document.getElementById('ast-ent-body');
    const count = document.getElementById('ast-ent-count');
    if (!tbody) return;

    // KPIs
    const totalNFs    = dados.length;
    const totalValor  = dados.reduce((s,r)=>s+(parseFloat(r.faturamento_doc)||0),0);
    const totalFrete  = dados.reduce((s,r)=>s+(parseFloat(r.valor_frete)||0),0);
    const clientes    = new Set(dados.map(r=>r.id_cliente).filter(Boolean)).size;
    const fmt = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

    const el = id => document.getElementById(id);
    if(el('ast-ent-k-total'))    el('ast-ent-k-total').textContent    = totalNFs;
    if(el('ast-ent-k-valor'))    el('ast-ent-k-valor').textContent    = fmt(totalValor);
    if(el('ast-ent-k-frete'))    el('ast-ent-k-frete').textContent    = fmt(totalFrete);
    if(el('ast-ent-k-clientes')) el('ast-ent-k-clientes').textContent = clientes;
    if(count) count.textContent = `${totalNFs} registros`;

    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="ast-empty"><div class="ast-empty-ico">🚚</div>Nenhuma NF encontrada no período</div></td></tr>';
      return;
    }

    const ctesMap = this._ctesMap || {};
    tbody.innerHTML = dados.map(r => {
      const numStr = String(r.num_nf||r.id_doc||'');
      const cte = ctesMap[numStr];
      // Rastreamento: semáforo + status legível
      let rastreioHtml;
      if (cte) {
        const st = cte.status_auditoria || 'pendente';
        const cor = st==='ok' ? 'var(--green)' : st==='divergencia' ? 'var(--red)' : 'var(--orange)';
        const ico = st==='ok' ? '✅' : st==='divergencia' ? '⚠️' : '🔄';
        const label = st==='ok' ? 'Entregue' : st==='divergencia' ? 'Divergência' : 'Em trânsito';
        const numCte = cte.num_cte || cte.chave_cte || '';
        const linkRastreio = cte.url_rastreio || (numCte ? `https://www.cte.inf.br/consulta/?chCTe=${numCte}` : '');
        rastreioHtml = `<div style="display:flex;flex-direction:column;gap:2px">
          <span style="font-size:12px;font-weight:600;color:${cor}">${ico} ${label}</span>
          <span style="font-size:11px;color:var(--text-muted)">${cte.nome_transportadora||'—'} ${cte.num_cte?'· CTe '+cte.num_cte:''}</span>
          ${cte.valor_frete_cte ? `<span style="font-size:11px;color:var(--orange)">Frete: R$ ${parseFloat(cte.valor_frete_cte).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>` : ''}
          ${linkRastreio ? `<a href="${linkRastreio}" target="_blank" style="font-size:11px;color:var(--blue-mid);text-decoration:none">🔗 Rastrear</a>` : ''}
        </div>`;
      } else {
        rastreioHtml = '<span style="font-size:11px;color:var(--text-muted)">Sem CTe vinculado</span>';
      }
      return `<tr>
        <td class="ast-mono" style="font-weight:600">${r.num_nf||r.id_doc||'—'}</td>
        <td style="white-space:nowrap">${r.data_faturamento?new Date(r.data_faturamento+'T00:00:00').toLocaleDateString('pt-BR'):'—'}</td>
        <td><div style="font-weight:500;font-size:13px">${r.nome_cliente||'—'}</div></td>
        <td style="color:var(--text-muted);font-size:12px">${r.nome_transportadora||'—'}</td>
        <td class="right" style="font-weight:600">${r.faturamento_doc?fmt(parseFloat(r.faturamento_doc)):'—'}</td>
        <td class="right" style="color:var(--orange)">${r.valor_frete&&parseFloat(r.valor_frete)>0?fmt(parseFloat(r.valor_frete)):'—'}</td>
        <td>${rastreioHtml}</td>
      </tr>`;
    }).join('');
  }
};


// ══════════════════════════════════════════
// CÁLCULO DE HORAS ÚTEIS (08–18, seg–sex)
// ══════════════════════════════════════════
function astHorasUteis(dataInicio, dataFim) {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const fim    = dataFim ? new Date(dataFim) : new Date();
  if (fim <= inicio) return 0;

  const HORA_INI = 8, HORA_FIM = 18; // 08:00–18:00
  let horas = 0;
  const cur = new Date(inicio);

  // Avança para o próximo momento útil se necessário
  function proximoMomentoUtil(d) {
    const diaSem = d.getDay(); // 0=dom, 6=sab
    if (diaSem === 0) { d.setDate(d.getDate()+1); d.setHours(HORA_INI,0,0,0); }
    else if (diaSem === 6) { d.setDate(d.getDate()+2); d.setHours(HORA_INI,0,0,0); }
    else if (d.getHours() < HORA_INI) { d.setHours(HORA_INI,0,0,0); }
    else if (d.getHours() >= HORA_FIM) {
      d.setDate(d.getDate()+1); d.setHours(HORA_INI,0,0,0);
      const ds2 = d.getDay();
      if (ds2===0) d.setDate(d.getDate()+1);
      else if (ds2===6) d.setDate(d.getDate()+2);
    }
    return d;
  }

  proximoMomentoUtil(cur);
  if (cur >= fim) return 0;

  while (cur < fim) {
    const diaSem = cur.getDay();
    if (diaSem === 0 || diaSem === 6) { cur.setDate(cur.getDate()+1); cur.setHours(HORA_INI,0,0,0); continue; }
    // Fim do dia útil atual
    const fimDia = new Date(cur); fimDia.setHours(HORA_FIM,0,0,0);
    const limite = fim < fimDia ? fim : fimDia;
    if (cur.getHours() < HORA_FIM) {
      horas += (limite - cur) / 3600000;
    }
    // Próximo dia
    cur.setDate(cur.getDate()+1); cur.setHours(HORA_INI,0,0,0);
  }
  return Math.round(horas * 10) / 10;
}


// ══════════════════════════════════════════
// REDE DE PARCEIROS — ast-parceiros
// ══════════════════════════════════════════
window.astParceiros = {
  _dados: [],
  _filtrados: [],
  _tagAtiva: '',
  _map: null,
  _markers: [],
  _drawerAberto: null,

  async carregar() {
    const mapEl = document.getElementById('ast-par-mapa');
    if (!mapEl) return;

    // Carregar Leaflet se necessário
    if (!window.L) {
      await new Promise(res => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.onload = res;
        document.head.appendChild(s);
      });
    }

    // Buscar dados
    const [{ data: parceiros }, { data: tags }, { data: prods }] = await Promise.all([
      window.sb.from('assist_parceiros').select('*').order('nome').range(0, 9999),
      window.sb.from('assist_parceiro_tags').select('*').eq('ativo', true).order('nome'),
      window.sb.from('assist_parceiro_produtos').select('*').range(0, 9999),
    ]);

    this._dados = (parceiros || []).map(p => ({
      ...p,
      tags: (prods || []).filter(pr => pr.parceiro_id === p.id).map(pr => pr.produto_tag)
    }));
    this._tagsList = tags || [];
    this._filtrados = [...this._dados];

    const count = document.getElementById('ast-par-count');
    if (count) count.textContent = `${this._dados.length} parceiros`;

    this._initMap();
    this.aplicarFiltros();
  },

  _initMap() {
    const el = document.getElementById('ast-par-mapa');
    if (!el || !window.L) return;
    if (this._map) { this._map.remove(); this._map = null; }

    this._map = L.map(el, { zoomControl: true }).setView([-15.5, -48.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }).addTo(this._map);
  },

  _corStatus(status) {
    return { ativo: '#0F9D6E', teste: '#E07B00', suspenso: '#D93025', inativo: '#9AA5B8' }[status] || '#9AA5B8';
  },

  _renderMarkers() {
    if (!this._map || !window.L) return;
    this._markers.forEach(m => m.remove());
    this._markers = [];

    this._filtrados.forEach(p => {
      if (!p.lat || !p.lng) return;
      const cor = this._corStatus(p.status);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${cor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);transition:transform .15s" onmouseover="this.style.transform='scale(1.8)'" onmouseout="this.style.transform=''"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      const tooltip = `<b>${p.nome}</b><br>${p.responsavel||''}<br>${p.telefone||''}<br>${p.cidade||''}${p.cidade&&p.uf?' / ':''}${p.uf||''}`;
      const m = L.marker([p.lat, p.lng], { icon })
        .addTo(this._map)
        .bindTooltip(tooltip, { permanent: false, direction: 'top', offset: [0, -8], className: 'ast-map-tooltip' })
        .on('click', () => this.abrirDrawer(p.id));
      this._markers.push(m);
    });
  },

  filtrarTag(tag, btn) {
    this._tagAtiva = tag;
    document.querySelectorAll('#ast-par-tag-filter .ast-toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.aplicarFiltros();
  },

  aplicarFiltros() {
    const busca  = (document.getElementById('ast-par-busca')?.value || '').toLowerCase();
    const status = document.getElementById('ast-par-status')?.value || '';
    const uf     = document.getElementById('ast-par-uf')?.value || '';
    this._filtrados = this._dados.filter(p => {
      if (status && p.status !== status) return false;
      if (uf && p.uf !== uf) return false;
      if (this._tagAtiva && !p.tags.includes(this._tagAtiva)) return false;
      if (busca && !`${p.nome} ${p.responsavel||''} ${p.cidade||''} ${p.uf||''}`.toLowerCase().includes(busca)) return false;
      return true;
    });
    const count = document.getElementById('ast-par-count');
    if (count) count.textContent = `${this._filtrados.length} parceiros`;
    this._renderMarkers();
    this._renderLista();
  },

  _renderLista() {
    const tbody = document.getElementById('ast-par-lista-tbody');
    const countEl = document.getElementById('ast-par-lista-count');
    if (!tbody) return;
    if (countEl) countEl.textContent = `${this._filtrados.length} parceiros`;
    const statusNome = { ativo:'✅ Ativo', teste:'🧪 Teste', suspenso:'⏸ Suspenso', inativo:'❌ Inativo' };
    const statusCor  = { ativo:'var(--green)', teste:'var(--orange)', suspenso:'var(--red)', inativo:'var(--text-muted)' };
    if (!this._filtrados.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Nenhum parceiro encontrado</td></tr>';
      return;
    }
    tbody.innerHTML = this._filtrados.map(p => `<tr style="cursor:pointer" onclick="astParceiros.abrirDrawer(${p.id})">
      <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.nome}">${p.nome}</td>
      <td style="color:var(--text-secondary);font-size:12px">${p.responsavel||'—'}</td>
      <td style="font-family:monospace;font-size:11px">${p.telefone||'—'}</td>
      <td style="font-size:12px;color:var(--text-secondary)">${p.cidade||'—'}</td>
      <td style="font-size:12px;font-weight:700;color:var(--blue-mid)">${p.uf||'—'}</td>
      <td style="white-space:nowrap">${[1,2,3,4,5].map(n=>`<span style="font-size:14px;color:${(p.avaliacao||0)>=n?'#E07B00':'#D1D9E8'}">★</span>`).join('')}</td>
      <td><span style="font-size:11px;font-weight:600;color:${statusCor[p.status]||'var(--text-muted)'}">${statusNome[p.status]||p.status}</span></td>
      <td style="font-size:11px">${p.tags.map(t=>`<span class="ast-par-tag">${t}</span>`).join('')||'—'}</td>
    </tr>`).join('');
  },

  async abrirDrawer(id) {
    const p = this._dados.find(r => r.id === id);
    if (!p) return;
    this._drawerAberto = id;

    // Buscar followups e docs
    const [{ data: fups }, { data: docs }] = await Promise.all([
      window.sb.from('assist_parceiro_followups').select('*').eq('parceiro_id', id).order('criado_em', {ascending: false}).range(0, 50),
      window.sb.from('assist_parceiro_docs').select('*').eq('parceiro_id', id).order('criado_em', {ascending: false}).range(0, 50),
    ]);

    const statusCor = { ativo: 'var(--green)', teste: 'var(--orange)', suspenso: 'var(--red)', inativo: 'var(--text-muted)' };
    const statusNome = { ativo: 'Ativo', teste: 'Em teste', suspenso: 'Suspenso', inativo: 'Inativo' };
    const tagHtml = p.tags.length
      ? p.tags.map(t => `<span class="ast-par-tag">${t}</span>`).join('')
      : '<span style="color:var(--text-muted);font-size:12px">Nenhuma tag</span>';

    const fmtDate = d => d ? new Date(d).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';
    const fmt = d => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

    const fupsHtml = (fups||[]).length
      ? (fups||[]).map(f => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:11px;font-weight:600;color:var(--blue-mid)">${f.tipo||'Contato'}</span>
            <span style="font-size:10px;color:var(--text-muted)">${fmtDate(f.criado_em)} · ${f.usuario_nome||'—'}</span>
          </div>
          <div style="font-size:13px">${f.mensagem}</div>
        </div>`).join('')
      : '<div style="color:var(--text-muted);font-size:13px;padding:10px 0">Nenhum acompanhamento</div>';

    const docsHtml = (docs||[]).length
      ? (docs||[]).map(d => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.nome_doc}</div>
            <div style="font-size:11px;color:var(--text-muted)">${d.tipo||'documento'} · ${fmt(d.criado_em)}${d.tamanho_bytes?` · ${(d.tamanho_bytes/1024).toFixed(0)}KB`:''}</div>
          </div>
          <div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">
            ${d.storage_path ? `<button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astParceiros.downloadDoc('${d.storage_path}','${d.nome_doc}')">⬇ Baixar</button>` : d.url ? `<a href="${d.url}" target="_blank" class="ast-btn ast-btn-secondary ast-btn-sm">↗ Abrir</a>` : ''}
            <button class="ast-btn ast-btn-sm" style="background:var(--red-bg);color:var(--red)" onclick="astParceiros.excluirDoc(${d.id},'${d.storage_path||''}',${id})">🗑</button>
          </div>
        </div>`).join('')
      : '<div style="color:var(--text-muted);font-size:13px;padding:10px 0">Nenhum documento</div>';

    // Tags disponíveis para marcar
    const tagsDispHtml = this._tagsList.map(t => {
      const marcada = p.tags.includes(t.nome);
      return `<label style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;margin:3px;padding:4px 12px;border-radius:20px;border:1px solid ${marcada?'var(--blue-mid)':'var(--border)'};font-size:12px;font-weight:${marcada?'600':'400'};background:${marcada?'var(--blue-pale)':'var(--surface2)'};transition:all .15s" onclick="astParceiros.toggleTagClick(${id},'${t.nome}',this)">
        ${marcada?'✅ ':'⬜ '}${t.nome}
      </label>`;
    }).join('');

    const html = `
      <div class="ast-drawer-header">
        <div>
          <div class="ast-drawer-title">${p.nome}</div>
          <div class="ast-drawer-sub" style="display:flex;align-items:center;gap:8px">
            <span style="font-weight:600;color:${statusCor[p.status]||'var(--text-muted)'}">${statusNome[p.status]||p.status}</span>
            ${p.cidade||p.uf ? `<span>·</span><span>${p.cidade||''}${p.cidade&&p.uf?' / ':''}${p.uf||''}</span>` : ''}
          </div>
        </div>
        <button class="ast-drawer-close" onclick="astParceiros.fecharDrawer()">✕</button>
      </div>
      <div class="ast-drawer-body">

        <!-- DADOS -->
        <div class="ast-drw-section">
          <div class="ast-drw-section-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>Dados</span>
            <div style="display:flex;align-items:center;gap:10px">
              <div id="ast-par-stars-${id}" style="display:flex;gap:1px">${this._starsHtml(id, p.avaliacao, '22px')}</div>
              <select class="ast-select" style="height:26px;font-size:11px" onchange="astParceiros.alterarStatus(${id},this.value)">
                <option value="ativo" ${p.status==='ativo'?'selected':''}>✅ Ativo</option>
                <option value="teste" ${p.status==='teste'?'selected':''}>🧪 Em teste</option>
                <option value="suspenso" ${p.status==='suspenso'?'selected':''}>⏸ Suspenso</option>
                <option value="inativo" ${p.status==='inativo'?'selected':''}>❌ Inativo</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">NOME</label>
              <input class="ast-form-input" id="par-f-nome-${id}" value="${p.nome||''}" placeholder="Nome do parceiro" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">RESPONSÁVEL</label>
              <input class="ast-form-input" id="par-f-resp-${id}" value="${p.responsavel||''}" placeholder="Nome" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">CNPJ</label>
              <input class="ast-form-input" id="par-f-cnpj-${id}" value="${p.cnpj||''}" placeholder="00.000.000/0001-00" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">TELEFONE</label>
              <input class="ast-form-input" id="par-f-tel-${id}" value="${p.telefone||''}" placeholder="(00) 00000-0000" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">WHATSAPP</label>
              <div style="display:flex;gap:4px">
                <input class="ast-form-input" id="par-f-whats-${id}" value="${p.whatsapp||''}" placeholder="(00) 00000-0000" style="flex:1">
                ${p.whatsapp?`<a href="https://wa.me/${(p.whatsapp||'').replace(/\D/g,'')}" target="_blank" class="ast-btn ast-btn-sm" style="background:#25D366;color:#fff;flex-shrink:0">📱</a>`:''}
              </div></div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">EMAIL</label>
              <input class="ast-form-input" id="par-f-email-${id}" value="${p.email||''}" placeholder="email@empresa.com" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">CEP <span style="font-weight:400;color:var(--text-muted)">(preenche cidade/UF/coords)</span></label>
              <div style="display:flex;gap:4px">
                <input class="ast-form-input" id="par-f-cep-${id}" value="${p.cep||''}" placeholder="00000-000" style="flex:1"
                  onblur="astParceiros.buscarCep(${id})">
                <button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astParceiros.buscarCep(${id})">🔍</button>
              </div></div>
            <div style="display:flex;gap:6px">
              <div style="flex:1"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">CIDADE</label>
                <input class="ast-form-input" id="par-f-cidade-${id}" value="${p.cidade||''}" placeholder="Cidade" style="width:100%"
                  onblur="astParceiros.geocodificarCidadeUF(${id})"></div>
              <div style="width:64px"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">UF</label>
                <input class="ast-form-input" id="par-f-uf-${id}" value="${p.uf||''}" placeholder="SP" maxlength="2" style="width:100%;text-transform:uppercase"
                  onblur="astParceiros.geocodificarCidadeUF(${id})"></div>
            </div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">ENDEREÇO</label>
              <input class="ast-form-input" id="par-f-end-${id}" value="${p.endereco||''}" placeholder="Rua, nº, bairro" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">RAIO ATENDIMENTO (km)</label>
              <input class="ast-form-input" id="par-f-raio-${id}" value="${p.raio_km||''}" placeholder="100" type="number" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">COORDS <span id="par-f-coords-label-${id}" style="font-weight:400">${p.lat?`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`:'não definida'}</span></label>
              <div id="par-f-geo-status-${id}" style="font-size:11px;color:var(--text-muted)"></div></div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">OBSERVAÇÃO</label>
              <textarea class="ast-form-input" id="par-f-obs-${id}" placeholder="Observações..." rows="2" style="width:100%;resize:vertical">${p.observacao||''}</textarea></div>
          </div>
          <button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astParceiros.salvarDados(${id})" style="width:100%">💾 Salvar dados</button>
        </div>

        <!-- PRODUTOS -->
        <div class="ast-drw-section">
          <div class="ast-drw-section-title">Produtos atendidos</div>
          <div style="margin-bottom:8px">${tagHtml}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${tagsDispHtml}</div>
        </div>

        <!-- FOLLOWUPS -->
        <div class="ast-drw-section">
          <div class="ast-drw-section-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>Acompanhamento</span>
          </div>
          <div style="margin-bottom:12px">
            <div style="display:flex;gap:6px;margin-bottom:6px">
              <select id="ast-par-fup-tipo-${id}" class="ast-select" style="height:32px;font-size:12px;flex:1">
                <option>Contato</option>
                <option>Visita</option>
                <option>Negociação</option>
                <option>Problema</option>
                <option>Elogio</option>
                <option>Outros</option>
              </select>
            </div>
            <textarea id="ast-par-fup-msg-${id}" class="ast-form-input" placeholder="O que foi feito ou combinado..." rows="2" style="width:100%;resize:vertical;font-size:13px"></textarea>
            <button class="ast-btn ast-btn-primary ast-btn-sm" style="margin-top:6px" onclick="astParceiros.salvarFup(${id})">Registrar</button>
          </div>
          <div id="ast-par-fups-${id}">${fupsHtml}</div>
        </div>

        <!-- DOCUMENTOS -->
        <div class="ast-drw-section">
          <div class="ast-drw-section-title">Documentos</div>
          <div style="margin-bottom:10px">
            <label style="display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;gap:6px;align-items:center">
                <input id="ast-par-doc-nome-${id}" class="ast-form-input" placeholder="Nome do documento" style="flex:1">
                <select id="ast-par-doc-tipo-${id}" class="ast-select" style="height:32px;font-size:12px;width:120px">
                  <option value="documento">📄 Documento</option>
                  <option value="contrato">📝 Contrato</option>
                  <option value="laudo">🔍 Laudo</option>
                  <option value="foto">📷 Foto</option>
                  <option value="outros">📎 Outros</option>
                </select>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <label style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 12px;border:2px dashed var(--border);border-radius:var(--radius-sm);cursor:pointer;background:var(--surface2);font-size:12px;color:var(--text-muted)" 
                  onmouseover="this.style.borderColor='var(--blue-mid)'" onmouseout="this.style.borderColor='var(--border)'">
                  <span style="font-size:18px">📎</span>
                  <span id="ast-par-doc-file-label-${id}">Clique para selecionar arquivo (PDF, imagem, Word)</span>
                  <input type="file" id="ast-par-doc-file-${id}" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" style="display:none"
                    onchange="document.getElementById('ast-par-doc-file-label-${id}').textContent=this.files[0]?.name||'Nenhum arquivo'">
                </label>
                <button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astParceiros.uploadDoc(${id})">📤 Upload</button>
              </div>
              <div id="ast-par-doc-progress-${id}" style="display:none;font-size:12px;color:var(--blue-mid)">Enviando...</div>
            </label>
          </div>
          <div id="ast-par-docs-${id}">${docsHtml}</div>
        </div>

      </div>`;

    // Garantir que overlay/drawer existem e têm z-index acima do Leaflet
    if (!document.getElementById('ast-overlay')) {
      const ovlEl = document.createElement('div');
      ovlEl.id = 'ast-overlay'; ovlEl.className = 'ast-overlay';
      ovlEl.style.zIndex = '1001';
      ovlEl.onclick = () => astParceiros.fecharDrawer();
      document.body.appendChild(ovlEl);
      const drwEl = document.createElement('div');
      drwEl.id = 'ast-drawer'; drwEl.className = 'ast-drawer';
      drwEl.style.zIndex = '1002';
      document.body.appendChild(drwEl);
    }
    const drw = document.getElementById('ast-drawer');
    const ovl = document.getElementById('ast-overlay');
    // Forçar z-index acima do Leaflet (que usa ~1000)
    if (drw) { drw.style.zIndex = '1002'; drw.innerHTML = html; drw.classList.add('open'); }
    if (ovl) { ovl.style.zIndex = '1001'; ovl.classList.add('open'); }
  },

  fecharDrawer() {
    this._drawerAberto = null;
    const drw = document.getElementById('ast-drawer');
    const ovl = document.getElementById('ast-overlay');
    if (drw) { drw.classList.remove('open'); drw.style.zIndex = ''; }
    if (ovl) { ovl.classList.remove('open'); ovl.style.zIndex = ''; }
  },

  async toggleTagClick(parceiroId, tag, labelEl) {
    const p = this._dados.find(r => r.id === parceiroId);
    if (!p) return;
    const checked = !p.tags.includes(tag); // inverter estado atual
    await this.toggleTag(parceiroId, tag, checked, labelEl);
  },

  async toggleTag(parceiroId, tag, checked, labelEl) {
    const p = this._dados.find(r => r.id === parceiroId);
    if (!p) return;
    if (checked) {
      // Verificar se já existe antes de inserir
      const { data: exists } = await window.sb.from('assist_parceiro_produtos')
        .select('id').eq('parceiro_id', parceiroId).eq('produto_tag', tag).maybeSingle();
      if (!exists) {
        const { error } = await window.sb.from('assist_parceiro_produtos')
          .insert({ parceiro_id: parceiroId, produto_tag: tag });
        if (error) { console.error('toggleTag insert:', error); return; }
      }
      if (!p.tags.includes(tag)) p.tags.push(tag);
    } else {
      const { error } = await window.sb.from('assist_parceiro_produtos')
        .delete().eq('parceiro_id', parceiroId).eq('produto_tag', tag);
      if (error) { console.error('toggleTag delete:', error); return; }
      p.tags = p.tags.filter(t => t !== tag);
    }
    // Atualizar visual do label
    const p2 = this._dados.find(r => r.id === parceiroId);
    const el = labelEl || document.querySelector(`[onclick*="toggleTagClick(${parceiroId},'${tag}')"]`);
    if (el && p2) {
      const marcada = p2.tags.includes(tag);
      el.style.background = marcada ? 'var(--blue-pale)' : 'var(--surface2)';
      el.style.border     = `1px solid ${marcada ? 'var(--blue-mid)' : 'var(--border)'}`;
      el.style.fontWeight = marcada ? '600' : '400';
      el.textContent      = (marcada ? '✅ ' : '⬜ ') + tag;
    }
  },

  async alterarStatus(id, novoStatus) {
    await window.sb.from('assist_parceiros').update({ status: novoStatus, atualizado_em: new Date().toISOString() }).eq('id', id);
    const p = this._dados.find(r => r.id === id);
    if (p) { p.status = novoStatus; this._renderMarkers(); }
  },

  async salvarFup(id) {
    const tipo = document.getElementById(`ast-par-fup-tipo-${id}`)?.value;
    const msg  = document.getElementById(`ast-par-fup-msg-${id}`)?.value?.trim();
    if (!msg) return;
    const usuario = window.getUsuario?.()?.nome || 'Sistema';
    await window.sb.from('assist_parceiro_followups').insert({ parceiro_id: id, tipo, mensagem: msg, usuario_nome: usuario });
    const msgEl = document.getElementById(`ast-par-fup-msg-${id}`);
    if (msgEl) msgEl.value = '';
    // Recarregar followups inline sem fechar o drawer
    const fupsEl = document.getElementById(`ast-par-fups-${id}`);
    if (fupsEl) {
      const { data: fups2 } = await window.sb.from('assist_parceiro_followups')
        .select('*').eq('parceiro_id', id).order('criado_em', {ascending: false}).range(0, 50);
      const fmtDate = d => d ? new Date(d).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';
      fupsEl.innerHTML = (fups2||[]).length
        ? (fups2||[]).map(f => `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span style="font-size:11px;font-weight:600;color:var(--blue-mid)">${f.tipo||'Contato'}</span>
              <span style="font-size:10px;color:var(--text-muted)">${fmtDate(f.criado_em)} · ${f.usuario_nome||'—'}</span>
            </div>
            <div style="font-size:13px">${f.mensagem}</div>
          </div>`).join('')
        : '<div style="color:var(--text-muted);font-size:13px;padding:10px 0">Nenhum acompanhamento</div>';
    }
  },


  _starsHtml(id, avaliacao, size='18px') {
    return [1,2,3,4,5].map(n =>
      `<span data-star="${n}"
        onclick="astParceiros.avaliar(${id},${n})"
        onmouseover="astParceiros.hoverStar(${id},${n})"
        onmouseout="astParceiros.hoverStar(${id},0)"
        style="font-size:${size};color:${(avaliacao||0)>=n?'#E07B00':'#D1D9E8'};cursor:pointer;line-height:1;transition:color .1s">★</span>`
    ).join('')
  },

  async avaliar(id, nota) {
    await window.sb.from('assist_parceiros').update({ avaliacao: nota, atualizado_em: new Date().toISOString() }).eq('id', id);
    const p = this._dados.find(r => r.id === id);
    if (p) { p.avaliacao = nota; }
    // Atualizar visual das estrelas
    const stars = document.querySelectorAll(`#ast-par-stars-${id} span`);
    stars.forEach((s, i) => { s.style.color = i < nota ? '#E07B00' : '#E2E8F2'; });
  },

  hoverStar(id, nota) {
    const stars = document.querySelectorAll(`#ast-par-stars-${id} span`);
    const p = this._dados.find(r => r.id === id);
    const atual = nota > 0 ? nota : (p?.avaliacao || 0);
    stars.forEach((s, i) => { s.style.color = i < atual ? '#E07B00' : '#D1D9E8'; });
  },

  async uploadDoc(id) {
    const nome     = document.getElementById(`ast-par-doc-nome-${id}`)?.value?.trim();
    const tipo     = document.getElementById(`ast-par-doc-tipo-${id}`)?.value || 'documento';
    const fileInput = document.getElementById(`ast-par-doc-file-${id}`);
    const file     = fileInput?.files?.[0];
    const progEl   = document.getElementById(`ast-par-doc-progress-${id}`);

    if (!file) { alert('Selecione um arquivo'); return; }
    const nomeDoc = nome || file.name;

    if (progEl) { progEl.style.display = 'block'; progEl.textContent = 'Enviando...'; }

    const path = `parceiro-${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;

    const { error: upErr } = await window.sb.storage.from('assist-parceiros-docs').upload(path, file, {
      contentType: file.type,
      upsert: false
    });

    if (upErr) {
      if (progEl) progEl.style.display = 'none';
      alert('Erro no upload: ' + upErr.message);
      return;
    }

    const usuario = window.getUsuario?.()?.nome || 'Sistema';
    await window.sb.from('assist_parceiro_docs').insert({
      parceiro_id: id,
      nome_doc: nomeDoc,
      tipo,
      storage_path: path,
      tamanho_bytes: file.size,
      mime_type: file.type,
      criado_por: usuario
    });

    if (progEl) progEl.style.display = 'none';
    if (fileInput) { fileInput.value = ''; document.getElementById(`ast-par-doc-file-label-${id}`).textContent = 'Clique para selecionar arquivo'; }
    if (document.getElementById(`ast-par-doc-nome-${id}`)) document.getElementById(`ast-par-doc-nome-${id}`).value = '';
    this.abrirDrawer(id);
  },

  async downloadDoc(path, nome) {
    const { data, error } = await window.sb.storage.from('assist-parceiros-docs').download(path);
    if (error) { alert('Erro ao baixar: ' + error.message); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url; a.download = nome; a.click();
    URL.revokeObjectURL(url);
  },

  async excluirDoc(docId, storagePath, parceiroId) {
    if (!confirm('Excluir este documento?')) return;
    if (storagePath) await window.sb.storage.from('assist-parceiros-docs').remove([storagePath]);
    await window.sb.from('assist_parceiro_docs').delete().eq('id', docId);
    this.abrirDrawer(parceiroId);
  },

  async salvarDados(id) {
    const g = f => document.getElementById(`par-f-${f}-${id}`)?.value?.trim();
    // Verificar se nome foi alterado
    const nomeInput = document.getElementById(`par-f-nome-${id}`);
    const payload = {
      ...(nomeInput && nomeInput.value.trim() ? { nome: nomeInput.value.trim() } : {}),
      responsavel: g('resp') || null,
      cnpj:        g('cnpj') || null,
      telefone:    g('tel')  || null,
      whatsapp:    g('whats')|| null,
      email:       g('email')|| null,
      cep:         g('cep')  || null,
      cidade:      g('cidade')|| null,
      uf:          (g('uf')||'').toUpperCase() || null,
      endereco:    g('end')  || null,
      raio_km:     parseInt(g('raio')) || null,
      observacao:  g('obs')  || null,
      atualizado_em: new Date().toISOString()
    };
    const { error } = await window.sb.from('assist_parceiros').update(payload).eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    // Atualizar local
    const p = this._dados.find(r => r.id === id);
    if (p) Object.assign(p, payload);
    this._renderMarkers();
    this._renderLista();
    // Feedback visual
    const btn = document.querySelector(`button[onclick="astParceiros.salvarDados(${id})"]`);
    if (btn) { btn.textContent = '✅ Salvo!'; btn.style.background = 'var(--green)'; setTimeout(()=>{ btn.textContent = '💾 Salvar dados'; btn.style.background = ''; }, 2000); }
  },

  async buscarCep(id) {
    const cep = document.getElementById(`par-f-cep-${id}`)?.value?.replace(/\D/g,'');
    if (!cep || cep.length < 8) return;
    const statusEl = document.getElementById(`par-f-geo-status-${id}`);
    if (statusEl) statusEl.textContent = 'Buscando CEP...';
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) { if (statusEl) statusEl.textContent = 'CEP não encontrado'; return; }
      const cidadeEl = document.getElementById(`par-f-cidade-${id}`);
      const ufEl     = document.getElementById(`par-f-uf-${id}`);
      const endEl    = document.getElementById(`par-f-end-${id}`);
      if (cidadeEl && !cidadeEl.value) cidadeEl.value = d.localidade || '';
      if (ufEl     && !ufEl.value)     ufEl.value     = d.uf || '';
      if (endEl    && !endEl.value && d.logradouro) endEl.value = d.logradouro + (d.bairro ? ', ' + d.bairro : '');
      // Geocodificar
      await this.geocodificarCidadeUF(id);
    } catch(e) {
      if (statusEl) statusEl.textContent = 'Erro ao buscar CEP';
    }
  },

  async geocodificarCidadeUF(id) {
    const cidade = document.getElementById(`par-f-cidade-${id}`)?.value?.trim();
    const uf     = document.getElementById(`par-f-uf-${id}`)?.value?.trim();
    if (!cidade || !uf) return;
    const statusEl = document.getElementById(`par-f-geo-status-${id}`);
    const labelEl  = document.getElementById(`par-f-coords-label-${id}`);
    if (statusEl) statusEl.textContent = '🔍 Buscando localização...';
    try {
      const query = encodeURIComponent(`${cidade}, ${uf}, Brasil`);
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await r.json();
      if (!data.length) { if (statusEl) statusEl.textContent = 'Localização não encontrada'; return; }
      const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
      // Atualizar no banco imediatamente
      await window.sb.from('assist_parceiros').update({ lat, lng, atualizado_em: new Date().toISOString() }).eq('id', id);
      const p = this._dados.find(r => r.id === id);
      if (p) { p.lat = lat; p.lng = lng; }
      if (labelEl) labelEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      if (statusEl) statusEl.textContent = '✅ Localização definida';
      this._renderMarkers();
    } catch(e) {
      if (statusEl) statusEl.textContent = 'Erro ao geocodificar';
    }
  },

  abrirNovo() {
    const drw = document.getElementById('ast-drawer');
    const ovl = document.getElementById('ast-overlay');
    if (!drw || !ovl) return;

    const html = `
      <div class="ast-drawer-header">
        <div>
          <div class="ast-drawer-title">Novo Parceiro</div>
          <div class="ast-drawer-sub">Preencha os dados do parceiro</div>
        </div>
        <button class="ast-drawer-close" onclick="astParceiros.fecharDrawer()">✕</button>
      </div>
      <div class="ast-drawer-body">
        <div class="ast-drw-section">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">NOME *</label>
              <input class="ast-form-input" id="novo-par-nome" placeholder="Nome da empresa ou responsável" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">RESPONSÁVEL</label>
              <input class="ast-form-input" id="novo-par-resp" placeholder="Nome do contato" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">CNPJ / CPF</label>
              <input class="ast-form-input" id="novo-par-cnpj" placeholder="00.000.000/0001-00" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">TELEFONE</label>
              <input class="ast-form-input" id="novo-par-tel" placeholder="(00) 00000-0000" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">WHATSAPP</label>
              <input class="ast-form-input" id="novo-par-whats" placeholder="(00) 00000-0000" style="width:100%"></div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">EMAIL</label>
              <input class="ast-form-input" id="novo-par-email" placeholder="email@empresa.com" style="width:100%"></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">CEP <span style="font-weight:400">(recomendado)</span></label>
              <div style="display:flex;gap:4px">
                <input class="ast-form-input" id="novo-par-cep" placeholder="00000-000" style="flex:1" onblur="astParceiros.buscarCepNovo()">
                <button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astParceiros.buscarCepNovo()">🔍</button>
              </div></div>
            <div style="display:flex;gap:6px">
              <div style="flex:1"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">CIDADE *</label>
                <input class="ast-form-input" id="novo-par-cidade" placeholder="Cidade" style="width:100%" onblur="astParceiros.geocodificarNovo()"></div>
              <div style="width:64px"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">UF *</label>
                <input class="ast-form-input" id="novo-par-uf" placeholder="SP" maxlength="2" style="width:100%;text-transform:uppercase" onblur="astParceiros.geocodificarNovo()"></div>
            </div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">ENDEREÇO</label>
              <input class="ast-form-input" id="novo-par-end" placeholder="Rua, nº, bairro" style="width:100%"></div>
            <div style="grid-column:span 2;background:var(--surface2);border-radius:var(--radius-sm);padding:8px 12px;font-size:12px">
              📍 <span id="novo-par-coords-label" style="color:var(--text-muted)">Localização será detectada automaticamente pelo CEP ou Cidade/UF</span>
              <div id="novo-par-geo-status" style="font-size:11px;color:var(--blue-mid);margin-top:2px"></div>
            </div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">STATUS</label>
              <select class="ast-select" id="novo-par-status" style="width:100%">
                <option value="ativo">✅ Ativo</option>
                <option value="teste" selected>🧪 Em teste</option>
                <option value="suspenso">⏸ Suspenso</option>
                <option value="inativo">❌ Inativo</option>
              </select></div>
            <div><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">RAIO ATENDIMENTO (km)</label>
              <input class="ast-form-input" id="novo-par-raio" placeholder="100" type="number" style="width:100%"></div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">PRODUTOS</label>
              <div style="display:flex;flex-wrap:wrap;gap:6px" id="novo-par-tags">
                ${(this._tagsList||[]).map(t=>`<label style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;padding:4px 10px;border-radius:20px;border:1px solid var(--border);font-size:12px">
                  <input type="checkbox" value="${t.nome}" style="accent-color:var(--blue-mid)"> ${t.nome}
                </label>`).join('')}
              </div></div>
            <div style="grid-column:span 2"><label style="font-size:11px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:3px">OBSERVAÇÃO</label>
              <textarea class="ast-form-input" id="novo-par-obs" placeholder="Observações..." rows="2" style="width:100%;resize:vertical"></textarea></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="ast-btn ast-btn-primary" style="flex:1" onclick="astParceiros.confirmarNovo()">✅ Cadastrar parceiro</button>
            <button class="ast-btn ast-btn-secondary" onclick="astParceiros.fecharDrawer()">Cancelar</button>
          </div>
          <div id="novo-par-erro" style="display:none;margin-top:8px;padding:8px;background:var(--red-bg);color:var(--red);border-radius:6px;font-size:12px"></div>
        </div>
      </div>`;

    if (drw) { drw.style.zIndex='1002'; drw.innerHTML = html; drw.classList.add('open'); }
    if (ovl) { ovl.style.zIndex='1001'; ovl.classList.add('open'); }

    // Guardar lat/lng encontradas
    window._novoParLat = null;
    window._novoParLng = null;
  },

  async buscarCepNovo() {
    const cep = document.getElementById('novo-par-cep')?.value?.replace(/\D/g,'');
    if (!cep || cep.length < 8) return;
    const statusEl = document.getElementById('novo-par-geo-status');
    if (statusEl) statusEl.textContent = 'Buscando CEP...';
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (d.erro) { if (statusEl) statusEl.textContent = 'CEP não encontrado'; return; }
      const cidadeEl = document.getElementById('novo-par-cidade');
      const ufEl     = document.getElementById('novo-par-uf');
      const endEl    = document.getElementById('novo-par-end');
      if (cidadeEl) cidadeEl.value = d.localidade || '';
      if (ufEl)     ufEl.value     = d.uf || '';
      if (endEl && d.logradouro) endEl.value = d.logradouro + (d.bairro ? ', ' + d.bairro : '');
      await this.geocodificarNovo();
    } catch(e) {
      if (statusEl) statusEl.textContent = 'Erro ao buscar CEP';
    }
  },

  async geocodificarNovo() {
    const cidade = document.getElementById('novo-par-cidade')?.value?.trim();
    const uf     = document.getElementById('novo-par-uf')?.value?.trim();
    if (!cidade || !uf) return;
    const statusEl = document.getElementById('novo-par-geo-status');
    const labelEl  = document.getElementById('novo-par-coords-label');
    if (statusEl) statusEl.textContent = '🔍 Buscando localização...';
    try {
      const query = encodeURIComponent(`${cidade}, ${uf}, Brasil`);
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await r.json();
      if (!data.length) { if (statusEl) statusEl.textContent = '⚠️ Localização não encontrada — preencha manualmente'; return; }
      window._novoParLat = parseFloat(data[0].lat);
      window._novoParLng = parseFloat(data[0].lon);
      if (labelEl) labelEl.textContent = `📍 ${cidade}/${uf} — ${window._novoParLat.toFixed(4)}, ${window._novoParLng.toFixed(4)}`;
      if (statusEl) statusEl.textContent = '';
    } catch(e) {
      if (statusEl) statusEl.textContent = '⚠️ Erro ao geocodificar';
    }
  },

  async confirmarNovo() {
    const g = id => document.getElementById(id)?.value?.trim();
    const nome = g('novo-par-nome');
    if (!nome) { document.getElementById('novo-par-erro').textContent = 'Nome é obrigatório'; document.getElementById('novo-par-erro').style.display='block'; return; }
    const cidade = g('novo-par-cidade'), uf = g('novo-par-uf');
    if (!cidade || !uf) { document.getElementById('novo-par-erro').textContent = 'Cidade e UF são obrigatórios'; document.getElementById('novo-par-erro').style.display='block'; return; }
    if (!window._novoParLat) await this.geocodificarNovo();

    const payload = {
      nome,
      responsavel: g('novo-par-resp') || null,
      cnpj:        g('novo-par-cnpj') || null,
      telefone:    g('novo-par-tel')  || null,
      whatsapp:    g('novo-par-whats')|| null,
      email:       g('novo-par-email')|| null,
      cep:         g('novo-par-cep')  || null,
      cidade, uf: uf.toUpperCase(),
      endereco:    g('novo-par-end')  || null,
      raio_km:     parseInt(g('novo-par-raio')) || 100,
      status:      g('novo-par-status') || 'teste',
      observacao:  g('novo-par-obs')  || null,
      lat: window._novoParLat || null,
      lng: window._novoParLng || null,
      origem: 'manual'
    };

    const { data, error } = await window.sb.from('assist_parceiros').insert(payload).select('id').single();
    if (error) { document.getElementById('novo-par-erro').textContent = 'Erro: ' + error.message; document.getElementById('novo-par-erro').style.display='block'; return; }

    // Tags selecionadas
    const tagsChecked = [...document.querySelectorAll('#novo-par-tags input:checked')].map(i => i.value);
    if (tagsChecked.length) {
      await window.sb.from('assist_parceiro_produtos').insert(tagsChecked.map(t => ({ parceiro_id: data.id, produto_tag: t })));
    }

    // Recarregar dados e abrir drawer do novo parceiro
    await this.carregar();
    this.abrirDrawer(data.id);
  }
};

// ══════════════════════════════════════════
// CONFIGURAÇÕES
// ══════════════════════════════════════════
const CFG_TABLES_ATENDIMENTO = [
  {id:'status',      tabela:'assist_status',      titulo:'📋 Status',           extra:'finaliza_chamado', extraCor:true},
  {id:'setores',     tabela:'assist_setores',      titulo:'🏢 Setores'},
  {id:'prioridades', tabela:'assist_prioridades',  titulo:'⚡ Prioridades'},
  {id:'procedencias',tabela:'assist_procedencias', titulo:'✅ Tipos de Resolução'},
  {id:'diagnostico', tabela:null, titulo:'🔍 Diagnóstico', grupo:[
    {id:'defeitos', tabela:'assist_defeitos', titulo:'Defeitos'},
    {id:'causas',   tabela:'assist_causas',   titulo:'Causas'},
  ]},
];
const CFG_TABLES_PARCEIROS = [
  {id:'par-tags', tabela:'assist_parceiro_tags', titulo:'🔧 Produtos atendidos (tags)'},
];

window.astCfgMostrarAba = function(aba, btn) {
  ['atendimento','parceiros','produtos'].forEach(function(a) {
    var el = document.getElementById('ast-cfg-aba-' + a);
    if (el) el.style.display = a === aba ? '' : 'none';
  });
  document.querySelectorAll('#ast-cfg-tabs .ast-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  if (aba === 'produtos') astLoadProdutos();
};

function _renderCfgItem(c, r) {
  var cor = r.cor || '#6B7280';
  var ativo = r.ativo !== false;
  var html = '<div class="ast-cfg-item" id="cfg-item-' + c.id + '-' + r.id + '">';
  if (c.extraCor) html += '<div style="width:18px;height:18px;border-radius:4px;background:' + cor + ';flex-shrink:0;border:1px solid var(--border);cursor:pointer" onclick="astCfgEditarCor(\'' + c.tabela + '\',' + r.id + ',\'' + cor + '\',this)"></div>';
  html += '<span class="ast-cfg-name" id="cfg-nm-' + c.id + '-' + r.id + '">' + r.nome + '</span>';
  if (c.extra === 'finaliza_chamado' && r.finaliza_chamado) html += '<span style="font-size:10px;background:var(--green-bg);color:var(--green);padding:1px 5px;border-radius:8px;font-weight:600">Finaliza</span>';
  if (c.extraCor && r.sla_horas) html += '<span style="font-size:10px;background:var(--blue-pale);color:var(--blue-mid);padding:1px 6px;border-radius:8px;font-weight:600">⏱️ ' + r.sla_horas + 'h</span>';
  html += '<span class="ast-badge ' + (ativo ? 'ast-badge-concluido' : 'ast-badge-cancelado') + '" style="font-size:10px">' + (ativo ? 'Ativo' : 'Inativo') + '</span>';
  html += '<div style="display:flex;gap:3px">';
  html += '<button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astCfgEditar(\'' + c.id + '\',' + r.id + ',\'' + c.tabela + '\',\'' + r.nome.replace(/'/g, '\\\'') + '\')">✏️</button>';
  if (c.extraCor) html += '<button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astCfgEditarSLA(\'' + c.tabela + '\',' + r.id + ',' + (r.sla_horas || 0) + ')">⏱️</button>';
  html += '<button class="ast-btn ' + (ativo ? 'ast-btn-danger' : 'ast-btn-success') + ' ast-btn-sm" onclick="astCfgToggle(\'' + c.tabela + '\',' + r.id + ',' + (!ativo) + ')">' + (ativo ? '🚫' : '✅') + '</button>';
  html += '</div></div>';
  return html;
}

function _renderCfgCard(c, rows) {
  var items = rows.map(function(r) { return _renderCfgItem(c, r); }).join('');
  return '<div class="ast-cfg-card">'
    + '<div class="ast-cfg-title">' + c.titulo + '<span style="font-size:11px;color:var(--text-muted);font-weight:400">' + rows.length + ' itens</span></div>'
    + (items || '<div style="color:var(--text-muted);font-size:12px;padding:6px 0">Nenhum item</div>')
    + '<div class="ast-cfg-add">'
    + '<input class="ast-cfg-input" id="cfg-new-' + c.id + '" placeholder="Novo item..." onkeydown="if(event.key===\'Enter\')astCfgAdicionar(\'' + c.tabela + '\',\'' + c.id + '\')">'
    + '<button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astCfgAdicionar(\'' + c.tabela + '\',\'' + c.id + '\')">+ Add</button>'
    + '</div></div>';
}

async function astLoadConfig() {
  var grid    = document.getElementById('ast-cfg-grid');
  var gridPar = document.getElementById('ast-cfg-grid-parceiros');
  if (!grid && !gridPar) return;
  if (grid)    grid.innerHTML    = '<div style="color:var(--text-muted);font-size:13px">Carregando...</div>';
  if (gridPar) gridPar.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Carregando...</div>';

  var tabelasAtend = CFG_TABLES_ATENDIMENTO
    .flatMap(function(c) { return c.grupo ? c.grupo.map(function(g) { return g.tabela; }) : (c.tabela ? [c.tabela] : []); });
  var tabelasPar   = CFG_TABLES_PARCEIROS.map(function(c) { return c.tabela; });
  var todasTabelas = [...new Set([...tabelasAtend, ...tabelasPar])];

  var resultMap = {};
  await Promise.all(todasTabelas.map(async function(tabela) {
    try {
      var r = await window.sb.from(tabela).select('*').order('nome').range(0,999);
      resultMap[tabela] = r.data || [];
    } catch(e) { resultMap[tabela] = []; }
  }));

  if (grid) {
    grid.innerHTML = CFG_TABLES_ATENDIMENTO.map(function(c) {
      if (c.grupo) {
        var subHtml = c.grupo.map(function(g) {
          var items = (resultMap[g.tabela]||[]).map(function(r) { return _renderCfgItem(g, r); }).join('');
          return '<div style="margin-bottom:4px">'
            + '<div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">' + g.titulo + '</div>'
            + (items || '<div style="color:var(--text-muted);font-size:12px">Nenhum item</div>')
            + '<div class="ast-cfg-add" style="margin-top:8px">'
            + '<input class="ast-cfg-input" id="cfg-new-' + g.id + '" placeholder="Novo ' + g.titulo.toLowerCase() + '..." onkeydown="if(event.key===\'Enter\')astCfgAdicionar(\'' + g.tabela + '\',\'' + g.id + '\')">'
            + '<button class="ast-btn ast-btn-primary ast-btn-sm" onclick="astCfgAdicionar(\'' + g.tabela + '\',\'' + g.id + '\')">+ Add</button>'
            + '</div></div>';
        }).join('<hr style="border:none;border-top:1px solid var(--border);margin:12px 0">');
        return '<div class="ast-cfg-card"><div class="ast-cfg-title">' + c.titulo + '</div>' + subHtml + '</div>';
      }
      return _renderCfgCard(c, resultMap[c.tabela]||[]);
    }).join('');
  }

  if (gridPar) {
    gridPar.innerHTML = CFG_TABLES_PARCEIROS.map(function(c) { return _renderCfgCard(c, resultMap[c.tabela]||[]); }).join('');
  }

  window.setLastUpdate && window.setLastUpdate();
}

window.astCfgAdicionar = async function(tabela, cfgId) {
  var input = document.getElementById('cfg-new-' + cfgId);
  var nome = input && input.value.trim(); if (!nome) return;
  var res = await window.sb.from(tabela).insert({nome: nome, ativo: true});
  if (res.error) { alert('Erro: ' + res.error.message); return; }
  input.value = ''; astInvalidarLookups(); await astLoadConfig();
};
window.astCfgToggle = async function(tabela, id, novoAtivo) {
  await window.sb.from(tabela).update({ativo: novoAtivo, atualizado_em: new Date().toISOString()}).eq('id', id);
  astInvalidarLookups(); await astLoadConfig();
};
window.astCfgEditar = function(cfgId, rowId, tabela, nomeAtual) {
  var el = document.getElementById('cfg-nm-' + cfgId + '-' + rowId); if (!el) return;
  el.innerHTML = '<input class="ast-cfg-input" style="width:100%;max-width:150px" value="' + nomeAtual + '" id="cfg-edit-' + cfgId + '-' + rowId + '" onkeydown="if(event.key===\'Enter\')astCfgSalvarEdit(\'' + tabela + '\',\'' + cfgId + '\',' + rowId + ');if(event.key===\'Escape\')astLoadConfig()">'
    + '<button class="ast-btn ast-btn-success ast-btn-sm" style="margin-left:4px" onclick="astCfgSalvarEdit(\'' + tabela + '\',\'' + cfgId + '\',' + rowId + ')">✅</button>'
    + '<button class="ast-btn ast-btn-secondary ast-btn-sm" onclick="astLoadConfig()">✕</button>';
  var inp = document.getElementById('cfg-edit-' + cfgId + '-' + rowId); if (inp) inp.focus();
};
window.astCfgEditarCor = function(tabela, id, corAtual, el) {
  var inp = document.createElement('input');
  inp.type = 'color'; inp.value = corAtual;
  inp.style.cssText = 'position:absolute;opacity:0;pointer-events:none';
  document.body.appendChild(inp); inp.click();
  inp.addEventListener('change', async function() {
    var novaCor = inp.value;
    await window.sb.from(tabela).update({cor: novaCor, atualizado_em: new Date().toISOString()}).eq('id', id);
    el.style.background = novaCor;
    try { document.body.removeChild(inp); } catch(e) {}
    astInvalidarLookups(); await astLoadConfig();
  });
  inp.addEventListener('blur', function() { setTimeout(function() { try { document.body.removeChild(inp); } catch(e) {} }, 500); });
};
window.astCfgEditarSLA = function(tabela, id, slaAtual) {
  var novo = prompt('SLA em horas ÚTEIS (08h-18h, seg-sex)\nDeixe vazio para sem SLA:', slaAtual || '');
  if (novo === null) return;
  var horas = novo.trim() === '' ? null : parseInt(novo);
  if (novo.trim() !== '' && isNaN(horas)) { alert('Digite um número válido'); return; }
  window.sb.from(tabela).update({sla_horas: horas, atualizado_em: new Date().toISOString()}).eq('id', id)
    .then(function() { astInvalidarLookups(); astLoadConfig(); });
};
window.astCfgSalvarEdit = async function(tabela, cfgId, rowId) {
  var el = document.getElementById('cfg-edit-' + cfgId + '-' + rowId);
  var novoNome = el && el.value.trim(); if (!novoNome) return;
  await window.sb.from(tabela).update({nome: novoNome, atualizado_em: new Date().toISOString()}).eq('id', rowId);
  astInvalidarLookups(); await astLoadConfig();
};

// ══════════════════════════════════════════
// ROTEADOR
// ══════════════════════════════════════════
const AST_LOADERS={
  'ast-chamados': astLoadChamados,
  'ast-gestao':   astLoadGestao,
  'ast-entregas': ()=>astEntregas.carregar(),
  'ast-mov-garantia': ()=>astMovGarantia.carregar(),
  'ast-parceiros': ()=>astParceiros.carregar(),
  'ast-config':   astLoadConfig,
};

window.ModuloAssistencia = {
  showPage(pageId, container) {
    _container=container; _pagina=pageId;
    if (!_iniciado) {
      const w=document.createElement('div'); w.id='ast-pages';
      Object.entries(AST_PAGES).forEach(([pid,html])=>{
        const t=document.createElement('div'); t.innerHTML=html;
        if(t.firstElementChild) w.appendChild(t.firstElementChild);
      });
      container.innerHTML=''; container.appendChild(w); _iniciado=true;

    }
    container.querySelectorAll('.ast-page').forEach(p=>p.style.display='none');
    const target=container.querySelector(`#page-${pageId}`);
    if(target)target.style.display='';
    AST_LOADERS[pageId]?.();
  },
  onFiltroChange() {},
  destroy() {
    _iniciado=false; _pagina=null;
    astData=[];astFiltrados=[];astProdAll=[];
    _statusList=[];_setoresList=[];
  }
};

})();
