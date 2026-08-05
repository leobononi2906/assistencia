# Implantação — Auto-resumo IA + publicação do painel

> Instrução de implantação para a assistência. O pipeline de Resumo IA já está
> **construído e commitado** no branch `claude/ungler-segment-info-ctlolo` do repo
> `leobononi2906/assistencia`. `OPENAI_API_KEY` **já foi adicionado** no Supabase
> (áudio e vídeo já transcrevem via Whisper). Faltam **2 tarefas** para ir ao ar.

---

## 1. Publicar o painel

- O projeto Vercel **`assistencia`** faz deploy automático a cada push em `main`.
- **Ação:** revisar e mergear o branch `claude/ungler-segment-info-ctlolo` → `main`.
  As mudanças são **aditivas** em `assistencia.js`:
  - botão **🤖 Gerar Resumo IA** no drawer do chamado;
  - botão **⚙️ Regras** (editor das instruções da IA — tabela `assist_ia_regras`, id=1).
- Depois do merge, confirmar no Vercel que o deploy do projeto `assistencia` saiu **verde**.

---

## 2. Auto-gerar o resumo por **inatividade** (evita pegar conversa picada)

Em vez de gerar a cada mensagem (caro e pega a conversa pela metade — o cliente manda
texto, depois foto, depois áudio em *bursts*), gerar **quando a conversa assenta**.

Criar um **cron leve (`pg_cron`, a cada 5 min)** que chama a edge function já existente
**`assist-resumo-ia`** (aceita `{ chamado_id }`), só para os chamados que se encaixam:

| Condição | Ação |
|---|---|
| Tem mensagem nova desde o último resumo (ou nunca teve resumo) **E** última mensagem há **≥ 10 min** | **Gera / atualiza** o resumo |
| Nada novo desde `resumo_ia_em` | **Não faz nada** (não gasta à toa) |
| Chegou mídia nova (foto/áudio) depois do resumo | **Regera** (a URL da mídia só vem no 2º webhook da Umbler; os 10 min cobrem isso) |

**Por que 10 minutos:** é o tempo típico até a URL da imagem/áudio chegar no segundo
webhook da Umbler. Gerar antes disso traria "[sem imagem]".

**Arquitetura sugerida:**
- Uma função `assist-resumo-cron` que roda a query dos candidatos e invoca
  `assist-resumo-ia` para cada chamado elegível.
- `pg_cron` dispara `assist-resumo-cron` de 5 em 5 min.
- **Limitar** a quantidade de chamados por rodada (ex.: 20) para custo previsível.

**⚠️ Não tocar no `umbler-intake`** (receptor crítico — já causou sobrecarga do banco).
O cron deve ser totalmente isolado do fluxo de recebimento.

O botão **🤖 Gerar Resumo IA** no painel continua cobrindo o caso do atendente que quer
o resumo **na hora**, sem esperar os 10 min.

---

## Verificação final

1. Abrir um chamado real no painel → seção **🤖 Resumo IA** preenche
   **resumo + soluções sugeridas + link do vídeo**.
2. Confirmar que o **cron gerou sozinho** um chamado que ficou parado há > 10 min.
3. Testar um chamado com **áudio/vídeo** → conferir que a transcrição entra no resumo.

---

## Referência

- Design e detalhes do pipeline: `docs/IA-RESUMO-E-SOLUCOES.md`
- Edge function: `supabase/functions/assist-resumo-ia/index.ts`
- Migrations: `supabase/migrations/0001_assist_resumo_ia_e_kb_produto.sql`
