-- Fix for "function initcap(service_ticket_status) does not exist" error
-- This creates an overload for initcap that accepts the enum type and casts it to text

CREATE OR REPLACE FUNCTION public.initcap(status public.service_ticket_status)
RETURNS text AS $$
BEGIN
  RETURN initcap(status::text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
