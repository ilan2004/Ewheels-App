-- Fix missing pieces in the Supabase database
-- Run this in your Supabase SQL Editor

-- 1. Create missing vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  registration_number TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  battery_type TEXT,
  motor_type TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  last_service_date DATE,
  next_service_date DATE,
  mileage_km INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Enable RLS on vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for vehicles
CREATE POLICY "Enable read access for all users" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vehicles FOR UPDATE USING (true);

-- Add trigger for updated_at on vehicles
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vehicles_updated_at ON vehicles;
CREATE TRIGGER trigger_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_updated_at();

-- 2. Add the missing foreign key relationship between profiles and app_roles
-- This creates the relationship that Supabase's PostgREST API needs for joins

-- First, let's check if we need to add the foreign key constraint
-- The app_roles table should reference profiles.user_id
ALTER TABLE app_roles 
ADD CONSTRAINT fk_app_roles_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 3. Add some sample customers and vehicles data
-- First, let's add some customers
INSERT INTO customers (id, name, contact, email, address) VALUES 
  ('c1e1f1a1-1111-4111-a111-111111111111', 'Arjun Mehta', '+919876543210', 'arjun.mehta@gmail.com', '123 MG Road, Bangalore, Karnataka'),
  ('c2e2f2a2-2222-4222-a222-222222222222', 'Sita Devi', '+919876543211', 'sita.devi@gmail.com', '456 Anna Salai, Chennai, Tamil Nadu'),
  ('c3e3f3a3-3333-4333-a333-333333333333', 'Ravi Kumar', '+919876543212', 'ravi.kumar@gmail.com', '789 FC Road, Pune, Maharashtra')
ON CONFLICT (id) DO NOTHING;

-- Add some vehicles for these customers
INSERT INTO vehicles (id, customer_id, registration_number, brand, model, year, battery_type, motor_type) VALUES
  ('v1e1f1a1-1111-4111-a111-111111111111', 'c1e1f1a1-1111-4111-a111-111111111111', 'KA01AB1234', 'Ather', '450X', 2023, 'Lithium-ion', 'BLDC'),
  ('v2e2f2a2-2222-4222-a222-222222222222', 'c2e2f2a2-2222-4222-a222-222222222222', 'DL02CD5678', 'Ola Electric', 'S1 Pro', 2023, 'Lithium-ion', 'BLDC'),
  ('v3e3f3a3-3333-4333-a333-333333333333', 'c3e3f3a3-3333-4333-a333-333333333333', 'MH03EF9012', 'Bajaj', 'Chetak', 2022, 'Lithium-ion', 'BLDC')
ON CONFLICT (id) DO NOTHING;

-- 4. Create some service tickets
INSERT INTO service_tickets (
  id, 
  ticket_number, 
  customer_id, 
  vehicle_registration, 
  symptom, 
  description, 
  priority, 
  status, 
  location_id, 
  due_date,
  created_by,
  updated_by
) VALUES 
  (
    'st1e1f1a-1111-4111-a111-111111111111',
    'EV-2025-000001', 
    'c1e1f1a1-1111-4111-a111-111111111111',
    'KA01AB1234',
    'Battery not charging properly',
    'Customer reports that battery is not charging to full capacity and charging time has increased significantly',
    1,
    'reported',
    (SELECT id FROM locations LIMIT 1),
    NOW() + INTERVAL '2 days',
    'system',
    'system'
  ),
  (
    'st2e2f2a-2222-4222-a222-222222222222',
    'EV-2025-000002',
    'c2e2f2a2-2222-4222-a222-222222222222', 
    'DL02CD5678',
    'Motor making unusual noise',
    'Unusual grinding noise from motor during acceleration',
    2,
    'triaged',
    (SELECT id FROM locations LIMIT 1),
    NOW() + INTERVAL '1 day',
    'system',
    'system'
  ),
  (
    'st3e3f3a-3333-4333-a333-333333333333',
    'EV-2025-000003',
    'c3e3f3a3-3333-4333-a333-333333333333',
    'MH03EF9012',
    'Brake system needs adjustment', 
    'Brake pedal feels spongy and braking distance has increased',
    1,
    'overdue',
    (SELECT id FROM locations LIMIT 1),
    NOW() - INTERVAL '1 day',
    'system',
    'system'
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 'Setup verification:' as status;
SELECT 'Customers count:' as table_name, COUNT(*) as count FROM customers;
SELECT 'Vehicles count:' as table_name, COUNT(*) as count FROM vehicles;  
SELECT 'Service tickets count:' as table_name, COUNT(*) as count FROM service_tickets;
SELECT 'Profiles count:' as table_name, COUNT(*) as count FROM profiles;
SELECT 'App roles count:' as table_name, COUNT(*) as count FROM app_roles;
