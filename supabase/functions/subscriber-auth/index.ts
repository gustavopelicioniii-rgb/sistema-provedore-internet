import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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
    loginAttempts.set(key, { count: 1, resetAt: now + 60_000 }); // 1 min window
    return true;
  }
  entry.count++;
  if (entry.count > 5) return false; // max 5 attempts per minute
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

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("subscriber-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleLogin(req: Request, adminClient: ReturnType<typeof createClient>) {
  const body = await req.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { cpf, password, organization_slug } = parsed.data;
  const cpfDigits = cpf.replace(/\D/g, "");

  // Rate limit by CPF
  if (!checkRateLimit(cpfDigits)) {
    return new Response(JSON.stringify({ error: "Muitas tentativas. Tente novamente em 1 minuto." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find organization by slug
  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .select("id, name, logo_url")
    .eq("slug", organization_slug)
    .single();

  if (orgError || !org) {
    return new Response(JSON.stringify({ error: "CPF ou senha inválidos" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find subscriber credentials
  const { data: cred, error: credError } = await adminClient
    .from("subscriber_credentials")
    .select("id, customer_id, organization_id, password_hash")
    .eq("cpf", cpfDigits)
    .eq("organization_id", org.id)
    .single();

  if (credError || !cred) {
    return new Response(JSON.stringify({ error: "CPF ou senha inválidos" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify password
  const match = await bcrypt.compare(password, cred.password_hash);
  if (!match) {
    return new Response(JSON.stringify({ error: "CPF ou senha inválidos" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
      exp: getNumericDate(24 * 60 * 60), // 24h
      iat: getNumericDate(0),
    },
    key
  );

  // Update last_login_at
  await adminClient
    .from("subscriber_credentials")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", cred.id);

  return new Response(JSON.stringify({
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
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleRegister(req: Request, adminClient: ReturnType<typeof createClient>) {
  // Validate admin auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claims, error: claimsError } = await userClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsError || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { customer_id, cpf, password, organization_id } = parsed.data;
  const cpfDigits = cpf.replace(/\D/g, "");

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

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
    return new Response(JSON.stringify({ error: "Erro ao registrar credenciais", details: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, id: data.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleVerify(req: Request) {
  const { token } = await req.json();
  if (!token) {
    return new Response(JSON.stringify({ error: "Token ausente" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const key = await getJwtKey();
    const payload = await verify(token, key);

    if (payload.type !== "subscriber") {
      throw new Error("Invalid token type");
    }

    return new Response(JSON.stringify({ valid: true, payload }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false, error: "Token inválido ou expirado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
