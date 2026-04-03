import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event, organization_id, payload } = await req.json();

    if (!event || !organization_id) {
      return new Response(
        JSON.stringify({ error: "event and organization_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find all enabled automations matching this event for this org
    const { data: automations, error: fetchError } = await supabase
      .from("automations")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("enabled", true)
      .eq("trigger_type", "event");

    if (fetchError) {
      console.error("Error fetching automations:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch automations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter automations whose trigger_config.event matches
    const matching = (automations || []).filter((a: any) => {
      const config = a.trigger_config || {};
      return config.event === event;
    });

    if (matching.length === 0) {
      return new Response(
        JSON.stringify({ status: "no_match", event, automations_checked: automations?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const automation of matching) {
      let logStatus: "success" | "error" = "success";
      let errorMessage: string | null = null;
      let responsePayload: Record<string, unknown> = {};

      try {
        const actionConfig = automation.action_config || {};

        if (automation.action_type === "webhook_call" && actionConfig.url) {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(actionConfig.headers || {}),
          };

          const body = JSON.stringify({
            ...(actionConfig.payload_template || {}),
            trigger_data: payload,
            event,
            automation_id: automation.id,
            automation_name: automation.name,
            organization_id,
            timestamp: new Date().toISOString(),
          });

          const webhookResponse = await fetch(actionConfig.url, {
            method: actionConfig.method || "POST",
            headers,
            body,
          });

          const responseText = await webhookResponse.text();
          let parsed;
          try { parsed = JSON.parse(responseText); } catch { parsed = { raw: responseText }; }

          responsePayload = { status_code: webhookResponse.status, body: parsed };

          if (!webhookResponse.ok) {
            logStatus = "error";
            errorMessage = `Webhook returned ${webhookResponse.status}`;
          }
        } else if (automation.action_type === "internal") {
          responsePayload = { message: "Internal action processed", action: actionConfig };
        } else {
          responsePayload = { message: "Action processed", type: automation.action_type };
        }
      } catch (err) {
        logStatus = "error";
        errorMessage = err instanceof Error ? err.message : "Unknown error";
      }

      // Update last_triggered_at
      await supabase
        .from("automations")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", automation.id);

      // Log execution
      await supabase.from("automation_logs").insert({
        automation_id: automation.id,
        organization_id,
        status: logStatus,
        trigger_payload: { event, ...payload },
        response_payload: responsePayload,
        error_message: errorMessage,
      });

      results.push({
        automation_id: automation.id,
        name: automation.name,
        status: logStatus,
        error: errorMessage,
      });
    }

    return new Response(
      JSON.stringify({ event, matched: matching.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Event dispatch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
