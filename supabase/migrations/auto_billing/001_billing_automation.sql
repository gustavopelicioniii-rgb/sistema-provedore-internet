-- ============================================================================
-- BILLING AUTOMATION - Tabelas e Configurações
-- ============================================================================

-- Tabela de configuração de billing por organização
CREATE TABLE IF NOT EXISTS billing_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Configurações de notificação
    notify_before_days INTEGER[] DEFAULT ARRAY[7, 3, 1],  -- Notificar 7, 3 e 1 dia antes
    whatsapp_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    
    -- Configurações de suspensão
    suspend_after_days INTEGER DEFAULT 7,  -- Suspender após 7 dias
    
    -- Configurações de reativação
    reactivate_after_payment BOOLEAN DEFAULT true,
    
    -- Horário de execução (formato 24h)
    execution_time TIME DEFAULT '06:00',
    
    -- Status
    enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por organização
CREATE INDEX IF NOT EXISTS idx_billing_config_org ON billing_configurations(organization_id);

-- Tabela de log de execuções da automation
CREATE TABLE IF NOT EXISTS billing_automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Resultados
    invoices_generated INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    customers_suspended INTEGER DEFAULT 0,
    customers_reactivated INTEGER DEFAULT 0,
    
    -- Status e erros
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    
    -- Metadados
    execution_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para relatórios
CREATE INDEX IF NOT EXISTS idx_billing_logs_org_date ON billing_automation_logs(organization_id, created_at);

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Tipo de notificação
    type VARCHAR(50) NOT NULL,  -- 'due_reminder', 'overdue', 'suspended', 'reactivated'
    channel VARCHAR(20) NOT NULL,  -- 'whatsapp', 'email', 'in_app'
    language VARCHAR(5) DEFAULT 'pt-BR',
    
    -- Conteúdo
    subject VARCHAR(200),  -- Para email
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    
    -- Variáveis disponíveis: {{customer_name}}, {{amount}}, {{due_date}}, {{days}}, {{plan_name}}
    
    -- Status
    enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dados padrão de templates (pt-BR)
INSERT INTO notification_templates (organization_id, type, channel, title, body) VALUES
    -- Lembretes de vencimento
    (NULL, 'due_reminder_7', 'whatsapp', 'Lembrete de Fatura', 
     'Olá {{customer_name}}! Sua fatura de {{amount}} vence em {{days}} dia(s) ({{due_date}}). Pague em dia para evitar suspensão do serviço.'),
    (NULL, 'due_reminder_3', 'whatsapp', '⚠️ Fatura vencendo!', 
     'Olá {{customer_name}}! Sua fatura de {{amount}} vence em {{days}} dia(s) ({{due_date}}). Efetue o pagamento urgente para evitar interrupção.'),
    (NULL, 'due_reminder_1', 'whatsapp', '🚨 ÚLTIMO DIA!', 
     'Olá {{customer_name}}! SUA FATURA DE {{amount}} VENCE HOJE ({{due_date}})! Pague agora para não ter o serviço interrompido.'),
    
    -- Cobrança vencida
    (NULL, 'overdue', 'whatsapp', '⚠️ Fatura Vencida', 
     'Olá {{customer_name}}! Sua fatura de {{amount}} está vencida desde {{due_date}}. Efetue o pagamento o quanto antes para evitar a suspensão do serviço.'),
    
    -- Cliente suspenso
    (NULL, 'suspended', 'whatsapp', '⚠️ Serviço Suspenso', 
     'Olá {{customer_name}}! Seu serviço foi suspenso por inadimplência. Para reativar, efetue o pagamento da fatura de {{amount}} e entre em contato com o suporte.'),
    
    -- Cliente reativado
    (NULL, 'reactivated', 'whatsapp', '✅ Serviço Reativado', 
     'Olá {{customer_name}}! Seu pagamento foi confirmado e o serviço foi reativado. Obrigado!');

-- Tabela de controle de notificações (evita duplicação)
CREATE TABLE IF NOT EXISTS notification_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id UUID NOT NULL,  -- ID da fatura ou cliente
    reference_type VARCHAR(50) NOT NULL,  -- 'invoice_due', 'customer_suspended', etc.
    notification_type VARCHAR(50) NOT NULL,  -- 'due_reminder', 'overdue', etc.
    channel VARCHAR(20) NOT NULL,  -- 'whatsapp', 'email', 'in_app'
    
    -- Data da última notificação
    last_sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contagem de envios
    send_count INTEGER DEFAULT 1,
    
    -- Unique para evitar duplicatas
    UNIQUE(reference_id, reference_type, notification_type, channel)
);

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_notification_control_lookup ON notification_control(reference_id, reference_type, notification_type);

-- ============================================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para billing_configurations
DROP TRIGGER IF EXISTS update_billing_configurations_updated_at ON billing_configurations;
CREATE TRIGGER update_billing_configurations_updated_at
    BEFORE UPDATE ON billing_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para notification_templates
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS - Row Level Security
-- ============================================================================

ALTER TABLE billing_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_control ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas a organização proprietária pode ver/editar
CREATE POLICY "Org can manage own billing config" ON billing_configurations
    FOR ALL USING (organization_id = current_setting('app.organization_id')::uuid);

CREATE POLICY "Org can view own automation logs" ON billing_automation_logs
    FOR SELECT USING (organization_id = current_setting('app.organization_id')::uuid);

CREATE POLICY "Org can manage own notification templates" ON notification_templates
    FOR ALL USING (organization_id = current_setting('app.organization_id')::uuid);

-- O service role pode fazer tudo
CREATE POLICY "Service role can manage all billing" ON billing_configurations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all logs" ON billing_automation_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all templates" ON notification_templates
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- EXEMPLO DE CONFIGURAÇÃO POR ORGANIZAÇÃO
-- ============================================================================

-- Para configurar a automação para uma organização:
/*
INSERT INTO billing_configurations (
    organization_id,
    notify_before_days,
    suspend_after_days,
    whatsapp_enabled,
    email_enabled,
    enabled
) VALUES (
    'seu-org-uuid-aqui',
    ARRAY[7, 3, 1],  -- Notificar 7, 3 e 1 dia antes
    7,                -- Suspender após 7 dias de atraso
    true,             -- WhatsApp enabled
    true,             -- Email enabled
    true              -- Automation enabled
);
*/
