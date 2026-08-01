# ERP Bononi — Estoque: Solicitação de produto + Gôndola

## Regra de negócio
- **Vendas nunca lança produto direto** na OS/Venda. Cria uma **solicitação**.
- **Estoque** é quem lança de fato: atende a solicitação → cria a linha real
  (`os_pecas`/`vendas_itens`) com `movimentou_estoque=true` e `id_usuario_distribuiu`,
  baixa o estoque e recalcula os totais do documento.
- Vale para **OS e Venda** (mesma tabela `solicitacoes_produto`).
- Config `exige_solicitacao_produto=S` (tabela `configuracoes`) governa a regra.

## Gôndola (estoque à parte, com quantidade própria)
- Gôndola = um **centro de estoque** marcado com `centros_estoque.gondola=true`
  (marca-se em Configurações → Centros de Estoque).
- Tem **saldo próprio por produto** (`estoque_saldos` no centro gôndola).
- O vendedor lança **direto** da gôndola (`fn_lancar_produto_gondola`), mas **só até
  a quantidade disponível** — o lançamento bloqueia estoque negativo na gôndola
  (é o "somente aquela quantidade poderá ser lançada").
- A gôndola é abastecida por transferência do estoque principal
  (`fn_gondola_abastecer`: SAÍDA do depósito + ENTRADA na gôndola).

## Objetos criados (schema `Teste ERP`)
- Tabela `solicitacoes_produto` (espelha o conceito da `TBL_DEMANDA` do Firebird).
- `centros_estoque.gondola` (flag) + `configuracoes.exige_solicitacao_produto`.
- Funções: `fn_solicitar_produto`, `fn_atender_solicitacao`, `fn_cancelar_solicitacao`,
  `fn_gondola_abastecer`, `fn_lancar_produto_gondola`, `fn_estoque_saida`
  (com `p_bloqueia_negativo`), `fn_estoque_entrada`, `fn_recalc_totais`.
- Views: `vw_solicitacoes` (fila do estoque), `vw_gondola_saldo`.
- Wrappers `public.erp_*` para o front + views registradas no admin.

## Front (pasta `erp/`, tela Estoque)
- **Solicitações** — fila do estoque: criar solicitação, **atender** (lança na OS/Venda)
  e **cancelar**.
- **Gôndola** — saldo por produto e **abastecer** (transferência do depósito).

## Validação (com rollback, nada gravado)
1. Abastecer gôndola (10 un) → saldo 10.
2. Vendedor lança 3 direto → saldo 7.
3. Tentar lançar 999 → **bloqueado** (só a quantidade da gôndola).
4. Vendas solicita 4 un → estoque atende do depósito → item entra na venda, total recalculado.
