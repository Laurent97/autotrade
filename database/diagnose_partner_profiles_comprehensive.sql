-- Comprehensive Diagnosis for partner_profiles table
-- This script checks everything needed for the partner metrics modal

-- ========================================
-- 1. CHECK IF partner_profiles TABLE EXISTS
-- ========================================
SELECT 
  'Table Exists' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'partner_profiles' AND table_schema = 'public'
    ) THEN '✅ YES'
    ELSE '❌ NO'
  END as status;

-- ========================================
-- 2. CHECK ALL COLUMNS IN partner_profiles
-- ========================================
SELECT 
  'Columns in partner_profiles' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- 3. CHECK SPECIFIC REQUIRED COLUMNS
-- ========================================
SELECT 
  'Required Columns Check' as check_type,
  column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'partner_profiles' AND column_name = column_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (VALUES 
  ('user_id'),
  ('store_visits'),
  ('store_credit_score'),
  ('store_rating'),
  ('total_products'),
  ('active_products'),
  ('commission_rate'),
  ('is_verified'),
  ('is_active'),
  ('referred_by')
) AS required_columns(column_name);

-- ========================================
-- 4. CHECK ALL FOREIGN KEY CONSTRAINTS
-- ========================================
SELECT 
  'Foreign Keys' as check_type,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'partner_profiles'
ORDER BY kcu.column_name;

-- ========================================
-- 5. CHECK SAMPLE DATA
-- ========================================
SELECT 
  'Sample Data' as check_type,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as profiles_with_user_id,
  COUNT(CASE WHEN store_visits IS NOT NULL THEN 1 END) as profiles_with_visits,
  COUNT(CASE WHEN store_credit_score IS NOT NULL THEN 1 END) as profiles_with_credit_score
FROM partner_profiles;

-- ========================================
-- 6. CHECK IF user_id COLUMN HAS REFERENCES
-- ========================================
SELECT 
  'user_id References Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'partner_profiles' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN '✅ FOREIGN KEY EXISTS'
    ELSE '❌ NO FOREIGN KEY'
  END as status;

-- ========================================
-- 7. ATTEMPT TO ADD MISSING FOREIGN KEY (if needed)
-- ========================================
DO $$
BEGIN
  -- First check if user_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'user_id'
  ) THEN
    -- Check if foreign key already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'partner_profiles' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN
      -- Add the foreign key
      EXECUTE 'ALTER TABLE partner_profiles ADD CONSTRAINT fk_partner_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE';
      RAISE NOTICE '✅ SUCCESS: Added foreign key constraint partner_profiles.user_id → users.id';
    ELSE
      RAISE NOTICE 'ℹ️ INFO: Foreign key constraint already exists for user_id';
    END IF;
  ELSE
    RAISE NOTICE '❌ ERROR: user_id column does not exist in partner_profiles table';
  END IF;
END $$;

-- ========================================
-- 8. FINAL VERIFICATION
-- ========================================
SELECT 
  'Final Status' as check_type,
  'All foreign keys after fix attempt' as description,
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
  AND tc.table_name = 'partner_profiles'
ORDER BY kcu.column_name;
