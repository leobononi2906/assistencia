# ERP Bononi — Status Geral do Sistema

_Documento-mestre. Atualizado em 2026-08-02._

Sistema próprio do **Grupo Bononi Acessórios**, substituindo o Firebird (SGA_BONONI).
Banco: **Supabase / PostgreSQL**, projeto `vishxwdxqiygbxmtpfoy`, schema **`"Teste ERP"`**.
Front: **HTML/JS puro** em `erp/` (sem build), consumindo RPCs no schema `public`.

## Arquitetura
- **Front** (`erp/index.html` + JS por módulo): SPA simples, sidebar por grupos, tema Bononi.
- **API**: funções `public.erp_*` (SECURITY DEFINER) expõem o schema `"Teste ERP"` ao PostgREST.
- **CRUD genérico**: `public.erp_admin_tabelas` (whitelist) + `erp_list/erp_colunas/erp_upsert/erp_delete`
  alimentam a tela **Configurações** — toda tabela registrada vira cadastro editável automaticamente.
- **Multi-empresa**: config e fiscal por empresa (`fn_config`, `produtos_fiscal_empresa`, `produtos_precos`).
- **Acesso**: `usuarios_grupos` → `grupos_permissoes` (grupo × módulo × ação); `fn_pode`/`erp_permissoes_usuario`.
- **Auditoria**: `erp_log` grava em `log_acessos`.
- **Login de teste**: usuário `Leonardo`, senha `bononi123` (ambiente de teste; sem produção ainda).

## Módulos implementados

| Módulo | Telas | Backend principal | Status |
|--------|-------|-------------------|:------:|
| **Login / Dashboard** | login, KPIs | `erp_login` (retorna permissões) | ✅ |
| **Clientes** | lista + Dados/Crédito/Contatos + **Histórico** (pagamentos e movimentações) | `erp_cliente_full/salvar`, `erp_cliente_historico` | ✅ |
| **Produtos** | tela única + **Movimentações** + **Curva ABC** | `erp_produto_full/salvar`, `erp_produto_historico`, `erp_produto_curva_abc` | ✅ |
| **Relatórios** | Curva ABC (mensal automática) | `erp_curva_abc`, `erp_gerar_curva_abc` (pg_cron dia 1º) | ✅ |
| **Orçamentos** | lista + editor; aprovar → venda + solicitações | `erp_orcamento_salvar/aprovar` | ✅ |
| **Vendas / OS** | lista, solicitar produto, finalizar, gerar NF-e | `erp_criar_venda/os`, `fn_finalizar_*` | ✅ |
| **Financeiro** | Contas a Receber/Pagar, Caixa, Cobrança | `titulos`, `fn_baixar_titulo`, caixa, régua, PIX copia-e-cola, renegociação | ✅ |
| **Compras / Entrada** | Pedidos + Recebimentos | `erp_pedido_compra_*`, `erp_recebimento_*` (estoque + Contas a Pagar) | ✅ |
| **Estoque** | Solicitações, Gôndola, Transferências, Inventário (dupla contagem) | `fn_estoque_*`, `erp_transferencia_*`, `erp_inventario_*` | ✅ |
| **Fiscal / NF-e** | gerar NF-e (venda/OS) + IBS/CBS/IS | `fn_gerar_nfe` (Edge Function pendente) | 🟡 falta provedor |
| **Sistema** | Usuários, Permissões, Logs, Configurações | `erp_usuario_*`, `erp_perm_*`, `vw_logs` | ✅ |

## Regras de negócio respeitadas
- **Vendas não lançam produto direto**: viram **solicitação**; o **estoque** atende (OS e Venda). Gôndola é
  controle à parte (o vendedor lança direto só a quantidade da gôndola).
- **Financeiro × NF-e independentes**: finalizar o pedido gera o movimento financeiro (títulos);
  a NF-e é acessório opcional, nunca vinculada.
- **Limite de crédito**: só modalidade **a prazo** consome; à vista/cartão passam direto; exige `permite_prazo`.
- **Fiscal por empresa** + **Reforma Tributária** (IBS/CBS/IS, CST/cClassTrib) no cálculo da NF-e.
- **Transferência entre empresas**: como o saldo é por centro (e centro pertence a uma empresa),
  transferir entre centros de empresas diferentes move o saldo entre as empresas.
- **Permissões**: admin/sem-grupo = acesso total (pragmático); com grupo, valem as permissões (união).

## Migrations (versionadas em `supabase/migrations/`)
`20260801_01..08` financeiro/condições/caixa/cobrança/CRUD · `09..10` estoque solicitação+gôndola ·
`11..12` fiscal/NF-e · `13` finalizar venda/OS · `14` config+fiscal por empresa · `15` vendas/OS ·
`16..17` reforma tributária · `18` produtos tela única · `19` seed CST · `20` clientes ·
`21` compras/entrada · `22` orçamentos · `23` permissões+logs · `24` inventário+transferências ·
`25` inventário dupla contagem · `26` cobrança avançada (config PIX/juros, templates, renegociação) ·
`27` históricos (cliente/produto) + curva ABC mensal (pg_cron).

## Testes
Todas as funções de banco foram testadas com **rollback** (bloco `DO ... RAISE EXCEPTION`), inclusive
validando acesso como `anon` (como o front acessa). **Não** foi possível teste visual (e2e) do front
neste ambiente remoto — o navegador não alcança o Supabase/CDN. O teste de tela é abrir `erp/index.html`.

---

## Expedição — app `bononi-exped` (separado, já em produção)

O grupo tem um **app próprio de expedição** (`github.com/leobononi2906/bononi-exped`): React+Vite+Tailwind
na Vercel, **mesmo Supabase**, esquema próprio `exp_*` (`exp_documentos`, `exp_itens`, `exp_pickings`,
`exp_numeros_serie`, `exp_romaneios`, `exp_log_eventos`…). Login pelo **Auth do Hub Bononi**
(`user_metadata.modulos` contém `"expedicao"`), **não** pelo login do ERP.

- **Fluxo (Kanban):** NOVO → EM_SEPARAÇÃO → PARA_CONFERÊNCIA → CONFERIDO → EXPEDIDO. Picking (bipagem),
  **conferência cega** (2º operador), número de série, coleta (bipa chave da NF).
- **Alimentação hoje:** `exp_documentos` tem 2 origens — `BLING` (Edge Function `exp-sync-bling`, marketplace)
  e `ERP` (NFs de distribuição do sistema de vendas atual). Ou seja, **já consome documentos "origem = ERP"**.
- **Como encaixa no ERP:** o ERP não terá tela de expedição — ele **abastece** o `bononi-exped` gravando
  `exp_documentos`/`exp_itens` (origem `ERP`) ao finalizar a venda de distribuição / emitir a NF-e. O novo ERP
  assume o papel de *feeder* que o sistema atual já cumpre. **Gatilho e tela read-only ainda a decidir.**
- ⚠️ **Aposentar duplicidade:** existe no schema `"Teste ERP"` uma suíte antiga de separação
  (`expedicoes`/`erp_separacao_*`, sem front) e o `solicitacoes_produto` (requisição interna de peça, outro
  propósito). A separação antiga deve ser descontinuada para não competir com o `bononi-exped`.

---

## PRÓXIMOS PASSOS

### 1. NF-e — última milha (depende de decisão do Leo)
- Escolher **provedor**: Focus NF-e (adaptador pronto) ou NFe.io (stub).
- **Certificado A1** por empresa (`certificados_digital`).
- **Deploy da Edge Function** `emitir-nfe` + secret do token.
- Homologação com o contador antes de produção.

### 2. Segurança de acesso (quando os grupos estiverem configurados)
- Configurar grupos/empresas dos 5 usuários em **Sistema → Usuários**.
- Depois, **fechar a regra** "sem grupo = acesso total" em `fn_pode`/`erp_permissoes_usuario`
  (mudar para "sem permissão explícita = sem acesso").
- Opcional: descer o gate ao **nível de botão** (esconder Incluir/Excluir/Aprovar por ação) nas telas.

### 3. Cobrança — completar (depende de terceiros)
- **Boleto / CNAB remessa-retorno**: definir **banco + convênio/carteira/cedente** (campos já em `cobranca_config`;
  colunas de boleto já em `titulos`) e escrever a geração/baixa CNAB (240/400).
- **PIX dinâmico** (txid conciliável): escolher **PSP/banco com API PIX** + Edge Function. (PIX estático já entregue.)
- **Disparo automático** de WhatsApp/e-mail por faixa da régua: escolher **provedor** (WhatsApp Cloud/Twilio, SMTP) +
  Edge Function agendada. (Envio assistido de 1 clique já entregue.)

### 4. Expedição — integrar o `bononi-exped` (ver seção acima)
- Gerar `exp_documentos`/`exp_itens` (origem `ERP`) ao finalizar venda de distribuição / emitir NF-e.
- Decidir gatilho (finalizar venda × emitir NF-e) e se haverá tela read-only no ERP.
- Aposentar a suíte antiga `expedicoes`/`erp_separacao_*`.

### 5. Refinos transversais (opcionais)
- **Relatórios / DRE** (config já existe: `dre_config`, `plano_contas`, `centros_custo`).
- **Devoluções** (venda/compra) reaproveitando estoque + financeiro.
- **Cotações de compra** (`cotacoes*`) alimentando o pedido de compra.
- Dashboard por empresa (filtro global) e KPIs de estoque/compras.
- **Lista de acordos** de renegociação (tela de acompanhamento; hoje os títulos aparecem em Contas a Receber).

### 4. Operação / dados
- Migrar/importar cadastros reais do Firebird (clientes, produtos, saldos) quando validado.
- Definир numeração fiscal (série/ambiente) por empresa antes de emitir.
- Só desligar o Firebird após validação completa com dados reais.
