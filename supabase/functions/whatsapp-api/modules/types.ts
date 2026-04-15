import { createClient } from "npm:@supabase/supabase-js@2";

// Rate limiting (in-memory, resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  if (entry.count > maxRequests) return false;
  return true;
}

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ── Evolution API v2 Full Integration ──────────────────────────────────────

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  instance: string;
}

async function getEvolutionConfig(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  instanceOverride?: string
): Promise<EvolutionConfig> {
  const { data, error } = await supabase
    .from("channel_configs")
    .select("config, enabled")
    .eq("organization_id", orgId)
    .eq("channel", "whatsapp")
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("WhatsApp channel not configured. Go to Settings → Channels to set up.");
  }

  const cfg = data.config as Record<string, string> | null;
  if (!cfg?.api_url || !cfg?.api_key) {
    throw new Error("WhatsApp channel is missing API URL or API Key. Check Settings → Channels.");
  }

  return {
    api_url: cfg.api_url.replace(/\/+$/, ""),
    api_key: cfg.api_key,
    instance: instanceOverride || cfg.instance || "default",
  };
}

async function evolutionFetch(
  config: EvolutionConfig,
  path: string,
  method = "GET",
  body?: unknown
) {
  const url = `${config.api_url}${path}`;
  console.log(`Evolution API ${method} ${url}`);

  const resp = await fetch(url, {
    method,
    headers: {
      apikey: config.api_key,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      `Evolution API error [${resp.status}]: ${JSON.stringify(data)}`
    );
  }
  return data;
}

// ── Input Schemas ──────────────────────────────────────────────────────────

const ActionSchema = z.object({
  action: z.string(),
  params: z.record(z.unknown()).default({}),
});

// ── Handlers ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const { data: orgId } = await supabase.rpc("get_user_organization_id");
    if (!orgId) {
      return jsonResp({ error: "Organization not found" }, 400);
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResp({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
    }

    const { action, params } = parsed.data;
    let result: unknown;

    switch (action) {
      // ═══════════════════════════════════════════════════════════════════
      // INSTANCE MANAGEMENT (Evolution API v2)
      // ═══════════════════════════════════════════════════════════════════

      case "instance_info": {
        // GET / — Check if Evolution API is reachable
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(config, "/");
        break;
      }

      case "instance_create": {
        // POST /instance/create
        const config = await getEvolutionConfig(supabase, orgId);
        const instanceName = (params.instanceName as string) || config.instance;
        const webhookUrl = params.webhookUrl as string | undefined;

        const createBody: Record<string, unknown> = {
          instanceName,
          integration: (params.integration as string) || "WHATSAPP-BAILEYS",
          qrcode: params.qrcode !== false,
          rejectCall: params.rejectCall ?? true,
          msgCall: (params.msgCall as string) || "",
          groupsIgnore: params.groupsIgnore ?? true,
          alwaysOnline: params.alwaysOnline ?? false,
          readMessages: params.readMessages ?? false,
          readStatus: params.readStatus ?? false,
          syncFullHistory: params.syncFullHistory ?? false,
        };

        // If number provided, use pairing code instead of QR
        if (params.number) {
          createBody.number = String(params.number).replace(/\D/g, "");
          createBody.qrcode = false;
        }

        // Configure webhook during instance creation
        if (webhookUrl) {
          createBody.webhook = {
            url: webhookUrl,
            byEvents: false,
            base64: true,
            headers: params.webhookHeaders || {},
            events: [
              "MESSAGES_UPSERT",
              "MESSAGES_UPDATE",
              "MESSAGE_RECEIPT_UPDATE",
              "CONNECTION_UPDATE",
              "QRCODE_UPDATED",
            ],
          };
        }

        result = await evolutionFetch(config, "/instance/create", "POST", createBody);
        break;
      }

      case "instance_connect": {
        // GET /instance/connect/{instance} — Returns QR code / pairing code
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
