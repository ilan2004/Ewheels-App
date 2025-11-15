-- Fix missing columns and relationships in service_tickets table

-- 1. Add missing due_date column
ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- 2. Add comment for due_date
COMMENT ON COLUMN service_tickets.due_date IS 'Expected completion date for the service ticket';

-- 3. Create foreign key relationship for created_by -> profiles.user_id
-- First, let's make sure we have the profiles table structure
-- (This assumes you have a profiles table with user_id as primary key)

-- Add foreign key constraint for created_by
ALTER TABLE service_tickets
ADD CONSTRAINT fk_service_tickets_created_by 
FOREIGN KEY (created_by) REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- 4. Add foreign key constraint for updated_by
ALTER TABLE service_tickets
ADD CONSTRAINT fk_service_tickets_updated_by 
FOREIGN KEY (updated_by) REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- 5. Add foreign key constraint for triaged_by
ALTER TABLE service_tickets
ADD CONSTRAINT fk_service_tickets_triaged_by 
FOREIGN KEY (triaged_by) REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- 6. Add foreign key constraint for assigned_to
ALTER TABLE service_tickets
ADD CONSTRAINT fk_service_tickets_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- 7. Add foreign key constraint for assigned_by
ALTER TABLE service_tickets
ADD CONSTRAINT fk_service_tickets_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES profiles(user_id)
ON DELETE SET NULL;

-- 8. Add indexes for better performance on foreign key columns
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_by ON service_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_service_tickets_updated_by ON service_tickets(updated_by);
CREATE INDEX IF NOT EXISTS idx_service_tickets_triaged_by ON service_tickets(triaged_by);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_by ON service_tickets(assigned_by);
CREATE INDEX IF NOT EXISTS idx_service_tickets_due_date ON service_tickets(due_date);

-- 9. Update existing records to set a default due_date if needed
-- This sets due_date to 7 days from created_at for records that don't have it
UPDATE service_tickets 
SET due_date = created_at + INTERVAL '7 days'
WHERE due_date IS NULL;

-- 10. Add check constraint to ensure due_date is after created_at
ALTER TABLE service_tickets
ADD CONSTRAINT chk_due_date_after_created 
CHECK (due_date IS NULL OR due_date >= created_at);

-- Optional: Add some comments for better documentation
COMMENT ON CONSTRAINT fk_service_tickets_created_by ON service_tickets IS 'Links to the user who created the service ticket';
COMMENT ON CONSTRAINT fk_service_tickets_assigned_to ON service_tickets IS 'Links to the technician assigned to work on the ticket';
