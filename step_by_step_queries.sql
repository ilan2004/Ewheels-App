-- Step-by-step Database Analysis
-- Run these queries ONE BY ONE in Supabase SQL Editor

-- QUERY 1: Check what tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- QUERY 2: Service tickets table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_tickets'
ORDER BY ordinal_position;

-- QUERY 3: Check if service_tickets has assignment columns
SELECT 
  column_name,
  CASE WHEN column_name IN ('assigned_to', 'assigned_at', 'assigned_by', 'due_date', 'created_by', 'updated_by') 
       THEN 'FLOOR_MANAGER_COLUMN' 
       ELSE 'OTHER' 
  END as column_type
FROM information_schema.columns
WHERE table_name = 'service_tickets'
AND column_name IN ('assigned_to', 'assigned_at', 'assigned_by', 'due_date', 'created_by', 'updated_by')
ORDER BY column_name;

-- QUERY 4: Check complaint column name
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'service_tickets'
AND column_name IN ('customer_complaint', 'symptom');
