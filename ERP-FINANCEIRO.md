# ERP Bononi — Módulo Financeiro (status e próximos passos)

Schema `Teste ERP` no Supabase `vishxwdxqiygbxmtpfoy`. Este doc registra a
varredura do financeiro feita em 2026-08-01 e o que já foi construído.

## 1. Varredura — tabelas do financeiro (todas já existem)

Estrutura 100% criada. O que falta é fluxo (telas + geração automática), não tabela.

| Tabela | Papel | Dados |
|--------|-------|:-----:|
| `titulos` | CR + CP unificado. `valor_saldo` é **coluna gerada** (`valor - valor_pago`) | 2 |
| `titulos_baixas` | baixas parciais/totais, com estorno | 0 |
| `contas_financeiras` | caixa / banco / cartão, saldo atual | 2 |
| `contas_movimentos` | extrato com saldo anterior/posterior | 0 |
| `caixas_sessoes` / `caixas_movimentos` | abertura/fechamento de caixa | 0 |
| `plano_contas` | plano de contas hierárquico | 33 |
| `centros_custo` | centros de custo | 5 |
| `cheques` | cheques, com status/devolução | 0 |
| `renegociacoes` / `renegociacoes_titulos` | renegociação | 0 |
| `conciliacoes` | conciliação bancária | 0 |
| `recibos` | emissão de recibo | 0 |
| `dre_config` | configuração do DRE | 0 |

## 2. Onde se configura o prazo de pagamento

- **`condicoes_pagamento`** — o parcelamento em si (`num_parcelas`,
  `intervalo_dias`, `entrada`). 9 já cadastradas (À Vista, 30, 30/60,
  30/60/90, 30/60/90/120, 28/56, 28/56/84, 1+1, 1+2).
- **`formas_pagamento`** — meio + `modalidade` (`A_VISTA` / `CARTAO` /
  `A_PRAZO`) + `usa_limite_credito`. 13 já cadastradas, flags corretas
  (só boleto/crediário/cheque pré consomem limite).

## 3. Prazo ligado ao cliente ("mostrar só o liberado")

Modelo escolhido: **flag simples**.

- Nova coluna `clientes.permite_prazo boolean` (default `false`).
- Regra na venda/OS:
  - Formas `A_VISTA` e `CARTAO` → sempre disponíveis (não checam limite).
  - Formas/condições `A_PRAZO` → só se `permite_prazo = true` **e** couber no
    limite disponível (`limite_credito − saldo devedor real em aberto`).
  - Cliente sem liberação → só à vista/cartão (comportamento seguro).

## 4. Geração automática de título (entregue)

Função `fn_gerar_titulos_receber(p_origem, p_id_origem, p_id_usuario, p_reprocessar)`
— gera os títulos (CR) parcelados ao faturar uma **Venda** ou **OS**.

```sql
select "Teste ERP".fn_gerar_titulos_receber('VENDA', 221);
-- {"ok":true,"origem":"VENDA","parcelas":3,"valor_total":614.30,"titulos":[8,9,10]}
```

Comportamento validado (4 testes, todos com rollback — nada gravado):
1. Cliente liberado + boleto 30/60/90 → 3 parcelas com vencimentos e centavos corretos.
2. Cliente não liberado a prazo → **bloqueia**.
3. Limite insuficiente → **bloqueia** informando o disponível.
4. À vista → passa direto, 1 título hoje, sem checar limite.

Migração versionada em
`supabase/migrations/20260801_financeiro_permite_prazo_e_gerar_titulos.sql`.

## 5. Próximos passos sugeridos (na ordem)

1. **Wire da função nas telas** de faturamento de Venda e OS (chamar a RPC ao
   confirmar o faturamento).
2. **Tela Contas a Receber** — lista com saldo real (`valor_saldo`), filtro por
   empresa/vencimento, e **baixa** (`titulos_baixas`) que gera
   `contas_movimentos`.
3. **Tela de cliente** — expor o toggle `permite_prazo` e, na venda, filtrar as
   formas a prazo por ele + limite disponível.
4. **Contas a Pagar** — gerar títulos `CP` a partir de `compras_recebimento`.
5. **Caixa** — abertura/fechamento (`caixas_sessoes` + `caixas_movimentos`).

## 6. BACKLOG — NÃO ESQUECER

> ⭐ **Tela de Cobrança** (obrigatória) — pedido do Leo em 2026-08-01.
> Momento na ordem ainda a definir, mas **não pode ficar de fora**.
> Escopo esperado: gestão de inadimplência a partir dos `titulos` CR em aberto
> e vencidos — régua de cobrança (avisos por vencimento), agrupamento por
> cliente com saldo devedor real, filtro por dias em atraso, registro de
> contato/acordo e integração com `renegociacoes` para renegociar títulos.

### Notas de ambiente / operação
- ERP **ainda não está em produção** → pode rodar SQL/migração livremente,
  sem pedir autorização a cada passo (validado pelo Leo em 2026-08-01).
- A "pasta do ERP Firebird completa" fica no computador local do Leo
  (pasta **Claude Erp**). Não é acessível a partir do ambiente remoto; para
  cruzar campo a campo, o conteúdo precisa ser colado ou subido ao repositório.
