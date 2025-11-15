-- EvWheels Mobile App Database Schema Setup
-- Run this script in your Supabase SQL Editor to set up the required tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Locations table (for multi-location support)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID, -- Reference to auth.users
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    location_id UUID REFERENCES locations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. App roles table (for role-based access control)
CREATE TABLE IF NOT EXISTS app_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'front_desk_manager', 'floor_manager', 'technician', 'customer')),
    location_id UUID REFERENCES locations(id),
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role, location_id)
);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    location_id UUID REFERENCES locations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vehicle information (optional, can be part of service tickets)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    registration_number VARCHAR(50) UNIQUE,
    chassis_number VARCHAR(100),
    motor_number VARCHAR(100),
    battery_type VARCHAR(100),
    location_id UUID REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Service tickets table (main job cards)
CREATE TABLE IF NOT EXISTS service_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_reg_no VARCHAR(50), -- Denormalized for quick access
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    customer_complaint TEXT NOT NULL,
    description TEXT,
    symptom TEXT, -- Same as customer_complaint, for compatibility
    status VARCHAR(50) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'triaged', 'assigned', 'in_progress', 'completed', 'delivered', 'closed', 'cancelled', 'on_hold', 'waiting_approval')),
    priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1=High, 2=Medium, 3=Low
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    triage_notes TEXT,
    resolution_notes TEXT,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    location_id UUID REFERENCES locations(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- 7. Battery records table (for battery-specific tracking)
CREATE TABLE IF NOT EXISTS battery_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_ticket_id UUID REFERENCES service_tickets(id) ON DELETE CASCADE,
    battery_serial VARCHAR(100),
    battery_type VARCHAR(100),
    voltage DECIMAL(5, 2),
    capacity DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'received' CHECK (status IN ('received', 'diagnosed', 'in_progress', 'completed', 'delivered')),
    diagnosis TEXT,
    repair_notes TEXT,
    test_results TEXT,
    location_id UUID REFERENCES locations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Ticket attachments table (for photos, documents, etc.)
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    attachment_type VARCHAR(50) CHECK (attachment_type IN ('photo', 'audio', 'document')),
    thumbnail_path TEXT,
    duration INTEGER, -- For audio files (in seconds)
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT false
);

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'status_change', 'overdue', 'new_ticket', 'priority_change')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ticket_id UUID REFERENCES service_tickets(id),
    ticket_number VARCHAR(100),
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_customer_id ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_location_id ON service_tickets(location_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_due_date ON service_tickets(due_date);
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON customers(location_id);
CREATE INDEX IF NOT EXISTS idx_battery_records_status ON battery_records(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 11. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create triggers for updated_at columns
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_service_tickets_updated_at BEFORE UPDATE ON service_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_battery_records_updated_at BEFORE UPDATE ON battery_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Row Level Security (RLS) policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these based on your needs)

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- App roles: Users can view their own roles
CREATE POLICY "Users can view their own roles" ON app_roles FOR SELECT USING (auth.uid() = user_id);

-- Service tickets: Basic access (customize based on your role logic)
CREATE POLICY "Authenticated users can view service tickets" ON service_tickets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create service tickets" ON service_tickets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update service tickets" ON service_tickets FOR UPDATE USING (auth.role() = 'authenticated');

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Insert some default data
-- Default location
INSERT INTO locations (id, name, address, city, state, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Service Center', '123 Main Street', 'Mumbai', 'Maharashtra', true)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'EvWheels database schema setup completed successfully!' AS status;
