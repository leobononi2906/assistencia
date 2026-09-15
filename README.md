# assistencia — ⛔ interface aposentada, repositório VIVO

## Não apague este repositório. Não apague este projeto na Vercel.

A interface antiga da Assistência foi **aposentada em 14/09/2026**, mas este
repositório hospeda **mais duas coisas que estão em produção**:

| O que | Onde | Situação |
|---|---|---|
| Interface da Assistência (raiz) | `index.html` | ⛔ **aposentada** — virou redirecionamento |
| **ERP Bononi** | `/erp` | ✅ **vivo**, servido neste mesmo endereço |
| **7 Edge Functions** | `/supabase/functions` | ✅ **em produção** |

As funções são `assist-perguntar`, `assist-resumo-ia`, `assist-kb-sync`,
`assist-material-pdf`, `assist-resumo-cron`, `credenciar-parceiro` e
`emitir-nfe`. **Edge Function publicada não devolve o código-fonte** — apagar
este repositório apagaria a única cópia. E apagar o projeto na Vercel derrubaria
o ERP junto.

> **Aposentar app antigo é por ARQUIVO, nunca por projeto ou repositório.**

## O que aconteceu com a interface

`assistencia.vercel.app` foi substituído por **`stonni-assistencia.vercel.app`**,
que reúne os dois módulos que existiam aqui (Assistência e Rede Autorizada) e tem
o ciclo novo de pagamento — orçamento → aceite da autorizada → NFS-e → PIX.

A raiz virou uma página de redirecionamento. `assistencia.js` e
`rede-autorizada.js` saíram do deploy e seguem no histórico do Git, no commit
anterior a `74a226b`. **`git revert` devolve a interface inteira.**

## O que foi conferido antes de desligar

Auditoria das duas interfaces **pelas tabelas que cada uma toca** — tabela usada
só aqui = função não portada. Deram 10. Depois, a medição de uso no banco, sobre
1.497 chamados:

| função que só existia aqui | uso real |
|---|---|
| abrir chamado a mão | **0** |
| vincular cliente do ERP | **0** |
| vincular OS ao chamado | **0** |
| causa do defeito · solução | **0** |
| peças do chamado | tabela vazia |
| NF no chamado | 1 |
| produto do chamado | 13 |
| procedência | 8 |
| follow-up de parceiro | 5 registros |
| tags de produtos atendidos | 4 nomes |

Telas construídas que a equipe nunca adotou. A **única** que importava — o editor
das **Regras da IA** (`assist_ia_regras.instrucoes`, campo vivo que as Edge
Functions leem e colam no prompt) — foi portada para a Assistência Stonni
**antes** da remoção.

Última ação real por esta interface: **10/09/2026**.

## Documentação

- [`docs/STATUS.md`](docs/STATUS.md) — histórico desta interface, com o aviso de
  aposentadoria no topo.
- `CONTEXTO-ASSISTENCIA.md` e os `ERP-*.md` descrevem o domínio e o ERP.
- O app que substituiu esta interface tem a documentação viva em
  `stonni-assistencia/docs/HANDOFF.md`.
