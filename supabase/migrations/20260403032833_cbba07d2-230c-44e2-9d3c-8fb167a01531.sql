
-- Enum for network device manufacturers
CREATE TYPE public.device_manufacturer AS ENUM ('mikrotik', 'huawei', 'intelbras', 'fiberhome', 'zte', 'other');
CREATE TYPE public.device_type AS ENUM ('olt', 'onu', 'router', 'switch', 'server', 'access_point', 'other');
CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'warning', 'maintenance');

-- Network devices table
CREATE TABLE public.network_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ip_address TEXT,
  mac_address TEXT,
  manufacturer device_manufacturer NOT NULL DEFAULT 'other',
  device_type device_type NOT NULL DEFAULT 'other',
  model TEXT,
  firmware_version TEXT,
  serial_number TEXT,
  location TEXT,
  snmp_community TEXT,
  api_port INTEGER DEFAULT 8728,
  api_username TEXT,
  api_password TEXT,
  status device_status NOT NULL DEFAULT 'offline',
  uptime TEXT,
  cpu_usage NUMERIC DEFAULT 0,
  memory_usage NUMERIC DEFAULT 0,
  connected_clients INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.network_devices FOR ALL USING (organization_id = get_user_organization_id());

-- Vehicle status enum
CREATE TYPE public.vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'decommissioned');
CREATE TYPE public.fuel_type AS ENUM ('gasoline', 'ethanol', 'diesel', 'flex');

-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  km INTEGER DEFAULT 0,
  status vehicle_status NOT NULL DEFAULT 'available',
  assigned_to TEXT,
  next_maintenance_date DATE,
  fuel_level INTEGER DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.vehicles FOR ALL USING (organization_id = get_user_organization_id());

-- Fuel logs table
CREATE TABLE public.fuel_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  fuel_type fuel_type NOT NULL DEFAULT 'gasoline',
  km INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.fuel_logs FOR ALL USING (organization_id = get_user_organization_id());

-- Fiscal invoice status
CREATE TYPE public.fiscal_status AS ENUM ('draft', 'pending', 'authorized', 'rejected', 'cancelled');
CREATE TYPE public.fiscal_model AS ENUM ('nfe21', 'nfe22', 'nfcom62');

-- Fiscal invoices table
CREATE TABLE public.fiscal_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  number TEXT,
  series TEXT DEFAULT '1',
  model fiscal_model NOT NULL DEFAULT 'nfe21',
  access_key TEXT,
  value NUMERIC NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status fiscal_status NOT NULL DEFAULT 'draft',
  xml_content TEXT,
  pdf_url TEXT,
  sefaz_response TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.fiscal_invoices FOR ALL USING (organization_id = get_user_organization_id());

-- Triggers for updated_at
CREATE TRIGGER update_network_devices_updated_at BEFORE UPDATE ON public.network_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fiscal_invoices_updated_at BEFORE UPDATE ON public.fiscal_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
