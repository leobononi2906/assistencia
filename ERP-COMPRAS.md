# ERP Bononi — Compras / Entrada

Fluxo de compras (`erp/compras.js`, menu **Compras**): Pedido → Recebimento (entrada de NF)
→ estoque + Contas a Pagar. NF-e de compra fica de fora (acessório, futuro).

## Telas
- **Pedidos de Compra** — lista + editor (cabeçalho: empresa, fornecedor, condição, previsão,
  frete/desconto) com grade de itens. Ações: salvar, **aprovar**, **gerar recebimento** e cancelar.
  Status: PENDENTE → APROVADO/ENVIADO → RECEBIDO_PARCIAL → RECEBIDO (ou CANCELADO).
- **Recebimentos (Entradas)** — lista + editor (NF do fornecedor, série, emissão, tipo de entrada,
  centro de estoque, condição de pagamento, frete/IPI/ICMS-ST/outras/desconto) com grade de itens
  (qtd, valor unit., IPI, ICMS-ST e **custo final** por item). Pode nascer de um pedido (traz os
  itens pendentes) ou avulsa.

## Regra da confirmação (`erp_recebimento_confirmar`)
Ao **Confirmar** uma entrada em DIGITACAO, conforme o **tipo de entrada**:
- **mov_estoque** → lança entrada em `estoque_movimentos`/`estoque_saldos` (via `fn_estoque_entrada`).
- **atualiza_custo** → atualiza `produtos.preco_custo` com o custo final do item.
- **mov_financeiro** → gera as parcelas em **Contas a Pagar** (via `fn_gerar_titulos_pagar`,
  usando a condição de pagamento; exige condição informada).
- baixa as quantidades no pedido de origem e ajusta o status (recebimento parcial/total).
Depois de confirmada, a entrada não é mais editável nem cancelável pela tela (já movimentou tudo).

## Back-end (public, SECURITY DEFINER)
`erp_pedido_compra_salvar/detalhe/status`, `erp_recebimento_salvar/detalhe/confirmar/cancelar`.
Views: `vw_pedidos_compra`, `vw_recebimentos`. Numeração automática por empresa (PC…, RC…).
Reaproveita `fn_estoque_entrada` e `fn_gerar_titulos_pagar`.

Testado (rollback): pedido → recebimento vinculado → confirmar gerou 1 movimento de estoque,
atualizou o custo do produto e gerou 4 parcelas em Contas a Pagar; status propagados corretamente.
