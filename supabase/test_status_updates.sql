-- ===================================================================
-- TEST SCRIPT FOR TICKET STATUS UPDATES
-- ===================================================================
-- This script tests the ticket_status_updates functionality
-- Run this in your Supabase SQL Editor to verify everything works
-- ===================================================================

-- First, let's check that all required tables exist
SELECT 'Tables Check:' AS test_section;
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'ticket_status_updates', 'service_tickets')
ORDER BY table_name;

-- Check foreign key relationships
SELECT 'Foreign Key Relationships:' AS test_section;
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'ticket_status_updates';

-- Check RLS policies
SELECT 'RLS Policies Check:' AS test_section;
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies 
WHERE tablename IN ('ticket_status_updates', 'profiles')
ORDER BY tablename, policyname;

-- Check indexes
SELECT 'Indexes Check:' AS test_section;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'ticket_status_updates'
ORDER BY indexname;

-- Check table structure
SELECT 'Table Structure - ticket_status_updates:' AS test_section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ticket_status_updates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test basic INSERT functionality (this will test if relationships work)
-- Note: This assumes you have at least one service ticket in your database
-- If you don't have any service tickets, this part will show an error - that's expected

SELECT 'Testing INSERT functionality:' AS test_section;

-- First, let's see if we have any service tickets to work with
SELECT 'Available Service Tickets:' AS info;
SELECT id, status, created_at 
FROM public.service_tickets 
LIMIT 3;

-- If you have service tickets, uncomment and modify the following INSERT test:
/*
-- Replace 'your-ticket-id-here' with an actual ticket ID from above
INSERT INTO public.ticket_status_updates (
    ticket_id, 
    status, 
    update_text, 
    created_by,
    is_system_update
) VALUES (
    'your-ticket-id-here',  -- Replace with actual ticket ID
    'reported',
    'This is a test status update',
    null,  -- We'll set this to null for testing (normally would be auth.uid())
    true   -- Mark as system update so it can be easily identified and deleted
);

-- Check if the insert worked
SELECT 'Test Insert Result:' AS info;
SELECT id, ticket_id, status, update_text, created_at, is_system_update
FROM public.ticket_status_updates 
WHERE update_text = 'This is a test status update';

-- Clean up the test data
DELETE FROM public.ticket_status_updates 
WHERE update_text = 'This is a test status update' AND is_system_update = true;
*/

-- ===================================================================
-- MANUAL TEST INSTRUCTIONS
-- ===================================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Check that all sections show expected results:
--    - Tables Check: Should show 3 tables (profiles, ticket_status_updates, service_tickets)
--    - Foreign Key Relationships: Should show relationships to service_tickets and auth.users
--    - RLS Policies: Should show 4 policies for ticket_status_updates
--    - Indexes: Should show 4 indexes for ticket_status_updates
--    - Table Structure: Should show all columns with correct types
--    - Available Service Tickets: Should show your existing tickets (if any)
--
-- 3. If you want to test INSERT functionality:
--    - Uncomment the INSERT section above
--    - Replace 'your-ticket-id-here' with an actual service ticket ID
--    - Run the script again
--
-- 4. Any errors in the results indicate issues that need to be fixed
-- ===================================================================

SELECT 'Test completed! Review the results above.' AS final_message;
