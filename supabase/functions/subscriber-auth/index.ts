import { createClient } from "npm:@supabase/supabase-js@2";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import bcrypt from "npm:bcryptjs@2.4.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LoginSchema = z.object({
  cpf: z.string().min(11).max(18),
  password: z.string().min(4).max(128),
  organization_slug: z.string().min(1).max(100),
});

const RegisterSchema = z.object({
  customer_id: z.string().uuid(),
  cpf: z.string().min(11).max(18),
  password: z.string().min(6).max(128),
  organization_id: z.string().uuid(),
});

// Rate limiting map (in-memory, resets on cold start)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count++;
  if (entry.count > 5) return false;
  return true;
}

async function getJwtKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "POST" && path === "login") {
      return await handleLogin(req, adminClient);
    }
    if (req.method === "POST" && path === "register") {
      return await handleRegister(req, adminClient);
    }
    if (req.method === "POST" && path === "verify") {
      return await handleVerify(req);
    }
    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    console.error("subscriber-auth error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

async function handleLogin(
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  const body = await req.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      400
    );
  }

  const { cpf, password, organization_slug } = parsed.data;
  const cpfDigits = cpf.replace(/\D/g, "");

  if (!checkRateLimit(cpfDigits)) {
    return jsonResponse(
      { error: "Muitas tentativas. Tente novamente em 1 minuto." },
      429
    );
  }

  // Find organization by slug using service role (bypasses RLS)
  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .select("id, name, logo_url")
    .eq("slug", organization_slug)
    .single();

  if (orgError || !org) {
    return jsonResponse({ error: "CPF ou senha inválidos" }, 401);
  }

  // Find subscriber credentials
  const { data: cred, error: credError } = await adminClient
    .from("subscriber_credentials")
    .select("id, customer_id, organization_id, password_hash")
    .eq("cpf", cpfDigits)
    .eq("organization_id", org.id)
    .single();

  if (credError || !cred) {
    return jsonResponse({ error: "CPF ou senha inválidos" }, 401);
  }

  // Verify password
  const match = bcrypt.compareSync(password, cred.password_hash);
  if (!match) {
    return jsonResponse({ error: "CPF ou senha inválidos" }, 401);
  }

  // Get customer info
  const { data: customer } = await adminClient
    .from("customers")
    .select("id, name, email, cpf_cnpj")
    .eq("id", cred.customer_id)
    .single();

  // Generate JWT
  const key = await getJwtKey();
  const token = await create(
    { alg: "HS256", typ: "JWT" },
    {
      sub: cred.customer_id,
      customer_id: cred.customer_id,
      organization_id: cred.organization_id,
      type: "subscriber",
      exp: getNumericDate(24 * 60 * 60),
      iat: getNumericDate(0),
    },
    key
  );

  // Update last_login_at
  await adminClient
    .from("subscriber_credentials")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", cred.id);

  return jsonResponse({
    token,
    customer: {
      id: customer?.id,
      name: customer?.name,
      email: customer?.email,
      cpf: customer?.cpf_cnpj,
    },
    organization: {
      id: org.id,
      name: org.name,
      logo_url: org.logo_url,
    },
  });
}

async function handleRegister(
  req: Request,
  adminClient: ReturnType<typeof createClient>
) {
  // Validate admin auth via JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autorizado" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  // Validate admin JWT using Supabase getUser
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: "Não autorizado" }, 401);
  }

  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      400
    );
  }

  const { customer_id, cpf, password, organization_id } = parsed.data;
  const cpfDigits = cpf.replace(/\D/g, "");

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  // Upsert credentials
  const { data, error } = await adminClient
    .from("subscriber_credentials")
    .upsert(
      { customer_id, organization_id, cpf: cpfDigits, password_hash },
      { onConflict: "organization_id,cpf" }
    )
    .select("id")
    .single();

  if (error) {
    return jsonResponse(
      { error: "Erro ao registrar credenciais", details: error.message },
      400
    );
  }

  return jsonResponse({ success: true, id: data.id });
}

async function handleVerify(req: Request) {
  const { token } = await req.json();
  if (!token) {
    return jsonResponse({ error: "Token ausente" }, 400);
  }

  try {
    const key = await getJwtKey();
    const payload = await verify(token, key);

    if (payload.type !== "subscriber") {
      throw new Error("Invalid token type");
    }

    return jsonResponse({ valid: true, payload });
  } catch {
    return jsonResponse(
      { valid: false, error: "Token inválido ou expirado" },
      401
    );
  }
}
