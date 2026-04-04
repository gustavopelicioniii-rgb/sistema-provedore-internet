
-- Notification alerts table for all-channel notifications
CREATE TABLE public.notification_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  channel TEXT NOT NULL DEFAULT 'in_app',
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts of their organization"
  ON public.notification_alerts FOR SELECT TO authenticated
  USING (organization_id = (SELECT get_user_organization_id()));

CREATE POLICY "Users can update alerts of their organization"
  ON public.notification_alerts FOR UPDATE TO authenticated
  USING (organization_id = (SELECT get_user_organization_id()));

CREATE POLICY "Service role can insert alerts"
  ON public.notification_alerts FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_notification_alerts_org_read ON public.notification_alerts(organization_id, read);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_alerts;
