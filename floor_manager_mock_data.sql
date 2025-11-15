-- Floor Manager Mock Data SQL Script
-- Run this in your Supabase SQL editor to set up test data

-- =================================================================
-- 1. SCHEMA UPDATES (Run this first if not already applied)
-- =================================================================

-- Add assignment tracking columns to service_tickets if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'assigned_to') THEN
        ALTER TABLE service_tickets ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'assigned_at') THEN
        ALTER TABLE service_tickets ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'assigned_by') THEN
        ALTER TABLE service_tickets ADD COLUMN assigned_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'due_date') THEN
        ALTER TABLE service_tickets ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_at ON service_tickets(assigned_at);
CREATE INDEX IF NOT EXISTS idx_service_tickets_due_date ON service_tickets(due_date);

-- Create technician settings table if not exists
CREATE TABLE IF NOT EXISTS technician_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  max_capacity INTEGER DEFAULT 8 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for technician_settings if not already enabled
ALTER TABLE technician_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own technician settings" ON technician_settings;
DROP POLICY IF EXISTS "Floor managers can view all technician settings" ON technician_settings;
DROP POLICY IF EXISTS "Floor managers can update technician settings" ON technician_settings;
DROP POLICY IF EXISTS "Floor managers can insert technician settings" ON technician_settings;

-- Create RLS policies for technician_settings
CREATE POLICY "Users can view own technician settings" ON technician_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Floor managers can view all technician settings" ON technician_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'floor_manager', 'front_desk_manager')
    )
  );

CREATE POLICY "Floor managers can update technician settings" ON technician_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM app_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'floor_manager')
    )
  );

CREATE POLICY "Floor managers can insert technician settings" ON technician_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'floor_manager')
    )
  );

-- =================================================================
-- 2. CLEAN UP EXISTING TEST DATA
-- =================================================================
-- Clean up existing test data safely
DO $$
BEGIN
    -- Clean up service tickets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tickets') THEN
        DELETE FROM service_tickets WHERE ticket_number LIKE 'T-%TEST%';
    END IF;
    
    -- Clean up customers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        DELETE FROM customers WHERE name LIKE '%Test%';
    END IF;
    
    -- Clean up technician settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_settings') THEN
        DELETE FROM technician_settings WHERE user_id IN (
            SELECT user_id FROM profiles WHERE username LIKE '%test_%' OR username LIKE '%manager%'
        );
    END IF;
    
    -- Clean up app roles for test users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_roles') THEN
        DELETE FROM app_roles WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid,
            '33333333-3333-3333-3333-333333333333'::uuid,
            '44444444-4444-4444-4444-444444444444'::uuid,
            '55555555-5555-5555-5555-555555555555'::uuid,
            '66666666-6666-6666-6666-666666666666'::uuid
        );
    END IF;
    
    -- Clean up user locations for test users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_locations') THEN
        DELETE FROM user_locations WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid,
            '33333333-3333-3333-3333-333333333333'::uuid,
            '44444444-4444-4444-4444-444444444444'::uuid,
            '55555555-5555-5555-5555-555555555555'::uuid,
            '66666666-6666-6666-6666-666666666666'::uuid
        );
    END IF;
    
    -- Clean up profiles for test users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        DELETE FROM profiles WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid,
            '33333333-3333-3333-3333-333333333333'::uuid,
            '44444444-4444-4444-4444-444444444444'::uuid,
            '55555555-5555-5555-5555-555555555555'::uuid,
            '66666666-6666-6666-6666-666666666666'::uuid
        );
    END IF;
END $$;

-- =================================================================
-- 3. CREATE LOCATIONS (if not exists)
-- =================================================================
INSERT INTO locations (id, name, code, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Kochi Branch', 'KOCHI', true),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Thrissur Branch', 'THR', true)
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- =================================================================
-- 4. CREATE MOCK USERS AND PROFILES
-- =================================================================

-- Create mock users in auth.users (simulation - you may need to adapt this)
-- Note: In real Supabase, auth.users is managed by Supabase Auth
-- For testing, we'll create profiles directly and reference existing user IDs

-- Mock User IDs (replace these with actual user IDs from your auth.users table)
-- You can get actual UUIDs by running: SELECT id FROM auth.users LIMIT 5;

-- Floor Manager
INSERT INTO profiles (user_id, username, email, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'floor_manager_kochi', 'floor.manager@evwheels.com', 'Sarah', 'Johnson')
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- Technicians
INSERT INTO profiles (user_id, username, email, first_name, last_name) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 'John Doe', 'john.doe@evwheels.com', 'John', 'Doe'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Jane Smith', 'jane.smith@evwheels.com', 'Jane', 'Smith'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Mike Johnson', 'mike.johnson@evwheels.com', 'Mike', 'Johnson'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Sarah Wilson', 'sarah.wilson@evwheels.com', 'Sarah', 'Wilson')
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- Front Desk Manager
INSERT INTO profiles (user_id, username, email, first_name, last_name) VALUES
  ('66666666-6666-6666-6666-666666666666'::uuid, 'front_desk_manager', 'front.desk@evwheels.com', 'David', 'Kumar')
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- =================================================================
-- 5. ASSIGN ROLES
-- =================================================================

-- Create or update app_roles table structure if needed
CREATE TABLE IF NOT EXISTS app_roles (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assign roles
INSERT INTO app_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'floor_manager'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'technician'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'technician'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'technician'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'technician'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'front_desk_manager')
ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = NOW();

-- =================================================================
-- 6. CREATE USER LOCATION ASSIGNMENTS
-- =================================================================
INSERT INTO user_locations (user_id, location_id) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid), -- Floor Manager -> Kochi
  ('22222222-2222-2222-2222-222222222222'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid), -- John -> Kochi
  ('33333333-3333-3333-3333-333333333333'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid), -- Jane -> Kochi
  ('44444444-4444-4444-4444-444444444444'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid), -- Mike -> Kochi
  ('55555555-5555-5555-5555-555555555555'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid), -- Sarah -> Kochi
  ('66666666-6666-6666-6666-666666666666'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)  -- Front Desk -> Kochi
ON CONFLICT (user_id, location_id) DO NOTHING;

-- =================================================================
-- 7. CREATE TECHNICIAN SETTINGS
-- =================================================================
INSERT INTO technician_settings (user_id, max_capacity) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 8), -- John Doe
  ('33333333-3333-3333-3333-333333333333'::uuid, 8), -- Jane Smith  
  ('44444444-4444-4444-4444-444444444444'::uuid, 8), -- Mike Johnson
  ('55555555-5555-5555-5555-555555555555'::uuid, 8)  -- Sarah Wilson
ON CONFLICT (user_id) DO UPDATE SET max_capacity = EXCLUDED.max_capacity;

-- =================================================================
-- 8. CREATE MOCK CUSTOMERS
-- =================================================================
INSERT INTO customers (id, name, contact, email, address, location_id) VALUES
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'Test Customer 1', '+919876543210', 'customer1@test.com', '123 Main St, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'Test Customer 2', '+919876543211', 'customer2@test.com', '456 Oak Ave, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'Test Customer 3', '+919876543212', 'customer3@test.com', '789 Pine Rd, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'Test Customer 4', '+919876543213', 'customer4@test.com', '321 Elm St, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'Test Customer 5', '+919876543214', 'customer5@test.com', '654 Maple Dr, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c6666666-6666-6666-6666-666666666666'::uuid, 'Test Customer 6', '+919876543215', 'customer6@test.com', '987 Cedar Ln, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c7777777-7777-7777-7777-777777777777'::uuid, 'Test Customer 7', '+919876543216', 'customer7@test.com', '147 Birch Ave, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c8888888-8888-8888-8888-888888888888'::uuid, 'Test Customer 8', '+919876543217', 'customer8@test.com', '258 Spruce St, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 9. CREATE MOCK SERVICE TICKETS
-- =================================================================

-- Unassigned tickets (reported/triaged status)
INSERT INTO service_tickets (
  id, ticket_number, customer_id, customer_complaint, description, status, priority, 
  location_id, created_by, created_at, due_date
) VALUES
  ('t1111111-1111-1111-1111-111111111111'::uuid, 'T-20241107-TEST001', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Battery not charging', 'Customer reports battery not holding charge after 6 months', 'reported', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '2 hours', NOW() + INTERVAL '2 days'),

  ('t2222222-2222-2222-2222-222222222222'::uuid, 'T-20241107-TEST002', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Vehicle not starting', 'Electric scooter not turning on, display blank', 'triaged', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '4 hours', NOW() + INTERVAL '1 day'),

  ('t3333333-3333-3333-3333-333333333333'::uuid, 'T-20241107-TEST003', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Strange noise from motor', 'Clicking sound when accelerating', 'reported', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 days'),

  ('t4444444-4444-4444-4444-444444444444'::uuid, 'T-20241107-TEST004', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Brakes not working properly', 'Rear brake feels loose and ineffective', 'triaged', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '6 hours', NOW() + INTERVAL '1 day'),

  ('t5555555-5555-5555-5555-555555555555'::uuid, 'T-20241107-TEST005', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Battery draining fast', 'Range has decreased significantly', 'reported', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '2 days');

-- Assigned tickets (in_progress status)
INSERT INTO service_tickets (
  id, ticket_number, customer_id, customer_complaint, description, status, priority, 
  location_id, created_by, assigned_to, assigned_by, assigned_at, created_at, due_date
) VALUES
  -- John Doe (6 tickets - near capacity)
  ('t6666666-6666-6666-6666-666666666666'::uuid, 'T-20241105-TEST006', 'c6666666-6666-6666-6666-666666666666'::uuid, 
   'Controller malfunction', 'Speed controller intermittent', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 day'),

  ('t7777777-7777-7777-7777-777777777777'::uuid, 'T-20241106-TEST007', 'c7777777-7777-7777-7777-777777777777'::uuid, 
   'Headlight not working', 'Front LED headlight completely dead', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days'),

  ('t8888888-8888-8888-8888-888888888888'::uuid, 'T-20241106-TEST008', 'c8888888-8888-8888-8888-888888888888'::uuid, 
   'Tire replacement needed', 'Front tire worn out, needs replacement', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day'),

  ('t9999999-9999-9999-9999-999999999999'::uuid, 'T-20241107-TEST009', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Horn not working', 'Electric horn completely silent', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 days'),

  ('taaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'T-20241107-TEST010', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Display flickering', 'Digital display shows intermittent readings', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 hours', NOW() + INTERVAL '2 days'),

  ('tbbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'T-20241107-TEST011', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Loose handle grip', 'Right handle grip coming loose', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '4 days'),

  -- Jane Smith (8 tickets - at capacity)  
  ('tcccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'T-20241104-TEST012', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Suspension issue', 'Front suspension making noise', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', NOW() + INTERVAL '1 day'),

  ('tdddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'T-20241105-TEST013', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Chain adjustment needed', 'Drive chain too loose', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days'),

  ('teeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'T-20241105-TEST014', 'c6666666-6666-6666-6666-666666666666'::uuid, 
   'Mirror replacement', 'Left mirror cracked', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '1 day'),

  ('tffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 'T-20241106-TEST015', 'c7777777-7777-7777-7777-777777777777'::uuid, 
   'Throttle sticking', 'Throttle not returning to zero position', 'in_progress', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '1 day'),

  ('tgggggggg-gggg-gggg-gggg-gggggggggggg'::uuid, 'T-20241106-TEST016', 'c8888888-8888-8888-8888-888888888888'::uuid, 
   'Seat adjustment broken', 'Seat height adjustment mechanism stuck', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days'),

  ('thhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'::uuid, 'T-20241107-TEST017', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Kickstand loose', 'Side kickstand not holding weight properly', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '3 days'),

  ('tiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii'::uuid, 'T-20241107-TEST018', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'USB charging port not working', 'Phone charging port not providing power', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '4 days'),

  ('tjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj'::uuid, 'T-20241107-TEST019', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Storage compartment lock broken', 'Under-seat storage not locking', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '5 days'),

  -- Mike Johnson (4 tickets - medium load)
  ('tkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk'::uuid, 'T-20241107-TEST020', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Turn signal not working', 'Left turn indicator not blinking', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days'),

  ('tllllllll-llll-llll-llll-llllllllllll'::uuid, 'T-20241107-TEST021', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Footrest adjustment', 'Passenger footrest position uncomfortable', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '18 hours', NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 days'),

  ('tmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm'::uuid, 'T-20241107-TEST022', 'c6666666-6666-6666-6666-666666666666'::uuid, 
   'Speedometer calibration', 'Speed reading appears inaccurate', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '18 hours', NOW() + INTERVAL '2 days'),

  ('tnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn'::uuid, 'T-20241107-TEST023', 'c7777777-7777-7777-7777-777777777777'::uuid, 
   'Handlebar alignment', 'Handlebars slightly bent after minor fall', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '10 hours', NOW() + INTERVAL '1 day'),

  -- Sarah Wilson (2 tickets - light load, but oldest assignment)
  ('toooooooo-oooo-oooo-oooo-oooooooooooo'::uuid, 'T-20241100-TEST024', 'c8888888-8888-8888-8888-888888888888'::uuid, 
   'Complete overhaul needed', 'Comprehensive service and maintenance check', 'in_progress', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '10 days', NOW() + INTERVAL '1 day'),

  ('tppppppp-pppp-pppp-pppp-pppppppppppp'::uuid, 'T-20241106-TEST025', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Custom modification request', 'Customer wants additional LED strip installation', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '4 days');

-- Some overdue tickets (due date in the past)
UPDATE service_tickets SET due_date = NOW() - INTERVAL '1 day' 
WHERE ticket_number IN ('T-20241105-TEST006', 'T-20241105-TEST013', 'T-20241105-TEST014', 'T-20241106-TEST015');

-- Some due today tickets
UPDATE service_tickets SET due_date = NOW() + INTERVAL '6 hours' 
WHERE ticket_number IN ('T-20241107-TEST009', 'T-20241107-TEST020', 'T-20241100-TEST024');

-- =================================================================
-- 10. VERIFICATION QUERIES
-- =================================================================

-- Check that everything was created correctly
SELECT 'Locations Created:' as check_type;
SELECT id, name, code FROM locations WHERE code IN ('KOCHI', 'THR');

SELECT 'Profiles Created:' as check_type;
SELECT user_id, username, email FROM profiles WHERE username LIKE '%test_%' OR username LIKE '%manager%';

SELECT 'Roles Assigned:' as check_type;
SELECT user_id, role FROM app_roles WHERE role IN ('floor_manager', 'technician', 'front_desk_manager');

SELECT 'User Locations:' as check_type;
SELECT ul.user_id, p.username, l.name as location 
FROM user_locations ul 
JOIN profiles p ON ul.user_id = p.user_id 
JOIN locations l ON ul.location_id = l.id;

SELECT 'Technician Settings:' as check_type;
SELECT ts.user_id, p.username, ts.max_capacity 
FROM technician_settings ts 
JOIN profiles p ON ts.user_id = p.user_id;

SELECT 'Service Tickets Summary:' as check_type;
SELECT 
  status,
  CASE WHEN assigned_to IS NULL THEN 'Unassigned' ELSE 'Assigned' END as assignment_status,
  COUNT(*) as count
FROM service_tickets 
WHERE ticket_number LIKE '%TEST%'
GROUP BY status, assigned_to IS NULL
ORDER BY status;

SELECT 'Technician Workloads:' as check_type;
SELECT 
  p.username,
  COUNT(st.id) as active_tickets,
  ts.max_capacity,
  MIN(st.assigned_at) as oldest_assignment
FROM profiles p
JOIN app_roles ar ON p.user_id = ar.user_id
LEFT JOIN technician_settings ts ON p.user_id = ts.user_id
LEFT JOIN service_tickets st ON p.user_id = st.assigned_to AND st.status = 'in_progress'
WHERE ar.role = 'technician'
GROUP BY p.user_id, p.username, ts.max_capacity
ORDER BY active_tickets DESC;

SELECT 'Due Date Analysis:' as check_type;
SELECT 
  CASE 
    WHEN due_date < NOW() THEN 'Overdue'
    WHEN due_date < NOW() + INTERVAL '1 day' THEN 'Due Today'
    ELSE 'Future'
  END as due_status,
  COUNT(*) as count
FROM service_tickets 
WHERE ticket_number LIKE '%TEST%'
AND due_date IS NOT NULL
GROUP BY 1
ORDER BY 1;

-- =================================================================
-- INSTRUCTIONS:
-- =================================================================
-- 1. Run this entire script in your Supabase SQL Editor
-- 2. After running, disable mock mode in your mobile app by setting:
--    USE_MOCK_API=false and EXPO_PUBLIC_USE_MOCK_API=false in .env.local
-- 3. Test the Floor Manager interface with real database data
-- 
-- Mock Users Created:
-- - Floor Manager: floor_manager_kochi (Sarah Johnson)
-- - Technicians: John Doe (6 tickets), Jane Smith (8 tickets), 
--                Mike Johnson (4 tickets), Sarah Wilson (2 tickets, oldest work)
-- - Front Desk: front_desk_manager (David Kumar)
--
-- Test Data:
-- - 5 unassigned tickets (status: reported/triaged)
-- - 20 assigned tickets (status: in_progress) 
-- - Various priorities and due dates
-- - Some overdue tickets for testing alerts
-- - Different technician workloads for testing capacity management
-- =================================================================
