# ERP Bononi — Front (HTML/JS puro)

Front do ERP seguindo o padrão Bononi (HTML/JS puro, design system, um arquivo por área).
Consome o Supabase `vishxwdxqiygbxmtpfoy` (schema `Teste ERP`) via funções `public.erp_*`.

## Arquivos
- `index.html` — shell, CSS (design tokens Bononi), login, sidebar, modais, toast.
- `core.js` — client Supabase, auth (`erp_login`), helpers, navegação, dashboard.
- `config.js` — **Configurações: CRUD genérico de todas as tabelas registradas**
  (listar, buscar, **adicionar**, **editar**, **excluir**). Formulário montado
  automaticamente a partir das colunas (`erp_colunas`), com dropdown para chaves
  estrangeiras.
- `financeiro.js` — Contas a Receber, Contas a Pagar, Caixa e Cobrança.

## Login de teste
- Usuário: `Leonardo` · Senha: `bononi123` (senha padrão de teste; trocar em produção).

## Como o CRUD de "todas as tabelas" funciona
O backend expõe um admin genérico no schema `public`:
- `public.erp_admin_tabelas` — registro (whitelist) das tabelas editáveis, por grupo.
  Para habilitar mais tabelas na tela de Configurações, basta inserir uma linha aqui.
- `public.erp_list / erp_colunas / erp_upsert / erp_delete` — CRUD dinâmico e seguro
  (valida a tabela contra o registro; respeita `somente_leitura`).

O front lê o registro, monta o menu por grupo, e para cada tabela gera a lista e o
formulário automaticamente — sem precisar codar tela por tela.

## Deploy
Servir a pasta `erp/` como estático (mesmo padrão dos outros apps Bononi). Sem build.

## Observação de teste
O e2e no navegador não rodou neste ambiente porque o browser de teste não tem saída
de rede (o CDN e o Supabase ficam bloqueados pelo proxy). A camada de dados foi
validada RPC a RPC via MCP do Supabase (login, CRUD genérico, geração/baixa/estorno
de título, caixa, contas a pagar, cobrança) e as permissões do papel `anon` conferidas.
O carregamento do Supabase segue o mesmo CDN do app de Assistência (que roda em produção).
