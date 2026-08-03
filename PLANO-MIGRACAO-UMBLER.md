# Plano — Migrar o Umbler do CRM Atacado (stonnidist-v2) para o modelo de fonte única

> Planejamento. **Nenhum código do CRM (`stonnidist-v2`) foi alterado.** Este doc só
> entende o que existe e planeja a troca do Umbler do **atacado** para o **modelo de
> fonte única** (`umbler-intake`) já usado pela assistência. Data: 03/08/2026.
> Supabase: `vishxwdxqiygbxmtpfoy`.
>
> ⚠️ Três coisas SEPARADAS, não confundir:
> - **Assistência** (repo `assistencia`) — já migrado, tabelas `assist_*`. Fora deste plano.
> - **CRM Atacado = Umbler atacado** (repo `stonnidist-v2`) — **É O ALVO DESTE PLANO.**
> - **Ecommerce** (`Ecomm_UMBLER`) — já roteado pela fonte única. Fora deste plano.

---

## 1. O que é o CRM Atacado (não muda)

App HTML/JS puro (`stonnidist-v2`, deploy Vercel na `main`). Login Supabase. Só **lê**
do banco. O que ele usa do Umbler:

| Onde (`js/`) | Lê de | Pra quê |
|---|---|---|
| `data.js loadUmbler` | `atac_umbler_contatos` (`nao_comercial=false`) | Fila **"Contatos Sem Tratativa"** (lead sem vínculo no ERP) |
| `data.js loadContatos` | `atac_umbler_contatos` (período) | **Esforço por vendedor** (Falados/Atendimentos no ranking) |
| `data.js loadDetalhe` | `atac_umbler_contatos` por telefone | Umbler no drawer do cliente |
| `data.js loadUmblerVendMap` | `atac_umbler_vendedor` | De-para atendente Umbler → vendedor ERP |
| `umbler.js` | escreve `atac_cliente_telefones`, `atac_cliente_vendedor`, `atac_clientes` | Vincular contato a cliente / criar lead |

**Modelo de dados do atacado é LEVE:** `atac_umbler_contatos` = **1 linha por telefone**
(upsert por `telefone`), não é log de mensagem. Guarda: último contato, atendente, inbox,
tags, `nao_comercial` + motivo, e já tem coluna `id_conversa_umbler`. Volume: **1656
contatos** (796 comerciais). `atac_umbler_vendedor`: 11 mapeamentos.

**Contrato de leitura que NÃO pode quebrar:** `atac_umbler_contatos` precisa continuar
com as colunas `telefone, nome_contato, ultimo_contato, nome_atendente,
id_atendente_umbler, inbox_umbler, tags, nao_comercial, motivo_nao_comercial`,
1 linha por telefone, comercial = `nao_comercial=false`.

---

## 2. Como o Umbler do atacado funciona HOJE (modelo velho)

App Umbler **próprio do atacado** → webhook direto na Edge Function **`UMBLERATC`**
(`verify_jwt=false`). **NÃO passa pela fonte única.** Prova no banco:
`umbler_conversas` com `segmento='atacado'` = **0**; canais ATACADO/JOÃO/GUILHERME/ANA/
IGUI/MARKETING ainda `pendente` no de-para `umbler_canal_segmento`.

Regras de negócio que o `UMBLERATC` carrega (precisam sobreviver à migração):
1. **Segmentação por TAG:** tags `ECOMMERCE` / `ASSISTENCIA` → `nao_comercial=true` (não é
   atacado). Correção do lead de ECOMMERCE que foi etiquetado DEPOIS da 1ª mensagem.
2. **Atendente:** `id_membro` → `atac_umbler_vendedor.id_membro_umbler`; fallback por
   inbox exclusivo (inbox com 1 vendedor ativo só). Inbox geral "ATACADO" fica sem dono.
3. **Não sobrescrever** `nao_comercial=true` manual com `false`; não apagar atendente com vazio.
4. **Auto-vínculo ERP** via RPC **`buscar_cliente_por_telefone`** (⚠️ RPC do ATACADO,
   busca `atac_clientes` — NÃO é a `erp_cliente_por_telefone` da assistência).
5. **Upsert por `telefone`**.

---

## 3. O modelo NOVO (fonte única) — como a assistência já faz

App Umbler **"Geral"** → **`umbler-intake`** grava tudo em:
`umbler_eventos` (cru, dedup por `event_id`), `umbler_conversas` (1/conversa),
`umbler_mensagens` (1/mensagem). Carimba `segmento` pelo de-para **por CANAL**
(`umbler_canal_segmento: id_canal → segmento`) e **roteia** pro webhook do setor.
Hoje o roteamento do atacado está **comentado**: `// atacado: 'UMBLERATC'`.

**Diferença conceitual crítica:** fonte única segmenta **por CANAL**; o `UMBLERATC`
segmenta **por TAG**. Precisa conciliar (ver §5).

---

## 4. Modelo alvo do atacado

Atacado passa a receber pela **fonte única** (`umbler-intake`), e `atac_umbler_contatos`
vira **projeção** de `umbler_conversas` (segmento `atacado`) + as regras do §2. O CRM
**não muda** — continua lendo `atac_umbler_contatos`.

```
Umbler "Geral" ─▶ umbler-intake ─▶ umbler_eventos / umbler_conversas / umbler_mensagens
                     (segmento por canal)          │  (segmento=atacado)
                                                    ▼
                                     PROJETOR atacado (regras do UMBLERATC)
                                                    ▼
                                          atac_umbler_contatos  ──▶  CRM (sem mudança)
```

### Duas opções
- **A) Reusar o `UMBLERATC` como projetor (menor risco, recomendado pra 1ª fase).**
  Classificar os canais atacado no de-para e **ligar a rota** `atacado: 'UMBLERATC'` no
  intake. O `UMBLERATC` continua igual (recebe o mesmo payload cru, agora vindo do intake
  em vez do app próprio) e segue populando `atac_umbler_contatos`. Ganho imediato: todo
  contato atacado passa a existir também em `umbler_conversas/mensagens` (log completo,
  histórico de mensagem que hoje o atacado NÃO tem).
- **B) Projetor novo lendo `umbler_conversas` (fim de estado).** Move as regras do §2 pra
  um projetor que lê a fonte única; aposenta o `UMBLERATC`. Só depois da fase A estável.

**Recomendação:** fazer **A primeiro** (ligar na fonte única sem mexer na lógica), medir,
depois avaliar **B**.

---

## 5. Passo a passo (sem tocar no repo do CRM)

1. **Classificar os canais do atacado** em `umbler_canal_segmento`: `ATACADO`, `JOÃO ATAC`,
   `GUILHERME ATAC`, `ANA ATAC`, `IGUI ATAC` → `segmento='atacado'`. Decidir `MARKETING`
   (provável `pendente`/próprio). Hoje todos estão `pendente`.
2. **Apontar o app Umbler do atacado para a Aplicação "Geral"** (ou o webhook do intake),
   deixando de bater direto no `UMBLERATC`. Assim o intake vira o único receptor.
3. **Ligar a rota** no `umbler-intake`: `atacado: 'UMBLERATC'` (hoje comentada).
4. **Conciliar segmentação canal × tag (o ponto sensível):** no modelo novo o ecommerce tem
   canais próprios (OFICIAL LF/LV). Mas o `UMBLERATC` ainda filtra por tag
   `ECOMMERCE/ASSISTENCIA`. Manter o filtro por tag no `UMBLERATC` durante a fase A (defesa
   em profundidade). Na fase B, decidir se a segmentação passa a ser 100% por canal.
5. **Idempotência / não duplicar:** `atac_umbler_contatos` é upsert por `telefone` → reprocesso
   é seguro. Preencher `id_conversa_umbler` (coluna já existe) com `umbler_conversas.id_conversa`.
6. **Backfill opcional:** reprocessar `umbler_eventos` de segmento atacado (quando existirem)
   pro `UMBLERATC`, nos moldes do `umbler-backfill-assist` da assistência.
7. **CRM (`stonnidist-v2`): ZERO mudança.** Continua lendo `atac_umbler_contatos`. Critério
   de sucesso.
8. **Rollback trivial:** reapontar o app do atacado de volta pro webhook `UMBLERATC` direto.

---

## 6. Riscos e atenção

- **Ordem de ativação:** o comentário no intake diz *"atacado POR ÚLTIMO"*. Ligar só depois
  de assistência e ecommerce estáveis (estão).
- **Segmentação dupla (canal × tag):** maior risco. Um contato no canal ATACADO com tag
  ECOMMERCE precisa continuar caindo como `nao_comercial`. Manter o filtro de tag do
  `UMBLERATC` na fase A resolve.
- **Inbox/atendente:** o de-para `atac_umbler_vendedor` usa `inbox_umbler` e `id_membro_umbler`.
  A fonte única passa `Channel.Name` (=inbox) e `LastOrganizationMember.Id` (=id_membro) —
  compatível com o que o `UMBLERATC` já lê. Conferir que o nome do canal bate.
- **RPC certa:** manter `buscar_cliente_por_telefone` (atacado). NÃO trocar pela
  `erp_cliente_por_telefone` (assistência) — buscam tabelas diferentes.
- **Volume:** 1656 contatos hoje; a fila "Sem Tratativa" (796 comerciais) não pode inflar
  nem sumir no cutover — comparar contagem antes/depois.

---

## 7. ⚠️ Segurança (sinalização obrigatória)

Advisor do Supabase: **RLS desabilitado em 138 tabelas**, incluindo `atac_umbler_contatos`,
`atac_umbler_vendedor`, `atac_cliente_telefones`, `atac_clientes` e as `umbler_*`. Com RLS
off, qualquer um com a anon key lê/grava tudo (telefones, nomes, tags — PII). Recomendo
habilitar RLS + policies. **Não aplicar automático** (ligar RLS sem policy trava o app) —
decisão do dono.

---

## 8. Inventário de referência

**Edge Functions:** `umbler-intake` (receptor único), `UMBLERATC` (webhook atacado, hoje
recebe direto do app próprio), `Ecomm_UMBLER` (ecommerce, já roteado), `assistencia-umbler-webhook`
(assistência, já roteado).

**Fonte única:** `umbler_eventos`, `umbler_conversas`, `umbler_mensagens`, `umbler_canal_segmento`.

**Atacado (CRM):** `atac_umbler_contatos` (1/telefone, 1656), `atac_umbler_vendedor` (de-para, 11),
`atac_cliente_telefones`, `atac_cliente_vendedor`, `atac_clientes`, RPC `buscar_cliente_por_telefone`.

**Repo CRM (só leitura):** `leobononi2906/stonnidist-v2` — `js/umbler.js`, `js/data.js`
(`loadUmbler`/`loadContatos`/`loadUmblerVendMap`), `_HANDOFF.md`, `_PROGRESSO.md`.
