# Edge Function: emitir-nfe

Emissão de NF-e via provedor externo (Focus NF-e ou NFe.io), independente do resto do ERP.

## Fluxo
`{ id_nfe }` → lê `public.erp_nfe_payload(id_nfe)` → monta o request do provedor →
envia → grava o retorno em `public.erp_registrar_retorno_nfe(...)`.

## Secrets (configurar antes de usar — NÃO ficam no código)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `NFE_PROVIDER` = `FOCUS` (default) ou `NFEIO`
- Focus: `FOCUS_NFE_TOKEN`, `FOCUS_NFE_BASE` (ex.: https://homologacao.focusnfe.com.br)
- NFe.io: `NFEIO_API_KEY`, `NFEIO_BASE`, `NFEIO_EMPRESA_ID`

## Deploy (pendente — depende da escolha do provedor + certificado)
```
supabase functions deploy emitir-nfe
supabase secrets set NFE_PROVIDER=FOCUS FOCUS_NFE_TOKEN=... FOCUS_NFE_BASE=...
```
O adaptador Focus está implementado como referência; o NFe.io está com stub a completar
quando o provedor for definido. Homologar com um contador antes de produção.
