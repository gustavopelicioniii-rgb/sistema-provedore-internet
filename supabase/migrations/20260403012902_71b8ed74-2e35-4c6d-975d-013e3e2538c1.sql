
-- Drop the overly permissive policy
DROP POLICY "Service can create organizations" ON public.organizations;

-- The handle_new_user function runs as SECURITY DEFINER which bypasses RLS,
-- so no INSERT policy is needed on organizations for the trigger to work.
-- Only add an INSERT policy scoped to authenticated users for future manual creation
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);
