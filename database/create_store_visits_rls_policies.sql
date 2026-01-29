-- Add RLS policies for store_visits table
-- This allows the visit distribution system to insert visit records

-- Enable RLS if not already enabled
ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

-- Policy for admins and partners to insert visit records
CREATE POLICY "Admins and partners can insert visit records" ON store_visits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for admins and partners to view all visit records
CREATE POLICY "Admins and partners can view visit records" ON store_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for admins and partners to update visit records
CREATE POLICY "Admins and partners can update visit records" ON store_visits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for admins to delete visit records
CREATE POLICY "Admins can delete visit records" ON store_visits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );
