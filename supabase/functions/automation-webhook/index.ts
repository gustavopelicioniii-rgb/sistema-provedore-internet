import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const automationId = url.searchParams.get("automation_id");

    if (!automationId) {
      return new Response(
        JSON.stringify({ error: "automation_id query param required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch automation
    const { data: automation, error: fetchError } = await supabase
      .from("automations")
      .select("*")
      .eq("id", automationId)
      .single();

    if (fetchError || !automation) {
      return new Response(
        JSON.stringify({ error: "Automation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate webhook secret if set
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (automation.webhook_secret && webhookSecret !== automation.webhook_secret) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!automation.enabled) {
      // Log as skipped
      await supabase.from("automation_logs").insert({
        automation_id: automationId,
        organization_id: automation.organization_id,
        status: "skipped",
        trigger_payload: {},
        error_message: "Automation is disabled",
      });
      return new Response(
        JSON.stringify({ status: "skipped", message: "Automation is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse incoming payload
    let triggerPayload = {};
    try {
      if (req.method === "POST" || req.method === "PUT") {
        triggerPayload = await req.json();
      }
    } catch {
      // no body is ok
    }

    // Execute action based on type
    let responsePayload = {};
    let logStatus: "success" | "error" = "success";
    let errorMessage: string | null = null;

    try {
      const actionConfig = automation.action_config || {};

      if (automation.action_type === "webhook_call" && actionConfig.url) {
        // Call external webhook (n8n, Zapier, etc.)
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(actionConfig.headers || {}),
        };

        const body = actionConfig.payload_template
          ? JSON.stringify({
              ...actionConfig.payload_template,
              trigger_data: triggerPayload,
              automation_name: automation.name,
              timestamp: new Date().toISOString(),
            })
          : JSON.stringify({
              trigger_data: triggerPayload,
              automation_id: automationId,
              automation_name: automation.name,
              organization_id: automation.organization_id,
              timestamp: new Date().toISOString(),
            });

        const webhookResponse = await fetch(actionConfig.url, {
          method: actionConfig.method || "POST",
          headers,
          body,
        });

        const responseText = await webhookResponse.text();
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch {
          parsedResponse = { raw: responseText };
        }

        responsePayload = {
          status_code: webhookResponse.status,
          body: parsedResponse,
        };

        if (!webhookResponse.ok) {
          logStatus = "error";
          errorMessage = `Webhook returned ${webhookResponse.status}`;
        }
      } else if (automation.action_type === "internal") {
        // Internal actions (suspend contract, reactivate, etc.)
        responsePayload = { message: "Internal action processed", action: actionConfig };
      } else {
        responsePayload = { message: "Action type processed", type: automation.action_type };
      }
    } catch (actionError) {
      logStatus = "error";
      errorMessage = actionError instanceof Error ? actionError.message : "Unknown action error";
    }

    // Update last_triggered_at
    await supabase
      .from("automations")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", automationId);

    // Log execution
    await supabase.from("automation_logs").insert({
      automation_id: automationId,
      organization_id: automation.organization_id,
      status: logStatus,
      trigger_payload: triggerPayload,
      response_payload: responsePayload,
      error_message: errorMessage,
    });

    return new Response(
      JSON.stringify({
        status: logStatus,
        automation: automation.name,
        response: responsePayload,
        error: errorMessage,
      }),
      { status: logStatus === "success" ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
