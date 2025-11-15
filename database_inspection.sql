-- Database Inspection Script
-- Run this in Supabase SQL Editor to understand current schema and data
-- This will help us create the perfect mock data script

-- =================================================================
-- 1. BASIC TABLE EXISTENCE CHECK
-- =================================================================
SELECT '=== TABLE EXISTENCE CHECK ===' as section;

SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =================================================================
-- 2. SERVICE_TICKETS TABLE DETAILED ANALYSIS
-- =================================================================
SELECT '=== SERVICE_TICKETS TABLE SCHEMA ===' as section;

-- Check if service_tickets table exists and get its structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tickets') THEN
    RAISE NOTICE 'service_tickets table EXISTS';
  ELSE
    RAISE NOTICE 'service_tickets table does NOT exist';
  END IF;
END $$;

-- Get all columns for service_tickets table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'service_tickets'
ORDER BY ordinal_position;

-- Check for indexes on service_tickets
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'service_tickets';

-- Sample existing data from service_tickets (if any)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tickets') THEN
    EXECUTE 'SELECT ''=== SAMPLE SERVICE_TICKETS DATA ==='' as section';
    EXECUTE 'SELECT id, ticket_number, status, priority, created_at, assigned_to, assigned_at FROM service_tickets LIMIT 5';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query service_tickets: %', SQLERRM;
END $$;

-- =================================================================
-- 3. PROFILES TABLE ANALYSIS
-- =================================================================
SELECT '=== PROFILES TABLE SCHEMA ===' as section;

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Sample profiles data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    EXECUTE 'SELECT ''=== SAMPLE PROFILES DATA ==='' as section';
    EXECUTE 'SELECT user_id, username, email, first_name, last_name FROM profiles LIMIT 5';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query profiles: %', SQLERRM;
END $$;

-- =================================================================
-- 4. APP_ROLES TABLE ANALYSIS
-- =================================================================
SELECT '=== APP_ROLES TABLE SCHEMA ===' as section;

-- Check app_roles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'app_roles'
ORDER BY ordinal_position;

-- Sample app_roles data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_roles') THEN
    EXECUTE 'SELECT ''=== SAMPLE APP_ROLES DATA ==='' as section';
    EXECUTE 'SELECT user_id, role, created_at FROM app_roles LIMIT 10';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query app_roles: %', SQLERRM;
END $$;

-- =================================================================
-- 5. LOCATIONS TABLE ANALYSIS
-- =================================================================
SELECT '=== LOCATIONS TABLE SCHEMA ===' as section;

-- Check locations table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;

-- Sample locations data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    EXECUTE 'SELECT ''=== SAMPLE LOCATIONS DATA ==='' as section';
    EXECUTE 'SELECT id, name, code, is_active FROM locations';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query locations: %', SQLERRM;
END $$;

-- =================================================================
-- 6. USER_LOCATIONS TABLE ANALYSIS
-- =================================================================
SELECT '=== USER_LOCATIONS TABLE SCHEMA ===' as section;

-- Check user_locations table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_locations'
ORDER BY ordinal_position;

-- Sample user_locations data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_locations') THEN
    EXECUTE 'SELECT ''=== SAMPLE USER_LOCATIONS DATA ==='' as section';
    EXECUTE 'SELECT user_id, location_id FROM user_locations LIMIT 10';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query user_locations: %', SQLERRM;
END $$;

-- =================================================================
-- 7. CUSTOMERS TABLE ANALYSIS
-- =================================================================
SELECT '=== CUSTOMERS TABLE SCHEMA ===' as section;

-- Check customers table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Sample customers data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    EXECUTE 'SELECT ''=== SAMPLE CUSTOMERS DATA ==='' as section';
    EXECUTE 'SELECT id, name, contact, email, location_id FROM customers LIMIT 5';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query customers: %', SQLERRM;
END $$;

-- =================================================================
-- 8. TECHNICIAN_SETTINGS TABLE ANALYSIS
-- =================================================================
SELECT '=== TECHNICIAN_SETTINGS TABLE SCHEMA ===' as section;

-- Check technician_settings table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'technician_settings'
ORDER BY ordinal_position;

-- Sample technician_settings data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technician_settings') THEN
    EXECUTE 'SELECT ''=== SAMPLE TECHNICIAN_SETTINGS DATA ==='' as section';
    EXECUTE 'SELECT user_id, max_capacity FROM technician_settings';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not query technician_settings: %', SQLERRM;
END $$;

-- =================================================================
-- 9. CHECK FOR ENUMS/TYPES
-- =================================================================
SELECT '=== CUSTOM TYPES AND ENUMS ===' as section;

SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%status%' OR t.typname LIKE '%role%'
GROUP BY t.typname;

-- =================================================================
-- 10. FOREIGN KEY RELATIONSHIPS
-- =================================================================
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name IN ('service_tickets', 'profiles', 'app_roles', 'customers', 'locations', 'user_locations', 'technician_settings'))
ORDER BY tc.table_name, tc.constraint_name;

-- =================================================================
-- 11. ROW LEVEL SECURITY STATUS
-- =================================================================
SELECT '=== ROW LEVEL SECURITY STATUS ===' as section;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('service_tickets', 'profiles', 'app_roles', 'customers', 'locations', 'user_locations', 'technician_settings')
ORDER BY tablename;

-- =================================================================
-- 12. EXISTING POLICIES
-- =================================================================
SELECT '=== EXISTING RLS POLICIES ===' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =================================================================
-- 13. CURRENT USER DATA SUMMARY
-- =================================================================
SELECT '=== CURRENT DATA SUMMARY ===' as section;

-- Count existing users by role
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_roles') THEN
    EXECUTE 'SELECT ''User counts by role:'' as info';
    EXECUTE 'SELECT role, COUNT(*) as count FROM app_roles GROUP BY role ORDER BY role';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not count users by role';
END $$;

-- Count existing service tickets by status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tickets') THEN
    EXECUTE 'SELECT ''Service tickets by status:'' as info';
    EXECUTE 'SELECT status, COUNT(*) as count FROM service_tickets GROUP BY status ORDER BY status';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not count service tickets by status';
END $$;

-- =================================================================
-- 14. AUTH.USERS INSIGHT (if accessible)
-- =================================================================
SELECT '=== AUTH.USERS INFORMATION ===' as section;

DO $$
BEGIN
  -- Try to get some info about auth.users if accessible
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    EXECUTE 'SELECT ''Total users in auth.users:'' as info, COUNT(*) as count FROM auth.users';
    EXECUTE 'SELECT ''Sample auth user IDs:'' as info';
    EXECUTE 'SELECT id, email, created_at FROM auth.users LIMIT 3';
  ELSE
    RAISE NOTICE 'auth.users table not accessible or does not exist';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Cannot access auth.users: %', SQLERRM;
END $$;

-- =================================================================
-- FINAL MESSAGE
-- =================================================================
SELECT '=== INSPECTION COMPLETE ===' as section;
SELECT 'Analysis complete! Use this information to create tailored mock data.' as message;
