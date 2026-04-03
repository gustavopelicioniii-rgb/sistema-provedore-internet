
-- Table to store traffic usage data from RADIUS/NetFlow
CREATE TABLE public.traffic_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  download_bytes bigint NOT NULL DEFAULT 0,
  upload_bytes bigint NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'radius',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_traffic_usage_customer ON public.traffic_usage(customer_id, period_start DESC);
CREATE INDEX idx_traffic_usage_org ON public.traffic_usage(organization_id, period_start DESC);
CREATE UNIQUE INDEX idx_traffic_usage_unique_period ON public.traffic_usage(customer_id, period_start, period_end, source);

-- Enable RLS
ALTER TABLE public.traffic_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation"
  ON public.traffic_usage
  FOR ALL
  USING (organization_id = get_user_organization_id());
