# ERP Bononi — Permissões (liberações de usuários) e Logs

Menu **Sistema**: Usuários, Permissões por Grupo, Logs / Auditoria (`erp/sistema.js`).

## Modelo
- `grupos_acesso` (10 grupos) → `grupos_permissoes` (grupo × módulo × ação) sobre `modulos_sistema`
  (DASHBOARD, CLIENTES, PRODUTOS, ORCAMENTOS, VENDAS, OS, ESTOQUE, COMPRAS, FINANCEIRO_CR/CP,
  CAIXA, FISCAL, USUARIOS, CONFIG, …).
- `usuarios_grupos` (N:N usuário↔grupo) e `usuarios_empresas` (empresas liberadas).
- Ações por módulo: **ver, incluir, editar, excluir, aprovar, exportar** (+ ajustar_estoque, dar_desconto).

## Regra de acesso (pragmática, ambiente novo)
- **ADMIN** (perfil `admin*` ou grupo "Administrador") → acesso total.
- Usuário **sem nenhum grupo** → acesso total (até ser configurado — evita travar o sistema).
- Com grupos → vale a **união (OR)** das permissões dos grupos do usuário.
- Empresas: as vinculadas em `usuarios_empresas`; nenhuma vinculada = todas.

## Como aplica no front
- `erp_login` retorna o mapa de permissões; o front guarda em `window.perm`.
- `can(codigo, acao)` decide: **menu** oculta módulos sem `ver`; `nav()` bloqueia acesso direto.
- Telas de admin (Usuários/Permissões) e ações sensíveis podem usar `can(...)` para esconder botões.

## Telas
- **Usuários** — CRUD (`erp_usuario_salvar`, cria com senha padrão `bononi123`), reset de senha, e
  modal **Grupos & Empresas** (`erp_usuario_detalhe` + `erp_usuario_grupo_set`/`erp_usuario_empresa_set`).
- **Permissões por Grupo** — escolhe o grupo e edita a **matriz módulo × ação** (`erp_perm_matrix`,
  `erp_perm_set`).
- **Logs / Auditoria** — viewer de `vw_logs` (últimos 400), filtro por tipo/texto.

## Logs
- `erp_log(id_usuario, tipo, modulo, acao, tabela, registro, mensagem, detalhes)` grava em
  `log_acessos` (com `dados_anteriores`/`dados_novos` disponíveis para auditoria fina).
- `erp_login` registra **LOGIN** e **LOGIN_FALHA**. O front chama `bononiLog(...)` nas ações
  relevantes (ex.: alteração de usuário/permissão).

## Resolvers de servidor
`fn_is_admin(id)`, `fn_pode(id, codigo, acao)` — use `fn_pode` para **exigir** permissão em ações
sensíveis no backend (aprovar/excluir), além de esconder no front.

Testado (rollback): admin faz bypass; usuário sem grupo = total; usuário não-admin restrito a um
grupo só-CLIENTES **não** enxerga VENDAS; login retorna o mapa de permissões; logs gravam e são lidos.
