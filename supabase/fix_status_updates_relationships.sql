-- ===================================================================
-- FIX TICKET STATUS UPDATES RELATIONSHIPS
-- ===================================================================
-- This script ensures all necessary tables and relationships exist
-- for the ticket_status_updates feature to work properly
-- ===================================================================

-- First, create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create fresh policies for profiles
CREATE POLICY "Users can read all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions for profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- ===================================================================
-- Now ensure ticket_status_updates table exists with correct relationships
-- ===================================================================

-- Drop and recreate the ticket_status_updates table to ensure clean relationships
-- Note: This will lose existing data in ticket_status_updates if any exists
-- If you have important data, backup first or modify this script

DROP TABLE IF EXISTS public.ticket_status_updates CASCADE;

-- Recreate ticket_status_updates table with proper relationships
CREATE TABLE public.ticket_status_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    update_text TEXT NOT NULL CHECK (length(update_text) > 0 AND length(update_text) <= 1000),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_system_update BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_ticket_status_updates_ticket_id ON public.ticket_status_updates(ticket_id);
CREATE INDEX idx_ticket_status_updates_status ON public.ticket_status_updates(status);
CREATE INDEX idx_ticket_status_updates_created_at ON public.ticket_status_updates(created_at DESC);
CREATE INDEX idx_ticket_status_updates_created_by ON public.ticket_status_updates(created_by);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.ticket_status_updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read status updates for accessible tickets" ON public.ticket_status_updates;
DROP POLICY IF EXISTS "Users can create status updates for accessible tickets" ON public.ticket_status_updates;
DROP POLICY IF EXISTS "Users can update their own status updates" ON public.ticket_status_updates;
DROP POLICY IF EXISTS "Users can delete their own status updates" ON public.ticket_status_updates;

-- Recreate policies
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

-- Create the trigger for ticket_status_updates
DROP TRIGGER IF EXISTS trigger_update_ticket_status_updates_updated_at ON public.ticket_status_updates;
CREATE TRIGGER trigger_update_ticket_status_updates_updated_at
    BEFORE UPDATE ON public.ticket_status_updates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ticket_status_updates_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_status_updates TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.ticket_status_updates IS 'Custom status updates for service tickets - allows team members to add progress notes at any stage';
COMMENT ON COLUMN public.ticket_status_updates.ticket_id IS 'Reference to the service ticket';
COMMENT ON COLUMN public.ticket_status_updates.status IS 'The ticket status when this update was added (reported, triaged, in_progress, completed, delivered)';
COMMENT ON COLUMN public.ticket_status_updates.update_text IS 'The progress update text (max 1000 characters)';
COMMENT ON COLUMN public.ticket_status_updates.created_by IS 'User who added this update';
COMMENT ON COLUMN public.ticket_status_updates.is_system_update IS 'Whether this update was automatically generated by the system (vs manually added by user)';

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
-- Run these after the script to verify everything works

-- Check if both tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'ticket_status_updates', 'service_tickets');

-- Check foreign key relationships
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
AND tc.table_name IN ('ticket_status_updates', 'profiles');
