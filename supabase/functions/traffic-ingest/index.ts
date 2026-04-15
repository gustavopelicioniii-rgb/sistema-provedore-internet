import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


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

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://seudominio.com, https://app.seudominio.com, https://portal.seudominio.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrafficRecord {
  customer_id: string;
  contract_id?: string;
  period_start: string;
  period_end: string;
  download_bytes: number;
  upload_bytes: number;
  source?: string;
}

interface IngestPayload {
  action: "ingest" | "ingest_batch";
  records: TrafficRecord[];
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;
    const { action, records } = (await req.json()) as IngestPayload;

    if (action === "ingest" || action === "ingest_batch") {
      if (!records?.length) {
        return new Response(JSON.stringify({ error: "No records provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows = records.map((r) => ({
        organization_id: orgId,
        customer_id: r.customer_id,
        contract_id: r.contract_id || null,
        period_start: r.period_start,
        period_end: r.period_end,
        download_bytes: r.download_bytes,
        upload_bytes: r.upload_bytes,
        source: r.source || "radius",
      }));

      const { data, error } = await supabase
        .from("traffic_usage")
        .upsert(rows, {
          onConflict: "customer_id,period_start,period_end,source",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, inserted: data?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Traffic ingest error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
