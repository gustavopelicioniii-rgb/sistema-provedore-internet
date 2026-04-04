
-- Billing rules table
CREATE TABLE public.billing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  days_offset INTEGER NOT NULL DEFAULT 0,
  action TEXT NOT NULL DEFAULT 'notify' CHECK (action IN ('notify', 'suspend', 'reactivate')),
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('whatsapp', 'email', 'in_app', 'sms')),
  template_message TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.billing_rules
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_billing_rules_updated_at
  BEFORE UPDATE ON public.billing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Billing rule executions log
CREATE TABLE public.billing_rule_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  billing_rule_id UUID NOT NULL REFERENCES public.billing_rules(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_rule_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.billing_rule_executions
  FOR ALL USING (organization_id = get_user_organization_id());

-- Index for fast lookups
CREATE INDEX idx_billing_rule_executions_invoice ON public.billing_rule_executions(invoice_id, billing_rule_id);
CREATE INDEX idx_billing_rule_executions_date ON public.billing_rule_executions(executed_at);
CREATE INDEX idx_billing_rules_org ON public.billing_rules(organization_id, enabled);
