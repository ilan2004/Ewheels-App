-- Create a function to check if the current user belongs to a specific location
CREATE OR REPLACE FUNCTION public.is_user_in_location(location_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the user is an admin
  IF EXISTS (
    SELECT 1 FROM public.app_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if the user has an entry in user_locations for the given location_id
  RETURN EXISTS (
    SELECT 1
    FROM public.user_locations ul
    WHERE ul.user_id = auth.uid()
    AND ul.location_id = location_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on key tables
ALTER TABLE public.vehicle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- Assuming service_tickets exists based on foreign keys
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for Vehicle Records
CREATE POLICY "Users can view vehicle records of their branch"
ON public.vehicle_records
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert vehicle records into their branch"
ON public.vehicle_records
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update vehicle records of their branch"
ON public.vehicle_records
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete vehicle records of their branch"
ON public.vehicle_records
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Battery Records
CREATE POLICY "Users can view battery records of their branch"
ON public.battery_records
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert battery records into their branch"
ON public.battery_records
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update battery records of their branch"
ON public.battery_records
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete battery records of their branch"
ON public.battery_records
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Customers
CREATE POLICY "Users can view customers of their branch"
ON public.customers
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert customers into their branch"
ON public.customers
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update customers of their branch"
ON public.customers
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete customers of their branch"
ON public.customers
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Invoices
CREATE POLICY "Users can view invoices of their branch"
ON public.invoices
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert invoices into their branch"
ON public.invoices
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update invoices of their branch"
ON public.invoices
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete invoices of their branch"
ON public.invoices
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Inventory Items
CREATE POLICY "Users can view inventory items of their branch"
ON public.inventory_items
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert inventory items into their branch"
ON public.inventory_items
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update inventory items of their branch"
ON public.inventory_items
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete inventory items of their branch"
ON public.inventory_items
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Sales
CREATE POLICY "Users can view sales of their branch"
ON public.sales
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert sales into their branch"
ON public.sales
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update sales of their branch"
ON public.sales
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete sales of their branch"
ON public.sales
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Expenses
CREATE POLICY "Users can view expenses of their branch"
ON public.expenses
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert expenses into their branch"
ON public.expenses
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update expenses of their branch"
ON public.expenses
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete expenses of their branch"
ON public.expenses
FOR DELETE
USING (public.is_user_in_location(location_id));

-- Create policies for Service Tickets
CREATE POLICY "Users can view service tickets of their branch"
ON public.service_tickets
FOR SELECT
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can insert service tickets into their branch"
ON public.service_tickets
FOR INSERT
WITH CHECK (public.is_user_in_location(location_id));

CREATE POLICY "Users can update service tickets of their branch"
ON public.service_tickets
FOR UPDATE
USING (public.is_user_in_location(location_id));

CREATE POLICY "Users can delete service tickets of their branch"
ON public.service_tickets
FOR DELETE
USING (public.is_user_in_location(location_id));
