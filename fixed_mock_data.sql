-- Fixed Floor Manager Mock Data SQL Script
-- This script uses proper UUID format
-- Run this in your Supabase SQL editor

-- =================================================================
-- 1. SCHEMA PREPARATION - Add missing columns safely
-- =================================================================

-- Add assignment tracking columns if they don't exist
DO $$
BEGIN
    -- Check and add assigned_to column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'assigned_to') THEN
        ALTER TABLE service_tickets ADD COLUMN assigned_to UUID;
        CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
    END IF;
    
    -- Check and add assigned_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'assigned_at') THEN
        ALTER TABLE service_tickets ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
        CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_at ON service_tickets(assigned_at);
    END IF;
    
    -- Check and add assigned_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'assigned_by') THEN
        ALTER TABLE service_tickets ADD COLUMN assigned_by UUID;
    END IF;
    
    -- Check and add due_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_tickets' AND column_name = 'due_date') THEN
        ALTER TABLE service_tickets ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
        CREATE INDEX IF NOT EXISTS idx_service_tickets_due_date ON service_tickets(due_date);
    END IF;
END $$;

-- Create technician_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS technician_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  max_capacity INTEGER DEFAULT 8 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE technician_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies safely
DROP POLICY IF EXISTS "Users can view own technician settings" ON technician_settings;
DROP POLICY IF EXISTS "Floor managers can view all technician settings" ON technician_settings;
DROP POLICY IF EXISTS "Floor managers can update technician settings" ON technician_settings;
DROP POLICY IF EXISTS "Floor managers can insert technician settings" ON technician_settings;

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
DELETE FROM service_tickets WHERE ticket_number LIKE '%TEST%';
DELETE FROM customers WHERE name LIKE '%Test%';
DELETE FROM technician_settings WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid
);
DELETE FROM app_roles WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid
);
DELETE FROM user_locations WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid
);
DELETE FROM profiles WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid
);

-- =================================================================
-- 3. CREATE LOCATIONS (if not exists)
-- =================================================================
INSERT INTO locations (id, name, code, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Kochi Branch', 'KOCHI', true),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Thrissur Branch', 'THR', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- =================================================================
-- 4. CREATE MOCK PROFILES
-- =================================================================
INSERT INTO profiles (user_id, username, email, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'floor_manager_kochi', 'floor.manager@evwheels.com', 'Sarah', 'Johnson'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'John Doe', 'john.doe@evwheels.com', 'John', 'Doe'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Jane Smith', 'jane.smith@evwheels.com', 'Jane', 'Smith'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Mike Johnson', 'mike.johnson@evwheels.com', 'Mike', 'Johnson'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Sarah Wilson', 'sarah.wilson@evwheels.com', 'Sarah', 'Wilson'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'front_desk_manager', 'front.desk@evwheels.com', 'David', 'Kumar')
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- =================================================================
-- 5. ASSIGN ROLES
-- =================================================================
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
  ('11111111-1111-1111-1111-111111111111'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('33333333-3333-3333-3333-333333333333'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('44444444-4444-4444-4444-444444444444'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('55555555-5555-5555-5555-555555555555'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('66666666-6666-6666-6666-666666666666'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT (user_id, location_id) DO NOTHING;

-- =================================================================
-- 7. CREATE TECHNICIAN SETTINGS
-- =================================================================
INSERT INTO technician_settings (user_id, max_capacity) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 8),
  ('33333333-3333-3333-3333-333333333333'::uuid, 8),
  ('44444444-4444-4444-4444-444444444444'::uuid, 8),
  ('55555555-5555-5555-5555-555555555555'::uuid, 8)
ON CONFLICT (user_id) DO UPDATE SET max_capacity = EXCLUDED.max_capacity;

-- =================================================================
-- 8. CREATE MOCK CUSTOMERS
-- =================================================================
INSERT INTO customers (id, name, contact, email, address, location_id) VALUES
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'Test Customer 1', '+919876543210', 'customer1@test.com', '123 Main St, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'Test Customer 2', '+919876543211', 'customer2@test.com', '456 Oak Ave, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'Test Customer 3', '+919876543212', 'customer3@test.com', '789 Pine Rd, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'Test Customer 4', '+919876543213', 'customer4@test.com', '321 Elm St, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'Test Customer 5', '+919876543214', 'customer5@test.com', '654 Maple Dr, Kochi', '550e8400-e29b-41d4-a716-446655440000'::uuid)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 9. CREATE SERVICE TICKETS - Simplified approach with valid UUIDs
-- =================================================================

-- Create unassigned tickets (reported/triaged status)
INSERT INTO service_tickets (
  id, ticket_number, customer_id, customer_complaint, description, status, priority, 
  location_id, created_by, created_at, due_date
) VALUES
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'T-20241107-TEST001', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Battery not charging', 'Customer reports battery not holding charge after 6 months', 'reported', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '2 hours', NOW() + INTERVAL '2 days'),

  ('a2222222-2222-2222-2222-222222222222'::uuid, 'T-20241107-TEST002', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Vehicle not starting', 'Electric scooter not turning on, display blank', 'triaged', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '4 hours', NOW() + INTERVAL '1 day'),

  ('a3333333-3333-3333-3333-333333333333'::uuid, 'T-20241107-TEST003', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Strange noise from motor', 'Clicking sound when accelerating', 'reported', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 days'),

  ('a4444444-4444-4444-4444-444444444444'::uuid, 'T-20241107-TEST004', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Brakes not working properly', 'Rear brake feels loose and ineffective', 'triaged', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '6 hours', NOW() + INTERVAL '1 day'),

  ('a5555555-5555-5555-5555-555555555555'::uuid, 'T-20241107-TEST005', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Battery draining fast', 'Range has decreased significantly', 'reported', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '2 days');

-- Create assigned tickets (in_progress status)
INSERT INTO service_tickets (
  id, ticket_number, customer_id, customer_complaint, description, status, priority, 
  location_id, created_by, assigned_to, assigned_by, assigned_at, created_at, due_date
) VALUES
  -- John Doe assignments (6 tickets - near capacity)
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'T-20241105-TEST006', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Controller malfunction', 'Speed controller intermittent', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 day'),

  ('b2222222-2222-2222-2222-222222222222'::uuid, 'T-20241106-TEST007', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Headlight not working', 'Front LED headlight completely dead', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days'),

  ('b3333333-3333-3333-3333-333333333333'::uuid, 'T-20241106-TEST008', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Tire replacement needed', 'Front tire worn out, needs replacement', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day'),

  ('b4444444-4444-4444-4444-444444444444'::uuid, 'T-20241107-TEST009', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Horn not working', 'Electric horn completely silent', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 hours'),

  ('b5555555-5555-5555-5555-555555555555'::uuid, 'T-20241107-TEST010', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Display flickering', 'Digital display shows intermittent readings', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 hours', NOW() + INTERVAL '2 days'),

  ('b6666666-6666-6666-6666-666666666666'::uuid, 'T-20241107-TEST011', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Loose handle grip', 'Right handle grip coming loose', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '22222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '4 days'),

  -- Jane Smith assignments (8 tickets - at capacity)  
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'T-20241104-TEST012', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Suspension issue', 'Front suspension making noise', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),

  ('c2222222-2222-2222-2222-222222222222'::uuid, 'T-20241105-TEST013', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Chain adjustment needed', 'Drive chain too loose', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

  ('c3333333-3333-3333-3333-333333333333'::uuid, 'T-20241105-TEST014', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Mirror replacement', 'Left mirror cracked', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),

  ('c4444444-4444-4444-4444-444444444444'::uuid, 'T-20241106-TEST015', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Throttle sticking', 'Throttle not returning to zero position', 'in_progress', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),

  ('c5555555-5555-5555-5555-555555555555'::uuid, 'T-20241106-TEST016', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Seat adjustment broken', 'Seat height adjustment mechanism stuck', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days'),

  ('c6666666-6666-6666-6666-666666666666'::uuid, 'T-20241107-TEST017', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Kickstand loose', 'Side kickstand not holding weight properly', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '12 hours', NOW() + INTERVAL '3 days'),

  ('c7777777-7777-7777-7777-777777777777'::uuid, 'T-20241107-TEST018', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'USB charging port not working', 'Phone charging port not providing power', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '4 days'),

  ('c8888888-8888-8888-8888-888888888888'::uuid, 'T-20241107-TEST019', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Storage compartment lock broken', 'Under-seat storage not locking', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '33333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '5 days'),

  -- Mike Johnson assignments (4 tickets - medium load)
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'T-20241107-TEST020', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Turn signal not working', 'Left turn indicator not blinking', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '6 hours'),

  ('d2222222-2222-2222-2222-222222222222'::uuid, 'T-20241107-TEST021', 'c1111111-1111-1111-1111-111111111111'::uuid, 
   'Footrest adjustment', 'Passenger footrest position uncomfortable', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '18 hours', NOW() - INTERVAL '1 day', NOW() + INTERVAL '3 days'),

  ('d3333333-3333-3333-3333-333333333333'::uuid, 'T-20241107-TEST022', 'c2222222-2222-2222-2222-222222222222'::uuid, 
   'Speedometer calibration', 'Speed reading appears inaccurate', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '18 hours', NOW() + INTERVAL '2 days'),

  ('d4444444-4444-4444-4444-444444444444'::uuid, 'T-20241107-TEST023', 'c3333333-3333-3333-3333-333333333333'::uuid, 
   'Handlebar alignment', 'Handlebars slightly bent after minor fall', 'in_progress', 2, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '44444444-4444-4444-4444-444444444444'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '10 hours', NOW() + INTERVAL '1 day'),

  -- Sarah Wilson assignments (2 tickets - light load, but oldest assignment)
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'T-20241031-TEST024', 'c4444444-4444-4444-4444-444444444444'::uuid, 
   'Complete overhaul needed', 'Comprehensive service and maintenance check', 'in_progress', 1, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '7 days', NOW() - INTERVAL '10 days', NOW() + INTERVAL '6 hours'),

  ('e2222222-2222-2222-2222-222222222222'::uuid, 'T-20241106-TEST025', 'c5555555-5555-5555-5555-555555555555'::uuid, 
   'Custom modification request', 'Customer wants additional LED strip installation', 'in_progress', 3, 
   '550e8400-e29b-41d4-a716-446655440000'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '55555555-5555-5555-5555-555555555555'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '4 days');

-- =================================================================
-- 10. VERIFICATION
-- =================================================================
SELECT 'Mock Data Created Successfully!' as status;

SELECT 'Profiles:' as check_type;
SELECT user_id, username, email FROM profiles WHERE username LIKE '%manager%' OR username LIKE '%Doe' OR username LIKE '%Smith' OR username LIKE '%Johnson' OR username LIKE '%Wilson';

SELECT 'Roles:' as check_type;  
SELECT user_id, role FROM app_roles WHERE role IN ('floor_manager', 'technician', 'front_desk_manager');

SELECT 'Service Tickets:' as check_type;
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

-- =================================================================
-- SUCCESS! 
-- You can now:
-- 1. Set USE_MOCK_API=false in your .env.local
-- 2. Test the Floor Manager interface with real data
-- 3. Login with a floor manager role to see the dashboard
-- =================================================================
