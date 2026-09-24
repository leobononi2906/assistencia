# STATUS — Assistência Técnica (Garantia Stonni)

> Atualizado: 2026-09-24
>
> **24/09/2026:** criado `.vercelignore` — `supabase/`, `docs/` e os `.md` respondiam 200 em
> `assistencia.vercel.app` sem login (código das Edge Functions, migrations, ERP-*.md).
> `index.html` e `erp/` seguem publicados.

> ## ⛔ ESTA INTERFACE FOI APOSENTADA EM 14/09/2026
>
> `assistencia.vercel.app` **não é mais o app da Assistência.** A raiz virou uma
> página de redirecionamento para **`stonni-assistencia.vercel.app`**, que reúne
> os dois módulos que existiam aqui (Assistência e Rede Autorizada) e tem o ciclo
> novo de pagamento (orçamento → aceite → NFS-e → PIX). `assistencia.js` e
> `rede-autorizada.js` saíram do deploy — seguem no histórico do Git,
> commit `74a226b`. `git revert` devolve tudo.
>
> **O QUE FOI CONFERIDO ANTES DE DESLIGAR.** Auditoria das duas interfaces pelas
> tabelas que cada uma toca (tabela usada só aqui = função não portada): deu 10.
> Medido no banco, sobre 1.497 chamados: abrir chamado a mão **0**, vincular
> cliente do ERP **0**, vincular OS **0**, causa **0**, solução **0**, peças do
> chamado **tabela vazia**, NF no chamado **1**, produto do chamado **13**,
> procedência **8**, follow-up de parceiro **5 registros**, tags **4 nomes**.
> Telas construídas que a equipe nunca adotou.
>
> A **única** que importava — o editor das **Regras da IA**
> (`assist_ia_regras.instrucoes`, campo vivo que as Edge Functions leem) — foi
> portada para a Assistência Stonni **antes** da remoção.
>
> Última ação real por aqui: **10/09/2026**.
>
> ### ⚠️ ESTE REPOSITÓRIO TEM MAIS DOIS INQUILINOS — NÃO APAGUE
> - **`/erp`** — "ERP Bononi", outro app, **vivo** no mesmo endereço. Apagar o
>   projeto na Vercel derrubaria ele junto.
> - **`/supabase/functions`** — fonte das **7 Edge Functions em produção**:
>   `assist-perguntar`, `assist-resumo-ia`, `assist-kb-sync`,
>   `assist-material-pdf`, `assist-resumo-cron`, `credenciar-parceiro`,
>   `emitir-nfe`. Apagar o repositório apagaria a fonte delas — e Edge Function
>   publicada não devolve o código.
>
> **Aposentar app antigo é por ARQUIVO, nunca por projeto ou repositório.**
>
> O que está abaixo desta linha descreve a interface como ela era até 14/09/2026,
> e fica como registro.

## O que é
Kanban de chamados de assistência técnica (garantia Stonni), alimentado pela Umbler (WhatsApp). Tem **Resumo IA** por chamado, roteamento automático por setor, categoria por IA e um assistente "Perguntar à IA" que responde sobre os equipamentos.

## Onde está
- **Clone real (git):** `C:\CLAUDE\Projetos GitHub\assistencia\assistencia` (remote `leobononi2906/assistencia`, branch `main`).
  ⚠️ A pasta externa `assistencia\` é wrapper sem git — não editar lá. **Repo é MONOREPO:** a `main` recebe também todo o ERP (pasta `erp/`) → **`git fetch` + rebase ANTES do push** (a main avança sozinha).
- **Deploy:** Vercel projeto `assistencia` (team `team_1gQ3sv5QNPN4xl6scwftLoNO`), push na `main` → auto. **Meu push é bloqueado pelo classifier → o Leo dá o push.**
- **Supabase:** `vishxwdxqiygbxmtpfoy` (tabelas `assist_*`, materiais `prt_materiais`, intake `umbler_*`).
- **Código:** `assistencia.js` + `index.html` na raiz do clone.

## Stack
HTML/JS puro + Supabase (Auth + Edge Functions + pg_cron). IA: Anthropic (resumo/perguntar, obrigatória) + OpenAI Whisper (transcrição de áudio, opcional).

## Fluxo de dados
Umbler → Aplicação **"GERAL SUPABASE"** → edge `umbler-intake` → `assistencia-umbler-webhook` cria/atualiza chamado (`upsert onConflict:umbler_conversa_id`, exige índice único **FULL**). Cliente que digita "3" no menu do WhatsApp cai no canal assistência.

## Estado atual (em produção)
- **Resumo IA** (edge `assist-resumo-ia`, Haiku, texto+imagem+Whisper): 1ª seção do drawer, chip de categoria (Ar/Geladeira/Gerador/Outros → coluna `categoria_ia`), aviso de áudio não transcrito.
- **Roteamento de setor** — precedência **MANUAL > etiqueta "Operação" (contato Umbler) > IA**. Fonte única `assist_resolver_setor()`. IA só roteia no status Novo. Etiqueta "consumida" ao finalizar (`assist_tag_op_consumida`).
- **Prioridade no card** (`assist_prioridades` 1–4, selo + seletor no drawer).
- **Fecha na Umbler → conclui no dash** (sinal `umbler_conversas.aberta` = `ChatClosed`; reabre se voltar).
- **Perguntar à IA** — FAB global + edge `assist-perguntar` (base Notion `assist_kb_produto` + `prt_materiais` ao vivo + Dicas + Regras). PDFs de material processados por `assist-material-pdf` (unpdf + resumo Claude).
- **Prioridade por recência** (`assist-perguntar` v4, `assist-resumo-ia` v16) — cada fonte é carimbada com data (Notion "atualizado em", Materiais "doc de") e ordenada do mais novo ao mais antigo; regra no prompt: **Dicas > documento mais recente > Notion**; info nova sobre o mesmo tema substitui a antiga.
- **Materiais Técnicos** (Rede Autorizada → Configurações) — grid de cards (antes tabela): vídeo com thumbnail real do YouTube, selo de status na IA por card (PDF "IA lê o PDF" / OCR / "Na IA"), chips de filtro por tipo. Já cadastrados os PDFs oficiais **Gerador** (id 20) e **Ar** (id 21), extraídos.
- **Sincronizar base do Notion** (edge `assist-kb-sync`, requer `NOTION_API_KEY`) — botão dentro do chamado: seção "🤖 Resumo IA & Soluções" → **⚙️ Regras** → **🔄 Sincronizar do Notion** (manual).
- **Cron do resumo** — `assist-resumo-cron-30min` (jobid 51, inteligente, teto 20/rodada). **PAUSADO em 07/08** pelo Leo até a equipe começar a usar (reativar: `cron.alter_job(51, active:=true)`). Botão manual sempre funciona.

## Dados
561 chamados, 482 concluídos; **548 sem produto** (por isso a categoria por IA importa). `assist_kb_produto` só tem 5 produtos — expandir a cobertura da KB (Notion 🪛 ASSISTÊNCIA TÉCNICA) é o que mais melhora as soluções.

## Pendências / próximos passos
- [ ] **Gestão por categoria E por setor** (contagem/visão usando `categoria_ia` + setor Garantia/Operações).
- [ ] **Retroalimentar**: ao concluir o card, registrar "o que foi feito" (defeito/causa/solução) → base de aprendizado. Campos existem, hoje 100% vazios.
- [ ] **Lacuna de ingestão de mídia**: muitos áudios antigos sem URL salva (a Umbler manda a URL num evento posterior não capturado) → sem URL não transcreve.
- [ ] **Notas do cliente da Umbler** não chegam no webhook — puxar pela API por contato (futuro).
- [ ] Performance do drawer.

## Dívidas e armadilhas conhecidas
- Índice de `ON CONFLICT` tem que ser **FULL** (parcial não serve no PostgREST) — já causou parada de chamados 09/07→31/07.
- Se a Aplicação "GERAL SUPABASE" cair na Umbler, **nenhum chamado novo nasce** (já aconteceu em 30/07).
- Créditos: Anthropic acabando → erro visível no Gerar; OpenAI → áudio "[não transcrito]" silencioso.
- Umbler fecha por inatividade → pode concluir caso com peça em trânsito (Leo aceitou o risco).

## Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/IA-RESUMO-E-SOLUCOES.md` | como a IA lê o chamado que entra pela Umbler (texto, imagem, áudio e vídeo) e produz o resumo da reclamação + sugestão de solução. **Leia antes de mexer em prompt, crédito de API ou no `assist-resumo-ia`.** |
| `docs/MAPA_TELAS_ESPELHO.md` | quais telas existem em duplicata na Rede Autorizada, Materiais e IA, e a regra do Leo (01/09) de que **a Assistência é a fonte da verdade**. Leia antes de portar correção entre os apps. |

## Dev-log
- 2026-08-11 — Prioridade por recência nas 2 funções de IA (Dicas > doc novo > Notion; carimbo de data) — `assist-perguntar` v4, `assist-resumo-ia` v16. Materiais virou grid de cards (thumbnail YouTube + selo IA); aba renomeada "Materiais Técnicos". Cadastrados os PDFs oficiais Gerador (id 20) e Ar (id 21). Commits ba57639, 3241ef6, 560e836.
- 2026-08-06/07 — v15 (precedência de setor + etiqueta consumida), fecha-na-Umbler, prioridade no card, cron inteligente reintroduzido e depois pausado, Materiais/PDF alimentando a IA.
- 2026-07-31 — Índice único FULL corrigiu a parada de chamados; produção reiniciada limpa (482 concluídos).
