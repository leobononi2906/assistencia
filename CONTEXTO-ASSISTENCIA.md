# Contexto — App Assistência (Grupo Bononi Acessórios)

> Documento de handoff para retomar em conversas futuras. Descreve a estrutura do
> repo, o que cada arquivo faz, tabelas/funções usadas no Supabase e as regras
> importantes. Atualizado em **31/07/2026**.

## Onde fica / deploy
- Repo local: `C:\CLAUDE\Projetos GitHub\assistencia\assistencia` (o repo git de
  verdade é a pasta **aninhada** `assistencia\assistencia`).
- Branch de produção: **`main`**. **Push na main = produção** — revisar antes.
- Deploy: front estático (`index.html` + JS). Cada app é repo/deploy independente.
- Supabase: projeto **`vishxwdxqiygbxmtpfoy`** (compartilhado por todos os apps do grupo).

## Arquivos
| Arquivo | Papel |
|---|---|
| `index.html` | Shell do app + **auth**. Carrega `supabase-js@2` (CDN), `createClient(SUPA_URL, SUPA_KEY)`, login por `sb.auth.signInWithPassword`, `getSession`, `signOut`. Expõe `window.sb` (cliente Supabase) e `window.getUsuario()`. **Usuário faz login → sessão role `authenticated`.** |
| `assistencia.js` | App principal (dashboard, kanban, chamados, bloqueios, novo chamado, vínculo com cliente do ERP). |
| `rede-autorizada.js` | Módulo **Rede Autorizada** (RA): ordens de serviço de parceiros, compras de peças, credenciamento, abas Autorizadas/Parceiros, chips coloridos por linha (Ar/Geladeira/Gerador). |
| `supabase/functions/credenciar-parceiro/` | Edge Function que cria usuário no Supabase Auth (admin, sem e-mail). Recebe o **token da sessão** do gestor logado (não a anon key) — decisão de segurança. |
| `supabase/config.toml` | Config da CLI do Supabase. |

## Tabelas / views usadas (Supabase `public`)
- **Chamados/fluxo:** `assist_chamados`, `assist_kanban`, `assist_kpis`,
  `assist_indice_defeito`.
- **Lookups de domínio:** `assist_status`, `assist_setores`, `assist_prioridades`,
  `assist_defeitos`, `assist_causas`, `assist_procedencias`, `assist_produtos`.
- **Bloqueio:** `assist_numeros_bloqueados` (por `telefone_norm`, flag `ativo`).
- **Cliente do ERP:** view **`assist_clientes_telefone_lookup`** — vem de
  `vw_dim_cliente` (réplica do cadastro do ERP/Firebird, ~71k clientes). Colunas:
  `id_cliente, nome_cliente, telefone1/2/3, tel1_norm/2_norm/3_norm, cidade, uf, email, cpf, cnpj`.
  (⚠️ os campos normalizados são `tel1_norm/2_norm/3_norm` — **não** `telefone_norm1/2/3`.)
- **Rede Autorizada:** `prt_ordens_servico`, `prt_compras_pecas` (prefixo `prt_`).

## Busca de cliente por telefone — como funciona (31/07/2026)
O app resolve "esse telefone é de um cliente do ERP?" em 3 lugares em `assistencia.js`:
1. **Type-ahead** (`astBuscarClienteERP`, ~L2005): busca por nome (`ilike`) ou por
   número (`tel1_norm/tel2_norm ilike %...%`) direto na view. Rápido agora porque
   foram criados índices **GIN pg_trgm** em `vw_dim_cliente`
   (`ix_dimcli_tel1/2/3_norm_trgm`).
2. **`astVerificarTelefone`** (~L2166): ao digitar o telefone no chamado novo,
   auto-preenche o nome do cliente.
3. **`astSalvarNovo`** (~L2217): ao salvar, auto-vincula o chamado ao cliente do
   ERP (`cliente_id_erp`, `cliente_nome_erp`).

### Correção aplicada (31/07/2026)
Os pontos 2 e 3 filtravam por `telefone_norm1/2/3` — **coluna que não existe** na
view → o filtro dava erro e o vínculo com o ERP **nunca funcionava** (nome não
preenchia, `cliente_id_erp` saía `null`). Trocados para a RPC canônica
**`erp_cliente_por_telefone(p_tel)`**, que:
- normaliza via `bononi_telefone_key` (unifica **DDI 55** e **9º dígito**);
- usa a matview indexada `mv_cliente_contato` (ERP inteiro);
- é `SECURITY DEFINER`, exposta só a `authenticated`/`service_role` (o app está logado).

## Fonte única contato→cliente (camada de banco, cross-app)
Criada nesta mesma data, reusável por atacado/assistência/ecommerce:
- `bononi_telefone_key(text)` — chave canônica BR (DDD + últimos 8; remove DDI/9º díg).
- `mv_cliente_contato` — matview (~124k) 1 linha por contato (telefone/email/cpf/cnpj),
  refresh por `pg_cron` a cada 30min. **PII sem grant a `anon`** (não exposta na API).
- RPCs: `erp_cliente_por_telefone(text)`, `buscar_cliente_por_contato(text)`.
- ⚠️ **`buscar_cliente_por_telefone(text)` é do ATACADO** (busca `atac_clientes`
  ativos) — não confundir/trocar.

## Umbler (intake) — relação com a assistência
- A assistência recebe chamados via Umbler: Aplicação **"GERAL SUPABASE"** → Edge
  Function **`umbler-intake`** → roteia p/ **`assistencia-umbler-webhook`** (ambas no
  repo **`bononi-hub`**, não aqui). O webhook faz upsert em `assist_chamados` com
  `onConflict:'umbler_conversa_id'`.
- **Bug que travou chamados de 09/07 a 31/07** (corrigido 31/07/2026): o upsert exige
  índice único em `umbler_conversa_id`. Em 30/07 criaram o índice **PARCIAL**
  (`WHERE umbler_conversa_id IS NOT NULL`), que **NÃO** satisfaz `ON CONFLICT` →
  500 em todo chamado novo. Trocado por índice **FULL** em 31/07. Pipeline testado ✅.
  (Último chamado real ficou em 09/07; produção reiniciada limpa em 31/07 — 482
  chamados concluídos, 297 eventos antigos marcados como tratados.)
- Detalhes gerais do intake único: ver `C:\CLAUDE\instrucoes.md` (seção Umbler) e
  `bononi-hub/docs/UMBLER-FONTE-UNICA.md`.

## Convenções
- Config geral/cross-app → repo `bononi-hub`. Instrução geral → `C:\CLAUDE\instrucoes.md`.
- Padrão de código/design do grupo → skill `bononi-padrao`.
