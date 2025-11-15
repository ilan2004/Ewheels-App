-- Fix missing pieces in the Supabase database
-- Run this in your Supabase SQL Editor

-- 1. The vehicles table might already exist, let's check and add missing columns if needed
-- First, let's make sure the vehicles table has the right structure
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

-- 3. Add some sample customers and vehicles data
-- First, let's add some customers using gen_random_uuid()
INSERT INTO customers (name, phone, email, address, location_id) 
SELECT name, phone, email, address, loc.id
FROM (
  VALUES 
    ('Arjun Mehta', '+919876543210', 'arjun.mehta@gmail.com', '123 MG Road, Bangalore, Karnataka'),
    ('Sita Devi', '+919876543211', 'sita.devi@gmail.com', '456 Anna Salai, Chennai, Tamil Nadu'),
    ('Ravi Kumar', '+919876543212', 'ravi.kumar@gmail.com', '789 FC Road, Pune, Maharashtra')
) AS new_customers(name, phone, email, address)
CROSS JOIN (SELECT id FROM locations LIMIT 1) AS loc
WHERE NOT EXISTS (
  SELECT 1 FROM customers 
  WHERE customers.email = new_customers.email
);

-- Add some vehicles for these customers  
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
  AND c.phone LIKE '+9198765432_'
  AND NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE vehicles.registration_number = v.reg_no
  )
ORDER BY c.name;

-- 4. Create some service tickets using the correct column names
INSERT INTO service_tickets (
  ticket_number, 
  customer_id, 
  vehicle_id,
  vehicle_reg_no,
  vehicle_make,
  vehicle_model, 
  customer_complaint,
  symptom, 
  description, 
  priority, 
  status, 
  location_id, 
  due_date,
  created_by,
  updated_at
) 
SELECT 
  'EV-2025-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
  c.id,
  v.id,
  v.registration_number,
  v.make,
  v.model,
  tickets.symptom,
  tickets.symptom,
  tickets.description,
  tickets.priority,
  tickets.status,
  c.location_id,
  tickets.due_date,
  (SELECT user_id FROM profiles LIMIT 1), -- Use existing user as creator
  NOW()
FROM customers c
JOIN vehicles v ON c.id = v.customer_id
CROSS JOIN (
  VALUES 
    ('Battery not charging properly', 'Customer reports that battery is not charging to full capacity and charging time has increased significantly', 1, 'reported', NOW() + INTERVAL '2 days'),
    ('Motor making unusual noise', 'Unusual grinding noise from motor during acceleration', 2, 'triaged', NOW() + INTERVAL '1 day'),  
    ('Brake system needs adjustment', 'Brake pedal feels spongy and braking distance has increased', 1, 'overdue', NOW() - INTERVAL '1 day')
) AS tickets(symptom, description, priority, status, due_date)
WHERE c.name IN ('Arjun Mehta', 'Sita Devi', 'Ravi Kumar')
  AND NOT EXISTS (
    SELECT 1 FROM service_tickets 
    WHERE service_tickets.vehicle_reg_no = v.registration_number
  )
ORDER BY c.name;

-- Verify the setup
SELECT 'Setup verification completed!' as status;
SELECT 'Customers count: ' || COUNT(*)::TEXT as info FROM customers;
SELECT 'Vehicles count: ' || COUNT(*)::TEXT as info FROM vehicles;  
SELECT 'Service tickets count: ' || COUNT(*)::TEXT as info FROM service_tickets;
SELECT 'Profiles count: ' || COUNT(*)::TEXT as info FROM profiles;
SELECT 'App roles count: ' || COUNT(*)::TEXT as info FROM app_roles;

-- Show sample data
SELECT 'Sample customers:' as info;
SELECT id, name, phone FROM customers LIMIT 3;

SELECT 'Sample vehicles:' as info;  
SELECT id, make, model, registration_number FROM vehicles LIMIT 3;

SELECT 'Sample service tickets:' as info;
SELECT id, ticket_number, symptom, status FROM service_tickets LIMIT 3;
