
-- 1. FIX: Remove public anonymous access to chat-media
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public chat media access" ON storage.objects;

-- Remove any remaining anon policies on chat-media
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND roles::text LIKE '%anon%'
    AND qual::text LIKE '%chat-media%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 2. FIX: Prevent users from changing their own organization_id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
