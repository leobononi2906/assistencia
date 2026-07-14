# credenciar-parceiro

Edge Function que cria o login do parceiro no Supabase Auth **já confirmado e sem
enviar e-mail**, usando `auth.admin.createUser` com a `service_role`.

## Por que existe
O provedor de e-mail embutido do Supabase é limitado (~2–4 e-mails/hora e só entrega
para membros da organização). Criar o usuário via `signup` no navegador disparava um
e-mail de confirmação e batia no erro `email rate limit exceeded`, travando o
credenciamento. Esta função não envia e-mail nenhum, então o limite deixa de existir.
A `service_role` fica no servidor, nunca no frontend.

## Contrato
`POST /functions/v1/credenciar-parceiro`

Headers: `apikey: <anon>`, `Authorization: Bearer <anon>`, `Content-Type: application/json`

Body:
```json
{ "email": "parceiro@exemplo.com", "password": "SenhaGerada123!" }
```

Resposta:
```json
{ "user_id": "uuid", "existed": false }
```
Se o e-mail já existir, a função **redefine a senha** daquele usuário e retorna
`{ "user_id": "uuid", "existed": true }` (serve de "reenviar acesso").

## Variáveis de ambiente
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente pelo
runtime do Supabase — não precisa configurar nada.

## Deploy
```bash
supabase functions deploy credenciar-parceiro
```
(ou via MCP do Supabase). O `verify_jwt = true` está declarado no `supabase/config.toml`.

## Onde é chamada
`rede-autorizada.js` → `raConfirmarCredenciamento()`.
