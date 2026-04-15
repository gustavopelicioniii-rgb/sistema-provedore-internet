# 💰 Automação de Cobrança - Guia de Configuração

Este documento explica como configurar e usar o sistema de automação de cobrança.

## 📋 Visão Geral

O sistema de automação de cobrança do NetPulse ISP executa as seguintes tarefas automaticamente:

| Tarefa | Descrição |
|--------|-----------|
| **Gerar Faturas** | Cria faturas mensais automaticamente para todos os clientes ativos |
| **Notificações** | Envia lembretes por WhatsApp/Email antes do vencimento |
| **Suspensão** | Suspende clientes inadimplentes após X dias |
| **Reativação** | Reativa clientes após confirmação de pagamento |

## ⚙️ Configuração

### 1. Configurar Organization

Edite a tabela `billing_configurations` no Supabase:

```sql
INSERT INTO billing_configurations (
    organization_id,
    notify_before_days,
    suspend_after_days,
    whatsapp_enabled,
    email_enabled,
    enabled
) VALUES (
    'seu-org-uuid',
    ARRAY[7, 3, 1],  -- Notificar 7, 3 e 1 dia antes do vencimento
    7,                -- Suspender após 7 dias de atraso
    true,             -- Enviar WhatsApp
    true,             -- Enviar Email
    true              -- Ativar
);
```

### 2. Configurar Cron Job (Supabase)

No Supabase Dashboard, vá em **Database → Extensions → pg_cron** e ative.

Depois, configure o cron job:

```sql
-- Ativar extensão (se não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 6h da manhã
SELECT cron.schedule(
    'billing-automation-daily',
    '0 6 * * *',  -- Todo dia às 6:00
    $$
    SELECT
        supabase_functions.invoke(
            'billing-automation',
            '{"body": {}}
        '::json
    );
    $$
);

-- Verificar jobs agendados
SELECT * FROM cron.job;
```

### 3. Configurar Templates de Mensagens

Edite a tabela `notification_templates` para personalizar mensagens:

```sql
-- Exemplo: alterar mensagem de lembrete de 7 dias
UPDATE notification_templates
SET body = 'Olá {{customer_name}}! Sua fatura de R$ {{amount}} vence em {{days}} dias ({{due_date}}). Pague pelo PIX ou boleto!'
WHERE type = 'due_reminder_7' AND channel = 'whatsapp';
```

## 📅 Fluxo de Automação

```
DIA -7  → Lembrete: "Fatura vence em 7 dias"
DIA -3  → Lembrete: "Fatura vence em 3 dias!"
DIA -1  → URGENTE: "Fatura vence AMANHÃ!"
DIA  0  → Vencimento (sem ação automática)
DIA +7  → Suspensão: Cliente é suspenso
         → Notificação: "Serviço suspenso por inadimplência"
         
APÓS PAGAMENTO:
         → Reativação automática
         → Notificação: "Serviço reativado!"
```

## 🔧 Funções Disponíveis

### billing-automation

Função principal que executa todo o fluxo.

```bash
# Chamar manualmente (sem auth necessária - rate limited)
curl -X POST https://your-project.supabase.co/functions/v1/billing-automation \
  -H "Content-Type: application/json"
```

**Resposta:**
```json
{
  "success": true,
  "invoices_generated": 15,
  "notifications_sent": 42,
  "customers_suspended": 3,
  "customers_reactivated": 2,
  "errors": [],
  "execution_time": "2340ms"
}
```

### check-due-invoices

Verifica faturas pendentes dos próximos 7 dias e notifica.

### billing-rules

Sistema flexível de regras configuráveis por dias offset.

## 📊 Logs

Visualize os logs em `billing_automation_logs`:

```sql
-- Últimos logs
SELECT * FROM billing_automation_logs
ORDER BY created_at DESC
LIMIT 10;

-- Estatísticas por organização
SELECT 
    organization_id,
    SUM(invoices_generated) as total_generated,
    SUM(notifications_sent) as total_notified,
    SUM(customers_suspended) as total_suspended,
    SUM(customers_reactivated) as total_reactivated
FROM billing_automation_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY organization_id;
```

## 🔒 Segurança

- A função `billing-automation` tem rate limiting (10 execuções/minuto)
- Apenas o service_role do Supabase pode executar
- Logs não contém dados sensíveis (CPF, emails completos)
- Webhooks usam tokens de verificação

## 🐛 Troubleshooting

### Automação não executa
1. Verificar se o cron job está agendado: `SELECT * FROM cron.job;`
2. Verificar logs: `SELECT * FROM billing_automation_logs ORDER BY created_at DESC LIMIT 5;`
3. Testar função manualmente via curl

### Clientes não são suspensos
1. Verificar `suspend_after_days` na configuração
2. Verificar se a data de vencimento está correta
3. Verificar se o status da fatura é "pending"

### Notificações não enviadas
1. Verificar `whatsapp_enabled` e `email_enabled`
2. Verificar se o cliente tem WhatsApp/Email cadastrado
3. Verificar tabela `notification_control` para duplicatas bloqueadas

## 📱 Integrações

### WhatsApp
A função envia mensagens via `whatsapp-api`. Certifique-se de que:
- A integração com WhatsApp está configurada
- O webhook da Asaas está configurado para confirmar pagamentos

### MikroTik
Ao suspender/reativar clientes, a função dispatch events para `automation-event-dispatch`.
Configure regras no MikroTik para:
- Bloquear PPPoE quando cliente status = "suspended"
- Desbloquear quando status = "active"

## 🚀 Produção

Antes de ativar em produção:
1. ✅ Teste em desenvolvimento
2. ✅ Configure os templates de mensagem
3. ✅ Teste o cron job manualmente
4. ✅ Monitore os logs por alguns dias
5. ✅ Ajuste `notify_before_days` conforme necessário
