-- Fix missing pieces in the Supabase database

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

-- Create policy for vehicles
CREATE POLICY "Enable read access for all users" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vehicles FOR UPDATE USING (true);

-- 2. Add the missing foreign key relationship between profiles and app_roles
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

-- 3. Add sample customers (using only existing columns: id, name, email, address)
-- Use WHERE NOT EXISTS to avoid duplicates instead of ON CONFLICT
INSERT INTO customers (name, email, address) 
SELECT name, email, address FROM (
  VALUES 
    ('Arjun Mehta', 'arjun.mehta@evwheels.com', '123 MG Road, Bangalore, Karnataka'),
    ('Sita Devi', 'sita.devi@evwheels.com', '456 Anna Salai, Chennai, Tamil Nadu'),
    ('Ravi Kumar', 'ravi.kumar@evwheels.com', '789 FC Road, Pune, Maharashtra')
) AS new_customers(name, email, address)
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE customers.email = new_customers.email
);

-- 4. Add sample vehicles for these customers  
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
WHERE c.email LIKE '%@evwheels.com'
  AND NOT EXISTS (
    SELECT 1 FROM vehicles 
    WHERE vehicles.registration_number = v.reg_no
  )
ORDER BY c.name;
