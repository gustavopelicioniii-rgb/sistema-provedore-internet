import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Organização não encontrada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = profile.organization_id;

    // Parse optional params
    let targetMonth: number | undefined;
    let targetYear: number | undefined;
    try {
      const body = await req.json();
      targetMonth = body?.month;
      targetYear = body?.year;
    } catch { /* no body is fine */ }

    const now = new Date();
    const refMonth = targetMonth ?? now.getMonth() + 2; // next month (1-indexed)
    const refYear = targetYear ?? now.getFullYear();

    // Get active contracts with plan prices and billing_day
    const { data: contracts, error: contractsError } = await adminClient
      .from("contracts")
      .select("id, customer_id, plan_id, billing_day, plans(price)")
      .eq("organization_id", orgId)
      .eq("status", "active");

    if (contractsError) throw contractsError;
    if (!contracts?.length) {
      return new Response(JSON.stringify({ message: "Nenhum contrato ativo encontrado", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build invoices with per-contract billing_day
    const newInvoices: Array<{
      organization_id: string;
      customer_id: string;
      contract_id: string;
      amount: number;
      due_date: string;
      status: "pending";
    }> = [];

    const contractIds = contracts.map((c) => c.id);

    // Get all existing invoices for this org in the target month range to avoid duplicates
    const monthStart = `${refYear}-${String(refMonth).padStart(2, "0")}-01`;
    const nextMonth = refMonth === 12 ? 1 : refMonth + 1;
    const nextYear = refMonth === 12 ? refYear + 1 : refYear;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const { data: existingInvoices } = await adminClient
      .from("invoices")
      .select("contract_id, due_date")
      .eq("organization_id", orgId)
      .gte("due_date", monthStart)
      .lt("due_date", monthEnd)
      .in("contract_id", contractIds);

    const existingContractIds = new Set((existingInvoices ?? []).map((i) => i.contract_id));

    for (const contract of contracts) {
      if (existingContractIds.has(contract.id)) continue;

      const billingDay = contract.billing_day || 10;
      // Clamp to last day of month
      const lastDay = new Date(refYear, refMonth, 0).getDate();
      const day = Math.min(billingDay, lastDay);
      const dueDateStr = `${refYear}-${String(refMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      newInvoices.push({
        organization_id: orgId,
        customer_id: contract.customer_id,
        contract_id: contract.id,
        amount: (contract.plans as any)?.price ?? 0,
        due_date: dueDateStr,
        status: "pending",
      });
    }

    if (!newInvoices.length) {
      return new Response(JSON.stringify({ message: "Todas as faturas já foram geradas para este período", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await adminClient.from("invoices").insert(newInvoices);
    if (insertError) throw insertError;

    // Group by due date for summary
    const byDate = new Map<string, number>();
    newInvoices.forEach((inv) => {
      byDate.set(inv.due_date, (byDate.get(inv.due_date) || 0) + 1);
    });
    const summary = Array.from(byDate.entries()).map(([date, count]) => `${count} fatura(s) para ${date}`).join(", ");

    return new Response(
      JSON.stringify({
        message: `${newInvoices.length} fatura(s) gerada(s) com sucesso. ${summary}`,
        created: newInvoices.length,
        details: Object.fromEntries(byDate),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error generating invoices:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
