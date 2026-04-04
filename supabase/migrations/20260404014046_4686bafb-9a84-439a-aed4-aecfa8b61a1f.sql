
DROP POLICY "Service role can insert alerts" ON public.notification_alerts;

CREATE POLICY "Authenticated users can insert alerts for their org"
  ON public.notification_alerts FOR INSERT TO authenticated
  WITH CHECK (organization_id = (SELECT get_user_organization_id()));
