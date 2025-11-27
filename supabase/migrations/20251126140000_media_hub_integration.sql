-- Migration: Media Hub Integration with Ticket Attachments
-- Date: 2025-11-26
-- Purpose: Enable Media Hub media to be assigned to job cards as intake media

-- 1. Add tracking columns to media_items table
ALTER TABLE media_items
ADD COLUMN IF NOT EXISTS ticket_attachment_id UUID REFERENCES ticket_attachments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assigned_to_ticket_at TIMESTAMP WITH TIME ZONE;

-- 2. Ensure ticket_attachments has source column
ALTER TABLE ticket_attachments
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'internal' 
  CHECK (source IN ('internal', 'media_hub'));

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_items_ticket_attachment 
ON media_items(ticket_attachment_id);

CREATE INDEX IF NOT EXISTS idx_media_items_ticket_id 
ON media_items(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_source 
ON ticket_attachments(source);

-- 4. Add comment for documentation
COMMENT ON COLUMN media_items.ticket_attachment_id IS 
'Links to ticket_attachments when media is assigned from Media Hub to a job card';

COMMENT ON COLUMN ticket_attachments.source IS 
'Source of attachment: internal (direct upload) or media_hub (assigned from Media Hub)';

-- 5. Update RLS policies to allow cross-table access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "ticket_attachments_select_policy" ON ticket_attachments;
DROP POLICY IF EXISTS "ticket_attachments_insert_policy" ON ticket_attachments;
DROP POLICY IF EXISTS "ticket_attachments_delete_policy" ON ticket_attachments;

-- Users can view ticket_attachments for tickets they have access to
CREATE POLICY "ticket_attachments_select_policy"
ON ticket_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_tickets t
    WHERE t.id = ticket_id
    AND (
      t.created_by = auth.uid() 
      OR t.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM app_roles ar
        WHERE ar.user_id = auth.uid()
        AND ar.role IN ('admin', 'floor_manager', 'front_desk_manager')
      )
    )
  )
);

-- Users can insert ticket_attachments for tickets they created or are assigned to
CREATE POLICY "ticket_attachments_insert_policy"
ON ticket_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_tickets t
    WHERE t.id = ticket_id
    AND (
      t.created_by = auth.uid() 
      OR t.assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM app_roles ar
        WHERE ar.user_id = auth.uid()
        AND ar.role IN ('admin', 'floor_manager', 'front_desk_manager')
      )
    )
  )
);

-- Users can delete ticket_attachments they uploaded
CREATE POLICY "ticket_attachments_delete_policy"
ON ticket_attachments FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM app_roles ar
    WHERE ar.user_id = auth.uid()
    AND ar.role IN ('admin', 'floor_manager')
  )
);
