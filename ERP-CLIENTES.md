# ERP Bononi — Clientes

Tela única de clientes (`erp/clientes.js`, menu **Comercial → Clientes**), com o back-end já
existente do Financeiro (limite/`permite_prazo`, condições liberadas).

## Estrutura da tela
- **Lista** — busca (nome, fantasia, CPF/CNPJ), código, cidade/UF, limite, prazo, situação.
- **Dados & Endereço** — pessoa física/jurídica, documentos, IE/indicador IE, contatos rápidos,
  vendedor, endereço completo e município IBGE (datalist).
- **Crédito & Pagamento** — limite, uso atual (títulos a receber em aberto), disponível e barra de
  ocupação; tabela de preço padrão, descontos; `permite_prazo`; e a grade de **condições de
  pagamento liberadas** (à vista sempre liberada; a prazo por marcação, refletindo em venda/OS).
- **Contatos** — CRUD de contatos do cliente (nome, cargo, telefones, e-mail, nascimento, principal).

## Back-end (public, SECURITY DEFINER)
- `erp_cliente_full(id)` → cliente + contatos + condições (com flag `liberada`) + crédito
  (limite, usado, permite_prazo).
- `erp_cliente_salvar(jsonb)` → insert (gera `codigo`) ou update; um único RPC serve dados e crédito.
- `erp_cliente_contato_salvar / erp_cliente_contato_excluir`.
- `erp_cliente_condicao_set(id_cliente, id_condicao, liberar)` → liga/desliga condição a prazo.
- `erp_vendedores()` → lista enxuta de usuários (sem expor `senha_hash`).
- `fn_credito_usado_cliente(id)` → soma de `titulos` CR em aberto (ABERTO/PAGO_PARCIAL/VENCIDO).

Regra de crédito preservada: à vista/cartão não consomem limite; a prazo consome e exige
`permite_prazo`. Testado (rollback): criação com código automático, contato, cálculo de crédito e
liberação de condição a prazo.
