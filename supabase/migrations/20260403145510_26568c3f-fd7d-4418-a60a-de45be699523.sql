
-- Create automation category enum
CREATE TYPE public.automation_category AS ENUM ('cobranca', 'atendimento', 'operacional');

-- Create trigger type enum
CREATE TYPE public.automation_trigger_type AS ENUM ('webhook', 'schedule', 'event');

-- Create action type enum
CREATE TYPE public.automation_action_type AS ENUM ('webhook_call', 'whatsapp', 'email', 'internal');

-- Create automation log status enum
CREATE TYPE public.automation_log_status AS ENUM ('success', 'error', 'skipped');

-- Create automations table
CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category automation_category NOT NULL DEFAULT 'operacional',
  trigger_type automation_trigger_type NOT NULL DEFAULT 'webhook',
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_type automation_action_type NOT NULL DEFAULT 'webhook_call',
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,
  webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_logs table
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status automation_log_status NOT NULL DEFAULT 'success',
  trigger_payload JSONB DEFAULT '{}'::jsonb,
  response_payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for automations
CREATE POLICY "Tenant isolation" ON public.automations
  FOR ALL USING (organization_id = get_user_organization_id());

-- RLS policies for automation_logs
CREATE POLICY "Tenant isolation" ON public.automation_logs
  FOR ALL USING (organization_id = get_user_organization_id());

-- Indexes
CREATE INDEX idx_automations_org ON public.automations(organization_id);
CREATE INDEX idx_automations_enabled ON public.automations(organization_id, enabled);
CREATE INDEX idx_automation_logs_automation ON public.automation_logs(automation_id);
CREATE INDEX idx_automation_logs_executed ON public.automation_logs(executed_at DESC);

-- Update trigger
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for automation_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_logs;
