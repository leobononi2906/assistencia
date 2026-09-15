# Repo `assistencia` — guia do projeto

> **Estado atual: `docs/STATUS.md`.** Este arquivo é só o que é estável.
> Contexto do grupo e regras de banco: skill `bononi-contexto`. Rodar local: `rodar-app`.
> Publicar: `publicar-e-conferir`. Registrar: `registrar-status`.

## Atenção: este repo tem três inquilinos

O nome engana. Convivem aqui, no **mesmo repo e no mesmo deploy**:

1. **O kanban de assistência antigo** — a interface que saiu de uso em 14/09/2026.
2. **`/erp`** — o ERP novo, que continua vivo e é publicado deste mesmo repo.
3. **As 7 Edge Functions** do Supabase, que continuam em produção.

**Aposentar coisa daqui é por arquivo, nunca por projeto.** Apagar o repo, desligar o projeto na
Vercel ou "limpar o que não se usa mais" derruba o ERP e as Edge Functions junto. Antes de
remover qualquer coisa, identifique de qual dos três inquilinos ela é.

E `assistencia.vercel.app` **responde 200 sem redirect**: para quem ainda tem esse link salvo,
aquele código continua sendo produção.

## Onde está

- **Clone nesta máquina (`ecommerce06`):** `C:\Aplicações da bononi\assistencia`.
- **Remote:** `leobononi2906/assistencia`, branch `main`.
  ⚠️ **É monorepo**: a `main` recebe também todo o ERP (pasta `erp/`), vindo de outra frente de
  trabalho. **`git fetch` + rebase ANTES do push** — a `main` avança sozinha.
- **Supabase:** `vishxwdxqiygbxmtpfoy` (`assist_*`); a config do ERP fica em `erp/core.js`.
- **Local:** `preview_start { name: "assistencia-legado" }` → porta 5283.

## O que era o kanban

Chamados de assistência técnica (garantia Stonni) alimentados pela Umbler (WhatsApp), com resumo
por IA, roteamento automático por setor e um assistente "Perguntar à IA". O substituto em uso é o
`stonni-assistencia` (equipe interna) + `parceiro-stonni` (autorizadas).

## Documentação solta na raiz

Os vários `ERP-*.md` (clientes, cobrança, compras, estoque, financeiro, fiscal, orçamentos,
permissões) são o levantamento do ERP, não do kanban — pertencem ao inquilino 2.
