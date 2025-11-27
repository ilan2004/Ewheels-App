-- Fix service_tickets.battery_case_id to point to actual battery_case.id instead of battery_record_id
-- This updates tickets where battery_case_id currently points to a battery_record instead of a battery_case

UPDATE public.service_tickets st
SET battery_case_id = bc.id
FROM public.battery_cases bc
WHERE st.battery_case_id IS NOT NULL
  AND bc.battery_record_id = st.battery_case_id
  AND bc.service_ticket_id = st.id;

-- Verify the fix
SELECT 
  st.ticket_number,
  st.battery_case_id as "Ticket's battery_case_id",
  bc.id as "Actual battery_case.id",
  bc.battery_record_id as "battery_record_id"
FROM public.service_tickets st
LEFT JOIN public.battery_cases bc ON bc.service_ticket_id = st.id
WHERE st.battery_case_id IS NOT NULL
ORDER BY st.created_at DESC
LIMIT 10;
