-- Complete fix for store_visits table issues
-- This script will fix foreign key, RLS policies, and ensure proper structure

-- Step 1: Drop existing foreign key constraint (if it exists)
ALTER TABLE store_visits DROP CONSTRAINT IF EXISTS store_visits_partner_id_fkey;

-- Step 2: Add correct foreign key constraint pointing to users table
ALTER TABLE store_visits 
ADD CONSTRAINT store_visits_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Enable RLS if not already enabled
ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Admins and partners can insert visit records" ON store_visits;
DROP POLICY IF EXISTS "Admins and partners can view visit records" ON store_visits;
DROP POLICY IF EXISTS "Admins and partners can update visit records" ON store_visits;
DROP POLICY IF EXISTS "Admins can delete visit records" ON store_visits;

-- Step 5: Create comprehensive RLS policies
-- Policy for authenticated users to insert visits (for the distribution system)
CREATE POLICY "Enable visit insertion" ON store_visits
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for authenticated users to view visits
CREATE POLICY "Enable visit viewing" ON store_visits
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for authenticated users to update visits
CREATE POLICY "Enable visit updates" ON store_visits
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type IN ('admin', 'partner')
    )
  );

-- Policy for admins to delete visits
CREATE POLICY "Enable visit deletion" ON store_visits
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Step 6: Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_visits' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Test query (replace with actual user_id)
-- Uncomment and replace with actual user_id to test
-- SELECT * FROM store_visits WHERE partner_id = 'your-user-id-here' LIMIT 5;
