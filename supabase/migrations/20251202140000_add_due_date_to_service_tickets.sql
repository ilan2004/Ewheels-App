-- Add due_date column to service_tickets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'service_tickets'
        AND column_name = 'due_date'
    ) THEN
        ALTER TABLE service_tickets ADD COLUMN due_date TIMESTAMPTZ;
    END IF;
END $$;
