
-- ============================================================
-- 1. FIX: organizations - restrict public view
-- ============================================================
DROP POLICY IF EXISTS "Public can view org by slug" ON public.organizations;

CREATE OR REPLACE FUNCTION public.get_org_public_info(p_slug text)
RETURNS TABLE(id uuid, name text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, logo_url 
  FROM public.organizations 
  WHERE slug = p_slug 
  LIMIT 1;
$$;

CREATE POLICY "Anon can view org by slug only"
ON public.organizations
FOR SELECT
TO anon
USING (false);

-- ============================================================
-- 2. FIX: ftth_nodes - restrict public view
-- ============================================================
DROP POLICY IF EXISTS "Public can view ftth nodes" ON public.ftth_nodes;

CREATE OR REPLACE FUNCTION public.get_coverage_nodes(p_org_id uuid)
RETURNS TABLE(id uuid, name text, node_type text, lat double precision, lng double precision, capacity integer, used integer, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, node_type::text, lat, lng, capacity, used, status::text
  FROM public.ftth_nodes 
  WHERE organization_id = p_org_id;
$$;

-- ============================================================
-- 3. FIX: network_devices - hide credentials from non-admins
-- ============================================================
DROP POLICY IF EXISTS "Tenant isolation" ON public.network_devices;

CREATE POLICY "Admins full access network_devices"
ON public.network_devices
FOR ALL
TO authenticated
USING (
  organization_id = get_user_organization_id() 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  organization_id = get_user_organization_id() 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Org members can view devices"
ON public.network_devices
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- Drop and recreate the view to avoid column name conflict
DROP VIEW IF EXISTS public.network_devices_safe;

CREATE VIEW public.network_devices_safe AS
SELECT 
  id, organization_id, name, ip_address, mac_address, manufacturer,
  device_type, model, firmware_version, serial_number, location,
  status, uptime, cpu_usage, memory_usage, connected_clients,
  last_seen_at, notes, api_port, created_at, updated_at,
  CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN api_username ELSE NULL END as api_username,
  CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN api_password ELSE NULL END as api_password,
  CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN snmp_community ELSE NULL END as snmp_community
FROM public.network_devices;

-- ============================================================
-- 4. FIX: automations - restrict to admins
-- ============================================================
DROP POLICY IF EXISTS "Tenant isolation" ON public.automations;

CREATE POLICY "Admins full access automations"
ON public.automations
FOR ALL
TO authenticated
USING (
  organization_id = get_user_organization_id() 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  organization_id = get_user_organization_id() 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Org members can view automations"
ON public.automations
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- ============================================================
-- 5. FIX: notification_alerts INSERT
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert alerts for their org" ON public.notification_alerts;

CREATE POLICY "Users can insert alerts for themselves"
ON public.notification_alerts
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = get_user_organization_id()
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- ============================================================
-- 6. FIX: profiles - org-scoped read
-- ============================================================
CREATE POLICY "Users can view org member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- ============================================================
-- 7. FIX: chat-media storage
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update chat media" ON storage.objects;

CREATE POLICY "Org members can read own chat media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = get_user_organization_id()::text
);

CREATE POLICY "Org members can upload own chat media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = get_user_organization_id()::text
);

CREATE POLICY "Org members can update own chat media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = get_user_organization_id()::text
);

CREATE POLICY "Org members can delete own chat media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = get_user_organization_id()::text
);
