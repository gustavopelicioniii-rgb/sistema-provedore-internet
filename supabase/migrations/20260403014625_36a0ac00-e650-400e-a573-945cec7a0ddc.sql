
-- Create enum for lead stages
CREATE TYPE public.lead_stage AS ENUM ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost');

-- Create enum for lead sources
CREATE TYPE public.lead_source AS ENUM ('referral', 'website', 'social_media', 'cold_call', 'event', 'other');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  company TEXT,
  stage lead_stage NOT NULL DEFAULT 'new',
  value NUMERIC DEFAULT 0,
  source lead_source DEFAULT 'other',
  notes TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "Tenant isolation"
  ON public.leads
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Index for faster pipeline queries
CREATE INDEX idx_leads_org_stage ON public.leads (organization_id, stage, position);

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
