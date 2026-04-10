
-- Public function to get active plans for coverage page
CREATE OR REPLACE FUNCTION public.get_public_plans(p_org_id uuid)
RETURNS TABLE(id uuid, name text, price numeric, download_speed integer, upload_speed integer, technology text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, price, download_speed, upload_speed, technology::text
  FROM public.plans
  WHERE organization_id = p_org_id AND active = true
  ORDER BY price;
$$;

-- Public function to create a lead from coverage page
CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_org_id uuid,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Validate org exists
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organização não encontrada';
  END IF;
  
  -- Validate required fields
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Nome inválido';
  END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) < 8 THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;

  INSERT INTO public.leads (organization_id, name, phone, email, notes, source, stage)
  VALUES (p_org_id, trim(p_name), trim(p_phone), nullif(trim(p_email), ''), 
          coalesce(p_notes, 'Contato via mapa de cobertura'), 'website'::lead_source, 'new'::lead_stage)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
