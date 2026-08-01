# ERP Bononi — Fiscal / NF-e

## Estratégia
Emissão de NF-e **sempre via API externa** (Focus NF-e ou NFe.io) — nunca assinatura/SEFAZ
na mão. O ERP monta os dados; a Edge Function chama o provedor.

## O que está pronto (independente do provedor)
- **`fn_gerar_nfe(origem, id_origem, id_natureza_op, ...)`** — gera a NF-e (status
  `PENDENTE`) a partir de uma **Venda** ou **OS**, criando `nfe` + `nfe_itens` com
  tributação (ICMS/ICMS-ST/IPI/PIS/COFINS) calculada pelo **grupo tributário** do produto,
  CFOP da natureza e NCM do produto. Numeração automática por empresa+série.
- **`fn_registrar_retorno_nfe(...)`** — grava o retorno da SEFAZ (chave, protocolo, status, XML).
- **`vw_nfe`** — listagem das notas.
- Wrappers `public.erp_gerar_nfe / erp_registrar_retorno_nfe / erp_nfe_payload`.
- Config: `nfe_ambiente` (HOMOLOGACAO/PRODUCAO), `nfe_serie`, `nfe_provider`.
- Front: tela **Fiscal → NF-e** (gerar da venda/OS, ver status, botão Emitir).
- Testado: geração de NF a partir de venda real (3 itens, ICMS/IPI corretos, CFOP 5102).

## O que depende da sua escolha (última milha)
- **Provedor**: Focus NF-e (adaptador já implementado como referência) vs NFe.io (stub a completar).
- **Certificado digital A1** por empresa (tabela `certificados_digital`, editável em Configurações).
- **Deploy da Edge Function `emitir-nfe`** + secrets (token do provedor). Ver
  `supabase/functions/emitir-nfe/README.md`.
- Homologação com contador antes de produção.

## Como usar (depois de escolher o provedor)
1. Cadastrar certificado e o grupo tributário/natureza corretos.
2. `deploy` da função + `secrets` do provedor.
3. Na venda/OS faturada → Fiscal → Gerar NF-e → Emitir.

---

## Config por empresa vs global (definido em 2026-08-01)
Regra: `configuracoes.id_empresa` preenchido = valor daquela empresa; nulo = padrão global.
Resolver **`fn_config(chave, id_empresa)`** = específico da empresa ↘ fallback global.

**Por empresa:** fiscal do produto (`produtos_fiscal_empresa`: grupo tributário/NCM/CEST/CST/origem),
preço (`produtos_precos`), estoque (por centro), grupos tributários, taxas, certificado,
série e ambiente de NF-e (config por empresa).

**Global (compartilhado):** identidade do produto (nome/ref/EAN/grupo/unidade/marca/aplicação/
equivalentes/composição), catálogo de formas/condições, unidades, cores.

A `fn_gerar_nfe` resolve grupo tributário, NCM, série e ambiente **pela empresa da nota**
(com fallback global). Testado: NCM e ambiente saem por empresa.

## Reforma Tributária — IBS / CBS / IS (definido em 2026-08-01)
Modelo preparado para a transição da LC 214/2025, convivendo com ICMS/ST/IPI/PIS/COFINS:
- **IBS** = IBS-UF + IBS-Município (substitui ICMS/ISS); **CBS** (substitui PIS/COFINS); **IS** (Imposto Seletivo).
- Alíquotas e reduções por **grupo tributário**: `aliq_ibs_uf`, `aliq_ibs_mun`, `aliq_cbs`, `red_ibs`,
  `red_cbs`, `aliq_is`, além de `cst_ibscbs`/`cclasstrib`/`cst_is`.
- **CST IBS/CBS** e **cClassTrib** podem ser definidos **por empresa** em `produtos_fiscal_empresa`
  (fallback no grupo tributário).
- `fn_gerar_nfe` calcula IBS-UF, IBS-Município, CBS (com reduções) e IS por item, grava em
  `nfe_itens` e totaliza em `nfe`; retorna `{ibs, cbs, is}`. **Testado** (rollback): venda de 3 itens,
  IBS 133,73 / CBS 98,06, CST e cClassTrib resolvidos por empresa.
- Tabelas de referência editáveis em **Configurações → Fiscal**: CST IBS/CBS (seed dos códigos padrão),
  cClassTrib e CST do Imposto Seletivo.

## Produtos — tela única (definido em 2026-08-01)
`erp/produtos.js`: lista + editor único com abas:
- **Identidade (global)**: nome, referência, EAN, grupo/subgrupo/marca/unidade, NCM e grupo tributário
  padrão, origem, custo/preço padrão, estoque min/máx, situação.
- **Preço por empresa**: grade por tabela de preço (Varejo, Ecommerce, Atacado…), FIXO ou por MARGEM.
- **Fiscal por empresa**: grupo tributário, NCM, CEST, CFOP, CST/CSOSN, alíquota ICMS, origem **e**
  CST IBS/CBS + cClassTrib da reforma. Mostra o grupo/NCM efetivos (empresa ↘ global).
Seletor de **empresa** no topo aplica às abas de preço e fiscal. Backend: `erp_produto_full`,
`erp_produto_salvar`, `erp_preco_empresa_salvar`, `erp_fiscal_empresa_salvar`.

## Comercial (Venda/OS) — telas
`erp/vendas.js`: telas de **Vendas** e **Ordens de Serviço** (listar, abrir detalhe,
solicitar produto, **Finalizar** = financeiro, **Gerar NF-e** = acessório independente).
Backend: `vw_vendas`/`vw_os`, `erp_criar_venda`/`erp_criar_os`, `erp_venda_detalhe`/`erp_os_detalhe`.
