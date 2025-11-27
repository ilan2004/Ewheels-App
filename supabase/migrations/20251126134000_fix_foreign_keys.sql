-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE public.service_tickets 
DROP CONSTRAINT IF EXISTS service_tickets_battery_case_id_fkey;

-- Step 2: Update service_tickets.battery_case_id to point to actual battery_case.id
UPDATE public.service_tickets st
SET battery_case_id = bc.id
FROM public.battery_cases bc
WHERE st.battery_case_id IS NOT NULL
  AND bc.battery_record_id = st.battery_case_id
  AND bc.service_ticket_id = st.id;

-- Step 3: Add the correct foreign key constraint pointing to battery_cases
ALTER TABLE public.service_tickets
ADD CONSTRAINT service_tickets_battery_case_id_fkey 
FOREIGN KEY (battery_case_id) 
REFERENCES public.battery_cases(id) 
ON DELETE SET NULL;

-- Step 4: Do the same for vehicle_case_id if needed
ALTER TABLE public.service_tickets 
DROP CONSTRAINT IF EXISTS service_tickets_vehicle_case_id_fkey;

ALTER TABLE public.service_tickets
ADD CONSTRAINT service_tickets_vehicle_case_id_fkey 
FOREIGN KEY (vehicle_case_id) 
REFERENCES public.vehicle_cases(id) 
ON DELETE SET NULL;
