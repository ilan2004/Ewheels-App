-- Add foreign key constraint to ticket_status_updates referencing profiles
-- This enables PostgREST to detect the relationship for joins like select=*,profiles(*)

ALTER TABLE public.ticket_status_updates
ADD CONSTRAINT ticket_status_updates_created_by_profiles_fkey
FOREIGN KEY (created_by)
REFERENCES public.profiles(user_id);
