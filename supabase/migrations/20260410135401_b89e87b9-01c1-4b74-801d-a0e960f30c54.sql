
-- Realtime is managed by Supabase internally (reserved schema)
-- We cannot add RLS policies to realtime.messages directly
-- Channel isolation must be enforced at application level by using org-scoped channel names
-- This migration is a no-op placeholder acknowledging the limitation
SELECT 1;
