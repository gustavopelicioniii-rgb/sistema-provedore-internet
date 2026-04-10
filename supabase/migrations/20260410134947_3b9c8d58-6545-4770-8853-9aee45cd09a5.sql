
-- Fix: Set view to use invoker's permissions (not definer)
ALTER VIEW public.network_devices_safe SET (security_invoker = true);
