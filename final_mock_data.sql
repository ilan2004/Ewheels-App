-- Final Floor Manager Mock Data Script
-- Uses existing users to avoid foreign key constraints

-- =================================================================
-- 1. CLEAN UP EXISTING TEST DATA FIRST
-- =================================================================
DELETE FROM service_tickets WHERE ticket_number LIKE '%TEST%';
DELETE FROM customers WHERE name LIKE '%Test%';

-- =================================================================
-- 2. CREATE MOCK CUSTOMERS (using existing location)
-- =================================================================
-- Get existing location ID
DO $$
DECLARE 
    location_uuid uuid;
BEGIN
    -- Get any existing location
    SELECT id INTO location_uuid FROM locations LIMIT 1;
    
    -- Store in temp table for reference
    CREATE TEMP TABLE IF NOT EXISTS temp_location (id uuid);
    DELETE FROM temp_location;
    INSERT INTO temp_location VALUES (COALESCE(location_uuid, gen_random_uuid()));
END $$;

INSERT INTO customers (id, name, contact, email, address, location_id) 
SELECT 
  customer_id,
  customer_name,
  contact,
  email,
  address,
  (SELECT id FROM temp_location)
FROM (VALUES 
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'Test Customer 1', '+919876543210', 'customer1@test.com', '123 Main St, Test'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'Test Customer 2', '+919876543211', 'customer2@test.com', '456 Oak Ave, Test'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'Test Customer 3', '+919876543212', 'customer3@test.com', '789 Pine Rd, Test'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'Test Customer 4', '+919876543213', 'customer4@test.com', '321 Elm St, Test'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'Test Customer 5', '+919876543214', 'customer5@test.com', '654 Maple Dr, Test')
) AS v(customer_id, customer_name, contact, email, address)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 3. CREATE SERVICE TICKETS USING MINIMAL REQUIRED FIELDS
-- =================================================================

-- First, let's create tickets without user references to avoid foreign key issues
INSERT INTO service_tickets (
  id, 
  ticket_number, 
  customer_id, 
  customer_complaint, 
  description, 
  status, 
  priority, 
  location_id,
  created_at,
  updated_at
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
  created_time,
  created_time
FROM (VALUES 
  -- Unassigned tickets
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'T-20251107-TEST001', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Battery not charging', 'Customer reports battery not holding charge after 6 months', 'reported', 2, NOW() - INTERVAL '2 hours'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'T-20251107-TEST002', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Vehicle not starting', 'Electric scooter not turning on, display blank', 'triaged', 1, NOW() - INTERVAL '4 hours'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'T-20251107-TEST003', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Strange noise from motor', 'Clicking sound when accelerating', 'reported', 3, NOW() - INTERVAL '1 day'),
  ('a4444444-4444-4444-4444-444444444444'::uuid, 'T-20251107-TEST004', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Brakes not working properly', 'Rear brake feels loose and ineffective', 'triaged', 1, NOW() - INTERVAL '6 hours'),
  ('a5555555-5555-5555-5555-555555555555'::uuid, 'T-20251107-TEST005', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Battery draining fast', 'Range has decreased significantly', 'reported', 2, NOW() - INTERVAL '30 minutes')
) AS v(ticket_id, ticket_num, customer_id, complaint, description, status, priority, created_time);

-- =================================================================
-- 4. CREATE MOCK USERS AND ROLES FOR FLOOR MANAGER TESTING
-- =================================================================

-- Create test profiles (these won't have auth.users entries, but that's ok for testing)
INSERT INTO profiles (user_id, username, email, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'floor_manager_test', 'floor.manager@test.com', 'Floor', 'Manager'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'john_technician', 'john@test.com', 'John', 'Doe'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'jane_technician', 'jane@test.com', 'Jane', 'Smith'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'mike_technician', 'mike@test.com', 'Mike', 'Johnson'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'sarah_technician', 'sarah@test.com', 'Sarah', 'Wilson')
ON CONFLICT (user_id) DO UPDATE SET 
  username = EXCLUDED.username,
  email = EXCLUDED.email;

-- Assign roles
INSERT INTO app_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'floor_manager'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'technician'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'technician'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'technician'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'technician')
ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create user location assignments
INSERT INTO user_locations (user_id, location_id)
SELECT user_id, (SELECT id FROM temp_location)
FROM (VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid),
  ('33333333-3333-3333-3333-333333333333'::uuid),
  ('44444444-4444-4444-4444-444444444444'::uuid),
  ('55555555-5555-5555-5555-555555555555'::uuid)
) AS v(user_id)
ON CONFLICT (user_id, location_id) DO NOTHING;

-- Create technician settings
INSERT INTO technician_settings (user_id, max_capacity) VALUES
  ('22222222-2222-2222-2222-222222222222'::uuid, 8),
  ('33333333-3333-3333-3333-333333333333'::uuid, 8),
  ('44444444-4444-4444-4444-444444444444'::uuid, 8),
  ('55555555-5555-5555-5555-555555555555'::uuid, 8)
ON CONFLICT (user_id) DO UPDATE SET max_capacity = EXCLUDED.max_capacity;

-- =================================================================
-- 5. CREATE ASSIGNED TICKETS (simpler approach)
-- =================================================================

-- Create assigned tickets without foreign key references initially
INSERT INTO service_tickets (
  id, 
  ticket_number, 
  customer_id, 
  customer_complaint, 
  description, 
  status, 
  priority, 
  location_id,
  assigned_to,
  assigned_at,
  created_at,
  updated_at
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
  technician_id,
  assigned_time,
  created_time,
  assigned_time
FROM (VALUES 
  -- John's tickets (6 tickets)
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'T-20251105-TEST006', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Controller malfunction', 'Speed controller intermittent', 2, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days'),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'T-20251106-TEST007', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Headlight not working', 'Front LED headlight dead', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
  ('b3333333-3333-3333-3333-333333333333'::uuid, 'T-20251106-TEST008', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Tire replacement needed', 'Front tire worn out', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('b4444444-4444-4444-4444-444444444444'::uuid, 'T-20251107-TEST009', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Horn not working', 'Electric horn silent', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day'),
  ('b5555555-5555-5555-5555-555555555555'::uuid, 'T-20251107-TEST010', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Display flickering', 'Digital display intermittent', 2, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 hours'),
  ('b6666666-6666-6666-6666-666666666666'::uuid, 'T-20251107-TEST011', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Handle grip loose', 'Right handle grip coming loose', 3, '22222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '4 hours'),

  -- Jane's tickets (8 tickets - at capacity)
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'T-20251104-TEST012', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Suspension issue', 'Front suspension noisy', 2, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'T-20251105-TEST013', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Chain adjustment needed', 'Drive chain too loose', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'T-20251105-TEST014', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Mirror replacement', 'Left mirror cracked', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'T-20251106-TEST015', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Throttle sticking', 'Throttle not returning to zero', 1, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'T-20251106-TEST016', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Seat adjustment broken', 'Height adjustment stuck', 2, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('c6666666-6666-6666-6666-666666666666'::uuid, 'T-20251107-TEST017', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Kickstand loose', 'Side kickstand not holding', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '12 hours'),
  ('c7777777-7777-7777-7777-777777777777'::uuid, 'T-20251107-TEST018', 'c3333333-3333-3333-3333-333333333333'::uuid, 'USB port not working', 'Phone charging port dead', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 hours'),
  ('c8888888-8888-8888-8888-888888888888'::uuid, 'T-20251107-TEST019', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Storage lock broken', 'Under-seat storage not locking', 3, '33333333-3333-3333-3333-333333333333'::uuid, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours'),

  -- Mike's tickets (4 tickets)
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'T-20251107-TEST020', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Turn signal not working', 'Left indicator not blinking', 2, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'T-20251107-TEST021', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Footrest adjustment', 'Passenger footrest uncomfortable', 3, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '1 day'),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'T-20251107-TEST022', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Speedometer calibration', 'Speed reading inaccurate', 2, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '18 hours'),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'T-20251107-TEST023', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Handlebar alignment', 'Handlebars bent after fall', 2, '44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '10 hours'),

  -- Sarah's tickets (2 tickets - oldest work)
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'T-20251031-TEST024', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Complete overhaul', 'Comprehensive service needed', 1, '55555555-5555-5555-5555-555555555555'::uuid, NOW() - INTERVAL '7 days', NOW() - INTERVAL '10 days'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'T-20251106-TEST025', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Custom modification', 'LED strip installation', 3, '55555555-5555-5555-5555-555555555555'::uuid, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days')
) AS v(ticket_id, ticket_num, customer_id, complaint, description, priority, technician_id, assigned_time, created_time);

-- =================================================================
-- 6. CLEANUP AND VERIFICATION
-- =================================================================
DROP TABLE temp_location;

SELECT 'Mock Data Created Successfully!' as status;

SELECT 'Service Tickets Summary:' as info;
SELECT 
  status,
  CASE WHEN assigned_to IS NULL THEN 'Unassigned' ELSE 'Assigned' END as assignment_status,
  COUNT(*) as count
FROM service_tickets 
WHERE ticket_number LIKE '%TEST%'
GROUP BY status, assigned_to IS NULL
ORDER BY status;

SELECT 'Test Users Created:' as info;
SELECT p.username, ar.role
FROM profiles p
JOIN app_roles ar ON p.user_id = ar.user_id
WHERE p.username LIKE '%test%' OR p.username LIKE '%technician';

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

SELECT '✅ Floor Manager Mock Data Setup Complete!' as final_message;
SELECT 'Now set USE_MOCK_API=false in .env.local to test with real data!' as next_step;
