import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MikrotikCommand {
  action: "list_pppoe" | "create_pppoe" | "remove_pppoe" | "block_client" | "unblock_client" | "set_speed" | "get_traffic" | "list_queues";
  params?: Record<string, string>;
}

async function mikrotikApiCall(host: string, port: number, user: string, pass: string, path: string, method = "GET", body?: Record<string, string>) {
  const url = `https://${host}:${port}/rest${path}`;
  const headers: Record<string, string> = {
    "Authorization": "Basic " + btoa(`${user}:${pass}`),
    "Content-Type": "application/json",
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`MikroTik API error [${resp.status}]: ${text}`);
  }

  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, params } = (await req.json()) as MikrotikCommand;

    // Get device credentials from params or defaults
    const deviceId = params?.device_id;
    if (!deviceId) {
      return new Response(JSON.stringify({ error: "device_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: device, error: deviceError } = await supabase
      .from("network_devices")
      .select("ip_address, api_port, api_username, api_password, manufacturer")
      .eq("id", deviceId)
      .single();

    if (deviceError || !device) {
      return new Response(JSON.stringify({ error: "Device not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (device.manufacturer !== "mikrotik") {
      return new Response(JSON.stringify({ error: "Device is not a MikroTik" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const host = device.ip_address!;
    const port = device.api_port || 443;
    const user = device.api_username || "admin";
    const pass = device.api_password || "";

    let result: unknown;

    switch (action) {
      case "list_pppoe":
        result = await mikrotikApiCall(host, port, user, pass, "/ppp/active");
        break;

      case "create_pppoe":
        if (!params?.name || !params?.password || !params?.profile) {
          return new Response(JSON.stringify({ error: "name, password, and profile are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await mikrotikApiCall(host, port, user, pass, "/ppp/secret", "PUT", {
          name: params.name,
          password: params.password,
          profile: params.profile,
          service: "pppoe",
        });
        break;

      case "remove_pppoe":
        if (!params?.secret_id) {
          return new Response(JSON.stringify({ error: "secret_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await mikrotikApiCall(host, port, user, pass, `/ppp/secret/${params.secret_id}`, "DELETE");
        break;

      case "block_client":
        if (!params?.name) {
          return new Response(JSON.stringify({ error: "name (PPPoE username) is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await mikrotikApiCall(host, port, user, pass, `/ppp/secret/${params.name}`, "PATCH", {
          disabled: "true",
        });
        break;

      case "unblock_client":
        if (!params?.name) {
          return new Response(JSON.stringify({ error: "name (PPPoE username) is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await mikrotikApiCall(host, port, user, pass, `/ppp/secret/${params.name}`, "PATCH", {
          disabled: "false",
        });
        break;

      case "set_speed":
        if (!params?.name || !params?.max_limit) {
          return new Response(JSON.stringify({ error: "name and max_limit (e.g. '100M/50M') are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Update the PPPoE profile or queue
        result = await mikrotikApiCall(host, port, user, pass, `/queue/simple/${params.name}`, "PATCH", {
          "max-limit": params.max_limit,
        });
        break;

      case "get_traffic":
        result = await mikrotikApiCall(host, port, user, pass, "/interface");
        break;

      case "list_queues":
        result = await mikrotikApiCall(host, port, user, pass, "/queue/simple");
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("MikroTik API error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
