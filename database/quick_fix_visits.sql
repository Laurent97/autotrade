-- Quick fix for store visits issue
-- This addresses the most common problems

-- 1. Ensure RLS is enabled and policies are correct
ALTER TABLE store_visits ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Enable visit insertion" ON store_visits;
DROP POLICY IF EXISTS "Enable visit viewing" ON store_visits;
DROP POLICY IF EXISTS "Enable visit updates" ON store_visits;
DROP POLICY IF EXISTS "Enable visit deletion" ON store_visits;

-- 3. Create simple, permissive policies for testing
CREATE POLICY "Allow all operations on store_visits" ON store_visits
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Add some test visits for the specific partner
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  '33235e84-d175-4d35-a260-1037ca5cfd0c',
  'test_visit_' || generate_series || '_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  '/store',
  floor(random() * 300 + 60),
  NOW() - (generate_series || ' minutes')::INTERVAL
FROM generate_series(1, 25)
ON CONFLICT DO NOTHING;

-- 5. Verify the data was inserted
SELECT 
  COUNT(*) as visit_count,
  MIN(created_at) as earliest_visit,
  MAX(created_at) as latest_visit
FROM store_visits 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';
