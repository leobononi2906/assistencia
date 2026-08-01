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

## Comercial (Venda/OS) — telas
`erp/vendas.js`: telas de **Vendas** e **Ordens de Serviço** (listar, abrir detalhe,
solicitar produto, **Finalizar** = financeiro, **Gerar NF-e** = acessório independente).
Backend: `vw_vendas`/`vw_os`, `erp_criar_venda`/`erp_criar_os`, `erp_venda_detalhe`/`erp_os_detalhe`.
