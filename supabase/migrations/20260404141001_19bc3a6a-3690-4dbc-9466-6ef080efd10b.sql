
-- Create enum for FTTH node types
CREATE TYPE public.ftth_node_type AS ENUM ('cto', 'ceo', 'splitter', 'pop');

-- Create enum for FTTH node status
CREATE TYPE public.ftth_node_status AS ENUM ('active', 'full', 'inactive');

-- Create the ftth_nodes table
CREATE TABLE public.ftth_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  node_type public.ftth_node_type NOT NULL DEFAULT 'cto',
  address TEXT,
  capacity INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  status public.ftth_node_status NOT NULL DEFAULT 'active',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ftth_nodes ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "Tenant isolation" ON public.ftth_nodes
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Trigger for updated_at
CREATE TRIGGER update_ftth_nodes_updated_at
  BEFORE UPDATE ON public.ftth_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
