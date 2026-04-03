-- Allow org members to update their organization
CREATE POLICY "Members can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (id = get_user_organization_id())
WITH CHECK (id = get_user_organization_id());
