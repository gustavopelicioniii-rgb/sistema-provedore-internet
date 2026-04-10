
-- Use a trigger to prevent role/org changes (immune to race conditions)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only service_role or the handle_new_user trigger should change these
  -- For regular authenticated users, revert changes to protected fields
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.role := OLD.role;
  END IF;
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    NEW.organization_id := OLD.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS protect_profile_immutable_fields ON public.profiles;

CREATE TRIGGER protect_profile_immutable_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- Simplify the UPDATE policy now that trigger handles protection
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
