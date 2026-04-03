import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OltCommand {
  action: "list_onus" | "get_onu_signal" | "provision_onu" | "remove_onu" | "get_olt_info";
  params?: Record<string, string>;
}

// SNMP-like simulation for Huawei/FiberHome/ZTE OLTs
// In production, this would use actual SNMP or TL1 protocols via a relay agent
async function snmpQuery(host: string, community: string, oid: string): Promise<unknown> {
  // SNMP queries require a relay agent (Node.js/Python service on-premise)
  // This function serves as the API contract for the relay
  const relayUrl = Deno.env.get("OLT_RELAY_URL");
  if (!relayUrl) {
    throw new Error("OLT_RELAY_URL not configured. Deploy the on-premise SNMP relay agent.");
  }

  const resp = await fetch(`${relayUrl}/snmp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, community, oid }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SNMP relay error [${resp.status}]: ${text}`);
  }

  return resp.json();
}

async function tl1Command(host: string, user: string, pass: string, command: string): Promise<unknown> {
  const relayUrl = Deno.env.get("OLT_RELAY_URL");
  if (!relayUrl) {
    throw new Error("OLT_RELAY_URL not configured. Deploy the on-premise TL1 relay agent.");
  }

  const resp = await fetch(`${relayUrl}/tl1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, user, pass, command }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`TL1 relay error [${resp.status}]: ${text}`);
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

    const { action, params } = (await req.json()) as OltCommand;
    const deviceId = params?.device_id;

    if (!deviceId) {
      return new Response(JSON.stringify({ error: "device_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: device, error: deviceError } = await supabase
      .from("network_devices")
      .select("*")
      .eq("id", deviceId)
      .single();

    if (deviceError || !device) {
      return new Response(JSON.stringify({ error: "Device not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const manufacturer = device.manufacturer;
    const host = device.ip_address!;
    const community = device.snmp_community || "public";
    const user = device.api_username || "admin";
    const pass = device.api_password || "";

    let result: unknown;

    switch (action) {
      case "list_onus": {
        if (manufacturer === "huawei") {
          result = await tl1Command(host, user, pass, "LST-ONU::OLTID=0,PONID=ALL:CTAG::;");
        } else {
          // FiberHome, ZTE, Intelbras - use SNMP
          result = await snmpQuery(host, community, "1.3.6.1.4.1.2011.6.128.1.1.2.43.1");
        }
        break;
      }

      case "get_onu_signal": {
        const onuId = params?.onu_id;
        if (!onuId) {
          return new Response(JSON.stringify({ error: "onu_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (manufacturer === "huawei") {
          result = await tl1Command(host, user, pass, `LST-OMDDM::ONUID=${onuId}:CTAG::;`);
        } else {
          result = await snmpQuery(host, community, `1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4.${onuId}`);
        }
        break;
      }

      case "provision_onu": {
        const sn = params?.serial_number;
        const profile = params?.profile || "default";
        const vlan = params?.vlan || "100";
        if (!sn) {
          return new Response(JSON.stringify({ error: "serial_number is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (manufacturer === "huawei") {
          result = await tl1Command(host, user, pass, `ADD-ONU::OLTID=0,PONID=${params?.pon_id || "0/0/0"}:CTAG::AUTHTYPE=SN,ONUID=auto,SN=${sn},ONUTYPE=${profile};`);
        } else {
          result = { message: "Use SNMP relay for provisioning on this manufacturer", manufacturer };
        }
        break;
      }

      case "remove_onu": {
        const onuId = params?.onu_id;
        if (!onuId) {
          return new Response(JSON.stringify({ error: "onu_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (manufacturer === "huawei") {
          result = await tl1Command(host, user, pass, `DEL-ONU::ONUID=${onuId}:CTAG::;`);
        } else {
          result = { message: "Use SNMP relay for removal on this manufacturer", manufacturer };
        }
        break;
      }

      case "get_olt_info": {
        result = await snmpQuery(host, community, "1.3.6.1.2.1.1"); // sysDescr, sysUptime, etc.
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("OLT API error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
