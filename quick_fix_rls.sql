-- Quick fix for RLS policy on ticket_status_updates
-- Run this in Supabase SQL Editor

-- Allow null values for created_by (for system/unauthenticated operations)
ALTER TABLE public.ticket_status_updates 
ALTER COLUMN created_by DROP NOT NULL;

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can create status updates for accessible tickets" ON public.ticket_status_updates;

-- Create a more permissive insert policy that allows null created_by
CREATE POLICY "Allow insert access to ticket status updates" 
ON public.ticket_status_updates 
FOR INSERT 
WITH CHECK (true);

-- Update existing read policy to be more permissive
DROP POLICY IF EXISTS "Users can read status updates for accessible tickets" ON public.ticket_status_updates;

CREATE POLICY "Allow read access to ticket status updates" 
ON public.ticket_status_updates 
FOR SELECT 
USING (true);
