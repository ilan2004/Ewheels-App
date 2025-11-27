-- Add vehicle_record_id to vehicle_cases table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vehicle_cases' 
        AND column_name = 'vehicle_record_id'
    ) THEN
        ALTER TABLE vehicle_cases 
        ADD COLUMN vehicle_record_id UUID REFERENCES vehicle_records(id);
    END IF;
END $$;

-- Add battery_record_id to battery_cases table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'battery_cases' 
        AND column_name = 'battery_record_id'
    ) THEN
        ALTER TABLE battery_cases 
        ADD COLUMN battery_record_id UUID REFERENCES battery_records(id);
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_vehicle_record_id ON vehicle_cases(vehicle_record_id);
CREATE INDEX IF NOT EXISTS idx_battery_cases_battery_record_id ON battery_cases(battery_record_id);
