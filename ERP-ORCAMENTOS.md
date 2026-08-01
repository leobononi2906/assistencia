# ERP Bononi — Orçamentos de Venda

Tela `erp/orcamentos.js` (menu **Comercial → Orçamentos**). Orçamento → ao **aprovar** vira
Venda (pedido) e **gera solicitações de peças para o estoque** atender — a equipe de vendas não
lança produto direto (mesma regra da OS/Venda).

## Fluxo
- **Novo/editar** — cabeçalho (empresa, cliente, vendedor, condição, validade, frete/desconto,
  observação) + itens (tipo Produto/Serviço, qtd, valor, desconto). Status: ABERTO → ENVIADO →
  (APROVADO/CONVERTIDO | REPROVADO | EXPIRADO).
- **Aprovar** (`erp_orcamento_aprovar`):
  1. cria a **venda** (`erp_criar_venda`) e vincula `vendas.id_orcamento`;
  2. para cada item **PRODUTO**, gera uma **solicitação** (`fn_solicitar_produto`) na venda, com a
     observação "Gerado do orçamento …" — o estoque atende e lança o produto;
  3. **serviços não** vão para o estoque (contados à parte);
  4. marca o orçamento como **CONVERTIDO** (data de aprovação).

## Back-end (public, SECURITY DEFINER)
`erp_orcamento_salvar/detalhe/status/aprovar`. View `vw_orcamentos` (com `id_venda` gerada).
Numeração automática por empresa (ORC…). Coluna `vendas.id_orcamento` liga a venda ao orçamento.

Testado (rollback): orçamento com 2 produtos + 1 serviço → aprovar criou a venda, gerou 2
solicitações de peça para o estoque e marcou o orçamento como CONVERTIDO.
