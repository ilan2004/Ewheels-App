-- Simple Database Schema Check
-- This will give us the essential info needed for mock data creation

-- 1. Check what tables exist
SELECT 'EXISTING TABLES:' as info, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('service_tickets', 'profiles', 'app_roles', 'customers', 'locations', 'user_locations', 'technician_settings')
ORDER BY tablename;

-- 2. Service tickets table structure
SELECT 'SERVICE_TICKETS COLUMNS:' as info, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_tickets'
ORDER BY ordinal_position;

-- 3. Check for the complaint column name
SELECT 'COMPLAINT COLUMN CHECK:' as info, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'customer_complaint') 
            THEN 'customer_complaint' 
            WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'symptom')
            THEN 'symptom'
            ELSE 'neither found'
       END as complaint_column_name;

-- 4. Check assignment columns
SELECT 'ASSIGNMENT COLUMNS:' as info,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'assigned_to') as has_assigned_to,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'assigned_at') as has_assigned_at,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'assigned_by') as has_assigned_by,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'due_date') as has_due_date,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'created_by') as has_created_by;

-- 5. Check status enum values
SELECT 'STATUS ENUM VALUES:' as info, 
       array_agg(e.enumlabel ORDER BY e.enumsortorder) as status_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'service_ticket_status';

-- 6. Current locations
SELECT 'EXISTING LOCATIONS:' as info, id, name, code 
FROM locations 
LIMIT 5;

-- 7. Current users and roles
SELECT 'EXISTING USERS:' as info, ar.user_id, ar.role, p.username, p.email
FROM app_roles ar
LEFT JOIN profiles p ON ar.user_id = p.user_id
LIMIT 10;

-- 8. Current service tickets sample
SELECT 'EXISTING TICKETS:' as info, id, ticket_number, status, 
       CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'service_tickets' AND column_name = 'customer_complaint') 
            THEN customer_complaint 
            ELSE 'no complaint column'
       END as complaint
FROM service_tickets 
LIMIT 5;
