import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ── Evolution API v2 Full Integration ──────────────────────────────────────

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  instance: string;
}

async function getEvolutionConfig(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  instanceOverride?: string
): Promise<EvolutionConfig> {
  const { data, error } = await supabase
    .from("channel_configs")
    .select("config, enabled")
    .eq("organization_id", orgId)
    .eq("channel", "whatsapp")
    .eq("enabled", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("WhatsApp channel not configured. Go to Settings → Channels to set up.");
  }

  const cfg = data.config as Record<string, string> | null;
  if (!cfg?.api_url || !cfg?.api_key) {
    throw new Error("WhatsApp channel is missing API URL or API Key. Check Settings → Channels.");
  }

  return {
    api_url: cfg.api_url.replace(/\/+$/, ""),
    api_key: cfg.api_key,
    instance: instanceOverride || cfg.instance || "default",
  };
}

async function evolutionFetch(
  config: EvolutionConfig,
  path: string,
  method = "GET",
  body?: unknown
) {
  const url = `${config.api_url}${path}`;
  console.log(`Evolution API ${method} ${url}`);

  const resp = await fetch(url, {
    method,
    headers: {
      apikey: config.api_key,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      `Evolution API error [${resp.status}]: ${JSON.stringify(data)}`
    );
  }
  return data;
}

// ── Input Schemas ──────────────────────────────────────────────────────────

const ActionSchema = z.object({
  action: z.string(),
  params: z.record(z.unknown()).default({}),
});

// ── Handlers ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const { data: orgId } = await supabase.rpc("get_user_organization_id");
    if (!orgId) {
      return jsonResp({ error: "Organization not found" }, 400);
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResp({ error: "Invalid request", details: parsed.error.flatten().fieldErrors }, 400);
    }

    const { action, params } = parsed.data;
    let result: unknown;

    switch (action) {
      // ═══════════════════════════════════════════════════════════════════
      // INSTANCE MANAGEMENT (Evolution API v2)
      // ═══════════════════════════════════════════════════════════════════

      case "instance_info": {
        // GET / — Check if Evolution API is reachable
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(config, "/");
        break;
      }

      case "instance_create": {
        // POST /instance/create
        const config = await getEvolutionConfig(supabase, orgId);
        const instanceName = (params.instanceName as string) || config.instance;
        const webhookUrl = params.webhookUrl as string | undefined;

        const createBody: Record<string, unknown> = {
          instanceName,
          integration: (params.integration as string) || "WHATSAPP-BAILEYS",
          qrcode: params.qrcode !== false,
          rejectCall: params.rejectCall ?? true,
          msgCall: (params.msgCall as string) || "",
          groupsIgnore: params.groupsIgnore ?? true,
          alwaysOnline: params.alwaysOnline ?? false,
          readMessages: params.readMessages ?? false,
          readStatus: params.readStatus ?? false,
          syncFullHistory: params.syncFullHistory ?? false,
        };

        // If number provided, use pairing code instead of QR
        if (params.number) {
          createBody.number = String(params.number).replace(/\D/g, "");
          createBody.qrcode = false;
        }

        // Configure webhook during instance creation
        if (webhookUrl) {
          createBody.webhook = {
            url: webhookUrl,
            byEvents: false,
            base64: true,
            headers: params.webhookHeaders || {},
            events: [
              "MESSAGES_UPSERT",
              "MESSAGES_UPDATE",
              "MESSAGE_RECEIPT_UPDATE",
              "CONNECTION_UPDATE",
              "QRCODE_UPDATED",
            ],
          };
        }

        result = await evolutionFetch(config, "/instance/create", "POST", createBody);
        break;
      }

      case "instance_connect": {
        // GET /instance/connect/{instance} — Returns QR code / pairing code
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        result = await evolutionFetch(config, `/instance/connect/${config.instance}`);
        break;
      }

      case "instance_fetch": {
        // GET /instance/fetchInstances — List all instances
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(config, "/instance/fetchInstances");
        break;
      }

      case "instance_connection_state": {
        // GET /instance/connectionState/{instance}
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        result = await evolutionFetch(config, `/instance/connectionState/${config.instance}`);
        break;
      }

      case "instance_restart": {
        // PUT /instance/restart/{instance}
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        result = await evolutionFetch(config, `/instance/restart/${config.instance}`, "PUT");
        break;
      }

      case "instance_logout": {
        // DELETE /instance/logout/{instance}
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        result = await evolutionFetch(config, `/instance/logout/${config.instance}`, "DELETE");
        break;
      }

      case "instance_delete": {
        // DELETE /instance/delete/{instance}
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        result = await evolutionFetch(config, `/instance/delete/${config.instance}`, "DELETE");
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // WEBHOOK MANAGEMENT
      // ═══════════════════════════════════════════════════════════════════

      case "webhook_set": {
        // PUT /webhook/set/{instance}
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        const webhookBody = {
          url: params.url as string,
          webhook_by_events: params.byEvents ?? false,
          webhook_base64: params.base64 ?? true,
          events: (params.events as string[]) || [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "MESSAGE_RECEIPT_UPDATE",
            "CONNECTION_UPDATE",
          ],
          headers: params.headers || {},
        };
        result = await evolutionFetch(config, `/webhook/set/${config.instance}`, "PUT", webhookBody);
        break;
      }

      case "webhook_find": {
        // GET /webhook/find/{instance}
        const config = await getEvolutionConfig(supabase, orgId, params.instance as string);
        result = await evolutionFetch(config, `/webhook/find/${config.instance}`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Text
      // ═══════════════════════════════════════════════════════════════════

      case "send_text": {
        const phone = params.phone as string;
        const message = params.message as string;
        if (!phone || !message) {
          return jsonResp({ error: "phone and message are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);
        const number = normalizePhone(phone);

        const sendBody: Record<string, unknown> = {
          number,
          text: message,
        };
        if (params.delay) sendBody.delay = Number(params.delay);
        if (params.linkPreview !== undefined) sendBody.linkPreview = params.linkPreview;
        if (params.quoted) sendBody.quoted = params.quoted;

        result = await evolutionFetch(config, `/message/sendText/${config.instance}`, "POST", sendBody);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Media (image, video, gif)
      // ═══════════════════════════════════════════════════════════════════

      case "send_media": {
        const phone = params.phone as string;
        const media = params.media as string; // URL or base64
        const mediatype = (params.mediatype as string) || "image";
        if (!phone || !media) {
          return jsonResp({ error: "phone and media are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        const sendBody: Record<string, unknown> = {
          number: normalizePhone(phone),
          mediatype,
          media,
          caption: (params.caption as string) || "",
          fileName: (params.fileName as string) || "",
        };
        if (params.mimetype) sendBody.mimetype = params.mimetype;
        if (params.delay) sendBody.delay = Number(params.delay);

        result = await evolutionFetch(config, `/message/sendMedia/${config.instance}`, "POST", sendBody);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Audio (PTT / voice note)
      // ═══════════════════════════════════════════════════════════════════

      case "send_audio": {
        const phone = params.phone as string;
        const audio = params.audio as string; // URL or base64
        if (!phone || !audio) {
          return jsonResp({ error: "phone and audio are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendWhatsAppAudio/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            audio,
            delay: params.delay ? Number(params.delay) : undefined,
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Document
      // ═══════════════════════════════════════════════════════════════════

      case "send_document": {
        const phone = params.phone as string;
        const media = params.media as string;
        const fileName = params.fileName as string;
        if (!phone || !media || !fileName) {
          return jsonResp({ error: "phone, media and fileName are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendMedia/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            mediatype: "document",
            media,
            fileName,
            caption: (params.caption as string) || "",
            mimetype: (params.mimetype as string) || "application/pdf",
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Location
      // ═══════════════════════════════════════════════════════════════════

      case "send_location": {
        const phone = params.phone as string;
        const latitude = params.latitude as number;
        const longitude = params.longitude as number;
        if (!phone || latitude === undefined || longitude === undefined) {
          return jsonResp({ error: "phone, latitude and longitude are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendLocation/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            name: (params.name as string) || "",
            address: (params.address as string) || "",
            latitude,
            longitude,
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Contact (vCard)
      // ═══════════════════════════════════════════════════════════════════

      case "send_contact": {
        const phone = params.phone as string;
        const contactName = params.contactName as string;
        const contactPhone = params.contactPhone as string;
        if (!phone || !contactName || !contactPhone) {
          return jsonResp({ error: "phone, contactName and contactPhone are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendContact/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            contact: [
              {
                fullName: contactName,
                wuid: normalizePhone(contactPhone) + "@s.whatsapp.net",
                phoneNumber: normalizePhone(contactPhone),
              },
            ],
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Buttons / List
      // ═══════════════════════════════════════════════════════════════════

      case "send_buttons": {
        const phone = params.phone as string;
        if (!phone) return jsonResp({ error: "phone is required" }, 400);
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendButtons/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            title: params.title || "",
            description: params.description || "",
            footer: params.footer || "",
            buttons: params.buttons || [],
          }
        );
        break;
      }

      case "send_list": {
        const phone = params.phone as string;
        if (!phone) return jsonResp({ error: "phone is required" }, 400);
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendList/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            title: params.title || "",
            description: params.description || "",
            buttonText: params.buttonText || "Menu",
            footerText: params.footerText || "",
            sections: params.sections || [],
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Poll
      // ═══════════════════════════════════════════════════════════════════

      case "send_poll": {
        const phone = params.phone as string;
        const name = params.name as string;
        const values = params.values as string[];
        if (!phone || !name || !values?.length) {
          return jsonResp({ error: "phone, name and values are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendPoll/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            name,
            values,
            selectableCount: params.selectableCount || 1,
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Sticker
      // ═══════════════════════════════════════════════════════════════════

      case "send_sticker": {
        const phone = params.phone as string;
        const sticker = params.sticker as string;
        if (!phone || !sticker) {
          return jsonResp({ error: "phone and sticker are required" }, 400);
        }
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/message/sendSticker/${config.instance}`,
          "POST",
          {
            number: normalizePhone(phone),
            sticker,
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // MESSAGES — Send Status/Stories
      // ═══════════════════════════════════════════════════════════════════

      case "send_status": {
        const config = await getEvolutionConfig(supabase, orgId);
        const statusType = (params.type as string) || "text";

        result = await evolutionFetch(
          config,
          `/message/sendStatus/${config.instance}`,
          "POST",
          {
            type: statusType,
            content: params.content || params.text || "",
            caption: params.caption || "",
            backgroundColor: params.backgroundColor || "#000000",
            font: params.font || 0,
            allContacts: params.allContacts ?? true,
            statusJidList: params.statusJidList || [],
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // CHAT — Profile, Contacts, etc.
      // ═══════════════════════════════════════════════════════════════════

      case "check_number": {
        // POST /chat/whatsappNumbers/{instance}
        const phone = params.phone as string;
        if (!phone) return jsonResp({ error: "phone is required" }, 400);
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/chat/whatsappNumbers/${config.instance}`,
          "POST",
          { numbers: [normalizePhone(phone)] }
        );
        break;
      }

      case "get_profile_picture": {
        const phone = params.phone as string;
        if (!phone) return jsonResp({ error: "phone is required" }, 400);
        const config = await getEvolutionConfig(supabase, orgId);

        result = await evolutionFetch(
          config,
          `/chat/fetchProfilePictureUrl/${config.instance}`,
          "POST",
          { number: normalizePhone(phone) }
        );
        break;
      }

      case "get_contacts": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/findContacts/${config.instance}`,
          "POST",
          { where: params.where || {} }
        );
        break;
      }

      case "get_messages": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/findMessages/${config.instance}`,
          "POST",
          {
            where: {
              key: { remoteJid: params.remoteJid || "" },
            },
            limit: params.limit || 20,
          }
        );
        break;
      }

      case "read_messages": {
        // PUT /chat/markMessageAsRead/{instance}
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/markMessageAsRead/${config.instance}`,
          "PUT",
          {
            readMessages: params.readMessages || [],
          }
        );
        break;
      }

      case "archive_chat": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/archiveChat/${config.instance}`,
          "PUT",
          {
            lastMessage: {
              key: {
                remoteJid: params.remoteJid,
                fromMe: params.fromMe ?? false,
                id: params.messageId || "",
              },
            },
            archive: params.archive ?? true,
          }
        );
        break;
      }

      case "delete_message": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/deleteMessageForEveryone/${config.instance}`,
          "DELETE",
          {
            id: params.messageId,
            remoteJid: params.remoteJid,
            fromMe: params.fromMe ?? true,
          }
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // BUSINESS FLOWS — Billing, Boleto (higher-level helpers)
      // ═══════════════════════════════════════════════════════════════════

      case "send_billing": {
        const customer_id = params.customer_id as string;
        if (!customer_id) return jsonResp({ error: "customer_id is required" }, 400);
        const config = await getEvolutionConfig(supabase, orgId);

        const { data: customer } = await supabase
          .from("customers")
          .select("name, whatsapp")
          .eq("id", customer_id)
          .single();

        if (!customer?.whatsapp) {
          return jsonResp({ error: "Customer has no WhatsApp number" }, 400);
        }

        const { data: invoices } = await supabase
          .from("invoices")
          .select("id, amount, due_date, status")
          .eq("customer_id", customer_id)
          .in("status", ["pending", "overdue"])
          .order("due_date", { ascending: true })
          .limit(3);

        if (!invoices?.length) {
          return jsonResp({ error: "No pending invoices" }, 400);
        }

        const lines = invoices.map(
          (inv) =>
            `📄 Vencimento: ${inv.due_date} — R$ ${Number(inv.amount).toFixed(2)} (${inv.status === "overdue" ? "⚠️ VENCIDA" : "Pendente"})`
        );

        const message = `Olá ${customer.name}! 👋\n\nVocê possui faturas em aberto:\n\n${lines.join("\n")}\n\nPara pagar, acesse o portal do assinante ou entre em contato conosco.`;

        result = await evolutionFetch(config, `/message/sendText/${config.instance}`, "POST", {
          number: normalizePhone(customer.whatsapp),
          text: message,
        });
        break;
      }

      case "send_boleto": {
        const invoice_id = params.invoice_id as string;
        if (!invoice_id) return jsonResp({ error: "invoice_id is required" }, 400);
        const config = await getEvolutionConfig(supabase, orgId);

        const { data: invoice } = await supabase
          .from("invoices")
          .select("*, customers(name, whatsapp)")
          .eq("id", invoice_id)
          .single();

        if (!invoice) return jsonResp({ error: "Invoice not found" }, 404);
        const customer = (invoice as any).customers;
        if (!customer?.whatsapp) {
          return jsonResp({ error: "Customer has no WhatsApp number" }, 400);
        }

        let message = `Olá ${customer.name}! 📄\n\nSegue sua fatura:\n💰 Valor: R$ ${Number(invoice.amount).toFixed(2)}\n📅 Vencimento: ${invoice.due_date}`;
        if (invoice.barcode) message += `\n\n📋 Código de barras:\n${invoice.barcode}`;
        if (invoice.pix_qrcode) message += `\n\n📱 PIX disponível no portal do assinante.`;

        result = await evolutionFetch(config, `/message/sendText/${config.instance}`, "POST", {
          number: normalizePhone(customer.whatsapp),
          text: message,
        });
        break;
      }

      case "check_status": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(config, `/instance/connectionState/${config.instance}`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // GROUP MANAGEMENT
      // ═══════════════════════════════════════════════════════════════════

      case "group_create": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/group/create/${config.instance}`,
          "POST",
          {
            subject: params.subject || "New Group",
            description: params.description || "",
            participants: params.participants || [],
          }
        );
        break;
      }

      case "group_fetch_all": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/group/fetchAllGroups/${config.instance}`,
          "GET"
        );
        break;
      }

      // ═══════════════════════════════════════════════════════════════════
      // PROFILE
      // ═══════════════════════════════════════════════════════════════════

      case "profile_fetch": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/fetchProfile/${config.instance}`,
          "POST",
          { number: params.number ? normalizePhone(params.number as string) : "" }
        );
        break;
      }

      case "profile_update": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/updateProfileName/${config.instance}`,
          "PUT",
          { name: params.name || "" }
        );
        break;
      }

      case "profile_picture": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/updateProfilePicture/${config.instance}`,
          "PUT",
          { picture: params.picture || "" }
        );
        break;
      }

      case "profile_status": {
        const config = await getEvolutionConfig(supabase, orgId);
        result = await evolutionFetch(
          config,
          `/chat/updateProfileStatus/${config.instance}`,
          "PUT",
          { status: params.status || "" }
        );
        break;
      }

      default:
        return jsonResp({ error: `Unknown action: ${action}` }, 400);
    }

    return jsonResp({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("WhatsApp API error:", message);
    return jsonResp({ success: false, error: message }, 500);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
