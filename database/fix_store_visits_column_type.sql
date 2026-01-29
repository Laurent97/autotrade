-- Fix store_visits column type from integer to jsonb
-- This script resolves the "invalid input syntax for type integer" error

-- ========================================
-- 1. CHECK CURRENT store_visits COLUMN TYPE
-- ========================================
SELECT 
  'Current store_visits Column' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND column_name = 'store_visits';

-- ========================================
-- 2. BACKUP EXISTING DATA (if any)
-- ========================================
CREATE TEMPORARY TABLE IF NOT EXISTS store_visits_backup AS
SELECT 
  id,
  store_visits,
  created_at
FROM partner_profiles 
WHERE store_visits IS NOT NULL;

SELECT 
  'Backup Created' as info,
  COUNT(*) as backed_up_records
FROM store_visits_backup;

-- ========================================
-- 3. DROP THE INCORRECT COLUMN
-- ========================================
DO $$
BEGIN
  -- Check if column exists and is wrong type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' 
      AND column_name = 'store_visits'
      AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE partner_profiles DROP COLUMN IF EXISTS store_visits;
  END IF;
END $$;

-- ========================================
-- 4. ADD CORRECT jsonb COLUMN
-- ========================================
-- Add store_visits column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS store_visits jsonb DEFAULT '{"today": 0, "thisWeek": 0, "thisMonth": 0, "allTime": 0}'::jsonb;

-- ========================================
-- 5. VERIFY THE FIX
-- ========================================
SELECT 
  'Fixed store_visits Column' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND column_name = 'store_visits';

-- ========================================
-- 6. TEST THE COLUMN WITH SAMPLE DATA
-- ========================================
UPDATE partner_profiles 
SET store_visits = '{"today": 50, "thisWeek": 200, "thisMonth": 800, "allTime": 5000}'::jsonb
WHERE id = (
  SELECT id FROM partner_profiles LIMIT 1
);

SELECT 
  'Test Update' as info,
  store_visits,
  store_visits->>'today' as today_visits,
  store_visits->>'thisWeek' as this_week_visits,
  (store_visits->>'today')::integer as today_visits_integer
FROM partner_profiles 
WHERE store_visits IS NOT NULL
LIMIT 1;

-- ========================================
-- 7. CLEAN UP BACKUP
-- ========================================
DROP TABLE IF EXISTS store_visits_backup;
