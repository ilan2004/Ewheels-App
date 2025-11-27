-- Check if RLS is enabled on battery_cases
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('battery_cases', 'vehicle_cases');

-- Check existing policies on battery_cases
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('battery_cases', 'vehicle_cases')
ORDER BY tablename, policyname;
