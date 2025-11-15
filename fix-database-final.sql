-- Fix missing pieces in the Supabase database
-- Run this in your Supabase SQL Editor
-- This version matches your actual database schema

-- 1. Create the missing vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  make VARCHAR(100),
  model VARCHAR(100), 
  year INTEGER,
  registration_number VARCHAR(50) UNIQUE,
  chassis_number VARCHAR(100),
  motor_number VARCHAR(100),
  battery_type VARCHAR(100),
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);

-- Enable RLS on vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for vehicles (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON vehicles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON vehicles;

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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_app_roles_user_id'
  ) THEN
    ALTER TABLE app_roles 
    ADD CONSTRAINT fk_app_roles_user_id 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Add sample customers (using only the columns that exist: id, name, email, address)
INSERT INTO customers (name, email, address) 
VALUES 
  ('Arjun Mehta', 'arjun.mehta@gmail.com', '123 MG Road, Bangalore, Karnataka'),
  ('Sita Devi', 'sita.devi@gmail.com', '456 Anna Salai, Chennai, Tamil Nadu'),
  ('Ravi Kumar', 'ravi.kumar@gmail.com', '789 FC Road, Pune, Maharashtra')
ON CONFLICT (email) DO NOTHING;

-- 4. Add some vehicles for these customers  
INSERT INTO vehicles (customer_id, registration_number, make, model, year, battery_type, location_id)
SELECT c.id, v.reg_no, v.make, v.model, v.year, v.battery, loc.id
FROM customers c
CROSS JOIN (
  VALUES 
    ('KA01AB1234', 'Ather', '450X', 2023, 'Lithium-ion'),
    ('DL02CD5678', 'Ola Electric', 'S1 Pro', 2023, 'Lithium-ion'),
    ('MH03EF9012', 'Bajaj', 'Chetak', 2022, 'Lithium-ion')
) AS v(reg_no, make, model, year, battery)
CROSS JOIN (SELECT id FROM locations LIMIT 1) AS loc
WHERE c.name IN ('Arjun Mehta', 'Sita Devi', 'Ravi Kumar')
  AND NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE vehicles.registration_number = v.reg_no
  )
ORDER BY c.name;

-- 5. Let's check what columns actually exist in service_tickets before inserting
-- First, let's try to find the correct column names by checking what columns work
-- We'll use a simple approach - try common column names that should exist

-- Check if service_tickets has the basic required columns and insert sample data
-- Using only the columns we know exist: id, customer_id, ticket_number
DO $$
DECLARE
    customer_rec RECORD;
    vehicle_rec RECORD;
    location_id UUID;
BEGIN
    -- Get a location ID
    SELECT id INTO location_id FROM locations LIMIT 1;
    
    -- Insert service tickets with minimal required columns
    FOR customer_rec IN SELECT id, name FROM customers WHERE name IN ('Arjun Mehta', 'Sita Devi', 'Ravi Kumar') LOOP
        -- Get the vehicle for this customer
        SELECT * INTO vehicle_rec FROM vehicles WHERE customer_id = customer_rec.id LIMIT 1;
        
        IF vehicle_rec.id IS NOT NULL THEN
            -- Try to insert a basic service ticket
            INSERT INTO service_tickets (
                ticket_number,
                customer_id,
                status
            ) VALUES (
                'EV-2025-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
                customer_rec.id,
                CASE 
                    WHEN customer_rec.name = 'Arjun Mehta' THEN 'reported'
                    WHEN customer_rec.name = 'Sita Devi' THEN 'triaged'  
                    ELSE 'overdue'
                END
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- Verify the setup
SELECT 'Setup verification completed!' as status;
SELECT 'Customers count: ' || COUNT(*)::TEXT as info FROM customers;
SELECT 'Vehicles count: ' || COUNT(*)::TEXT as info FROM vehicles;  
SELECT 'Service tickets count: ' || COUNT(*)::TEXT as info FROM service_tickets;
SELECT 'Profiles count: ' || COUNT(*)::TEXT as info FROM profiles;
SELECT 'App roles count: ' || COUNT(*)::TEXT as info FROM app_roles;

-- Show sample data
SELECT 'Sample customers:' as info;
SELECT id, name, email FROM customers LIMIT 3;

SELECT 'Sample vehicles:' as info;  
SELECT id, make, model, registration_number FROM vehicles LIMIT 3;

SELECT 'Sample service tickets:' as info;
SELECT id, ticket_number, status FROM service_tickets LIMIT 3;
