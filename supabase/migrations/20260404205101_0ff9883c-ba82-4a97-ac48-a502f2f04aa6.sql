
-- =============================================
-- 1.1 SLA CONFIGS
-- =============================================
CREATE TABLE public.sla_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'medium',
  max_response_minutes INTEGER NOT NULL DEFAULT 60,
  max_resolution_minutes INTEGER NOT NULL DEFAULT 480,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, priority)
);

ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.sla_configs
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_sla_configs_updated_at
  BEFORE UPDATE ON public.sla_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add SLA tracking columns to tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN NOT NULL DEFAULT false;

-- =============================================
-- 1.2 RBAC — USER ROLES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'technician', 'financial', 'support');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, organization_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Admins can manage all roles in their org
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND has_role(auth.uid(), 'admin')
  );

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- 1.3 TECHNICIAN SCHEDULES & AVAILABILITY
-- =============================================
CREATE TYPE public.schedule_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TABLE public.technician_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE SET NULL,
  title TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status schedule_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.technician_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.technician_schedules
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_technician_schedules_updated_at
  BEFORE UPDATE ON public.technician_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tech_schedules_date ON public.technician_schedules(technician_id, date);

CREATE TABLE public.technician_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(technician_id, weekday)
);

ALTER TABLE public.technician_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.technician_availability
  FOR ALL USING (organization_id = get_user_organization_id());

-- =============================================
-- 1.4 BANK RECONCILIATION
-- =============================================
CREATE TYPE public.reconciliation_status AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE public.bank_transaction_status AS ENUM ('unmatched', 'matched', 'ignored');

CREATE TABLE public.bank_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'ofx',
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status reconciliation_status NOT NULL DEFAULT 'pending',
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.bank_reconciliations
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_bank_reconciliations_updated_at
  BEFORE UPDATE ON public.bank_reconciliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reconciliation_id UUID NOT NULL REFERENCES public.bank_reconciliations(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  memo TEXT,
  fitid TEXT,
  matched_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  status bank_transaction_status NOT NULL DEFAULT 'unmatched',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.bank_transactions
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE INDEX idx_bank_tx_reconciliation ON public.bank_transactions(reconciliation_id);
CREATE INDEX idx_bank_tx_date_amount ON public.bank_transactions(transaction_date, amount);
