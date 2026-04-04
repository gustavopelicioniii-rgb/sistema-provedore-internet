
-- Fix subscriber_credentials missing RLS policy
CREATE POLICY "Service role only" ON public.subscriber_credentials
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id());
