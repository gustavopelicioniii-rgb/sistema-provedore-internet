
-- Allow the trigger (SECURITY DEFINER) to insert organizations
CREATE POLICY "Service can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

-- Recreate handle_new_user to also create an organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Create a new organization for the user
  INSERT INTO public.organizations (name, slug)
  VALUES (
    user_name || '''s Organization',
    NEW.id::text
  )
  RETURNING id INTO new_org_id;

  -- Create profile linked to the organization
  INSERT INTO public.profiles (id, full_name, organization_id, role)
  VALUES (NEW.id, user_name, new_org_id, 'admin');

  RETURN NEW;
END;
$$;
