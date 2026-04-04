
-- Subscriber credentials for portal auth
CREATE TABLE public.subscriber_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cpf TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, cpf)
);

-- Enable RLS
ALTER TABLE public.subscriber_credentials ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role (edge functions) can access
-- This is intentional: login is handled by edge function with service role key

-- Index for fast login lookups
CREATE INDEX idx_subscriber_credentials_cpf_org ON public.subscriber_credentials(cpf, organization_id);

-- Updated_at trigger
CREATE TRIGGER update_subscriber_credentials_updated_at
  BEFORE UPDATE ON public.subscriber_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
