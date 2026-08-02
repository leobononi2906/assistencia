# ERP Bononi — Transferências e Inventário

Telas em `erp/estoque_mov.js` (menu **Estoque**). Reaproveita `fn_estoque_saida`/`fn_estoque_entrada`.

## Transferências (entre depósitos e entre empresas)
Como o saldo é por **(produto, centro)** e o centro pertence a uma empresa, transferir entre centros
de empresas diferentes já move o saldo **entre empresas**.
- **Fluxo**: criar (PENDENTE) → **Enviar** (baixa a origem, status ENVIADA, em trânsito) →
  **Receber** (entrada no destino com o custo médio da origem, status RECEBIDA). Cancelar só em PENDENTE.
- Back-end: `erp_transferencia_salvar/detalhe/enviar/receber/cancelar`, view `vw_transferencias`
  (mostra `entre_empresas`). Numeração `TR…` por empresa.

## Inventário — com dupla contagem
Snapshot dos saldos do centro ao abrir; conta-se produto a produto.
- **Regra de encerramento**: o item encerra quando a contagem **repete a referência**. A referência é
  o **saldo do sistema** na 1ª contagem; a partir daí, a **contagem anterior**.
  - Ex.: sistema 4, conto 4 → encerra. Conto 3 (≠4) → abre nova contagem; conto 3 de novo → encerra em 3.
- Só itens **encerrados** entram no ajuste. Ao **Finalizar**, aplica as diferenças (entrada/saída,
  origem `INVENTARIO`) e fecha (FINALIZADO). Se houver contagem divergente aberta, o sistema avisa e
  só finaliza com "forçar" (aplica a última contagem).
- Back-end: `erp_inventario_criar/detalhe/add_item/contar/ajustar/cancelar`, view `vw_inventarios`.
  Colunas `num_contagens` e `encerrado` em `inventarios_itens`.

Testado (rollback): transferência entre empresas (origem baixa, destino recebe); inventário conta=sistema
encerra de primeira, sequência 10→12→12 encerra na repetição, e o ajuste aplica a diferença ao estoque.
