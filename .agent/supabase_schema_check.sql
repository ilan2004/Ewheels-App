-- ============================================
-- SUPABASE SCHEMA AND RLS CHECK SCRIPT
-- ============================================
-- Run this in your Supabase SQL Editor to check your database schema

-- 1. Check if profiles table exists and its schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if app_roles table exists and its schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'app_roles'
ORDER BY ordinal_position;

-- 3. Check if locations table exists and its schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'locations'
ORDER BY ordinal_position;

-- 4. Check if user_locations table exists and its schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_locations'
ORDER BY ordinal_position;

-- 5. Check RLS policies on profiles table
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
WHERE tablename = 'profiles';

-- 6. Check RLS policies on app_roles table
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
WHERE tablename = 'app_roles';

-- 7. Check RLS policies on user_locations table
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
WHERE tablename = 'user_locations';

-- 8. Check if RLS is enabled on these tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'app_roles', 'user_locations', 'locations');

-- 9. List all locations (branches)
SELECT * FROM locations;

-- 10. Check existing user roles
SELECT DISTINCT role FROM app_roles;
