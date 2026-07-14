import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const { email, password } = await req.json();
    if (!email || !password) return json({ error: "email e password são obrigatórios" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // cria já confirmado e SEM enviar e-mail (não passa pelo provedor de e-mail do Supabase)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!error && data?.user) {
      return json({ user_id: data.user.id, existed: false });
    }

    // e-mail já cadastrado → localizar e redefinir a senha (re-credenciamento)
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
      let uid: string | null = null;
      for (let page = 1; page <= 20 && !uid; page++) {
        const { data: list, error: le } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (le) break;
        const found = (list?.users || []).find(
          (u) => (u.email || "").toLowerCase() === String(email).toLowerCase(),
        );
        if (found) uid = found.id;
        if (!list || list.users.length < 200) break;
      }
      if (!uid) return json({ error: "e-mail já existe, mas não foi possível localizar o usuário" }, 409);

      const { error: ue } = await admin.auth.admin.updateUserById(uid, { password, email_confirm: true });
      if (ue) return json({ error: ue.message }, 500);
      return json({ user_id: uid, existed: true });
    }

    return json({ error: error?.message || "erro ao criar usuário" }, 500);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
