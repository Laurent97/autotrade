-- Comprehensive debugging and fix script for store visits issue
-- Run this step by step in Supabase SQL Editor

-- Step 1: Check if the partner exists and get their ID
SELECT id, email, user_type FROM users WHERE id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 2: Check if there are any visit distributions for this partner
SELECT * FROM visit_distribution WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 3: Check if there are any store visits for this partner
SELECT COUNT(*) as total_visits FROM store_visits WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 4: Check RLS policies on store_visits table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'store_visits';

-- Step 5: Check if RLS is enabled on store_visits
SELECT relname, relrowsecurity, relforcerowsecurity 
FROM pg_class 
WHERE relname = 'store_visits';

-- Step 6: Test manual insertion (this should work if permissions are correct)
INSERT INTO store_visits (
  partner_id, 
  visitor_id, 
  page_visited, 
  session_duration, 
  created_at
) VALUES (
  '33235e84-d175-4d35-a260-1037ca5cfd0c',
  'test_manual_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  '/store',
  120,
  NOW()
);

-- Step 7: Verify the test insertion worked
SELECT * FROM store_visits WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 8: If the above worked, let's add some sample visits for testing
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  '33235e84-d175-4d35-a260-1037ca5cfd0c',
  'sample_' || generate_series || '_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  '/store',
  floor(random() * 300 + 60),
  NOW() - (generate_series || ' minutes')::INTERVAL
FROM generate_series(1, 50);

-- Step 9: Check final count
SELECT COUNT(*) as total_visits, MIN(created_at) as earliest, MAX(created_at) as latest
FROM store_visits 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 10: Update visit distribution if it exists
UPDATE visit_distribution 
SET total_distributed = 50,
    last_distribution = NOW(),
    updated_at = NOW()
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c' AND is_active = true;
