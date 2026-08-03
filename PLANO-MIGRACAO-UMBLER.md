# Plano — Migração da Assistência para o novo modelo Umbler (fonte única)

> Documento de planejamento. **Nada de código do CRM foi alterado.** Objetivo:
> entender o que existe hoje e planejar a troca da ingestão da assistência para o
> modelo de **fonte única** da Umbler. Data: 03/08/2026.
> Projeto Supabase: `vishxwdxqiygbxmtpfoy`.

---

## 1. O que é o CRM da Assistência (não muda)

App estático (`index.html` + `assistencia.js` + `rede-autorizada.js`) que loga no
Supabase e **lê**:

| O front lê | De onde vem |
|---|---|
| Kanban / lista / cards de chamados | view **`assist_kanban`** (sobre `assist_chamados`) |
| KPIs e índice de defeito | views `assist_kpis`, `assist_indice_defeito` |
| Detalhe do chamado + "Conversa WhatsApp" | `assist_chamados` + `assist_followups` (filtra `tipo='whatsapp'` / `origem='whatsapp'`) |
| Banner "chamados novos" | `assist_chamados` com `umbler_conversa_id IS NOT NULL` |
| Lookups (status, setor, prioridade, defeito, causa…) | `assist_status`, `assist_setores`, etc. |

**Contrato de leitura que NÃO pode quebrar:**
- `assist_followups` de WhatsApp gravados com `tipo='whatsapp'`, `origem='Umbler'`,
  `umbler_mensagem_id` preenchido.
- `assist_chamados` com `umbler_conversa_id`, `telefone_normalizado`, `nome_contato`,
  `cliente_id_erp/nome_erp`, `status_id`, `setor_responsavel_id`, `data_ultimo_followup`,
  campos `*_umbler` e `tags_umbler`.
- A view `assist_kanban` continua sendo a única porta de entrada de leitura.

> A migração precisa manter **exatamente** essas colunas populadas. Se isso for
> respeitado, o front **não muda uma linha**.

---

## 2. Como a Umbler está implementada hoje

### 2.1 Fonte única (modelo NOVO — já roda no banco)
Aplicação Umbler **"Geral"** → Edge Function **`umbler-intake`** (`verify_jwt=false`):

1. Grava o **payload cru** em `umbler_eventos` (dedup por `event_id`) — nada se perde.
2. Faz **parse** e upsert em `umbler_conversas` (por `id_conversa`) e
   `umbler_mensagens` (por `event_id`).
3. Carimba cada registro com **`segmento`**, resolvido pelo de-para
   **`umbler_canal_segmento`** (`id_canal → segmento`). Canal novo entra como
   `pendente` (classificação manual depois).
4. **Roteia por segmento** reencaminhando o cru para a função do setor:
   - `assistencia` → `assistencia-umbler-webhook`
   - `ecommerce` → `Ecomm_UMBLER`
   - `atacado` → `UMBLERATC` (desligado por enquanto)

De-para atual (`umbler_canal_segmento`): `SUPORTE STONNI → assistencia`;
`OFICIAL LF/LV → ecommerce`; canais ATAC/Marketing ainda `pendente`.

Volume atual: `umbler_eventos` ~1518, `umbler_conversas` ~176, `umbler_mensagens` ~1336.

### 2.2 Assistência (modelo VELHO — ainda em produção)
`assistencia-umbler-webhook` recebe o cru do intake e **re-parseia o mesmo payload**
para escrever em `assist_chamados` + `assist_followups`. Regras de negócio que ela
carrega hoje:

- **Bloqueio de número** (`assist_numeros_bloqueados` por `telefone_norm` ativo).
- **Direção**: heurística `isOutgoing` (Direction/Type). Saída não abre chamado.
- **TAG → status**: `EM ATENDIMENTO`/`ATENDIMENTO` → status "Em atendimento".
- **Vínculo cliente ERP** por telefone via `assist_clientes_telefone_lookup` (`like`).
- **Abertura**: status default "Novo", setor default "Garantia", upsert por
  `umbler_conversa_id` (unique index FULL — corrigido em 31/07, antes era parcial e
  quebrava o `ON CONFLICT`).
- Grava `assist_followups` (`tipo='whatsapp'`, `origem='Umbler'`).

`umbler-backfill-assist` (cron 1/min) reprocessa `umbler_eventos` de segmento
`assistencia` ainda não roteados, chamando de novo o webhook (idempotente por
`umbler_mensagem_id`).

### 2.3 Diagnóstico
O parse acontece **duas vezes** sobre o mesmo payload: uma no `intake` (→ `umbler_mensagens`)
e outra no `assistencia-umbler-webhook` (→ `assist_*`). Dois pontos de verdade, duas
chances de divergir. `umbler_mensagens` já tem `direcao`, `conteudo`, `nome_atendente`,
`tags` prontos — o webhook está reinventando isso.

---

## 3. Modelo alvo

**Assistência consome a fonte única.** `assist_chamados`/`assist_followups` passam a ser
**projeção** de `umbler_conversas` + `umbler_mensagens` (segmento `assistencia`), em vez
de re-parse do payload cru. A view `assist_kanban` e o front continuam idênticos.

```
Umbler "Geral" ─▶ umbler-intake ─▶ umbler_eventos
                                   umbler_conversas   ──┐
                                   umbler_mensagens   ──┤ (segmento=assistencia)
                                                        ▼
                                             PROJETOR (regras de negócio)
                                                        ▼
                                        assist_chamados + assist_followups
                                                        ▼
                                            assist_kanban  ──▶  CRM (sem mudança)
```

### Duas opções de projetor
- **A) Edge Function `assist-projetar` (recomendado).** Lê `umbler_mensagens` novas de
  segmento `assistencia` e aplica as regras (bloqueio, tag→status, cliente ERP, setor
  Garantia, upsert por conversa). Disparada pelo `intake` logo após gravar (substitui a
  rota atual) e/ou por cron de segurança. Lógica de negócio fica **em um lugar só**, em
  TS, fácil de versionar.
- **B) Trigger no banco** `AFTER INSERT ON umbler_mensagens`. Sem edge function, mas
  espalha regra de negócio (busca ERP, bloqueio) em PL/pgSQL — mais difícil de manter.

**Recomendação: opção A.** É a menor mudança de mentalidade em relação ao que já existe
e mantém as regras testáveis.

---

## 4. Passo a passo da migração (sem tocar no front do CRM)

1. **Manter o webhook velho ligado** durante toda a transição (rollback trivial).
2. **Criar `assist-projetar`** consumindo `umbler_mensagens` (segmento `assistencia`,
   `direcao='cliente'` = incoming). Reaproveitar as regras do webhook:
   bloqueio de número, TAG→status, upsert por `umbler_conversa_id`, setor "Garantia",
   status "Novo". **Trocar** a busca de cliente para a RPC canônica
   `erp_cliente_por_telefone(p_tel)` (unifica DDI 55 e 9º dígito — o webhook velho ainda
   usa `like` na view, que é mais frágil).
3. **Shadow run:** rodar o projetor sem cutover, comparando contagem/linhas geradas
   contra o que o webhook produz (ex.: projetar num schema/tabela espelho ou só logar
   diffs). Validar que `assist_followups` e `assist_chamados` saem idênticos.
4. **Backfill idempotente** das 176 conversas / 1336 mensagens já em `umbler_*`
   (dedup por `umbler_mensagem_id` / `umbler_conversa_id`).
5. **Cutover:** no `umbler-intake`, trocar a rota `assistencia` de
   `assistencia-umbler-webhook` para `assist-projetar` (ou deixar o intake só gravar e o
   projetor rodar por cron/trigger). Desligar `umbler-backfill-assist`.
6. **Front do CRM:** **zero mudança.** Continua lendo `assist_kanban` / `assist_followups`.
   Esse é o critério de sucesso.
7. **Aposentar** `assistencia-umbler-webhook` só depois de alguns dias verdes.

---

## 5. Riscos e pontos de atenção

- **Contrato de leitura** (seção 1): se `assist_followups` deixar de sair com
  `tipo='whatsapp'` / `origem='Umbler'` / `umbler_mensagem_id`, a aba "Conversa WhatsApp"
  quebra. O projetor precisa replicar isso literalmente.
- **Direção:** usar `umbler_mensagens.direcao` (`cliente`/`empresa`) no lugar da heurística
  `isOutgoing`. Mensagem de saída **não abre** chamado — só muda status por tag.
- **Idempotência:** dedup por `event_id` (mensagem) e `umbler_conversa_id` (chamado, unique
  index FULL já existe). Backfill e reprocesso não podem duplicar followup.
- **Cliente ERP:** padronizar na RPC `erp_cliente_por_telefone` (o webhook velho usa `like`
  na view — manter os dois divergiria o vínculo).
- **Canais `pendente`:** enquanto ATAC/Marketing não forem classificados, não entram na
  assistência — ok, mas revisar o de-para antes do cutover.
- **`assist_webhook_debug`:** o webhook grava tudo lá (~490 linhas). No modelo novo o cru
  já vive em `umbler_eventos`; pode-se aposentar o debug próprio.

---

## 6. ⚠️ Segurança (fora do escopo da migração, mas obrigatório sinalizar)

O advisor do Supabase acusa **RLS desabilitado em 138 tabelas**, incluindo
`umbler_eventos`, `umbler_conversas`, `umbler_mensagens`, `umbler_canal_segmento` e as
`assist_*`. Com RLS off, **qualquer um com a anon key lê/grava todas as linhas** — inclui
telefones, nomes e conteúdo de conversa (PII). Recomendação: habilitar RLS + policies
antes/junto da migração. **Não aplicar automaticamente** (ligar RLS sem policy bloqueia o
acesso do app) — decisão e policies com o dono.

---

## 7. Inventário de referência

**Edge Functions (Umbler):** `umbler-intake` (receptor único), `assistencia-umbler-webhook`
(legado assistência), `Ecomm_UMBLER` (ecommerce), `UMBLERATC` (atacado, off),
`umbler-backfill-assist` (cron reprocesso).

**Tabelas fonte única:** `umbler_eventos`, `umbler_conversas`, `umbler_mensagens`,
`umbler_canal_segmento`.

**Tabelas/views assistência:** `assist_chamados`, `assist_followups`, `assist_kanban`,
`assist_kpis`, `assist_indice_defeito`, `assist_numeros_bloqueados`, lookups `assist_*`,
`assist_clientes_telefone_lookup`, RPC `erp_cliente_por_telefone`.
