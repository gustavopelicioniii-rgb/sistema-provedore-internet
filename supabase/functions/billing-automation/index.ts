/**
 * BILLING AUTOMATION - Sistema de Cobrança Automática
 * 
 * Este função executa todas as自动化ções de cobrança de forma automatizada:
 * - Gera faturas automaticamente
 * - Envia notificações de vencimento
 * - Suspende clientes inadimplentes
 * - Reativa clientes após pagamento
 * - Integra com WhatsApp e Email
 * 
 * Configure no Supabase Dashboard > Database > cron jobs
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

interface BillingConfig {
  // Dias antes do vencimento para notificar
  notify_before_days: number[];
  // Dias após vencimento para suspender
  suspend_after_days: number;
  // Dias após pagamento para reativar
  reactivate_after_payment: boolean;
  // Horário para executar (formato 24h)
  execution_time: string;
  //whatsapp enabled
  whatsapp_enabled: boolean;
  // Email enabled
  email_enabled: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  plan_id: string;
  status: string;
}

interface Invoice {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  organization_id: string;
}

interface AutomationResult {
  success: boolean;
  invoices_generated: number;
  notifications_sent: number;
  customers_suspended: number;
  customers_reactivated: number;
  errors: string[];
  execution_time: string;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  if (entry.count > maxRequests) return false;
  return true;
}

// ============================================================================
// HELPERS
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://seudominio.com, https://app.seudominio.com, https://portal.seudominio.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR");
}

function getDaysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T12:00:00");
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function maskPhone(phone: string | null): string {
  if (!phone) return "***";
  if (phone.length < 6) return "***";
  return phone.slice(0, 3) + "****" + phone.slice(-2);
}

function maskEmail(email: string | null): string {
  if (!email) return "***";
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  return user.slice(0, 2) + "***@" + domain;
}

// ============================================================================
// WHATSAPP NOTIFICATION
// ============================================================================

async function sendWhatsAppMessage(
  supabase: ReturnType<typeof createClient>,
  phone: string,
  message: string,
  organizationId: string
): Promise<boolean> {
  try {
    // Chama a função whatsapp-api para enviar mensagem
    const { error } = await supabase.functions.invoke("whatsapp-api", {
      body: {
        action: "send_message",
        params: {
          phone: phone.replace(/\D/g, ""), // Remove formatação
          message: message,
        },
      },
    });

    if (error) {
      console.error("WhatsApp send error:", error);
      return false;
    }

    // Log a notificação
    await supabase.from("notification_alerts").insert({
      organization_id: organizationId,
      type: "info",
      title: "WhatsApp enviado",
      description: `Para ${maskPhone(phone)}: ${message.slice(0, 50)}...`,
      channel: "whatsapp",
      reference_type: "automation",
    });

    return true;
  } catch (err) {
    console.error("WhatsApp exception:", err);
    return false;
  }
}

// ============================================================================
// INVOICE GENERATION
// ============================================================================

async function generateInvoices(
  supabase: ReturnType<typeof createClient>,
  organizationId: string
): Promise<number> {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Busca clientes ativos sem fatura do mês
  const { data: customers, error: custError } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      email,
      whatsapp,
      plan_id,
      status,
      plans(price, name)
    `)
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (custError || !customers?.length) {
    return 0;
  }

  // Busca faturas já geradas neste mês
  const { data: existingInvoices } = await supabase
    .from("invoices")
    .select("customer_id")
    .eq("organization_id", organizationId)
    .gte("due_date", firstDayOfMonth.toISOString().slice(0, 10))
    .lte("due_date", lastDayOfMonth.toISOString().slice(0, 10));

  const existingCustomerIds = new Set(existingInvoices?.map(inv => inv.customer_id) || []);

  // Filtra clientes sem fatura
  const customersWithoutInvoice = customers.filter(c => !existingCustomerIds.has(c.id));

  let generated = 0;
  for (const customer of customersWithoutInvoice) {
    const plan = customer.plans as any;
    const amount = plan?.price || 0;
    const planName = plan?.name || "Plano";

    // Vencimento no dia 5 do próximo mês
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const { error: insertError } = await supabase.from("invoices").insert({
      customer_id: customer.id,
      organization_id: organizationId,
      amount: amount,
      due_date: dueDateStr,
      status: "pending",
      description: `Mensalidade ${planName} - ${today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
    });

    if (!insertError) {
      generated++;

      // Notifica cliente sobre nova fatura
      await supabase.from("notification_alerts").insert({
        organization_id: organizationId,
        type: "info",
        title: "Nova fatura gerada",
        description: `Fatura de ${formatCurrency(amount)} para ${customer.name} - vencimento ${formatDate(dueDateStr)}`,
        channel: "in_app",
        reference_type: "invoice_generated",
      });
    }
  }

  return generated;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

async function sendDueDateNotifications(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  config: BillingConfig
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Busca faturas pendentes dos próximos dias
  const notifyDates = config.notify_before_days.map(days => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  });

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      customer_id,
      amount,
      due_date,
      status,
      customers(name, email, whatsapp)
    `)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .in("due_date", notifyDates);

  if (error || !invoices?.length) {
    return 0;
  }

  let notificationsSent = 0;

  for (const invoice of invoices) {
    const customer = invoice.customers as any;
    if (!customer) continue;

    const daysUntil = getDaysDiff(invoice.due_date);
    const message = `Olá ${customer.name}! Sua fatura de ${formatCurrency(invoice.amount)} vence em ${daysUntil} dia(s) (${formatDate(invoice.due_date)}). Pague em dia para evitar suspensão.`;
    const urgentMessage = `⚠️ URGENTE: Sua fatura de ${formatCurrency(invoice.amount)} vence em ${daysUntil} dia(s) (${formatDate(invoice.due_date)}). Efetue o pagamento para evitar interrupção do serviço.`;

    // Verifica se já notificou hoje
    const { data: existing } = await supabase
      .from("notification_alerts")
      .select("id")
      .eq("reference_id", invoice.id)
      .eq("reference_type", "due_notification")
      .gte("created_at", todayStr + "T00:00:00Z")
      .limit(1);

    if (existing?.length) continue;

    // In-app notification
    await supabase.from("notification_alerts").insert({
      organization_id: organizationId,
      type: daysUntil <= 3 ? "warning" : "info",
      title: daysUntil <= 3 ? "Fatura vence em breve!" : "Lembrete de vencimento",
      description: `Fatura de ${formatCurrency(invoice.amount)} para ${customer.name} vence em ${daysUntil} dia(s)`,
      channel: "in_app",
      reference_id: invoice.id,
      reference_type: "due_notification",
    });
    notificationsSent++;

    // WhatsApp
    if (config.whatsapp_enabled && customer.whatsapp) {
      await sendWhatsAppMessage(
        supabase,
        customer.whatsapp,
        daysUntil <= 3 ? urgentMessage : message,
        organizationId
      );
      notificationsSent++;
    }

    // Email (placeholder - integraria com seu serviço de email)
    if (config.email_enabled && customer.email) {
      await supabase.from("notification_alerts").insert({
        organization_id: organizationId,
        type: "info",
        title: "Email de lembrete enviado",
        description: `Para ${maskEmail(customer.email)}: fatura vence em ${daysUntil} dia(s)`,
        channel: "email",
        reference_id: invoice.id,
        reference_type: "due_notification",
      });
    }
  }

  return notificationsSent;
}

// ============================================================================
// SUSPENSION
// ============================================================================

async function suspendOverdueCustomers(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  suspendAfterDays: number
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Calcula data de vencimento mais antiga que permite suspensão
  const oldestAllowedDate = new Date(today);
  oldestAllowedDate.setDate(oldestAllowedDate.getDate() - suspendAfterDays);
  const oldestAllowedStr = oldestAllowedDate.toISOString().slice(0, 10);

  // Busca faturas vencidas e não pagas
  const { data: overdueInvoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      customer_id,
      amount,
      due_date,
      customers(id, name, status)
    `)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .lte("due_date", oldestAllowedStr);

  if (error || !overdueInvoices?.length) {
    return 0;
  }

  let suspended = 0;

  for (const invoice of overdueInvoices) {
    const customer = invoice.customers as any;
    if (!customer || customer.status === "suspended") continue;

    // Suspende o cliente
    const { error: updateError } = await supabase
      .from("customers")
      .update({ status: "suspended", suspended_at: todayStr })
      .eq("id", customer.id);

    if (!updateError) {
      suspended++;

      // Marca a fatura como vencida
      await supabase
        .from("invoices")
        .update({ status: "overdue" })
        .eq("id", invoice.id);

      // Notifica
      await supabase.from("notification_alerts").insert({
        organization_id: organizationId,
        type: "warning",
        title: "Cliente suspenso",
        description: `${customer.name} foi suspenso por inadimplência (fatura vencida há ${suspendAfterDays}+ dias)`,
        channel: "in_app",
        reference_id: invoice.id,
        reference_type: "customer_suspended",
      });

      // Dispara automação de bloqueio no MikroTik (se configurado)
      try {
        await supabase.functions.invoke("automation-event-dispatch", {
          body: {
            event: "customer.suspended",
            organization_id: organizationId,
            payload: {
              customer_id: customer.id,
              customer_name: customer.name,
              invoice_id: invoice.id,
              reason: "overdue_payment",
            },
          },
        });
      } catch (e) {
        console.error("Error dispatching suspension event:", e);
      }
    }
  }

  return suspended;
}

// ============================================================================
// REACTIVATION
// ============================================================================

async function reactivatePaidCustomers(
  supabase: ReturnType<typeof createClient>,
  organizationId: string
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // Busca clientes suspensos com pagamentos confirmados nas últimas 24h
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const { data: paidInvoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      customer_id,
      paid_date,
      customers(id, name, status)
    `)
    .eq("organization_id", organizationId)
    .eq("status", "paid")
    .eq("customers.status", "suspended")
    .gte("paid_date", yesterdayStr);

  if (error || !paidInvoices?.length) {
    return 0;
  }

  let reactivated = 0;

  for (const invoice of paidInvoices) {
    const customer = invoice.customers as any;
    if (!customer) continue;

    // Reativa o cliente
    const { error: updateError } = await supabase
      .from("customers")
      .update({ 
        status: "active",
        suspended_at: null 
      })
      .eq("id", customer.id);

    if (!updateError) {
      reactivated++;

      // Notifica
      await supabase.from("notification_alerts").insert({
        organization_id: organizationId,
        type: "success",
        title: "Cliente reativado",
        description: `${customer.name} foi reativado após confirmação de pagamento`,
        channel: "in_app",
        reference_id: invoice.id,
        reference_type: "customer_reactivated",
      });

      // Dispara automação de reativação no MikroTik
      try {
        await supabase.functions.invoke("automation-event-dispatch", {
          body: {
            event: "customer.reactivated",
            organization_id: organizationId,
            payload: {
              customer_id: customer.id,
              customer_name: customer.name,
              invoice_id: invoice.id,
            },
          },
        });
      } catch (e) {
        console.error("Error dispatching reactivation event:", e);
      }
    }
  }

  return reactivated;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting - apenas 10 execuções por minuto
  if (!checkRateLimit("billing-automation", 10, 60000)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 10 executions per minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();
  const result: AutomationResult = {
    success: true,
    invoices_generated: 0,
    notifications_sent: 0,
    customers_suspended: 0,
    customers_reactivated: 0,
    errors: [],
    execution_time: "",
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Busca organizações ativas
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, billing_config")
      .eq("status", "active");

    if (orgError || !organizations?.length) {
      result.errors.push("Nenhuma organização ativa encontrada");
      result.success = false;
    } else {
      for (const org of organizations) {
        const config: BillingConfig = {
          notify_before_days: org.billing_config?.notify_before_days || [7, 3, 1],
          suspend_after_days: org.billing_config?.suspend_after_days || 7,
          reactivate_after_payment: org.billing_config?.reactivate_after_payment ?? true,
          execution_time: org.billing_config?.execution_time || "06:00",
          whatsapp_enabled: org.billing_config?.whatsapp_enabled ?? true,
          email_enabled: org.billing_config?.email_enabled ?? true,
        };

        // Executa cada automation
        try {
          const generated = await generateInvoices(supabase, org.id);
          result.invoices_generated += generated;
        } catch (e) {
          result.errors.push(`Erro ao gerar faturas para ${org.name}: ${e}`);
        }

        try {
          const notified = await sendDueDateNotifications(supabase, org.id, config);
          result.notifications_sent += notified;
        } catch (e) {
          result.errors.push(`Erro ao enviar notificações para ${org.name}: ${e}`);
        }

        try {
          const suspended = await suspendOverdueCustomers(supabase, org.id, config.suspend_after_days);
          result.customers_suspended += suspended;
        } catch (e) {
          result.errors.push(`Erro ao suspender clientes de ${org.name}: ${e}`);
        }

        try {
          if (config.reactivate_after_payment) {
            const reactivated = await reactivatePaidCustomers(supabase, org.id);
            result.customers_reactivated += reactivated;
          }
        } catch (e) {
          result.errors.push(`Erro ao reativar clientes de ${org.name}: ${e}`);
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    console.error("Billing automation error:", error);
  }

  result.execution_time = `${Date.now() - startTime}ms`;

  return new Response(JSON.stringify(result, null, 2), {
    status: result.success ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
