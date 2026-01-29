-- Fix the foreign key constraint issue for store_visits
-- The error shows partner_id is not present in table "users"

-- Step 1: Check what the current foreign key constraint is pointing to
SELECT
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'store_visits';

-- Step 2: Check if the user actually exists in the users table
SELECT id, email, user_type FROM users WHERE id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 3: Drop the incorrect foreign key constraint
ALTER TABLE store_visits DROP CONSTRAINT IF EXISTS store_visits_partner_id_fkey;

-- Step 4: Add the correct foreign key constraint pointing to users table
ALTER TABLE store_visits 
ADD CONSTRAINT store_visits_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Verify the fix worked
SELECT
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'store_visits';

-- Step 6: Now try to insert test visits
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  '33235e84-d175-4d35-a260-1037ca5cfd0c',
  'test_visit_' || generate_series || '_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  '/store',
  floor(random() * 300 + 60),
  NOW() - (generate_series || ' minutes')::INTERVAL
FROM generate_series(1, 25);

-- Step 7: Verify the data was inserted
SELECT 
  COUNT(*) as visit_count,
  MIN(created_at) as earliest_visit,
  MAX(created_at) as latest_visit
FROM store_visits 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';
