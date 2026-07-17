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

// usuário interno do grupo = tem admin=true ou lista de modulos
function ehInterno(meta: Record<string, unknown> | null | undefined) {
  const m = meta || {};
  if (m.admin === true) return true;
  return Array.isArray(m.modulos) && (m.modulos as unknown[]).length > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // ---------- 1. QUEM ESTÁ CHAMANDO ----------
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "não autenticado" }, 401);

    const { data: callerData, error: callerErr } = await admin.auth.getUser(token);
    const caller = callerData?.user;
    // anon key / service key não têm usuário por trás -> caem aqui
    if (callerErr || !caller) {
      return json({ error: "sessão inválida — faça login na Gestão e tente de novo" }, 401);
    }

    const callerUser = (caller.user_metadata || {}) as Record<string, unknown>;
    const callerApp = (caller.app_metadata || {}) as Record<string, unknown>;

    // parceiro nunca credencia ninguém (app_metadata o usuário não consegue editar)
    if (callerApp.perfil === "parceiro") {
      return json({ error: "sem permissão para credenciar" }, 403);
    }

    const podeCredenciar =
      callerUser.admin === true ||
      (Array.isArray(callerUser.modulos) && (callerUser.modulos as string[]).includes("assistencia"));

    if (!podeCredenciar) {
      return json({ error: "sem permissão para credenciar" }, 403);
    }

    // ---------- 2. DADOS ----------
    const { email, password } = await req.json();
    if (!email || !password) return json({ error: "email e password são obrigatórios" }, 400);
    const alvo = String(email).trim().toLowerCase();

    // ---------- 3. CRIAR ----------
    const { data, error } = await admin.auth.admin.createUser({
      email: alvo,
      password,
      email_confirm: true,
      app_metadata: { perfil: "parceiro" },
    });

    if (!error && data?.user) {
      return json({ user_id: data.user.id, existed: false });
    }

    // ---------- 4. JÁ EXISTE -> redefinir senha (só de parceiro) ----------
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exist")) {
      let alvoUser: { id: string; user_metadata?: Record<string, unknown> } | null = null;
      for (let page = 1; page <= 20 && !alvoUser; page++) {
        const { data: list, error: le } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (le) break;
        const found = (list?.users || []).find(
          (u) => (u.email || "").toLowerCase() === alvo,
        );
        if (found) alvoUser = found as typeof alvoUser;
        if (!list || list.users.length < 200) break;
      }
      if (!alvoUser) {
        return json({ error: "e-mail já existe, mas não foi possível localizar o usuário" }, 409);
      }

      // trava: não redefine senha de usuário interno do grupo
      if (ehInterno(alvoUser.user_metadata)) {
        return json(
          { error: "esse e-mail é de um usuário interno do grupo — não dá pra redefinir por aqui" },
          403,
        );
      }

      const { error: ue } = await admin.auth.admin.updateUserById(alvoUser.id, {
        password,
        email_confirm: true,
        app_metadata: { perfil: "parceiro" },
      });
      if (ue) return json({ error: ue.message }, 500);
      return json({ user_id: alvoUser.id, existed: true });
    }

    return json({ error: error?.message || "erro ao criar usuário" }, 500);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
