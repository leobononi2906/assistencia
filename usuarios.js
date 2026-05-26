;(function() {
'use strict';

// ══════════════════════════════════════════
// CSS USUARIOS
// ══════════════════════════════════════════
(function() {
  if (document.getElementById('css-ast-usuarios')) return;
  const s = document.createElement('style');
  s.id = 'css-ast-usuarios';
  s.textContent = `
.usr-page { padding: 20px 24px 32px; max-width: 900px; }
.usr-table-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-sm);overflow:hidden; }
.usr-table-header { padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px; }
.usr-table-title { font-size:13px;font-weight:600;color:var(--text-primary); }
.usr-table { width:100%;border-collapse:collapse;font-size:13px; }
.usr-table thead th { padding:9px 14px;background:var(--surface2);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);text-align:left; }
.usr-table tbody tr { border-top:1px solid var(--border);transition:background .1s; }
.usr-table tbody tr:hover { background:var(--surface2); }
.usr-table tbody td { padding:10px 14px;color:var(--text-primary);vertical-align:middle; }
.usr-badge-admin   { background:#EDE9FE;color:#7C3AED;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px; }
.usr-badge-gestor  { background:#DBEAFE;color:#1D4ED8;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px; }
.usr-badge-tecnico { background:#F0FDF4;color:#15803D;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px; }
.usr-badge-ativo   { background:var(--green-bg);color:var(--green);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px; }
.usr-badge-inativo { background:var(--surface2);color:var(--text-muted);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px; }
.usr-modal-ov { display:none;position:fixed;inset:0;background:rgba(15,29,53,.5);z-index:300;align-items:center;justify-content:center; }
.usr-modal-ov.open { display:flex; }
.usr-modal { background:var(--surface);border-radius:var(--radius);box-shadow:var(--shadow-lg);width:440px;max-width:96vw;overflow:hidden; }
.usr-modal-hdr  { padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between; }
.usr-modal-title{ font-size:15px;font-weight:700;color:var(--text-primary); }
.usr-modal-body { padding:20px 24px; }
.usr-modal-foot { padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px; }
.usr-form-field { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
.usr-form-lbl   { font-size:12px;font-weight:600;color:var(--text-secondary); }
.usr-form-input,.usr-form-select { padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text-primary);background:var(--surface2);outline:none;transition:border-color .15s;width:100%; }
.usr-form-input:focus,.usr-form-select:focus { border-color:var(--blue-mid);background:#fff; }
.usr-form-err { color:var(--red);font-size:12px;margin-top:4px; }
.usr-btn { display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .15s;border:none;white-space:nowrap; }
.usr-btn-primary   { background:var(--blue-dark);color:#fff; }
.usr-btn-primary:hover { background:var(--blue-mid); }
.usr-btn-secondary { background:var(--surface2);color:var(--text-primary);border:1px solid var(--border); }
.usr-btn-secondary:hover { background:var(--border); }
.usr-btn-danger    { background:var(--red-bg);color:var(--red);border:1px solid #FECACA; }
.usr-btn-success   { background:var(--green-bg);color:var(--green);border:1px solid #BBF7D0; }
.usr-btn-sm        { height:26px;padding:0 10px;font-size:11px; }
.usr-btn:disabled  { opacity:.5;cursor:not-allowed; }
  `;
  document.head.appendChild(s);
})();

// ══════════════════════════════════════════
// HTML DA PÁGINA
// ══════════════════════════════════════════
const USR_PAGE_HTML = `
<div class="usr-page" id="page-ast-usuarios">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <div>
      <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Usuários</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Gerencie quem tem acesso ao sistema de assistência</div>
    </div>
    <button class="usr-btn usr-btn-primary" onclick="usrAbrirModal()">+ Novo Usuário</button>
  </div>

  <div class="usr-table-card">
    <div class="usr-table-header">
      <div class="usr-table-title">Usuários cadastrados — <span id="usr-count">—</span></div>
    </div>
    <table class="usr-table">
      <thead><tr>
        <th>Nome</th><th>Usuário</th><th>Perfil</th>
        <th>Status</th><th>Último acesso</th><th style="width:120px"></th>
      </tr></thead>
      <tbody id="usr-tbody">
        <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">Carregando...</td></tr>
      </tbody>
    </table>
  </div>
</div>
`;

// ══════════════════════════════════════════
// ESTADO
// ══════════════════════════════════════════
let _usrIniciado = false;
let _usrData     = [];

// ══════════════════════════════════════════
// CARREGAR USUÁRIOS
// ══════════════════════════════════════════
async function usrLoad() {
  const tbody = document.getElementById('usr-tbody');
  const count = document.getElementById('usr-count');
  if (!tbody) return;

  try {
    const { data, error } = await window.sb.rpc('assistencia_listar_usuarios');
    if (error) throw error;

    _usrData = data || [];
    if (count) count.textContent = `${_usrData.length} usuários`;

    if (!_usrData.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum usuário cadastrado</td></tr>';
      return;
    }

    tbody.innerHTML = _usrData.map(u => `
      <tr>
        <td style="font-weight:500">${u.nome}</td>
        <td style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${u.usuario}</td>
        <td><span class="usr-badge-${(u.perfil||'tecnico').toLowerCase()}">${u.perfil||'tecnico'}</span></td>
        <td>${u.ativo !== false
          ? '<span class="usr-badge-ativo">Ativo</span>'
          : '<span class="usr-badge-inativo">Inativo</span>'}</td>
        <td style="color:var(--text-muted);font-size:12px">${u.ultimo_acesso
          ? new Date(u.ultimo_acesso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
          : '—'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="usr-btn usr-btn-secondary usr-btn-sm" onclick="usrAbrirModal(${u.id})">✏️ Editar</button>
            ${u.ativo !== false
              ? `<button class="usr-btn usr-btn-danger usr-btn-sm" onclick="usrDesativar(${u.id},'${u.nome.replace(/'/g,"\\'")}')">🚫</button>`
              : `<button class="usr-btn usr-btn-success usr-btn-sm" onclick="usrAtivar(${u.id},'${u.nome.replace(/'/g,"\\'")}')">✅</button>`}
          </div>
        </td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);padding:20px">Erro: ${e.message}</td></tr>`;
  }
}

// ══════════════════════════════════════════
// MODAL — CRIAR / EDITAR
// ══════════════════════════════════════════
function usrCriarModal() {
  if (document.getElementById('usr-modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="usr-modal-ov" id="usr-modal-ov">
      <div class="usr-modal" id="usr-modal">
        <div class="usr-modal-hdr">
          <div class="usr-modal-title" id="usr-modal-titulo">Novo Usuário</div>
          <button style="width:32px;height:32px;border:none;background:var(--surface2);border-radius:6px;cursor:pointer;font-size:16px;color:var(--text-muted)"
            onclick="usrFecharModal()">✕</button>
        </div>
        <div class="usr-modal-body">
          <input type="hidden" id="usr-form-id">
          <div class="usr-form-field">
            <label class="usr-form-lbl">Nome completo *</label>
            <input class="usr-form-input" id="usr-form-nome" placeholder="Ex: João Silva">
          </div>
          <div class="usr-form-field">
            <label class="usr-form-lbl">Usuário (login) *</label>
            <input class="usr-form-input" id="usr-form-usuario" placeholder="Ex: joao" autocomplete="off"
              oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9._]/g,'')">
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px">Somente letras minúsculas, números, ponto e underline</div>
          </div>
          <div class="usr-form-field" id="usr-campo-senha">
            <label class="usr-form-lbl" id="usr-senha-lbl">Senha *</label>
            <input class="usr-form-input" id="usr-form-senha" type="password" placeholder="Mínimo 4 caracteres" autocomplete="new-password">
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px" id="usr-senha-hint">Deixe em branco para não alterar a senha</div>
          </div>
          <div class="usr-form-field">
            <label class="usr-form-lbl">Perfil *</label>
            <select class="usr-form-select" id="usr-form-perfil">
              <option value="tecnico">Técnico — acesso operacional</option>
              <option value="gestor">Gestor — acesso completo</option>
              <option value="admin">Admin — acesso completo + usuários</option>
            </select>
          </div>
          <div id="usr-form-err" class="usr-form-err"></div>
        </div>
        <div class="usr-modal-foot">
          <button class="usr-btn usr-btn-secondary" onclick="usrFecharModal()">Cancelar</button>
          <button class="usr-btn usr-btn-primary" id="usr-btn-salvar" onclick="usrSalvar()">Salvar</button>
        </div>
      </div>
    </div>`);
}

window.usrAbrirModal = function(id) {
  usrCriarModal();
  const titulo   = document.getElementById('usr-modal-titulo');
  const senhaHint= document.getElementById('usr-senha-hint');
  const senhaLbl = document.getElementById('usr-senha-lbl');
  const campos   = ['usr-form-id','usr-form-nome','usr-form-usuario','usr-form-senha','usr-form-perfil'];
  campos.forEach(c => { const el = document.getElementById(c); if (el) el.value = ''; });
  document.getElementById('usr-form-err').textContent = '';

  if (id) {
    // Editar
    const u = _usrData.find(x => x.id === id);
    if (!u) return;
    titulo.textContent = 'Editar Usuário';
    if (senhaHint) senhaHint.style.display = '';
    if (senhaLbl)  senhaLbl.textContent = 'Nova Senha';
    document.getElementById('usr-form-id').value      = u.id;
    document.getElementById('usr-form-nome').value    = u.nome;
    document.getElementById('usr-form-usuario').value = u.usuario;
    document.getElementById('usr-form-perfil').value  = u.perfil || 'tecnico';
  } else {
    // Novo
    titulo.textContent = 'Novo Usuário';
    if (senhaHint) senhaHint.style.display = 'none';
    if (senhaLbl)  senhaLbl.textContent = 'Senha *';
  }

  document.getElementById('usr-modal-ov').classList.add('open');
  document.getElementById('usr-form-nome').focus();
};

window.usrFecharModal = function() {
  document.getElementById('usr-modal-ov')?.classList.remove('open');
};

window.usrSalvar = async function() {
  const id      = document.getElementById('usr-form-id')?.value;
  const nome    = document.getElementById('usr-form-nome')?.value.trim();
  const usuario = document.getElementById('usr-form-usuario')?.value.trim();
  const senha   = document.getElementById('usr-form-senha')?.value;
  const perfil  = document.getElementById('usr-form-perfil')?.value;
  const erro    = document.getElementById('usr-form-err');
  const btn     = document.getElementById('usr-btn-salvar');

  // Validações
  if (!nome)    { erro.textContent = '⚠️ Nome é obrigatório';    return; }
  if (!usuario) { erro.textContent = '⚠️ Usuário é obrigatório'; return; }
  if (!id && !senha) { erro.textContent = '⚠️ Senha é obrigatória para novo usuário'; return; }
  if (senha && senha.length < 4) { erro.textContent = '⚠️ Senha deve ter pelo menos 4 caracteres'; return; }

  erro.textContent = '';
  btn.textContent = 'Salvando...';
  btn.disabled = true;

  try {
    let error;

    if (id) {
      // Editar
      const params = { p_id: parseInt(id), p_nome: nome, p_usuario: usuario, p_perfil: perfil };
      if (senha) params.p_senha = senha;
      const res = await window.sb.rpc('assistencia_atualizar_usuario', params);
      error = res.error;
    } else {
      // Criar
      const res = await window.sb.rpc('assistencia_criar_usuario', {
        p_nome: nome, p_usuario: usuario, p_senha: senha, p_perfil: perfil,
      });
      error = res.error;
      if (!error && res.data) {
        const result = Array.isArray(res.data) ? res.data[0] : res.data;
        if (result?.erro) { erro.textContent = '❌ ' + result.erro; btn.textContent = 'Salvar'; btn.disabled = false; return; }
      }
    }

    if (error) throw error;

    usrFecharModal();
    await usrLoad();
  } catch(e) {
    erro.textContent = '❌ ' + (e.message || 'Erro ao salvar');
    btn.textContent = 'Salvar';
    btn.disabled = false;
  }
};

// ── DESATIVAR / ATIVAR ──
window.usrDesativar = async function(id, nome) {
  if (!confirm(`Desativar "${nome}"? O usuário não conseguirá mais fazer login.`)) return;
  const { error } = await window.sb.rpc('assistencia_excluir_usuario', { p_id: id });
  if (error) { alert('Erro: ' + error.message); return; }
  await usrLoad();
};

window.usrAtivar = async function(id, nome) {
  if (!confirm(`Reativar "${nome}"?`)) return;
  const { error } = await window.sb.from('assistencia_usuarios')
    .update({ ativo: true, atualizado_em: new Date().toISOString() }).eq('id', id);
  if (error) { alert('Erro: ' + error.message); return; }
  await usrLoad();
};

// ══════════════════════════════════════════
// HOOK NO ModuloAssistencia
// ══════════════════════════════════════════
// Espera o ModuloAssistencia estar disponível e intercepta showPage
// para adicionar a página ast-usuarios sem mexer no assistencia.js
function usrHookModulo() {
  const original = window.ModuloAssistencia?.showPage;
  if (!original) return;

  window.ModuloAssistencia.showPage = function(pageId, container, usuario, filtros) {
    if (pageId === 'ast-usuarios') {
      // Verifica permissão
      const perfil = (window.getUsuario?.()?.perfil || '').toLowerCase();
      if (!['admin','gestor'].includes(perfil)) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">🔒 Acesso restrito a administradores</div>';
        return;
      }
      // Monta página se ainda não existe
      if (!_usrIniciado) {
        container.innerHTML = USR_PAGE_HTML;
        _usrIniciado = true;
      }
      container.querySelector('#page-ast-usuarios').style.display = '';
      usrLoad();
      window.setLastUpdate?.();
      return;
    }
    // Para todas as outras páginas, usa o comportamento original
    return original.call(this, pageId, container, usuario, filtros);
  };
}

// Tenta hookear imediatamente ou aguarda ModuloAssistencia carregar
if (window.ModuloAssistencia) {
  usrHookModulo();
} else {
  // Aguarda até 5s
  let tentativas = 0;
  const timer = setInterval(() => {
    if (window.ModuloAssistencia) { usrHookModulo(); clearInterval(timer); }
    if (++tentativas > 50) clearInterval(timer);
  }, 100);
}

})();
