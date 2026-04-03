import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FiscalCommand {
  action: "emit_nfe" | "emit_nfcom" | "check_status" | "cancel_nfe" | "download_xml";
  params: Record<string, string>;
}

// Integration with NF-e API (Focus NFe / eNotas / Webmania)
async function fiscalApiCall(apiKey: string, baseUrl: string, path: string, method = "GET", body?: unknown) {
  const resp = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Fiscal API error [${resp.status}]: ${JSON.stringify(data)}`);
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

    const fiscalApiKey = Deno.env.get("FISCAL_API_KEY");
    const fiscalBaseUrl = Deno.env.get("FISCAL_API_URL") || "https://api.focusnfe.com.br/v2";

    if (!fiscalApiKey) {
      return new Response(JSON.stringify({ error: "FISCAL_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, params } = (await req.json()) as FiscalCommand;
    let result: unknown;

    switch (action) {
      case "emit_nfe": {
        const invoiceId = params.invoice_id;
        if (!invoiceId) {
          return new Response(JSON.stringify({ error: "invoice_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, customers(name, cpf_cnpj, email, address)")
          .eq("id", invoiceId)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const customer = (invoice as any).customers;
        const address = customer?.address || {};

        // NF-e Modelo 21/22 for ISP services
        const nfePayload = {
          natureza_operacao: "Prestação de Serviço de Comunicação",
          tipo_documento: 1, // Saída
          finalidade_emissao: 1, // Normal
          cnpj_emitente: Deno.env.get("COMPANY_CNPJ") || "",
          nome_destinatario: customer.name,
          cpf_cnpj_destinatario: customer.cpf_cnpj,
          email_destinatario: customer.email,
          logradouro_destinatario: address.street || "",
          numero_destinatario: address.number || "S/N",
          bairro_destinatario: address.neighborhood || "",
          municipio_destinatario: address.city || "",
          uf_destinatario: address.state || "",
          cep_destinatario: address.cep || "",
          items: [
            {
              numero_item: 1,
              codigo_produto: "INTERNET",
              descricao: "Serviço de Comunicação Multimídia - SCM",
              cfop: "5307",
              unidade_comercial: "UN",
              quantidade_comercial: 1,
              valor_unitario_comercial: Number(invoice.amount),
              valor_bruto: Number(invoice.amount),
              icms_situacao_tributaria: "00",
              icms_aliquota: "0",
              pis_situacao_tributaria: "99",
              cofins_situacao_tributaria: "99",
            },
          ],
        };

        const model = params.model || "nfe21";
        const ref = `nfe-${invoiceId.slice(0, 8)}`;

        result = await fiscalApiCall(fiscalApiKey, fiscalBaseUrl, `/nfe?ref=${ref}`, "POST", nfePayload);

        // Save fiscal invoice record
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        await supabaseAdmin.from("fiscal_invoices").insert({
          organization_id: claims.claims.user_metadata?.organization_id || (await supabase.from("profiles").select("organization_id").maybeSingle()).data?.organization_id,
          customer_id: invoice.customer_id,
          invoice_id: invoiceId,
          model: model as any,
          value: invoice.amount,
          status: "pending",
          sefaz_response: JSON.stringify(result),
        });

        break;
      }

      case "emit_nfcom": {
        // NFCom Modelo 62 - for telecom services
        const invoiceId = params.invoice_id;
        if (!invoiceId) {
          return new Response(JSON.stringify({ error: "invoice_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, customers(name, cpf_cnpj, email, address)")
          .eq("id", invoiceId)
          .single();

        if (!invoice) {
          return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // NFCom specific payload
        const nfcomPayload = {
          tipo_documento: "NFCom",
          natureza_operacao: "Prestação de Serviço de Telecomunicação",
          destinatario: {
            nome: (invoice as any).customers.name,
            cpf_cnpj: (invoice as any).customers.cpf_cnpj,
          },
          itens: [
            {
              descricao: "Serviço de Comunicação Multimídia",
              valor: Number(invoice.amount),
              cfop: "5307",
            },
          ],
        };

        result = await fiscalApiCall(fiscalApiKey, fiscalBaseUrl, "/nfcom", "POST", nfcomPayload);
        break;
      }

      case "check_status": {
        const ref = params.ref || params.fiscal_invoice_id;
        if (!ref) {
          return new Response(JSON.stringify({ error: "ref or fiscal_invoice_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await fiscalApiCall(fiscalApiKey, fiscalBaseUrl, `/nfe/${ref}`);

        // Update fiscal invoice status if we have the record
        if (params.fiscal_invoice_id && (result as any).status) {
          const statusMap: Record<string, string> = {
            autorizado: "authorized",
            cancelado: "cancelled",
            rejeitado: "rejected",
            processando_autorizacao: "pending",
          };
          const newStatus = statusMap[(result as any).status] || "pending";

          const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
          );

          await supabaseAdmin.from("fiscal_invoices").update({
            status: newStatus as any,
            access_key: (result as any).chave_nfe || null,
            number: (result as any).numero || null,
            sefaz_response: JSON.stringify(result),
          }).eq("id", params.fiscal_invoice_id);
        }

        break;
      }

      case "cancel_nfe": {
        const ref = params.ref;
        const justification = params.justification;
        if (!ref || !justification) {
          return new Response(JSON.stringify({ error: "ref and justification are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await fiscalApiCall(fiscalApiKey, fiscalBaseUrl, `/nfe/${ref}`, "DELETE", { justificativa: justification });
        break;
      }

      case "download_xml": {
        const ref = params.ref;
        if (!ref) {
          return new Response(JSON.stringify({ error: "ref is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await fiscalApiCall(fiscalApiKey, fiscalBaseUrl, `/nfe/${ref}.xml`);
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
    console.error("Fiscal API error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
