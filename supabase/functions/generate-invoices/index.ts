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

    // Verify the user is authenticated
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

    // Get user's organization
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

    // Get active contracts with plan prices
    const { data: contracts, error: contractsError } = await adminClient
      .from("contracts")
      .select("id, customer_id, plan_id, plans(price)")
      .eq("organization_id", orgId)
      .eq("status", "active");

    if (contractsError) throw contractsError;
    if (!contracts?.length) {
      return new Response(JSON.stringify({ message: "Nenhum contrato ativo encontrado", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate due date: day 10 of next month
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    // Check which contracts already have invoices for this due date
    const contractIds = contracts.map((c) => c.id);
    const { data: existingInvoices } = await adminClient
      .from("invoices")
      .select("contract_id")
      .eq("organization_id", orgId)
      .eq("due_date", dueDateStr)
      .in("contract_id", contractIds);

    const existingContractIds = new Set((existingInvoices ?? []).map((i) => i.contract_id));

    // Create invoices for contracts that don't have one yet
    const newInvoices = contracts
      .filter((c) => !existingContractIds.has(c.id))
      .map((c) => ({
        organization_id: orgId,
        customer_id: c.customer_id,
        contract_id: c.id,
        amount: (c.plans as any)?.price ?? 0,
        due_date: dueDateStr,
        status: "pending" as const,
      }));

    if (!newInvoices.length) {
      return new Response(JSON.stringify({ message: "Todas as faturas já foram geradas para este período", created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await adminClient.from("invoices").insert(newInvoices);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        message: `${newInvoices.length} fatura(s) gerada(s) com sucesso para vencimento em ${dueDateStr}`,
        created: newInvoices.length,
        due_date: dueDateStr,
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
