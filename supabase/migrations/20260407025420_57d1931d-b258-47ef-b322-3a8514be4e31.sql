
-- Invoice installments table
CREATE TABLE public.invoice_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date DATE,
  barcode TEXT,
  pix_qrcode TEXT,
  gateway_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.invoice_installments
  FOR ALL USING (organization_id = get_user_organization_id());

CREATE TRIGGER update_invoice_installments_updated_at
  BEFORE UPDATE ON public.invoice_installments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit analyses table
CREATE TABLE public.credit_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  cpf_cnpj TEXT NOT NULL,
  score NUMERIC,
  result TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON public.credit_analyses
  FOR ALL USING (organization_id = get_user_organization_id());

-- Add columns to plans
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS early_payment_discount NUMERIC DEFAULT 0;

-- Add columns to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS auto_debit BOOLEAN DEFAULT false;

-- Add columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 1;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
