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
