-- Nullify battery_case_id in service_tickets if the referenced battery_case does not exist
UPDATE public.service_tickets
SET battery_case_id = NULL
WHERE battery_case_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.battery_cases
    WHERE public.battery_cases.id = public.service_tickets.battery_case_id
);

-- Nullify vehicle_case_id in service_tickets if the referenced vehicle_case does not exist
UPDATE public.service_tickets
SET vehicle_case_id = NULL
WHERE vehicle_case_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.vehicle_cases
    WHERE public.vehicle_cases.id = public.service_tickets.vehicle_case_id
);
