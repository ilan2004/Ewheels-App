-- Working Floor Manager Mock Data Script (Final Version)
-- Uses ONLY existing authenticated users to avoid foreign key violations

-- =================================================================
-- 1. FIND EXISTING USERS AND SETUP
-- =================================================================

-- Create temporary tables to store existing user info
CREATE TEMP TABLE temp_existing_users AS
SELECT DISTINCT created_by as user_id FROM service_tickets WHERE created_by IS NOT NULL
UNION
SELECT DISTINCT updated_by as user_id FROM service_tickets WHERE updated_by IS NOT NULL
UNION  
SELECT DISTINCT assigned_to as user_id FROM service_tickets WHERE assigned_to IS NOT NULL
UNION
SELECT DISTINCT assigned_by as user_id FROM service_tickets WHERE assigned_by IS NOT NULL
UNION
SELECT user_id FROM profiles LIMIT 5;

-- Get the first existing user as our "floor manager" for this test
CREATE TEMP TABLE temp_floor_manager AS
SELECT user_id FROM temp_existing_users LIMIT 1;

-- Get existing location
CREATE TEMP TABLE temp_location AS
SELECT id FROM locations LIMIT 1;

-- Display what we're working with
SELECT 'Using existing user as floor manager:' as info, user_id::text as floor_manager_id 
FROM temp_floor_manager;

-- Clean up existing test data first
DELETE FROM service_tickets WHERE ticket_number LIKE '%TEST%';
DELETE FROM customers WHERE name LIKE '%Test%';

-- =================================================================
-- 2. CREATE MOCK CUSTOMERS
-- =================================================================
INSERT INTO customers (id, name, contact, email, address, location_id) 
SELECT 
  customer_id,
  customer_name,
  contact,
  email,
  address,
  COALESCE((SELECT id FROM temp_location), gen_random_uuid())
FROM (VALUES 
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'Test Customer Alpha', '+919876543210', 'alpha@test.com', '123 Alpha St, Test City'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'Test Customer Beta', '+919876543211', 'beta@test.com', '456 Beta Ave, Test City'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'Test Customer Gamma', '+919876543212', 'gamma@test.com', '789 Gamma Rd, Test City'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, 'Test Customer Delta', '+919876543213', 'delta@test.com', '321 Delta St, Test City'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, 'Test Customer Echo', '+919876543214', 'echo@test.com', '654 Echo Dr, Test City')
) AS v(customer_id, customer_name, contact, email, address)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 3. CREATE UNASSIGNED SERVICE TICKETS
-- =================================================================

INSERT INTO service_tickets (
  id, 
  ticket_number, 
  customer_id, 
  customer_complaint, 
  description, 
  status, 
  priority, 
  location_id,
  created_by,
  updated_by,
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
  COALESCE((SELECT id FROM temp_location), gen_random_uuid()),
  (SELECT user_id FROM temp_floor_manager),
  (SELECT user_id FROM temp_floor_manager),
  created_time,
  created_time
FROM (VALUES 
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'TEST-001-URGENT', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Battery completely dead', 'Customer reports battery died suddenly, no charging response', 'reported', 1, NOW() - INTERVAL '1 hour'),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'TEST-002-HIGH', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Motor making grinding noise', 'Loud grinding sound when accelerating, possible bearing issue', 'triaged', 1, NOW() - INTERVAL '3 hours'),
  ('a3333333-3333-3333-3333-333333333333'::uuid, 'TEST-003-MEDIUM', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Brake pads worn', 'Front brake pads need replacement, reduced stopping power', 'reported', 2, NOW() - INTERVAL '5 hours'),
  ('a4444444-4444-4444-4444-444444444444'::uuid, 'TEST-004-HIGH', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Throttle not responding', 'Throttle acceleration intermittent, safety concern', 'triaged', 1, NOW() - INTERVAL '2 hours'),
  ('a5555555-5555-5555-5555-555555555555'::uuid, 'TEST-005-LOW', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Headlight dim', 'Front headlight less bright than normal', 'reported', 3, NOW() - INTERVAL '30 minutes'),
  ('a6666666-6666-6666-6666-666666666666'::uuid, 'TEST-006-URGENT', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Electrical short circuit', 'Sparks from control panel, immediate attention needed', 'reported', 1, NOW() - INTERVAL '4 hours'),
  ('a7777777-7777-7777-7777-777777777777'::uuid, 'TEST-007-MEDIUM', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Tire pressure low', 'Both tires need air, handling affected', 'triaged', 2, NOW() - INTERVAL '6 hours')
) AS v(ticket_id, ticket_num, customer_id, complaint, description, status, priority, created_time);

-- =================================================================
-- 4. CREATE ASSIGNED SERVICE TICKETS (using existing users only)
-- =================================================================

-- We'll create some assigned tickets using existing users from your system
INSERT INTO service_tickets (
  id, 
  ticket_number, 
  customer_id, 
  customer_complaint, 
  description, 
  status, 
  priority, 
  location_id,
  created_by,
  updated_by,
  assigned_to,
  assigned_by,
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
  COALESCE((SELECT id FROM temp_location), gen_random_uuid()),
  (SELECT user_id FROM temp_floor_manager),
  (SELECT user_id FROM temp_floor_manager),
  assigned_to_user,
  (SELECT user_id FROM temp_floor_manager),
  assigned_time,
  created_time,
  assigned_time
FROM (
  SELECT 
    ticket_id,
    ticket_num,
    customer_id,
    complaint,
    description,
    priority,
    -- Cycle through existing users for assignment
    (SELECT user_id FROM temp_existing_users OFFSET (row_number() OVER () - 1) % (SELECT COUNT(*) FROM temp_existing_users) LIMIT 1) as assigned_to_user,
    assigned_time,
    created_time
  FROM (VALUES 
    ('b1111111-1111-1111-1111-111111111111'::uuid, 'TEST-101-PROGRESS', 'c3333333-3333-3333-3333-333333333333'::uuid, 'Chain maintenance', 'Regular chain lubrication and adjustment', 2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
    ('b2222222-2222-2222-2222-222222222222'::uuid, 'TEST-102-PROGRESS', 'c4444444-4444-4444-4444-444444444444'::uuid, 'Software update', 'Firmware update for display system', 3, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '8 hours'),
    ('b3333333-3333-3333-3333-333333333333'::uuid, 'TEST-103-PROGRESS', 'c5555555-5555-5555-5555-555555555555'::uuid, 'Mirror adjustment', 'Side mirrors loose, need tightening', 3, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '12 hours'),
    ('b4444444-4444-4444-4444-444444444444'::uuid, 'TEST-104-PROGRESS', 'c1111111-1111-1111-1111-111111111111'::uuid, 'Seat repair', 'Seat cushion replacement needed', 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
    ('b5555555-5555-5555-5555-555555555555'::uuid, 'TEST-105-PROGRESS', 'c2222222-2222-2222-2222-222222222222'::uuid, 'Turn signal fix', 'Right turn signal not working', 2, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day')
  ) AS v(ticket_id, ticket_num, customer_id, complaint, description, priority, assigned_time, created_time)
) sub;

-- =================================================================
-- 5. VERIFICATION AND SUMMARY
-- =================================================================

-- Clean up temp tables
DROP TABLE temp_existing_users;
DROP TABLE temp_floor_manager;
DROP TABLE temp_location;

SELECT '✅ Mock Data Created Successfully Using Existing Users!' as status;
SELECT '' as spacer;

SELECT 'SERVICE TICKETS SUMMARY:' as report_title;
SELECT 
  status,
  CASE WHEN assigned_to IS NULL THEN 'Unassigned' ELSE 'Assigned' END as assignment_status,
  COUNT(*) as ticket_count,
  AVG(priority) as avg_priority
FROM service_tickets 
WHERE ticket_number LIKE 'TEST-%'
GROUP BY status, assigned_to IS NULL
ORDER BY status;

SELECT '' as spacer;
SELECT 'PRIORITY BREAKDOWN:' as report_title;
SELECT 
  priority,
  CASE priority 
    WHEN 1 THEN 'HIGH' 
    WHEN 2 THEN 'MEDIUM' 
    WHEN 3 THEN 'LOW' 
  END as priority_label,
  COUNT(*) as count
FROM service_tickets 
WHERE ticket_number LIKE 'TEST-%'
GROUP BY priority 
ORDER BY priority;

SELECT '' as spacer;
SELECT 'RECENT TICKETS (Last 24 Hours):' as report_title;
SELECT 
  ticket_number,
  customer_complaint,
  status,
  priority,
  CASE WHEN assigned_to IS NULL THEN 'Unassigned' ELSE 'Assigned' END as assignment,
  created_at
FROM service_tickets 
WHERE ticket_number LIKE 'TEST-%'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

SELECT '' as spacer;
SELECT '🎯 FLOOR MANAGER TEST SCENARIOS READY:' as scenarios_title;
SELECT '1. Unassigned tickets waiting for assignment (7 tickets)' as scenario_1;
SELECT '2. Various priority levels for testing sorting' as scenario_2;
SELECT '3. Mix of recent and older tickets' as scenario_3;
SELECT '4. Already assigned tickets to test workload management' as scenario_4;
SELECT '5. Test customers with realistic service requests' as scenario_5;

SELECT '' as spacer;
SELECT '⚡ NEXT STEPS:' as next_steps_title;
SELECT '1. Set USE_MOCK_API=false in .env.local' as step_1;
SELECT '2. Test Floor Manager ticket assignment features' as step_2;
SELECT '3. Verify workload balancing algorithms' as step_3;
SELECT '4. Test priority-based assignment logic' as step_4;
