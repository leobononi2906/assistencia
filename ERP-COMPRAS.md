# ERP Bononi — Compras / Entrada

Fluxo de compras (`erp/compras.js` + `erp/demanda.js` + `erp/cotacoes.js`, menu **Compras**):
**Demanda → (Cotação) → Pedido → Recebimento** (entrada de NF) → estoque + Contas a Pagar.
A Cotação é opcional: dá para ir da Demanda direto ao Pedido, ou passar pela Cotação quando
quiser comparar fornecedores. NF-e de compra fica de fora (acessório, futuro).

## Telas
- **Demanda / Sugestão de Compra** (`erp/demanda.js`) — a etapa que **antecede** o pedido:
  o comprador filtra e analisa a necessidade e forma o pedido a partir dela.
  - **Filtros:** empresa, **modo de análise** (Reposição mín/máx · Giro/consumo · Ambos),
    **grupo**, **subgrupo**, **fornecedor**, busca (nome/referência), urgência
    (Crítico/Alerta/OK), janela de consumo (dias), lead time e estoque desejado (dias),
    e o toggle **“Só itens em demanda”** (ligado = só o que precisa comprar; desligado =
    lista tudo do filtro, para revisar/editar mín/máx sem urgência).
  - **Análise por linha:** estoque atual, **mínimo e máximo editáveis na hora**
    (`erp_produto_estoque_limites` — recalcula a sugestão ao salvar), consumo/dia,
    cobertura em dias, quantidade sugerida (reposição = máx−saldo; giro =
    consumo × (lead+alvo) − saldo) e **quantidade a comprar editável**.
  - **Urgência:** CRÍTICO (saldo ≤ 0) · ALERTA (saldo ≤ mínimo ou cobertura < lead time) · OK.
  - **Formar o pedido:** marca os itens (qtd editável), define o fornecedor quando o
    produto não tem principal, e **“Gerar pedido(s) de compra”** — agrupa por fornecedor
    e cria **um Pedido PENDENTE por fornecedor** (`erp_demanda_gerar_pedidos`, que reusa
    `erp_pedido_compra_salvar`). Sem permissão `COMPRAS/incluir`, o botão não aparece.
- **Cotações de Compra** (`erp/cotacoes.js`) — cotação de preços entre fornecedores antes do pedido:
  - **Cabeçalho + itens:** empresa, validade, observação e a lista de produtos a cotar (com quantidade).
    Pode nascer vazia (manual) ou **direto da Demanda** (botão “Cotar marcados” em Demanda/Sugestão).
  - **Mapa comparativo:** para cada fornecedor registra-se uma **resposta** (preço/prazo/condição por item)
    via “+ Cotação de fornecedor”. A matriz mostra item × fornecedor com o **menor preço destacado**;
    escolhe-se o vencedor por item (ou **“Selecionar menor preço”** automático).
  - **Gerar pedido(s):** os itens selecionados viram **um Pedido de Compra por fornecedor** (reusa
    `erp_pedido_compra_salvar`) e a cotação passa a **FINALIZADA**.
  - **Status:** ABERTA → (ENVIADA/RESPONDIDA) → FINALIZADA (ou CANCELADA). Edição/respostas travam
    após FINALIZADA/CANCELADA. Numeração `COT######` por empresa (advisory lock + UNIQUE backstop).
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

**Demanda (migration 37):** `erp_demanda_listar` (análise com filtros de empresa/grupo/
subgrupo/fornecedor/busca/urgência; modos reposição/giro/ambos), `erp_demanda_filtros`
(grupos e subgrupos para os seletores), `erp_produto_estoque_limites` (altera mín/máx com
validação máx≥mín) e `erp_demanda_gerar_pedidos` (agrupa por fornecedor e cria os pedidos).
Consumo = `estoque_movimentos.tipo='SAIDA'` excluindo transferências.
As funções órfãs `erp_demanda_compra`/`erp_demanda_abc` (sem tela) foram substituídas por esta suíte.

**Cotações (migration 38):** `erp_cotacao_salvar/detalhe/listar` (cabeçalho+itens, numeração COT######),
`erp_cotacao_resposta_salvar` (resposta de um fornecedor, preço/prazo/condição por item),
`erp_cotacao_selecionar`/`erp_cotacao_selecionar_menor` (vencedor por item; auto menor preço),
`erp_cotacao_gerar_pedidos` (um pedido por fornecedor, reusa `erp_pedido_compra_salvar`) e
`erp_cotacao_status`. Tabelas `cotacoes`/`cotacoes_itens`/`cotacoes_respostas` (já existentes).

Testado (rollback): pedido → recebimento vinculado → confirmar gerou 1 movimento de estoque,
atualizou o custo do produto e gerou 4 parcelas em Contas a Pagar; status propagados corretamente.
