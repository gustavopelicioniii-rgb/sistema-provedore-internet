
-- 1. Remove broad network_devices SELECT
DROP POLICY IF EXISTS "Org members can view devices" ON public.network_devices;

-- 2. Fix profiles update to prevent role change
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND organization_id IS NOT DISTINCT FROM (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid())
  AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

-- 3. Fix notification alerts SELECT and UPDATE
DROP POLICY IF EXISTS "Users can view alerts of their organization" ON public.notification_alerts;
DROP POLICY IF EXISTS "Users can view own or broadcast alerts" ON public.notification_alerts;
DROP POLICY IF EXISTS "Users can update alerts of their organization" ON public.notification_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.notification_alerts;

CREATE POLICY "Users can view own or broadcast alerts"
ON public.notification_alerts
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Users can update own alerts"
ON public.notification_alerts
FOR UPDATE
TO authenticated
USING (
  organization_id = get_user_organization_id()
  AND (user_id IS NULL OR user_id = auth.uid())
);
