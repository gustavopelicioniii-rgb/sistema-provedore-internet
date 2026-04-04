import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all network devices
    const { data: devices, error } = await supabase
      .from("network_devices")
      .select("id, name, ip_address, status, organization_id, device_type, manufacturer")
      .in("status", ["online", "warning"]);

    if (error) throw error;
    if (!devices?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No devices to monitor", checked: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = { checked: devices.length, status_changes: 0, alerts: 0 };

    for (const device of devices) {
      if (!device.ip_address) continue;

      // Simulate SNMP/ping check - in production this would use the relay
      // For now we update last_seen_at and simulate metrics
      const now = new Date().toISOString();

      // Update last_seen_at for online devices
      await supabase
        .from("network_devices")
        .update({
          last_seen_at: now,
          cpu_usage: Math.floor(Math.random() * 60 + 10),
          memory_usage: Math.floor(Math.random() * 50 + 20),
          connected_clients: Math.floor(Math.random() * 200 + 5),
        })
        .eq("id", device.id);
    }

    // Check for devices that haven't been seen in 5 minutes (would be offline)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: staleDevices } = await supabase
      .from("network_devices")
      .select("id, name, organization_id, status")
      .eq("status", "online")
      .lt("last_seen_at", fiveMinAgo);

    for (const stale of staleDevices || []) {
      // Mark as offline
      await supabase
        .from("network_devices")
        .update({ status: "offline" })
        .eq("id", stale.id);

      // Create alert
      await supabase.from("notification_alerts").insert({
        organization_id: stale.organization_id,
        type: "error",
        title: "Equipamento offline",
        description: `${stale.name} não responde há mais de 5 minutos`,
        channel: "in_app",
        reference_id: stale.id,
        reference_type: "device_offline",
      });

      // Dispatch automation event
      try {
        await supabase.functions.invoke("automation-event-dispatch", {
          body: {
            event: "device.offline",
            organization_id: stale.organization_id,
            payload: {
              device_id: stale.id,
              device_name: stale.name,
            },
          },
        });
      } catch (e) {
        console.error("Automation dispatch error:", e);
      }

      results.status_changes++;
      results.alerts++;
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("NOC monitor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
