import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

interface SubscriberPayload {
  sub: string;
  customer_id: string;
  organization_id: string;
  type: "subscriber";
}

async function getJwtKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function verifySubscriberToken(req: Request): Promise<SubscriberPayload> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Token ausente");
  const token = auth.replace("Bearer ", "");
  const key = await getJwtKey();
  const payload = await verify(token, key) as unknown as SubscriberPayload;
  if (payload.type !== "subscriber") throw new Error("Token inválido");
  return payload;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const subscriber = await verifySubscriberToken(req);
    const { customer_id, organization_id } = subscriber;

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    switch (action) {
      case "invoices": {
        const { data } = await adminClient
          .from("invoices")
          .select("id, amount, due_date, paid_date, status, barcode, pix_qrcode, payment_method")
          .eq("customer_id", customer_id)
          .eq("organization_id", organization_id)
          .order("due_date", { ascending: false })
          .limit(50);
        return jsonResponse({ data: data ?? [] });
      }

      case "contracts": {
        const { data } = await adminClient
          .from("contracts")
          .select("id, status, start_date, end_date, signed_at, installation_address, billing_day, authentication, plans(name, price, download_speed, upload_speed)")
          .eq("customer_id", customer_id)
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false });
        return jsonResponse({ data: data ?? [] });
      }

      case "tickets": {
        const { data } = await adminClient
          .from("tickets")
          .select("id, subject, description, priority, status, created_at, resolved_at")
          .eq("customer_id", customer_id)
          .eq("organization_id", organization_id)
          .order("created_at", { ascending: false })
          .limit(30);
        return jsonResponse({ data: data ?? [] });
      }

      case "create-ticket": {
        if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
        const body = await req.json();
        const subject = String(body.subject ?? "").trim();
        if (!subject || subject.length > 255) return jsonResponse({ error: "Assunto inválido" }, 400);
        const description = body.description ? String(body.description).slice(0, 2000) : null;

        const { error } = await adminClient.from("tickets").insert([{
          organization_id,
          customer_id,
          subject,
          description,
          priority: "medium",
          status: "open",
        }]);
        if (error) return jsonResponse({ error: error.message }, 400);
        return jsonResponse({ success: true });
      }

      case "traffic": {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const { data } = await adminClient
          .from("traffic_usage")
          .select("period_start, download_bytes, upload_bytes")
          .eq("customer_id", customer_id)
          .eq("organization_id", organization_id)
          .gte("period_start", sixMonthsAgo.toISOString())
          .order("period_start", { ascending: true });
        return jsonResponse({ data: data ?? [] });
      }

      case "connection": {
        const { data: contract } = await adminClient
          .from("contracts")
          .select("status, authentication, plans(name, download_speed, upload_speed)")
          .eq("customer_id", customer_id)
          .eq("organization_id", organization_id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        return jsonResponse({ data: contract });
      }

      case "profile": {
        const { data: customer } = await adminClient
          .from("customers")
          .select("name, email, phone, whatsapp, cpf_cnpj")
          .eq("id", customer_id)
          .eq("organization_id", organization_id)
          .single();
        return jsonResponse({ data: customer });
      }

      case "update-profile": {
        if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
        const body = await req.json();
        const updates: Record<string, string> = {};
        if (body.phone) updates.phone = String(body.phone).slice(0, 20);
        if (body.whatsapp) updates.whatsapp = String(body.whatsapp).slice(0, 20);
        if (body.email) updates.email = String(body.email).slice(0, 255);

        if (Object.keys(updates).length === 0) return jsonResponse({ error: "Nada para atualizar" }, 400);

        const { error } = await adminClient
          .from("customers")
          .update(updates)
          .eq("id", customer_id)
          .eq("organization_id", organization_id);
        if (error) return jsonResponse({ error: error.message }, 400);
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Endpoint não encontrado" }, 404);
    }
  } catch (err) {
    console.error("portal-data error:", err);
    const msg = err instanceof Error ? err.message : "Erro interno";
    const status = msg.includes("Token") ? 401 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
