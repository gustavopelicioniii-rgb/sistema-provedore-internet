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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // Get all organizations with enabled billing rules
    const { data: rules, error: rulesError } = await supabase
      .from("billing_rules")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: true });

    if (rulesError) throw rulesError;
    if (!rules?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No billing rules configured", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group rules by organization
    const rulesByOrg = new Map<string, typeof rules>();
    for (const rule of rules) {
      const orgRules = rulesByOrg.get(rule.organization_id) || [];
      orgRules.push(rule);
      rulesByOrg.set(rule.organization_id, orgRules);
    }

    const results = { total_rules: rules.length, processed: 0, actions: { notify: 0, suspend: 0, reactivate: 0 }, errors: 0 };

    for (const [orgId, orgRules] of rulesByOrg) {
      // Get all pending/overdue invoices for this org
      const { data: invoices, error: invError } = await supabase
        .from("invoices")
        .select("id, customer_id, amount, due_date, status, customers(name, email, whatsapp)")
        .eq("organization_id", orgId)
        .in("status", ["pending", "overdue"]);

      if (invError) {
        console.error(`Error fetching invoices for org ${orgId}:`, invError);
        results.errors++;
        continue;
      }

      if (!invoices?.length) continue;

      for (const rule of orgRules) {
        for (const invoice of invoices) {
          const dueDate = new Date(invoice.due_date + "T00:00:00");
          const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          // days_offset: negative = before due, positive = after due
          // e.g. -3 = 3 days before, +1 = 1 day after, +7 = 7 days after, +15 = 15 days after
          if (diffDays !== rule.days_offset) continue;

          // Check if already executed today for this invoice+rule
          const { data: existing } = await supabase
            .from("billing_rule_executions")
            .select("id")
            .eq("invoice_id", invoice.id)
            .eq("billing_rule_id", rule.id)
            .gte("executed_at", todayStr + "T00:00:00Z")
            .limit(1);

          if (existing && existing.length > 0) continue;

          const customer = invoice.customers as any;
          const customerName = customer?.name || "Cliente";

          let execStatus: "sent" | "failed" | "skipped" = "sent";
          let errorMessage: string | null = null;

          try {
            if (rule.action === "notify") {
              // Create in-app notification
              const isOverdue = rule.days_offset > 0;
              const title = isOverdue
                ? `Fatura vencida há ${rule.days_offset} dia(s)`
                : `Fatura vence em ${Math.abs(rule.days_offset)} dia(s)`;

              const description = rule.template_message
                ? rule.template_message
                    .replace("{{customer_name}}", customerName)
                    .replace("{{amount}}", Number(invoice.amount).toFixed(2))
                    .replace("{{due_date}}", dueDate.toLocaleDateString("pt-BR"))
                    .replace("{{days}}", String(Math.abs(rule.days_offset)))
                : `Fatura de R$ ${Number(invoice.amount).toFixed(2)} do cliente ${customerName} - vencimento ${dueDate.toLocaleDateString("pt-BR")}`;

              await supabase.from("notification_alerts").insert({
                organization_id: orgId,
                type: isOverdue ? "warning" : "info",
                title,
                description,
                channel: "in_app",
                reference_id: invoice.id,
                reference_type: "billing_rule",
              });

              // Dispatch automation event for external channels (WhatsApp, email)
              if (rule.channel !== "in_app") {
                try {
                  await supabase.functions.invoke("automation-event-dispatch", {
                    body: {
                      event: `billing.rule.${rule.days_offset < 0 ? "before" : "after"}_${Math.abs(rule.days_offset)}d`,
                      organization_id: orgId,
                      payload: {
                        invoice_id: invoice.id,
                        customer_id: invoice.customer_id,
                        customer_name: customerName,
                        customer_email: customer?.email,
                        customer_whatsapp: customer?.whatsapp,
                        amount: invoice.amount,
                        due_date: invoice.due_date,
                        days_offset: rule.days_offset,
                        channel: rule.channel,
                        template_message: description,
                      },
                    },
                  });
                } catch (e) {
                  console.error("Automation dispatch error:", e);
                }
              }

              results.actions.notify++;
            } else if (rule.action === "suspend") {
              // Suspend customer contract
              const { error: suspendError } = await supabase
                .from("contracts")
                .update({ status: "suspended" })
                .eq("customer_id", invoice.customer_id)
                .eq("organization_id", orgId)
                .eq("status", "active");

              if (suspendError) throw suspendError;

              // Update customer status
              await supabase
                .from("customers")
                .update({ status: "suspended" })
                .eq("id", invoice.customer_id)
                .eq("organization_id", orgId);

              // Mark invoice as overdue if still pending
              if (invoice.status === "pending") {
                await supabase
                  .from("invoices")
                  .update({ status: "overdue" })
                  .eq("id", invoice.id);
              }

              // Notification
              await supabase.from("notification_alerts").insert({
                organization_id: orgId,
                type: "error",
                title: "Cliente suspenso automaticamente",
                description: `${customerName} foi suspenso por inadimplência (${rule.days_offset} dias após vencimento)`,
                channel: "in_app",
                reference_id: invoice.id,
                reference_type: "billing_rule_suspend",
              });

              results.actions.suspend++;
            } else if (rule.action === "reactivate") {
              // This is handled differently - triggered when invoice is paid
              execStatus = "skipped";
            }
          } catch (err) {
            execStatus = "failed";
            errorMessage = err instanceof Error ? err.message : "Unknown error";
            results.errors++;
          }

          // Log execution
          await supabase.from("billing_rule_executions").insert({
            organization_id: orgId,
            billing_rule_id: rule.id,
            invoice_id: invoice.id,
            customer_id: invoice.customer_id,
            status: execStatus,
            error_message: errorMessage,
          });

          results.processed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Billing rules error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
