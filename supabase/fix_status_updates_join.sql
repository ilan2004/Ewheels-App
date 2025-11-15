-- ===================================================================
-- FIX TICKET STATUS UPDATES JOIN RELATIONSHIP
-- ===================================================================
-- This script fixes the join relationship between ticket_status_updates 
-- and profiles tables by creating a proper foreign key relationship
-- ===================================================================

-- Option 1: Add foreign key relationship from ticket_status_updates to profiles
-- This creates a direct relationship so Supabase can auto-join

-- First, let's see the current structure
SELECT 'Current Foreign Keys:' AS info;
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

-- Method 1: Modify the created_by column to reference profiles instead of auth.users
-- This approach creates a direct relationship for easier joining

-- Drop the existing foreign key constraint to auth.users
ALTER TABLE public.ticket_status_updates 
DROP CONSTRAINT IF EXISTS ticket_status_updates_created_by_fkey;

-- Add new foreign key constraint to profiles
ALTER TABLE public.ticket_status_updates 
ADD CONSTRAINT ticket_status_updates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Update RLS policies to use the new relationship
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read status updates for accessible tickets" ON public.ticket_status_updates;
DROP POLICY IF EXISTS "Users can create status updates for accessible tickets" ON public.ticket_status_updates;
DROP POLICY IF EXISTS "Users can update their own status updates" ON public.ticket_status_updates;
DROP POLICY IF EXISTS "Users can delete their own status updates" ON public.ticket_status_updates;

-- Recreate policies with proper user checking
CREATE POLICY "Users can read status updates for accessible tickets" 
ON public.ticket_status_updates 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.service_tickets st 
        WHERE st.id = ticket_status_updates.ticket_id 
        AND auth.uid() IS NOT NULL
    )
);

CREATE POLICY "Users can create status updates for accessible tickets" 
ON public.ticket_status_updates 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.service_tickets st 
        WHERE st.id = ticket_status_updates.ticket_id
    )
    AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own status updates" 
ON public.ticket_status_updates 
FOR UPDATE 
USING (created_by = auth.uid() AND auth.uid() IS NOT NULL)
WITH CHECK (created_by = auth.uid() AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own status updates" 
ON public.ticket_status_updates 
FOR DELETE 
USING (
    created_by = auth.uid() 
    AND auth.uid() IS NOT NULL 
    AND is_system_update = FALSE
);

-- Now test the relationship
SELECT 'Testing new relationship:' AS info;
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
AND tc.table_name = 'ticket_status_updates'
AND kcu.column_name = 'created_by';

-- Test query to ensure the join works
SELECT 'Test Join Query:' AS info;
-- This simulates what the React Native service will do
/*
SELECT 
    tsu.*,
    p.username,
    p.email
FROM public.ticket_status_updates tsu
LEFT JOIN public.profiles p ON tsu.created_by = p.user_id
LIMIT 1;
*/

-- ===================================================================
-- NOTES:
-- ===================================================================
-- After running this script:
-- 1. The ticket_status_updates.created_by now references profiles.user_id
-- 2. Supabase PostgREST can now auto-join these tables
-- 3. The React Native query `user:profiles(username, email)` should work
-- 4. Make sure all users have profiles created (the handle_new_user trigger should do this)
-- ===================================================================
