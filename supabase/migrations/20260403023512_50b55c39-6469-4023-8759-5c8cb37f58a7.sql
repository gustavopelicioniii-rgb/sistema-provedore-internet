
-- Enums
CREATE TYPE public.technician_status AS ENUM ('active', 'inactive', 'vacation');
CREATE TYPE public.technician_specialty AS ENUM ('installation', 'maintenance', 'support', 'general');
CREATE TYPE public.service_order_type AS ENUM ('installation', 'maintenance', 'technical_visit', 'repair');
CREATE TYPE public.service_order_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Technicians table
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  specialty public.technician_specialty NOT NULL DEFAULT 'general',
  status public.technician_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.technicians
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_technicians_updated_at
  BEFORE UPDATE ON public.technicians
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service orders table
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  technician_id UUID REFERENCES public.technicians(id),
  type public.service_order_type NOT NULL DEFAULT 'installation',
  status public.service_order_status NOT NULL DEFAULT 'open',
  description TEXT,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  address JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.service_orders
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
