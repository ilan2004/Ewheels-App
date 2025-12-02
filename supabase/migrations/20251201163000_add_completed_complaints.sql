-- Add completed_complaints column to service_tickets table
ALTER TABLE service_tickets 
ADD COLUMN IF NOT EXISTS completed_complaints text[] DEFAULT '{}';

-- Comment on column
COMMENT ON COLUMN service_tickets.completed_complaints IS 'List of customer complaints that have been addressed/completed';
