import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppCommand {
  action: "send_text" | "send_billing" | "send_boleto" | "send_template" | "check_status";
  params: Record<string, string>;
}

async function evolutionCall(baseUrl: string, apiKey: string, instance: string, path: string, method = "POST", body?: unknown) {
  const resp = await fetch(`${baseUrl}/message/${path}/${instance}`, {
    method,
    headers: {
      "apikey": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Evolution API error [${resp.status}]: ${JSON.stringify(data)}`);
  }
  return data;
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

    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE") || "default";

    if (!evolutionUrl || !evolutionKey) {
      return new Response(JSON.stringify({ error: "Evolution API not configured (EVOLUTION_API_URL, EVOLUTION_API_KEY)" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, params } = (await req.json()) as WhatsAppCommand;
    let result: unknown;

    switch (action) {
      case "send_text": {
        const { phone, message } = params;
        if (!phone || !message) {
          return new Response(JSON.stringify({ error: "phone and message are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const number = phone.replace(/\D/g, "");
        result = await evolutionCall(evolutionUrl, evolutionKey, evolutionInstance, "sendText", "POST", {
          number: `55${number}`,
          text: message,
        });
        break;
      }

      case "send_billing": {
        const { customer_id } = params;
        if (!customer_id) {
          return new Response(JSON.stringify({ error: "customer_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: customer } = await supabase
          .from("customers")
          .select("name, whatsapp")
          .eq("id", customer_id)
          .single();

        if (!customer?.whatsapp) {
          return new Response(JSON.stringify({ error: "Customer has no WhatsApp number" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: invoices } = await supabase
          .from("invoices")
          .select("id, amount, due_date, status")
          .eq("customer_id", customer_id)
          .in("status", ["pending", "overdue"])
          .order("due_date", { ascending: true })
          .limit(3);

        if (!invoices?.length) {
          return new Response(JSON.stringify({ error: "No pending invoices" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const lines = invoices.map((inv) =>
          `📄 Vencimento: ${inv.due_date} — R$ ${Number(inv.amount).toFixed(2)} (${inv.status === "overdue" ? "⚠️ VENCIDA" : "Pendente"})`
        );

        const message = `Olá ${customer.name}! 👋\n\nVocê possui faturas em aberto:\n\n${lines.join("\n")}\n\nPara pagar, acesse o portal do assinante ou entre em contato conosco.`;

        const number = customer.whatsapp.replace(/\D/g, "");
        result = await evolutionCall(evolutionUrl, evolutionKey, evolutionInstance, "sendText", "POST", {
          number: `55${number}`,
          text: message,
        });
        break;
      }

      case "send_boleto": {
        const { invoice_id } = params;
        if (!invoice_id) {
          return new Response(JSON.stringify({ error: "invoice_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, customers(name, whatsapp)")
          .eq("id", invoice_id)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const customer = (invoice as any).customers;
        if (!customer?.whatsapp) {
          return new Response(JSON.stringify({ error: "Customer has no WhatsApp number" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        let message = `Olá ${customer.name}! 📄\n\nSegue sua fatura:\n💰 Valor: R$ ${Number(invoice.amount).toFixed(2)}\n📅 Vencimento: ${invoice.due_date}`;

        if (invoice.barcode) {
          message += `\n\n📋 Código de barras:\n${invoice.barcode}`;
        }
        if (invoice.pix_qrcode) {
          message += `\n\n📱 PIX disponível no portal do assinante.`;
        }

        const number = customer.whatsapp.replace(/\D/g, "");
        result = await evolutionCall(evolutionUrl, evolutionKey, evolutionInstance, "sendText", "POST", {
          number: `55${number}`,
          text: message,
        });
        break;
      }

      case "send_template": {
        const { phone, template_name, variables } = params;
        if (!phone || !template_name) {
          return new Response(JSON.stringify({ error: "phone and template_name are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const number = phone.replace(/\D/g, "");
        // Evolution API template format
        result = await evolutionCall(evolutionUrl, evolutionKey, evolutionInstance, "sendText", "POST", {
          number: `55${number}`,
          text: variables || template_name, // Fallback to template name if no variables
        });
        break;
      }

      case "check_status": {
        const resp = await fetch(`${evolutionUrl}/instance/connectionState/${evolutionInstance}`, {
          headers: { apikey: evolutionKey },
        });
        result = await resp.json();
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
    console.error("WhatsApp API error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
