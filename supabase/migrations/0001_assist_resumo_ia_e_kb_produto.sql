-- IA na assistência (v1): resumo do chamado + cache do conhecimento do Notion.
-- Puramente ADITIVO: não altera nenhuma coluna existente nem o fluxo do webhook.
-- Aplicada em 04/08/2026 no projeto vishxwdxqiygbxmtpfoy.

alter table public.assist_chamados
  add column if not exists resumo_ia          jsonb,        -- {produto, reclamacao, defeito, ja_tentado, urgencia, falta_info}
  add column if not exists resumo_ia_solucoes jsonb,        -- [{solucao, video_url, confianca}]
  add column if not exists resumo_ia_em        timestamptz,
  add column if not exists resumo_ia_modelo    text;

-- Cache do conhecimento do Notion por produto (SEM embeddings; texto puro).
-- A base é pequena; o próprio modelo casa a reclamação com a solução.
create table if not exists public.assist_kb_produto (
  id            bigint generated always as identity primary key,
  produto       text not null,
  notion_id     text,
  conteudo_md   text not null,          -- DEFEITOS E SOLUÇÕES + TABELA DE ERROS + vídeos
  atualizado_em timestamptz not null default now()
);
create unique index if not exists ux_assist_kb_produto_notion
  on public.assist_kb_produto (notion_id);

grant select, insert, update on public.assist_kb_produto to anon, authenticated;
