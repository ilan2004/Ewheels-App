-- Tailored Floor Manager Mock Data Script
-- Based on your actual database schema analysis
-- Your database already has all the required columns!

-- =================================================================
-- 1. CLEAN UP EXISTING TEST DATA FIRST
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
-- 2. GET EXISTING LOCATION (using your existing locations)
-- =================================================================
-- First, let's see what location we can use
DO $$
DECLARE 
    location_uuid uuid;
BEGIN
    -- Get the first active location
    SELECT id INTO location_uuid FROM locations WHERE is_active = true LIMIT 1;
    IF location_uuid IS NULL THEN
        -- If no active location, get any location
        SELECT id INTO location_uuid FROM locations LIMIT 1;
    END IF;
    
    IF location_uuid IS NULL THEN
        -- Create a test location if none exist
        INSERT INTO locations (id, name, code, is_active) VALUES
        ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Test Location', 'TEST', true);
        location_uuid := '550e8400-e29b-41d4-a716-446655440000'::uuid;
    END IF;
    
    -- Store the location UUID for later use
    CREATE TEMP TABLE temp_location (id uuid);
    INSERT INTO temp_location VALUES (location_uuid);
    
    RAISE NOTICE 'Using location: %', location_uuid;
END $$;

-- =================================================================
-- 3. CREATE MOCK PROFILES
-- =================================================================
INSERT INTO profiles (user_id, username, email, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'floor_manager_test', 'floor.manager@evwheels.com', 'Sarah', 'Johnson'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'john_technician', 'john.doe@evwheels.com', 'John', 'Doe'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'jane_technician', 'jane.smith@evwheels.com', 'Jane', 'Smith'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'mike_technician', 'mike.johnson@evwheels.com', 'Mike', 'Johnson'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'sarah_technician', 'sarah.wilson@evwheels.com', 'Sarah', 'Wilson'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'frontdesk_manager', 'front.desk@evwheels.com', 'David', 'Kumar')
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- =================================================================
-- 4. ASSIGN ROLES
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
-- 5. CREATE USER LOCATION ASSIGNMENTS
-- =================================================================
INSERT INTO user_locations (user_id, location_id)
SELECT user_id, (SELECT id FROM temp_location)
FROM (VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid),
  ('33333333-3333-3333-3333-333333333333'::uuid),
  ('44444444-4444-4444-4444-444444444444'::uuid),
  ('55555555-5555-5555-5555-555555555555'::uuid),
  ('66666666-6666-6666-6666-666666666666'::uuid)
) AS v(user_id)
ON CONFLICT (user_id, location_id) DO NOTHING;

-- =================================================================
-- 6. CREATE TECHNICIAN SETTINGS
-- =================================================================
INSERT INTO technician_settings (user_id, max_capacity) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 8),
  ('33333333-3333-3333-3333-333333333333'::uuid, 8),
  ('44444444-4444-4444-4444-444444444444'::uuid, 8),
  ('55555555-5555-5555-5555-555555555555'::uuid, 8)
ON CONFLICT (user_id) DO UPDATE SET max_capacity = EXCLUDED.max_capacity;

-- =================================================================
-- 7. CREATE MOCK CUSTOMERS
-- =================================================================
INSERT INTO customers (id, name, contact, email, address, location_id) 
SELECT 
  customer_id,
  customer_name,
  contact,
  email,
  address,
  (SELECT id FROM temp_location)
FROM (VALUES 
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'Test Customer 1', '+919876543210', 'customer1@test.com', '123 Main St, Kochi'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'Test Customer 2', '+919876543211', 'customer2@test.com', '456 Oak Ave, Kochi'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'Test Customer 3', '+919876543212', 'customer3@test.com', '789 Pine Rd, Kochi'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'Test Customer 4', '+919876543213', 'customer4@test.com', '321 Elm St, Kochi'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'Test Customer 5', '+919876543214', 'customer5@test.com', '654 Maple Dr, Kochi')
) AS v(customer_id, customer_name, contact, email, address)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 8. CREATE UNASSIGNED SERVICE TICKETS
-- =================================================================
INSERT INTO service_tickets (
  id, ticket_number, customer_id, customer_complaint, description, status, priority, 
  location_id, created_by, updated_by, created_at, updated_at
) 
SELECT 
  ticket_id,
  ticket_num,
  customer_id,
  complaint,
  description,
  status::service_ticket_status,
  priority,
  (SELECT id FROM temp_location),
  '66666666-6666-6666-6666-666666666666'::uuid, -- front desk manager
  '66666666-6666-6666-6666-666666666666'::uuid,
  created_time,
  created_time
FROM (VALUES 
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'T-20251107-TEST001', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Battery not charging', 'Customer reports battery not holding charge after 6 months', 'reported', 2, NOW() - INTERVAL '2 hours'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'T-20251107-TEST002', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Vehicle not starting', 'Electric scooter not turning on, display blank', 'triaged', 1, NOW() - INTERVAL '4 hours'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'T-20251107-TEST003', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Strange noise from motor', 'Clicking sound when accelerating', 'reported', 3, NOW() - INTERVAL '1 day'),
  ('a4444444-4444-4444-4444-444444444444'::uuid, 'T-20251107-TEST004', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Brakes not working properly', 'Rear brake feels loose and ineffective', 'triaged', 1, NOW() - INTERVAL '6 hours'),
  ('a5555555-5555-5555-5555-555555555555'::uuid, 'T-20251107-TEST005', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Battery draining fast', 'Range has decreased significantly', 'reported', 2, NOW() - INTERVAL '30 minutes')
) AS v(ticket_id, ticket_num, customer_id, complaint, description, status, priority, created_time);

-- =================================================================
-- 9. CREATE ASSIGNED SERVICE TICKETS
-- =================================================================
INSERT INTO service_tickets (
  id, ticket_number, customer_id, customer_complaint, description, status, priority, 
  location_id, created_by, updated_by, assigned_to, assigned_by, assigned_at, 
  created_at, updated_at
) 
SELECT 
  ticket_id,
  ticket_num,
  customer_id,
  complaint,
  description,
  'in_progress'::service_ticket_status,
  priority,
  (SELECT id FROM temp_location),
  '66666666-6666-6666-6666-666666666666'::uuid, -- created by front desk
  '11111111-1111-1111-1111-111111111111'::uuid, -- updated by floor manager
  technician_id,
  '11111111-1111-1111-1111-111111111111'::uuid, -- assigned by floor manager
  assigned_time,
  created_time,
  assigned_time
FROM (VALUES 
  -- John Doe assignments (6 tickets - near capacity)
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'T-20251105-TEST006', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Controller malfunction', 'Speed controller intermittent', 2, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'T-20251106-TEST007', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Headlight not working', 'Front LED headlight completely dead', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
  ('b3333333-3333-3333-3333-333333333333'::uuid, 'T-20251106-TEST008', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Tire replacement needed', 'Front tire worn out, needs replacement', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('b4444444-4444-4444-4444-444444444444'::uuid, 'T-20251107-TEST009', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Horn not working', 'Electric horn completely silent', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day'),
  ('b5555555-5555-5555-5555-555555555555'::uuid, 'T-20251107-TEST010', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Display flickering', 'Digital display shows intermittent readings', 2, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 hours'),
  ('b6666666-6666-6666-6666-666666666666'::uuid, 'T-20251107-TEST011', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Loose handle grip', 'Right handle grip coming loose', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours'),

  -- Jane Smith assignments (8 tickets - at capacity)
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'T-20251104-TEST012', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Suspension issue', 'Front suspension making noise', 2, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'T-20251105-TEST013', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Chain adjustment needed', 'Drive chain too loose', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'T-20251105-TEST014', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Mirror replacement', 'Left mirror cracked', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'T-20251106-TEST015', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Throttle sticking', 'Throttle not returning to zero position', 1, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'T-20251106-TEST016', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Seat adjustment broken', 'Seat height adjustment mechanism stuck', 2, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('c6666666-6666-6666-6666-666666666666'::uuid, 'T-20251107-TEST017', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Kickstand loose', 'Side kickstand not holding weight properly', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '12 hours'),
  ('c7777777-7777-7777-7777-777777777777'::uuid, 'T-20251107-TEST018', 'c3333333-3333-3333-3333-333333333333'::uuid, 'USB charging port not working', 'Phone charging port not providing power', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 hours'),
  ('c8888888-8888-8888-8888-888888888888'::uuid, 'T-20251107-TEST019', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Storage compartment lock broken', 'Under-seat storage not locking', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours'),

  -- Mike Johnson assignments (4 tickets - medium load)
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'T-20251107-TEST020', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Turn signal not working', 'Left turn indicator not blinking', 2, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'T-20251107-TEST021', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Footrest adjustment', 'Passenger footrest position uncomfortable', 3, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '1 day'),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'T-20251107-TEST022', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Speedometer calibration', 'Speed reading appears inaccurate', 2, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '18 hours'),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'T-20251107-TEST023', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Handlebar alignment', 'Handlebars slightly bent after minor fall', 2, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '10 hours'),

  -- Sarah Wilson assignments (2 tickets - light load, but oldest assignment)
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'T-20251031-TEST024', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Complete overhaul needed', 'Comprehensive service and maintenance check', 1, '55555555-5555-5555-5555-555555555555'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '10 days'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'T-20251106-TEST025', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Custom modification request', 'Customer wants additional LED strip installation', 3, '55555555-5555-5555-5555-555555555555'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days')
) AS v(ticket_id, ticket_num, customer_id, complaint, description, priority, technician_id, assigned_time, created_time);

-- =================================================================
-- 10. CLEANUP TEMP TABLE
-- =================================================================
DROP TABLE temp_location;

-- =================================================================
-- 11. VERIFICATION
-- =================================================================
SELECT 'Mock Data Created Successfully!' as status;

SELECT 'Test Users Created:' as info;
SELECT p.username, ar.role, p.email
FROM profiles p
JOIN app_roles ar ON p.user_id = ar.user_id
WHERE p.username LIKE '%test%' OR p.username LIKE '%technician' OR p.username LIKE '%manager';

SELECT 'Service Tickets Summary:' as info;
SELECT 
  status,
  CASE WHEN assigned_to IS NULL THEN 'Unassigned' ELSE 'Assigned' END as assignment_status,
  COUNT(*) as count
FROM service_tickets 
WHERE id IN (
  SELECT unnest(ARRAY[
    'a1111111-1111-1111-1111-111111111111'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'a3333333-3333-3333-3333-333333333333'::uuid,
    'b1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'e1111111-1111-1111-1111-111111111111'::uuid
  ])
)
GROUP BY status, assigned_to IS NULL
ORDER BY status;

SELECT 'Technician Workloads:' as info;
SELECT 
  p.username,
  COUNT(st.id) as active_tickets,
  ts.max_capacity,
  MIN(st.assigned_at) as oldest_assignment
FROM profiles p
JOIN app_roles ar ON p.user_id = ar.user_id
LEFT JOIN technician_settings ts ON p.user_id = ts.user_id
LEFT JOIN service_tickets st ON p.user_id = st.assigned_to AND st.status = 'in_progress'
WHERE ar.role = 'technician' AND p.username LIKE '%technician'
GROUP BY p.user_id, p.username, ts.max_capacity
ORDER BY active_tickets DESC;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT '✅ Floor Manager Mock Data Setup Complete!' as final_message;
SELECT 'You can now:' as next_steps;  
SELECT '1. Set USE_MOCK_API=false in .env.local' as step_1;
SELECT '2. Test Floor Manager interface with real data' as step_2;
SELECT '3. Login as floor_manager_test to see the dashboard' as step_3;
