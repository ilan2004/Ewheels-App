-- Disable RLS temporarily to allow all operations
ALTER TABLE IF EXISTS public.battery_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicle_cases DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.battery_cases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.battery_cases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.battery_cases;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicle_cases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.vehicle_cases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.vehicle_cases;

-- Note: RLS is now DISABLED on both tables
-- This allows authenticated users to access all data
-- You can re-enable RLS later with proper policies if needed
