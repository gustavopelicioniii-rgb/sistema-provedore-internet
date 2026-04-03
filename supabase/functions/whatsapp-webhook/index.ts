import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvolutionMessagePayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { caption?: string; url?: string };
      audioMessage?: { url?: string };
      videoMessage?: { caption?: string; url?: string };
      documentMessage?: { caption?: string; url?: string; fileName?: string };
      stickerMessage?: { url?: string };
      locationMessage?: { degreesLatitude?: number; degreesLongitude?: number };
    };
    messageType?: string;
    messageTimestamp?: number;
    // Status update fields
    status?: string; // DELIVERY_ACK, READ, PLAYED, ERROR
    keyId?: string;
    remoteJid?: string;
  };
}

function extractContent(msg: EvolutionMessagePayload["data"]["message"]): { content: string | null; contentType: string; mediaUrl: string | null } {
  if (!msg) return { content: null, contentType: "text", mediaUrl: null };

  if (msg.conversation) return { content: msg.conversation, contentType: "text", mediaUrl: null };
  if (msg.extendedTextMessage?.text) return { content: msg.extendedTextMessage.text, contentType: "text", mediaUrl: null };
  if (msg.imageMessage) return { content: msg.imageMessage.caption || null, contentType: "image", mediaUrl: msg.imageMessage.url || null };
  if (msg.audioMessage) return { content: null, contentType: "audio", mediaUrl: msg.audioMessage.url || null };
  if (msg.videoMessage) return { content: msg.videoMessage.caption || null, contentType: "video", mediaUrl: msg.videoMessage.url || null };
  if (msg.documentMessage) return { content: msg.documentMessage.fileName || msg.documentMessage.caption || null, contentType: "document", mediaUrl: msg.documentMessage.url || null };
  if (msg.stickerMessage) return { content: null, contentType: "sticker", mediaUrl: msg.stickerMessage.url || null };
  if (msg.locationMessage) return { content: `${msg.locationMessage.degreesLatitude},${msg.locationMessage.degreesLongitude}`, contentType: "location", mediaUrl: null };

  return { content: null, contentType: "text", mediaUrl: null };
}

function normalizePhone(jid: string): string {
  return jid.replace(/@.*$/, "");
}

function mapEvolutionStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case "DELIVERY_ACK":
    case "SERVER_ACK":
      return "delivered";
    case "READ":
    case "PLAYED":
      return "read";
    case "ERROR":
    case "FAILED":
      return "failed";
    default:
      return "sent";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookSecret = Deno.env.get("EVOLUTION_WEBHOOK_SECRET");
    if (webhookSecret) {
      const headerSecret = req.headers.get("x-webhook-secret") || req.headers.get("apikey");
      if (headerSecret !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload: EvolutionMessagePayload = await req.json();
    console.log("Webhook event:", payload.event, "instance:", payload.instance);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Handle message status updates ---
    const statusEvents = ["messages.update", "MESSAGES_UPDATE", "message-receipt.update", "MESSAGE_RECEIPT_UPDATE"];
    if (statusEvents.includes(payload.event)) {
      const messageId = payload.data.keyId || payload.data.key?.id;
      const newStatus = payload.data.status;

      if (messageId && newStatus) {
        const deliveryStatus = mapEvolutionStatus(newStatus);
        const { error } = await supabase
          .from("chat_messages")
          .update({ delivery_status: deliveryStatus })
          .eq("external_message_id", messageId);

        if (error) {
          console.error("Error updating delivery status:", error);
        } else {
          console.log("Delivery status updated:", messageId, "->", deliveryStatus);
        }
      }

      return new Response(JSON.stringify({ ok: true, handled: "status_update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Handle incoming messages ---
    if (payload.event !== "messages.upsert" && payload.event !== "MESSAGES_UPSERT") {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "event_not_handled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { key, pushName, message } = payload.data;

    if (key.fromMe) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "from_me" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (key.remoteJid.includes("@g.us")) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "group_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = normalizePhone(key.remoteJid);
    const { content, contentType, mediaUrl } = extractContent(message);

    // Find org by instance
    const { data: channelConfig } = await supabase
      .from("channel_configs")
      .select("organization_id, config")
      .eq("channel", "whatsapp")
      .eq("enabled", true);

    let orgId: string | null = null;
    if (channelConfig && channelConfig.length > 0) {
      for (const cfg of channelConfig) {
        const cfgData = cfg.config as Record<string, unknown> | null;
        if (cfgData && (cfgData as any).instance === payload.instance) {
          orgId = cfg.organization_id;
          break;
        }
      }
      if (!orgId && channelConfig.length === 1) {
        orgId = channelConfig[0].organization_id;
      }
    }

    if (!orgId) {
      console.error("No organization found for instance:", payload.instance);
      return new Response(JSON.stringify({ error: "No organization configured" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, name")
      .eq("organization_id", orgId)
      .or(`whatsapp.eq.${phone},phone.eq.${phone}`)
      .maybeSingle();

    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id, status")
      .eq("organization_id", orgId)
      .eq("channel", "whatsapp")
      .eq("channel_contact_id", phone)
      .in("status", ["open", "waiting"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
      if (existingConv.status === "waiting") {
        await supabase.from("conversations").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", conversationId);
      }
    } else {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          organization_id: orgId,
          customer_id: customer?.id || null,
          channel: "whatsapp",
          channel_contact_id: phone,
          channel_conversation_id: key.remoteJid,
          status: "open",
          subject: pushName ? `Conversa com ${pushName}` : `Conversa WhatsApp ${phone}`,
          metadata: { pushName: pushName || null, instance: payload.instance },
        })
        .select("id")
        .single();

      if (convError || !newConv) throw new Error("Failed to create conversation");
      conversationId = newConv.id;
    }

    const { error: msgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        organization_id: orgId,
        sender_type: "customer",
        sender_id: customer?.id || null,
        content,
        content_type: contentType,
        media_url: mediaUrl,
        external_message_id: key.id,
        delivery_status: "delivered",
        metadata: { pushName: pushName || null, remoteJid: key.remoteJid },
      });

    if (msgError) throw new Error("Failed to insert message");

    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: (content || `[${contentType}]`).substring(0, 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return new Response(
      JSON.stringify({ ok: true, conversation_id: conversationId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
