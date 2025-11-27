-- Migration: Enable Read Access for Service Tickets
-- Date: 2025-11-27
-- Purpose: Allow authenticated users to view service tickets for job card selection

-- Enable RLS on service_tickets if not already enabled
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON service_tickets;
DROP POLICY IF EXISTS "service_tickets_select_policy" ON service_tickets;

-- Create a policy that allows all authenticated users to view service tickets
-- This is necessary for the Media Hub job card selector to work
CREATE POLICY "service_tickets_select_policy"
ON service_tickets FOR SELECT
TO authenticated
USING (true);

-- Also ensure users can update tickets (e.g. for status changes) if they have appropriate roles
-- This might already exist, but adding a basic one for safety if missing
DROP POLICY IF EXISTS "service_tickets_update_policy" ON service_tickets;
CREATE POLICY "service_tickets_update_policy"
ON service_tickets FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM app_roles ar
    WHERE ar.user_id = auth.uid()
    AND ar.role IN ('admin', 'floor_manager', 'front_desk_manager')
  )
);
