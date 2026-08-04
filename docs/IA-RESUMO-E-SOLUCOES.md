# IA na Assistência — Resumo da Reclamação + Sugestão de Soluções

> **Ideia (04/08/2026):** quando um chamado de garantia entra pela Umbler, a IA
> lê a conversa inteira (**texto + imagem + áudio + vídeo**), gera um **resumo
> estruturado da reclamação** e sugere as **soluções mais prováveis** — puxando
> do nosso banco de conhecimento no **Notion** — inclusive **qual vídeo do
> YouTube mandar** para o cliente.
>
> Documento de estudo/handoff. Nada aqui foi para produção ainda — é o desenho
> de como fazer, com uma **POC provada em um chamado real** (seção 2).

---

## 1. O que já temos hoje (a matéria-prima)

Tudo que a IA precisa **já está sendo capturado** pela fonte única da Umbler:

| Fonte | Onde | O que tem |
|---|---|---|
| Conversa do cliente | `umbler_mensagens` (Supabase) | texto, tipo (Text/Image/Audio/Video), direção (cliente/empresa), `arquivo` (URL da mídia no S3), ordem cronológica |
| Chamado | `assist_chamados` | vínculo `umbler_conversa_id`, cliente, produto, status |
| **Banco de soluções** | **Notion → 🪛 ASSISTÊNCIA TÉCNICA → PRODUTOS STONNI.** | 1 página por produto com **DEFEITOS E SOLUÇÕES** (sintoma → solução), **TABELA DE ERROS** (código → causa → solução) e **vídeos do YouTube já embutidos** nas soluções |

**Descoberta importante:** o mapa "qual vídeo mandar" **já existe** dentro do
Notion — cada solução que tem vídeo já traz o link do YouTube junto. Ex., na
página **Geladeira 30L**:

> **Geladeira aparece erro E1** → *Pedir para o cliente ajustar o nível de
> proteção da geladeira:* `https://youtu.be/FerO_Ytsc0I`

Ou seja: não precisamos "adivinhar" o vídeo — precisamos **casar o problema do
cliente com a solução certa** no Notion, e o vídeo vem junto.

---

## 2. POC em um chamado REAL (provado em 04/08/2026)

Chamado real puxado do `umbler_mensagens` (canal **SUPORTE STONNI**), conversa
`anDN6VML3ICHGNyL` — cliente **Zelão** (parceiro), sobre a geladeira do cliente
final **Elias**.

### 2.1. O que a IA leu (a conversa crua, resumida)
- "Pifou dinovo" / "Deu bom não"
- "Ela já veio duas vezes / E não resolveu"
- "Essa geladeira é aquela de semana passada? A do Elias?" → "Sim, do Elias"
- (empresa) "Ele falou que ela parou?"
- "Até o ideal seria bom mexer aqui, porque uma vez que mexeu aqui e não foi
  solucionado o problema do cliente"
- \+ 1 áudio e 1 imagem do cliente (na POC não transcritos; em produção entram
  no resumo — ver seção 3).

### 2.2. Resumo estruturado que a IA geraria (o "resumo_ia")

```
PRODUTO ......... Geladeira (linha portátil / compressor)
RECLAMAÇÃO ...... Geladeira voltou a apresentar defeito ("pifou de novo").
                  Cliente final: Elias. Reincidente.
DEFEITO PERCEBIDO Aparelho parou de funcionar / não gela.
HISTÓRICO ....... Já passou 2x pela assistência e o problema NÃO foi resolvido.
JÁ TENTADO ...... Dois reparos anteriores (sem sucesso).
URGÊNCIA/TOM .... Frustração — reincidência; parceiro sugere reavaliar o conserto.
FALTA INFO ...... Código de erro no display? Foto do painel? (pedir ao cliente)
```

### 2.3. Soluções sugeridas (casadas com o Notion "Geladeira 30L")

Ranqueadas por probabilidade, direto do banco de soluções:

1. **Compressor (mais provável — é reincidente).** Notion: *"Compressor está
   fazendo barulho / não gela → na maioria dos casos é o compressor; direcionar
   à assistência, fazer troca do compressor."* Como já foram 2 reparos sem
   sucesso, **trocar o compressor** é o caminho.
2. **Confirmar o código de erro.** Pedir foto do display. Se **E3** → "Proteção
   do compressor: desligar da tomada 30 min e reiniciar". Se **E1** → baixa
   tensão (testar 110/220V). *(TABELA DE ERROS do Notion.)*
3. **Vídeo para mandar ao cliente** (sai junto da solução no Notion): troca do
   sensor `https://youtu.be/1jbzjJSyBlg` — se o diagnóstico apontar sensor.

**Conclusão do atendente, pronta:** produto reincidente (2 reparos), sintoma =
parou/não gela → **abrir troca de compressor** e, antes, **confirmar o código de
erro no display** com uma foto. Isso é exatamente o tipo de resposta que o Codex
deu manualmente essa semana — só que **automática e no chamado**.

> Esse é o valor: o atendente abre o chamado e **já encontra** o resumo + as 3
> soluções mais prováveis + o vídeo certo, sem ler a conversa toda nem procurar
> no Notion.

---

## 3. Como funciona (arquitetura)

Duas peças independentes. Nenhuma altera o fluxo atual da Umbler — rodam **em
cima** do que já está gravado.

```
                    ┌─────────────────────────────────────────┐
                    │  A) RESUMO DA RECLAMAÇÃO (por chamado)    │
umbler_mensagens ──▶│  junta texto + transcreve áudio (Whisper)│──▶ assist_chamados
(1 conversa)        │  + descreve imagem/vídeo (visão)         │    .resumo_ia (novo)
                    │  → 1 chamada Claude → resumo estruturado  │    .resumo_ia_em
                    └─────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
Notion (produtos) ─▶│  B) BANCO DE SOLUÇÕES (RAG)               │
DEFEITOS/SOLUÇÕES   │  cada sintoma→solução(+vídeo) vira 1 chunk│──▶ assist_kb_solucoes
TABELA DE ERROS     │  embedding do sintoma (pgvector)         │    (produto,sintoma,
                    │  busca semântica pelo resumo do chamado  │     solucao,video_url,
                    └─────────────────────────────────────────┘     embedding)
                                     │
                                     ▼
                         Top-N soluções + vídeo → mostradas no chamado
```

### A) Resumo da reclamação
- **Gatilho:** quando o chamado é criado/atualizado (ou botão "gerar resumo" no
  painel da assistência, para começar sob controle).
- **Multimodal:**
  - **Texto** → direto.
  - **Áudio** → transcrever (Whisper/`gpt-4o-mini-transcribe`) antes; guardar a
    transcrição em `umbler_mensagens.arquivo->>'Transcription'` (o campo já
    existe no payload da Umbler, hoje vem `null`).
  - **Imagem/Vídeo** → visão do Claude descreve (ex.: "display mostrando E3").
    Vídeo: extrair 2–3 frames + áudio.
- **Saída:** texto estruturado (reclamação · produto · defeito · já tentado ·
  histórico · falta info) salvo em `assist_chamados.resumo_ia`.

### B) Banco de soluções (RAG a partir do Notion)
- **Ingestão:** ler as páginas de produto do Notion (DEFEITOS E SOLUÇÕES +
  TABELA DE ERROS), quebrar em chunks `{produto, sintoma, solucao, video_url}`,
  gerar embedding do sintoma e gravar em `assist_kb_solucoes` (pgvector).
  Re-sincronizar quando o Notion mudar (semanal ou botão "sincronizar").
- **Consulta:** embedding do `resumo_ia` do chamado → busca por similaridade →
  top-N soluções do **mesmo produto** primeiro, com o **vídeo do YouTube** que
  já vem no chunk.
- **Aprende com o histórico:** além do Notion, indexar também chamados
  **resolvidos** (`assist_defeitos`/`assist_causas`/`assist_solucoes`) para o
  banco melhorar sozinho com o que já foi resolvido de verdade.

---

## 4. Notion como fonte — organizar e (talvez) gerar PDF

- **Manter o Notion como a fonte de verdade** (é onde a equipe já edita). A IA
  **lê** o Notion; não precisamos migrar o conteúdo.
- **Organização sugerida** para a IA ler bem (e de quebra fica melhor pra
  equipe): manter em toda página de produto as 3 seções padronizadas —
  **DEFEITOS E SOLUÇÕES** (toggles sintoma→solução), **TABELA DE ERROS**
  (código→causa→solução) e **VÍDEOS** (links do YouTube junto da solução, como
  já está na Geladeira 30L). Quanto mais o sintoma estiver escrito como o
  cliente fala, melhor o casamento.
- **PDF:** dá pra gerar um PDF por produto (manual + defeitos/soluções) a partir
  do Notion — útil para o cliente/assistência externa. **Mas não é necessário
  para a IA** (a IA lê o Notion direto). Sugiro deixar o PDF como um "exportar"
  opcional, depois que o banco estiver rodando.
- **Vídeos do YouTube:** ficam **junto da solução** no Notion (já é assim). A IA
  só repassa o link do vídeo da solução escolhida. Não precisa de um "banco de
  vídeos" separado.

---

## 5. Custo (estimativa)

Volume assistência ≈ **texto 858 · áudio 136 · imagem 40 · vídeo 30** por período
de referência. Usando **Haiku 4.5** para o resumo (barato e suficiente):

| Item | Estimativa |
|---|---|
| Resumo (texto + visão de imagens) — Haiku | ~R$ 145/mês |
| Transcrição de áudios (Whisper) | ~R$ 30/mês |
| Embeddings (Notion + chamados) | centavos |
| Storage | ~R$ 1 (guardamos só texto derivado, não a mídia) |
| **Total** | **~R$ 150–320/mês** |

Storage é irrisório porque **não guardamos a mídia** — só o texto derivado
(resumo + transcrição). A mídia continua no S3 da Umbler.

---

## 6. O que precisa ser criado (mudanças propostas — nada aplicado ainda)

> Seguindo a regra: **schema é mostrado antes de aplicar.** Isto é só o desenho.

1. **Coluna** em `assist_chamados`:
   `resumo_ia text`, `resumo_ia_em timestamptz`, `resumo_ia_status text`.
2. **Tabela** `assist_kb_solucoes` (o banco RAG):
   `id, produto, sintoma, solucao, video_url, fonte ('notion'|'chamado'),
   fonte_id, embedding vector(1536), atualizado_em`. Extensão `pgvector`.
3. **Edge Function** `assist-resumo-ia`: recebe `chamado_id`/`id_conversa`, junta
   as mensagens, transcreve áudio, descreve imagem, chama o Claude, grava
   `resumo_ia`. **Sequencial, 1 chamado por vez** (regra anti-rajada).
4. **Edge Function** `assist-kb-sync`: lê o Notion, gera os chunks + embeddings,
   popula `assist_kb_solucoes`.
5. **Função de busca** `assist_kb_buscar(resumo, produto)`: retorna top-N
   soluções + vídeo por similaridade.
6. **UI** no painel da assistência (`index.html`/`assistencia.js`): mostrar o
   **Resumo IA** e as **Soluções sugeridas (+vídeo)** no chamado, com botão
   "gerar/atualizar".

---

## 7. Próximos passos (para retomar)

1. **Aprovar o schema** da seção 6 (mostrar SQL, aplicar após OK).
2. **POC ao vivo em 1 chamado:** rodar `assist-resumo-ia` no chamado do Zelão
   (com transcrição do áudio e visão da imagem reais) e comparar com a seção 2.
3. **Ingerir o Notion** (começar por Geladeira e AR — as páginas mais completas)
   e testar a busca de soluções.
4. **Ligar no painel** (botão manual primeiro; automático depois de validado).
5. Depois: indexar chamados resolvidos para o banco aprender com o histórico.

---

## Referências
- Conversa da POC: `umbler_mensagens` / `umbler_conversas` id `anDN6VML3ICHGNyL`.
- Banco de soluções: Notion **🪛 ASSISTÊNCIA TÉCNICA** (`185bfd20…`), páginas de
  produto (ex.: **Geladeira 30L** `24716a22…` — DEFEITOS E SOLUÇÕES + TABELA DE
  ERROS + vídeos).
- Arquitetura da fonte única da Umbler: `bononi-hub/docs/UMBLER-FONTE-UNICA.md`.
- Regras gerais e anti-rajada: `C:\CLAUDE\instrucoes.md`.
