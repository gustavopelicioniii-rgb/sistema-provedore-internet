import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentCommand {
  action: "generate_boleto" | "generate_pix" | "check_payment" | "list_charges" | "webhook";
  params?: Record<string, string>;
}

// Asaas API integration
const ASAAS_BASE = "https://api.asaas.com/v3";

async function asaasCall(apiKey: string, path: string, method = "GET", body?: unknown) {
  const resp = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: {
      "access_token": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Asaas API error [${resp.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, params } = (await req.json()) as PaymentCommand;

    // Webhook doesn't need auth (validated by Asaas token)
    if (action === "webhook") {
      const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
      const receivedToken = req.headers.get("asaas-access-token");
      if (webhookToken && receivedToken !== webhookToken) {
        return new Response(JSON.stringify({ error: "Invalid webhook token" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Process payment confirmation
      const event = params as Record<string, string>;
      if (event.event === "PAYMENT_RECEIVED" || event.event === "PAYMENT_CONFIRMED") {
        const gatewayId = event.payment?.id || event.id;
        if (gatewayId) {
          await supabaseAdmin
            .from("invoices")
            .update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) })
            .eq("gateway_id", gatewayId);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require auth
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

    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ASAAS_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: unknown;

    switch (action) {
      case "generate_boleto": {
        const invoiceId = params?.invoice_id;
        if (!invoiceId) {
          return new Response(JSON.stringify({ error: "invoice_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, customers(name, cpf_cnpj, email)")
          .eq("id", invoiceId)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Create or find customer in Asaas
        const customer = (invoice as any).customers;
        const asaasCustomer = await asaasCall(apiKey, "/customers", "POST", {
          name: customer.name,
          cpfCnpj: customer.cpf_cnpj,
          email: customer.email,
        });

        // Create boleto charge
        const charge = await asaasCall(apiKey, "/payments", "POST", {
          customer: asaasCustomer.id,
          billingType: "BOLETO",
          value: invoice.amount,
          dueDate: invoice.due_date,
          description: `Fatura #${invoiceId.slice(0, 8)}`,
          externalReference: invoiceId,
        });

        // Update invoice with gateway info
        await supabase
          .from("invoices")
          .update({
            gateway_id: charge.id,
            barcode: charge.bankSlipUrl || charge.nossoNumero,
          })
          .eq("id", invoiceId);

        result = charge;
        break;
      }

      case "generate_pix": {
        const invoiceId = params?.invoice_id;
        if (!invoiceId) {
          return new Response(JSON.stringify({ error: "invoice_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, customers(name, cpf_cnpj, email)")
          .eq("id", invoiceId)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const customer = (invoice as any).customers;
        const asaasCustomer = await asaasCall(apiKey, "/customers", "POST", {
          name: customer.name,
          cpfCnpj: customer.cpf_cnpj,
          email: customer.email,
        });

        const charge = await asaasCall(apiKey, "/payments", "POST", {
          customer: asaasCustomer.id,
          billingType: "PIX",
          value: invoice.amount,
          dueDate: invoice.due_date,
          description: `Fatura #${invoiceId.slice(0, 8)}`,
          externalReference: invoiceId,
        });

        // Get PIX QR code
        const pixData = await asaasCall(apiKey, `/payments/${charge.id}/pixQrCode`);

        await supabase
          .from("invoices")
          .update({
            gateway_id: charge.id,
            pix_qrcode: pixData.encodedImage,
            payment_method: "pix",
          })
          .eq("id", invoiceId);

        result = { ...charge, pix: pixData };
        break;
      }

      case "check_payment": {
        const gatewayId = params?.gateway_id;
        if (!gatewayId) {
          return new Response(JSON.stringify({ error: "gateway_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await asaasCall(apiKey, `/payments/${gatewayId}`);
        break;
      }

      case "list_charges": {
        const offset = params?.offset || "0";
        const limit = params?.limit || "20";
        result = await asaasCall(apiKey, `/payments?offset=${offset}&limit=${limit}`);
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
    console.error("Payment API error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
