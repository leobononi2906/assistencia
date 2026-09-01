# Mapa de telas espelho — Rede Autorizada, Materiais e IA

> Atualizado: 2026-09-01
> Regra de ouro (Leo, 01/09): **a aplicação Assistência é a FONTE DA VERDADE.** Nas outras aplicações
> (Vendas, com_stonni, stonnidist, parceiro-stonni) essas mesmas visualizações têm **caráter apenas
> informativo (só leitura)**. **Toda alteração deve nascer na Assistência e ser replicada em TODAS as telas espelho.**

Por que isso importa: os dados (rede autorizada, materiais, base da IA) vivem no mesmo Supabase e são
consumidos por vários apps. Se a gente mexe só num lugar, os apps ficam divergentes (um mostra "Produtos
atendidos", outro não; um tem a tag nova, outro não). Este mapa existe pra que qualquer mudança seja feita
na Assistência primeiro e depois "descida" pra cada espelho.

---

## 1. REDE AUTORIZADA / Pontos de assistência
**Dados:** `assist_parceiros` (cadastro) · `assist_parceiro_produtos` (junção parceiro→tag) · `assist_parceiro_tags` (lista de tags: Ar Condicionado, Geladeira, Gerador, Outros).

| Papel | App | Onde (arquivo · função) | Edita? |
|---|---|---|---|
| **MASTER** | **assistencia** | `rede-autorizada.js` → aba "Parceiros Autorizados" (`raCarregarParceiros`, credenciar, drawer). Drawer completo com **tags de produto (CRUD)** em `assistencia.js` (`astParceiros.abrirDrawer`, tabela admin `assist_parceiro_tags` em Config → "🔧 Produtos atendidos (tags)"). | ✅ SIM |
| Espelho (leitura) | **bononi-vendas** | `index.html` → aba "Assistência": `renderAssistencia` / `carregarAssist` / `pintarAssistLista` / `abrirAssistDrawer` (localizador em mapa Leaflet). | ❌ só leitura |
| Perfil próprio (leitura) | **parceiro-stonni** | `index.html` → aba "Meus dados" (`renderPerfil`, `case 'perfil'`): portal onde a **própria autorizada logada** vê os PRÓPRIOS dados + **Produtos atendidos** (chips). Só leitura (atualização é no cadastro central). NÃO é localizador de rede. | ❌ só leitura |

> **com_stonni NÃO tem localizador de pontos** (só materiais/IA — ver abaixo).

**Exemplo de propagação já feito (01/09):** o Lucas (Ecom) pediu pra mostrar os **produtos atendidos**
(Ar/Geladeira/Gerador/Outros) no card da autorizada. As tags já existiam na MASTER (assistencia). Faltava
só o **espelho** — adicionei em **bononi-vendas** (chips na lista + drawer + filtro por produto). ✔️

---

## 2. MATERIAIS TÉCNICOS
**Dados:** `prt_materiais` (vídeos/PDFs/imagens técnicos). **Linhas de produto** (Geladeira/Ar-Condicionado/Gerador) = tabela **`prt_linhas_produto`** (slug, nome, ordem, ativo) — **fonte da verdade das linhas**. Edges de apoio: `assist-material-pdf`.

⚠️ **Regra crítica (01/09): as linhas NÃO são hardcoded.** Todos os apps leem `prt_linhas_produto`. Assim, criar/renomear uma linha no master (Assistência → Config → Linhas e Modelos) propaga o filtro/rótulo pra TODOS os espelhos sozinho. (Antes Vendas e o widget com_stonni/stonnidist tinham as 3 linhas fixas no código — corrigido.)

| Papel | App | Onde | Linhas |
|---|---|---|---|
| **MASTER** | **assistencia** | CRUD de materiais + KB (`rede-autorizada.js` Config → Materiais; linhas em Config → Linhas e Modelos). | 🟢 dinâmico |
| Espelho (leitura) | **bononi-vendas** | `index.html` → aba "Materiais": `renderMateriais` (+ `carregarLinhasProduto`). | 🟢 dinâmico |
| Espelho (leitura) | **com_stonni** | `materiais.js`, `crm/js/materiais.js` (`carregarLinhasProduto`); `catalogo.js` = uso separado (catálogos-modelo, categoria≈Catálogo). | 🟢 dinâmico |
| Espelho (leitura) | **stonnidist-v2** | `js/materiais.js` (widget idêntico ao `com_stonni/crm`). | 🟢 dinâmico |
| Espelho (leitura) | **parceiro-stonni** | `index.html` → aba "Material" (`renderMaterial`; já lia `prt_linhas_produto` + `prt_modelos_produto`). | 🟢 dinâmico |

> Fallback: os widgets mantêm as 3 linhas fixas só como rede de segurança se o fetch falhar; em condição normal, tudo vem do banco.

---

## 3. IA "Perguntar" (base de conhecimento compartilhada)
**Dados/serviço:** Edge `assist-perguntar` (responde da KB) + `assist-resumo-ia`, `assist-kb-sync`, `assist-material-pdf`. Base = `assist_kb_*` (sincronizada do Notion).

| Papel | App | Onde |
|---|---|---|
| **MASTER** (base + edges) | **assistencia** | `supabase/functions/assist-perguntar`, `assist-resumo-ia`, `assist-kb-sync`, `assist-material-pdf` + KB. |
| Espelho (mesmo widget/edge) | **bononi-vendas** | `index.html` → `iaPerguntar` (chama `/functions/v1/assist-perguntar`). |
| Espelho | **com_stonni** | `catalogo.js` / `materiais.js`. |
| Espelho | **stonnidist-v2** | `js/materiais.js`. |
| Espelho | **parceiro-stonni** | `index.html`. |

> O widget de IA e os materiais são **reúso** — o mesmo componente/edge roda em qualquer app Bononi
> (ver memória `materiais-ia-widget-reuso`). A base é única; muda-se na Assistência.

---

## 4. Checklist ao alterar (COLE no PR/registro)
**Mudou algo na REDE AUTORIZADA (campo, tag, exibição)?** Atualizar:
- [ ] **assistencia** (master — dado + edição)
- [ ] **bononi-vendas** (aba Assistência — espelho de leitura)
- [ ] **parceiro-stonni** (aba "Meus dados" — espelho do próprio parceiro)

**Mudou MATERIAIS (item)?** Atualizar: assistencia (master) → bononi-vendas · com_stonni · stonnidist-v2 · parceiro-stonni.
**Linha de produto nova/renomeada?** Só mexer no master (Config → Linhas e Modelos = `prt_linhas_produto`). Propaga sozinha pra todos os espelhos. NÃO hardcodar linha em app nenhum.

**Mudou a IA / KB?** Muda na assistencia (edge + base). Os espelhos pegam automático (mesmo edge) — só conferir o texto/UI do widget em cada app.

---

## 5. Armadilhas
- **Não editar a rede autorizada pelos espelhos.** Vendas/com_stonni leem como `anon` e são só consulta.
- As tags de produto vêm de `assist_parceiro_tags` (lista) — pra criar uma tag nova (ex.: "Bebedouro"),
  criar na Assistência (Config → Produtos atendidos) e ela aparece em todos os espelhos que listam tags.
- Cada espelho tem seu próprio estilo/tokens — replicar o **comportamento/dado**, não copiar CSS cru.
- `assist_parceiros` no localizador de Vendas filtra `status=eq.ativo` (só autorizadas ativas aparecem).
