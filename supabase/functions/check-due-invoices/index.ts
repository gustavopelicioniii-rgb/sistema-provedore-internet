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
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);

    const todayStr = today.toISOString().slice(0, 10);
    const in3Str = in3Days.toISOString().slice(0, 10);
    const in7Str = in7Days.toISOString().slice(0, 10);

    // Find pending invoices due in the next 7 days (covers both 3 and 7 day windows)
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("id, customer_id, amount, due_date, organization_id, customers(name, email, whatsapp)")
      .eq("status", "pending")
      .gte("due_date", todayStr)
      .lte("due_date", in7Str);

    if (error) throw error;

    const results = { total: invoices?.length || 0, notified: 0, automation_dispatched: 0 };

    for (const inv of invoices || []) {
      const dueDate = new Date(inv.due_date + "T12:00:00");
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const customer = inv.customers as any;
      const customerName = customer?.name || "Cliente";

      // Determine urgency
      const isUrgent = diffDays <= 3;
      const alertType = isUrgent ? "warning" : "info";
      const title = isUrgent
        ? "Fatura vence em breve!"
        : "Fatura próxima do vencimento";
      const description = `Fatura de R$ ${Number(inv.amount).toFixed(2)} do cliente ${customerName} vence em ${dueDate.toLocaleDateString("pt-BR")} (${diffDays} dia${diffDays !== 1 ? "s" : ""})`;

      // Check if we already sent this alert today to avoid duplicates
      const { data: existing } = await supabase
        .from("notification_alerts")
        .select("id")
        .eq("reference_id", inv.id)
        .eq("reference_type", "invoice_due")
        .gte("created_at", todayStr + "T00:00:00Z")
        .limit(1);

      if (existing && existing.length > 0) continue;

      // 1) In-app notification alert
      await supabase.from("notification_alerts").insert({
        organization_id: inv.organization_id,
        type: alertType,
        title,
        description,
        channel: "in_app",
        reference_id: inv.id,
        reference_type: "invoice_due",
      });
      results.notified++;

      // 2) Dispatch automation event for WhatsApp/Email channels
      try {
        const eventName = isUrgent ? "invoice.due_3_days" : "invoice.due_7_days";
        await supabase.functions.invoke("automation-event-dispatch", {
          body: {
            event: eventName,
            organization_id: inv.organization_id,
            payload: {
              invoice_id: inv.id,
              customer_id: inv.customer_id,
              customer_name: customerName,
              customer_email: customer?.email,
              customer_whatsapp: customer?.whatsapp,
              amount: inv.amount,
              due_date: inv.due_date,
              days_until_due: diffDays,
            },
          },
        });
        results.automation_dispatched++;
      } catch (e) {
        console.error("Automation dispatch error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check due invoices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
