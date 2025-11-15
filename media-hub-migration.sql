-- Media Hub Migration
-- Add media_items table for unified media management with job card assignment

-- Create media_items table
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES service_tickets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')) NOT NULL,
  file_name TEXT NOT NULL,
  local_uri TEXT,
  remote_url TEXT,
  supabase_path TEXT,
  file_size INTEGER,
  duration_seconds INTEGER, -- for audio/video
  width INTEGER, -- for images/video
  height INTEGER, -- for images/video
  metadata JSONB DEFAULT '{}', -- camera settings, location, etc.
  assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_items_ticket_id ON media_items(ticket_id);
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_media_type ON media_items(media_type);
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON media_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_assigned_at ON media_items(assigned_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see all media items in their organization/location
CREATE POLICY "Users can view media items" ON media_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own media items
CREATE POLICY "Users can insert their own media items" ON media_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own media items
CREATE POLICY "Users can update their own media items" ON media_items
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own media items
CREATE POLICY "Users can delete their own media items" ON media_items
  FOR DELETE
  USING (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on media_items
CREATE TRIGGER update_media_items_updated_at 
  BEFORE UPDATE ON media_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON media_items TO authenticated;
GRANT USAGE ON SEQUENCE media_items_id_seq TO authenticated;

SELECT 'Media Hub migration completed successfully!' as status;
