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

Modelo em **duas camadas**, alinhado ao Firebird (SGA_BONONI):

- **Chave-mestra**: `clientes.permite_prazo boolean` (default `false`) — liga/desliga
  venda a prazo para o cliente.
- **Granular (espelha `TBL_CONDPAG_CLI`)**: `clientes_condicoes_pagamento` (N:N) —
  lista de condições liberadas por cliente. É o que permite "mostrar só o liberado".
- Regra na venda/OS:
  - Formas `A_VISTA` e `CARTAO` → sempre disponíveis (não checam limite).
  - Formas/condições `A_PRAZO` → só se `permite_prazo = true`, a condição estiver
    liberada para o cliente, **e** couber no limite disponível
    (`limite_credito − saldo devedor real em aberto`).
  - Cliente sem liberação → só à vista/cartão (comportamento seguro).

**Função para a tela:** `fn_condicoes_liberadas_cliente(id_cliente)` retorna todas
as condições ativas com a flag `liberada` (À Vista sempre; prazo só se liberado) —
a tela lista só as `liberada = true`.

### Mapeamento com o Firebird (fonte da verdade do legado)

| Firebird (SGA_BONONI) | ERP novo (`Teste ERP`) |
|---|---|
| `TBL_CONDPAG` (LIBERA_LIMITE) | `condicoes_pagamento` (+ `libera_limite`) |
| `TBL_ITENS_CONDPAG` (PRAZO+PERCENTUAL) | `condicoes_pagamento_parcelas` (parcelas flexíveis) |
| `TBL_CONDPAG_CLI` | `clientes_condicoes_pagamento` (N:N liberação) |
| `TBL_FORMA_PAG` (CARTAO/BOLETO/LIBERA_LIMITE) | `formas_pagamento` (`modalidade`/`usa_limite_credito`) |
| `TBL_CLIENTE.CHCONDPAG / LIMITE_CRED` | `clientes.id_condicao_pagamento` / `limite_credito` |

Ainda **não** portados do Firebird (backlog): `TBL_FORMA_PAG_CLI` (forma por
cliente), `TBL_CONDPAG_CATEG_CLI` (liberação por categoria), `TBL_TAXA_FORMA_PAG`
(taxa por condição×forma×empresa).

## 4. Geração automática de título (entregue)

Função `fn_gerar_titulos_receber(p_origem, p_id_origem, p_id_usuario, p_reprocessar)`
— gera os títulos (CR) parcelados ao faturar uma **Venda** ou **OS**.

```sql
select "Teste ERP".fn_gerar_titulos_receber('VENDA', 221);
-- {"ok":true,"origem":"VENDA","parcelas":3,"valor_total":614.30,"titulos":[8,9,10]}
```

Comportamento validado (todos com rollback — nada gravado):
1. Cliente liberado + boleto 30/60/90 → 3 parcelas com vencimentos e centavos corretos.
2. Cliente não liberado a prazo (`permite_prazo=false`) → **bloqueia**.
3. Condição não liberada para o cliente (N:N) → **bloqueia**.
4. Limite insuficiente → **bloqueia** informando o disponível.
5. À vista → passa direto, 1 título hoje, sem checar limite.
6. Parcelas flexíveis (ex.: 50% hoje + 40% em 30d + 10% em 60d) → gera na proporção certa.

Migração versionada em
`supabase/migrations/20260801_financeiro_permite_prazo_e_gerar_titulos.sql`.

## 4b. Contas a Receber (entregue)

- **View `vw_contas_receber`** — lista de títulos CR com nome do cliente/empresa,
  saldo real (`valor_saldo`), `vencido` e `dias_atraso`. A tela consome direto.
- **`fn_baixar_titulo(...)`** — baixa total ou parcial: grava `titulos_baixas`,
  atualiza `titulos` (status `PAGO`/`PAGO_PARCIAL`), lança `contas_movimentos`
  (`C`/`D`) e atualiza `contas_financeiras.saldo_atual`.
  - Principal amortizado = pago + desconto − juros − multa.
  - Validado (rollback): baixa total→PAGO, parcial→PAGO_PARCIAL, saldo da conta
    somando os pagamentos, movimentos gerados.
- **`taxas_forma_pagamento`** — espelha `TBL_TAXA_FORMA_PAG` (taxa por
  empresa×condição×forma, percentual ou valor).

## 5. Próximos passos sugeridos (na ordem)

1. **Wire nas telas (React)** — faturamento de Venda/OS chama `fn_gerar_titulos_receber`;
   tela Contas a Receber consome `vw_contas_receber` e chama `fn_baixar_titulo`;
   cadastro de cliente expõe `permite_prazo` + liberação de condições; venda usa
   `fn_condicoes_liberadas_cliente`.
2. **Estorno de baixa** — `fn_estornar_baixa` (reverter `titulos_baixas` +
   `contas_movimentos`, campos `estornado` já existem nas tabelas).
3. **Contas a Pagar** — gerar títulos `CP` a partir de `compras_recebimento`
   (mesma `fn_baixar_titulo` já atende CP → débito na conta).
4. **Caixa** — abertura/fechamento (`caixas_sessoes` + `caixas_movimentos`).
5. **Cobrança** (backlog obrigatório — seção 6) sobre `vw_contas_receber`.

## 5b. Front do ERP (entregue — pasta `erp/`)

App HTML/JS puro (padrão Bononi) consumindo `public.erp_*`:
- **Configurações** — CRUD genérico de **todas as tabelas** registradas
  (adicionar/editar/excluir), formulário automático a partir das colunas.
- **Contas a Receber / a Pagar** — lista com saldo real + baixa.
- **Caixa** — abrir / movimento / fechar.
- **Cobrança** — inadimplência por cliente com régua e registro de ações.
- Backend do admin: `erp_admin_tabelas` (whitelist) + `erp_list/colunas/upsert/delete`,
  `erp_login`, e wrappers `erp_*` das funções financeiras. Login teste: Leonardo / bononi123.

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
