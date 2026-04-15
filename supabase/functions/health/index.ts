import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://seudominio.com, https://app.seudominio.com, https://portal.seudominio.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const startTime = Date.now();
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: Deno.env.get("APP_VERSION") || "1.0.0",
    uptime: `${Math.round(Deno.osUptime())}s`,
    checks: {
      supabase: "unknown",
      responseTime: "unknown",
    },
  };

  try {
    // Check Supabase connection
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const checkStart = Date.now();
    const { error: dbError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);
    
    health.checks.supabase = dbError ? "unhealthy" : "healthy";
    health.checks.responseTime = `${Date.now() - checkStart}ms`;
  } catch (err) {
    health.checks.supabase = "unhealthy";
    health.status = "degraded";
  }

  const totalResponseTime = Date.now() - startTime;
  health.checks.responseTime = `${totalResponseTime}ms`;

  if (health.checks.supabase === "unhealthy") {
    health.status = "unhealthy";
  }

  const status = health.status === "healthy" ? 200 : 503;

  return new Response(JSON.stringify(health, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
