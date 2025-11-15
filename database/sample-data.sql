-- EvWheels Sample Data Script
-- Run this AFTER setting up the schema to populate with test data
-- Make sure you have created at least one user account via Supabase Auth first

-- Note: You'll need to replace 'YOUR_USER_ID' with actual UUIDs from auth.users table
-- You can get user IDs by running: SELECT id, email FROM auth.users;

-- 1. Insert sample customers
INSERT INTO customers (id, name, email, phone, address, city, state, location_id, created_by) VALUES
('10000000-0000-0000-0000-000000000001', 'Rajesh Kumar', 'rajesh.kumar@gmail.com', '+91 9876543210', '123 MG Road', 'Mumbai', 'Maharashtra', '00000000-0000-0000-0000-000000000001', auth.uid()),
('10000000-0000-0000-0000-000000000002', 'Priya Sharma', 'priya.sharma@gmail.com', '+91 8765432109', '456 Park Street', 'Mumbai', 'Maharashtra', '00000000-0000-0000-0000-000000000001', auth.uid()),
('10000000-0000-0000-0000-000000000003', 'Amit Patel', 'amit.patel@gmail.com', '+91 7654321098', '789 Ring Road', 'Mumbai', 'Maharashtra', '00000000-0000-0000-0000-000000000001', auth.uid()),
('10000000-0000-0000-0000-000000000004', 'Sneha Reddy', 'sneha.reddy@gmail.com', '+91 6543210987', '321 Brigade Road', 'Mumbai', 'Maharashtra', '00000000-0000-0000-0000-000000000001', auth.uid()),
('10000000-0000-0000-0000-000000000005', 'Vikram Singh', 'vikram.singh@gmail.com', '+91 5432109876', '654 Commercial Street', 'Mumbai', 'Maharashtra', '00000000-0000-0000-0000-000000000001', auth.uid())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert sample vehicles
INSERT INTO vehicles (id, customer_id, make, model, year, registration_number, chassis_number, battery_type, location_id) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Hero Electric', 'Optima', 2023, 'MH01AB1234', 'HE2023OP001', 'Lithium Ion 48V', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Ather Energy', '450X', 2023, 'MH02CD5678', 'AT2023450X002', 'Lithium Ion 60V', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'TVS Motor', 'iQube Electric', 2022, 'MH03EF9012', 'TVS2022IQ003', 'Lithium Ion 48V', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Bajaj Auto', 'Chetak', 2023, 'MH04GH3456', 'BJ2023CH004', 'Lithium Ion 60V', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Ola Electric', 'S1 Pro', 2023, 'MH05IJ7890', 'OLA2023S1005', 'Lithium Ion 72V', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert sample service tickets
-- You'll need to replace auth.uid() with actual user IDs from your auth.users table
INSERT INTO service_tickets (
    id, 
    ticket_number, 
    customer_id, 
    vehicle_id, 
    vehicle_reg_no, 
    vehicle_make, 
    vehicle_model, 
    customer_complaint, 
    symptom,
    description,
    status, 
    priority, 
    due_date, 
    location_id, 
    created_by,
    created_at
) VALUES
-- Overdue tickets (for testing overdue filter)
('30000000-0000-0000-0000-000000000001', 'EV-2024-001001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'MH01AB1234', 'Hero Electric', 'Optima', 'Battery not charging properly', 'Battery not charging properly', 'Customer reports battery not holding charge', 'reported', 1, CURRENT_TIMESTAMP - INTERVAL '2 days', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '5 days'),

('30000000-0000-0000-0000-000000000002', 'EV-2024-001002', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'MH02CD5678', 'Ather Energy', '450X', 'Motor making grinding noise', 'Motor making grinding noise', 'Unusual noise from motor during operation', 'assigned', 1, CURRENT_TIMESTAMP - INTERVAL '1 day', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Due today tickets (for testing today filter)
('30000000-0000-0000-0000-000000000003', 'EV-2024-001003', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'MH03EF9012', 'TVS Motor', 'iQube Electric', 'Brake system malfunction', 'Brake system malfunction', 'Brake pedal feels spongy and ineffective', 'in_progress', 1, CURRENT_TIMESTAMP + INTERVAL '2 hours', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '1 day'),

('30000000-0000-0000-0000-000000000004', 'EV-2024-001004', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'MH04GH3456', 'Bajaj Auto', 'Chetak', 'Display screen flickering', 'Display screen flickering', 'Instrument cluster display intermittently flickers', 'triaged', 2, CURRENT_TIMESTAMP + INTERVAL '8 hours', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '2 hours'),

-- Unassigned tickets (for testing unassigned filter)
('30000000-0000-0000-0000-000000000005', 'EV-2024-001005', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'MH05IJ7890', 'Ola Electric', 'S1 Pro', 'Throttle response delayed', 'Throttle response delayed', 'Acceleration is sluggish and unresponsive', 'reported', 2, CURRENT_TIMESTAMP + INTERVAL '2 days', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '1 hour'),

('30000000-0000-0000-0000-000000000006', 'EV-2024-001006', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'MH01AB1234', 'Hero Electric', 'Optima', 'Headlight not working', 'Headlight not working', 'Front headlight completely dead', 'reported', 3, CURRENT_TIMESTAMP + INTERVAL '5 days', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '30 minutes'),

-- In progress tickets (for testing in_progress filter)
('30000000-0000-0000-0000-000000000007', 'EV-2024-001007', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'MH02CD5678', 'Ather Energy', '450X', 'Horn not functioning', 'Horn not functioning', 'Horn button pressed but no sound', 'in_progress', 3, CURRENT_TIMESTAMP + INTERVAL '3 days', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '6 hours'),

-- Completed tickets
('30000000-0000-0000-0000-000000000008', 'EV-2024-001008', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'MH03EF9012', 'TVS Motor', 'iQube Electric', 'Seat adjustment broken', 'Seat adjustment broken', 'Seat height adjustment mechanism stuck', 'completed', 3, CURRENT_TIMESTAMP + INTERVAL '1 day', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '2 days'),

('30000000-0000-0000-0000-000000000009', 'EV-2024-001009', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'MH04GH3456', 'Bajaj Auto', 'Chetak', 'Mirror loose and vibrating', 'Mirror loose and vibrating', 'Rearview mirror vibrates excessively during ride', 'completed', 2, CURRENT_TIMESTAMP - INTERVAL '1 day', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '4 days'),

('30000000-0000-0000-0000-000000000010', 'EV-2024-001010', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'MH05IJ7890', 'Ola Electric', 'S1 Pro', 'USB charging port dead', 'USB charging port dead', 'Mobile charging port not providing power', 'assigned', 3, CURRENT_TIMESTAMP + INTERVAL '4 days', '00000000-0000-0000-0000-000000000001', auth.uid(), CURRENT_TIMESTAMP - INTERVAL '8 hours')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert sample battery records for some service tickets
INSERT INTO battery_records (
    id,
    service_ticket_id,
    battery_serial,
    battery_type,
    voltage,
    capacity,
    status,
    diagnosis,
    location_id,
    created_by
) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'HE48V001234', 'Lithium Ion 48V', 48.0, 30.5, 'diagnosed', 'Cell imbalance detected, requires recalibration', '00000000-0000-0000-0000-000000000001', auth.uid()),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'TVS48V005678', 'Lithium Ion 48V', 48.2, 28.8, 'in_progress', 'BMS replacement in progress', '00000000-0000-0000-0000-000000000001', auth.uid()),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', 'AT60V009012', 'Lithium Ion 60V', 60.1, 45.2, 'completed', 'Battery tested and calibrated successfully', '00000000-0000-0000-0000-000000000001', auth.uid())
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Sample data inserted successfully!' AS status;

-- Display summary of inserted data
SELECT 'Data Summary:' as info;
SELECT COUNT(*) as total_customers FROM customers;
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as total_service_tickets FROM service_tickets;
SELECT COUNT(*) as total_battery_records FROM battery_records;
SELECT status, COUNT(*) as count FROM service_tickets GROUP BY status ORDER BY status;
