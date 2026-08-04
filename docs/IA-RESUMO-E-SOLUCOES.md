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

## 2. POC AO VIVO (provada em 04/08/2026)

Chamado real do `umbler_mensagens` (canal **SUPORTE STONNI**), conversa
`anDkfthp-WoTgdbt` — cliente **Leonardo Bomfim**, **gerador que não dá partida**
(o cliente depende do gerador para ligar o caminhão). **Nesta POC a imagem foi
lida de verdade por visão** (baixada do S3 da Umbler) e a solução veio **de
verdade do Notion** (página "Gerador"). Só o áudio não foi transcrito (em
produção é uma chamada Whisper — ver seção 3).

### 2.1. O que a IA leu (dados reais)
- **Texto (cliente):** *"como que eu vou ficar sem gerador esses dias, meu
  caminhão não liga sem o gerador… enquanto vcs vão ver o que tá acontecendo eu
  faço como?"* → urgência: veículo parado.
- **Texto (empresa):** *"Pedi para o cliente abrir a frente do gerador… ver se é
  o fusível que está queimado"* + foto *"Verifique esse fusível"*.
- **Imagem lida por visão (real, nesta POC):** um **bloco distribuidor de
  energia / porta-fusível** cromado, com fusível verde translúcido e terminais —
  exatamente o ponto que o técnico mandou conferir.
- **Resolução no fim do chat:** *"após a análise, tudo indica que o problema está
  na placa ou no carburador… será necessário trazer o gerador para a assistência
  para laudo e reparo em garantia."*
- \+ vários áudios do cliente (não transcritos nesta POC).

### 2.2. Resumo estruturado que a IA gera (o "resumo_ia")

```
PRODUTO ......... Gerador (12/24V)
RECLAMAÇÃO ...... Gerador não dá partida; cliente depende dele p/ ligar o caminhão.
DEFEITO PERCEBIDO Falha na partida / não liga.
JÁ TENTADO ...... Abrir a frente e verificar o fusível (foto conferida).
IMAGEM .......... Bloco de fusível/distribuidor — fusível aparentemente íntegro.
DIAGNÓSTICO ..... Não é só o fusível; indícios de placa ou carburador.
URGÊNCIA/TOM .... Alta — veículo parado sem o gerador.
FALTA INFO ...... Código de erro no display (Exx)?
```

### 2.3. Soluções sugeridas (casadas com o Notion "⚡ Gerador")

Ranqueadas por probabilidade, direto do banco de soluções (TABELA DE ERROS real):

1. **E04 – Falha na partida (mais provável).** Checklist do Notion: 1) bateria
   18–32V; 2) combustível; 3) **carburador e sistema de combustível**; 4) vela de
   ignição; 5) partida manual → automático. *(Bate com o diagnóstico do próprio
   técnico: carburador.)*
2. **Confirmar o código no display:** E20 = bateria <16V; E10 = voltagem alta;
   E80 = só alerta de troca de óleo (não é defeito).
3. **Vídeo para mandar ao cliente** (já no Notion, junto do produto): *"primeira
   partida do gerador"* `https://www.youtube.com/shorts/1bKsBfcMeqY` e os vídeos
   de **teste 12V/24V**.
4. Se descartar fusível + checklist E04 → **encaminhar à assistência p/ laudo** —
   que foi exatamente a decisão do técnico.

**Conclusão pronta pro atendente:** não é só o fusível (imagem confere) → seguir
o checklist E04 (foco em **carburador**), mandar o vídeo da primeira partida e,
não resolvendo, abrir laudo em garantia. Isso é o mesmo que o Codex fez manual
essa semana — só que **automático e já dentro do chamado**.

> Esse é o valor: o atendente abre o chamado e **já encontra** o resumo + as
> soluções mais prováveis + o vídeo certo, sem ler a conversa toda nem garimpar
> no Notion. **Tudo nesta POC é rastreável a dado real** (conversa + imagem lida
> + página do Notion + link de vídeo).

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
- Conversa da POC: `umbler_mensagens` / `umbler_conversas` id `anDkfthp-WoTgdbt`
  (gerador — imagem do fusível lida por visão). Caso extra pronto p/ transcrição:
  `alfRp4o4ZyrR2NL9` (valmir, 11 áudios com URL válida).
- Banco de soluções: Notion **🪛 ASSISTÊNCIA TÉCNICA** (`185bfd20…`), páginas de
  produto — ex.: **⚡ Gerador** (`1ba16a22…` — TABELA DE ERROS E04/E20/E10/E80 +
  vídeos do YouTube) e **🧊 Geladeira 30L** (`24716a22…` — DEFEITOS E SOLUÇÕES +
  TABELA DE ERROS + vídeos).
- Arquitetura da fonte única da Umbler: `bononi-hub/docs/UMBLER-FONTE-UNICA.md`.
- Regras gerais e anti-rajada: `C:\CLAUDE\instrucoes.md`.
