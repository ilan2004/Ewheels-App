-- Enable RLS on battery_cases
ALTER TABLE IF EXISTS public.battery_cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.battery_cases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.battery_cases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.battery_cases;

-- Create policy for battery_cases
CREATE POLICY "Enable read access for all users" ON public.battery_cases FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.battery_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.battery_cases FOR UPDATE USING (true);

-- Also fix vehicle_cases just in case
ALTER TABLE IF EXISTS public.vehicle_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicle_cases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.vehicle_cases;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.vehicle_cases;

CREATE POLICY "Enable read access for all users" ON public.vehicle_cases FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.vehicle_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.vehicle_cases FOR UPDATE USING (true);
