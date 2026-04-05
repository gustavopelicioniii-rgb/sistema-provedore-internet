
-- Function to get org id by slug (public, no auth needed)
CREATE OR REPLACE FUNCTION public.get_org_id_by_slug(p_slug text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.organizations WHERE slug = p_slug LIMIT 1
$$;

-- Allow anonymous users to read organization name/logo by slug
CREATE POLICY "Public can view org by slug"
ON public.organizations
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read ftth_nodes for any org (filtered by slug in app)
CREATE POLICY "Public can view ftth nodes"
ON public.ftth_nodes
FOR SELECT
TO anon
USING (true);
