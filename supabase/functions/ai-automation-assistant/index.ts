const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Prompt deve ter pelo menos 5 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um assistente especializado em criar automações para um sistema de provedor de internet (ISP).
O sistema suporta os seguintes tipos de automação:

CATEGORIAS: cobranca, atendimento, operacional

TIPOS DE TRIGGER:
- "event" — disparo quando um evento do sistema acontece
- "webhook" — disparo externo via webhook 
- "schedule" — disparo agendado

EVENTOS DISPONÍVEIS:
- invoice.due_3_days — fatura vence em 3 dias
- invoice.due_7_days — fatura vence em 7 dias
- invoice.overdue — fatura vencida
- invoice.paid — fatura paga
- contract.created — novo contrato criado
- ticket.resolved — ticket resolvido
- service_order.created — nova ordem de serviço

TIPOS DE AÇÃO:
- "webhook_call" — chama um webhook externo (n8n, Zapier, Make)
- "whatsapp" — enviar via WhatsApp (precisa de integração)
- "email" — enviar por email
- "internal" — ação interna do sistema (suspend_contract, reactivate_contract)

Baseado na descrição do usuário, retorne um JSON com:
{
  "name": "Nome da automação",
  "description": "Descrição clara",
  "category": "cobranca|atendimento|operacional",
  "trigger_type": "event|webhook|schedule",
  "trigger_config": { "event": "nome.do.evento" },
  "action_type": "webhook_call|whatsapp|email|internal",
  "action_config": { ... configuração da ação ... },
  "explanation": "Explicação amigável do que a automação faz"
}

Retorne APENAS o JSON válido, sem markdown, sem código, sem explicação fora do JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI retornou resposta inválida");
    }

    // Validate required fields
    const requiredFields = ["name", "category", "trigger_type", "action_type"];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, automation: parsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI automation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
