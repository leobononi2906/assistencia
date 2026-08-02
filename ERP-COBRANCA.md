# ERP Bononi — Cobrança

Tela em `financeiro.js` (menu **Financeiro → Cobrança**). Migration `20260801_26_cobranca_avancada.sql`.

## O que já existia
- **Régua de aging** (`cobranca_regua`) por faixa de atraso.
- **Painel de inadimplentes** (`vw_cobranca_clientes`): vencido / a vencer / saldo devedor / maior atraso.
- **Registro de ações** de cobrança (`cobranca_acoes`): contato, promessa, canal.

## O que foi adicionado

### 1. Config por empresa (`cobranca_config`)
Botão **⚙ Config cobrança**. Por empresa: chave/tipo de PIX, beneficiário, cidade, **juros ao mês (%)** e **multa (%)** padrão, e campos bancários (banco/agência/conta/convênio/carteira/cedente) reservados para boleto/CNAB.
- `erp_cobranca_config_get(id_empresa)` (com fallback nos dados da empresa) · `erp_cobranca_config_salvar(jsonb)`.

### 2. Cobrar (PIX + mensagem) — botão **Cobrar**
- **PIX copia-e-cola** (BR Code EMV, padrão Bacen) gerado no front a partir da chave da empresa — CRC16 validado. Funciona em qualquer app bancário, **sem gateway**.
- **Mensagem** montada a partir de um **template** (`cobranca_templates`) escolhido pela faixa do maior atraso, com placeholders `{cliente} {empresa} {total} {qtd} {maior_atraso} {lista} {pix}`.
- Envio por **WhatsApp** (`wa.me`) e **e-mail** (`mailto:`) — 1 clique, sem API.
- `erp_cobranca_cliente_titulos(id_cliente,id_empresa)` alimenta o modal.

### 3. Renegociação / acordos — botão **Renegociar**
- Seleciona os títulos em aberto do cliente, informa **juros / multa / entrada / nº de parcelas / 1º vencimento / forma**; botão *Sugerir* usa juros e multa da config.
- `erp_renegociar_titulos(...)`: marca os originais como **RENEGOCIADO**, registra o **acordo** (`cobranca_acordos` + `cobranca_acordos_origem`) e gera os **novos títulos** parcelados (origem/modalidade `RENEGOCIACAO`), com a última parcela ajustando o centavo. Loga em `log_acessos`.

## Pendente (depende de terceiros + Edge Function)
- **Boleto / CNAB (remessa-retorno)** — precisa do **banco + convênio/carteira/cedente**; os campos já existem em `cobranca_config` e as colunas de boleto já existem em `titulos` (`nosso_numero`, `linha_digitavel`, `codigo_barras`, `url_boleto`).
- **PIX dinâmico** (cobrança com txid conciliável) — precisa de **PSP/banco com API PIX**. O PIX estático já cobre o recebimento manual.
- **Disparo automático** de WhatsApp/e-mail por faixa da régua — precisa de **provedor** (WhatsApp Cloud API/Twilio, SMTP) + Edge Function agendada. Hoje o envio é assistido (1 clique).

Testado com rollback: config, listagem de títulos e renegociação (saldo 500 + juros 25 + multa 10 − entrada 35 = 500 em 3x; 2 originais → RENEGOCIADO, 3 novos somando 500). PIX BR Code e CRC16 validados em node.
