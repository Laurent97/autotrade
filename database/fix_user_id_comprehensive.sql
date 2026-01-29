-- Comprehensive Fix for user_id column and foreign key in partner_profiles
-- This script handles all scenarios for the missing user_id relationship

-- ========================================
-- 1. CHECK IF user_id COLUMN EXISTS
-- ========================================
SELECT 
  'user_id Column Check' as step,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'partner_profiles' AND column_name = 'user_id'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- ========================================
-- 2. ADD user_id COLUMN IF MISSING
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'user_id'
  ) THEN
    -- Add user_id column
    ALTER TABLE partner_profiles 
    ADD COLUMN user_id UUID;
    
    RAISE NOTICE '✅ Added user_id column to partner_profiles';
    
    -- Try to populate user_id from existing data if possible
    -- This assumes there might be existing data that needs linking
    UPDATE partner_profiles 
    SET user_id = (
      SELECT u.id 
      FROM users u 
      WHERE u.email = partner_profiles.store_email 
      LIMIT 1
    ) 
    WHERE user_id IS NULL AND store_email IS NOT NULL;
    
    RAISE NOTICE '🔄 Attempted to populate user_id from existing data';
  ELSE
    RAISE NOTICE 'ℹ️ user_id column already exists';
  END IF;
END $$;

-- ========================================
-- 3. CHECK FOR ORPHANED DATA (user_id values that don't exist in users)
-- ========================================
SELECT 
  'Orphaned Data Check' as step,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as profiles_with_user_id,
  COUNT(CASE WHEN user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = partner_profiles.user_id
  ) THEN 1 END) as orphaned_user_ids
FROM partner_profiles;

-- ========================================
-- 4. CLEAN UP ORPHANED DATA (set to NULL if user doesn't exist)
-- ========================================
DO $$
BEGIN
  -- Update orphaned user_id values to NULL
  UPDATE partner_profiles 
  SET user_id = NULL 
  WHERE user_id IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM users WHERE users.id = partner_profiles.user_id
    );
    
  IF FOUND THEN
    RAISE NOTICE '🧹 Cleaned up orphaned user_id values';
  END IF;
END $$;

-- ========================================
-- 5. ADD FOREIGN KEY CONSTRAINT
-- ========================================
DO $$
BEGIN
  -- Check if foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'partner_profiles' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE partner_profiles 
    ADD CONSTRAINT fk_partner_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ SUCCESS: Added foreign key constraint partner_profiles.user_id → users.id';
  ELSE
    RAISE NOTICE 'ℹ️ Foreign key constraint already exists for user_id';
  END IF;
END $$;

-- ========================================
-- 6. FINAL VERIFICATION
-- ========================================
SELECT 
  'Final Verification' as step,
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ COMPLETE' as status
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
-- 7. TEST THE RELATIONSHIP
-- ========================================
SELECT 
  'Relationship Test' as step,
  COUNT(*) as partner_profiles_count,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_to_users,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as not_linked
FROM partner_profiles;
