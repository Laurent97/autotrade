-- Link remaining partner profiles to users
-- This script helps connect the 15 unlinked partner profiles to their user accounts

-- ========================================
-- 1. SHOW UNLINKED PARTNER PROFILES
-- ========================================
SELECT 
  'Unlinked Partner Profiles' as info,
  pp.id as profile_id,
  pp.store_name,
  pp.store_email,
  pp.created_at
FROM partner_profiles pp
WHERE pp.user_id IS NULL
ORDER BY pp.created_at;

-- ========================================
-- 2. SHOW POTENTIAL USER MATCHES
-- ========================================
SELECT 
  'Potential User Matches' as info,
  pp.id as profile_id,
  pp.store_name as profile_store,
  pp.store_email as profile_email,
  u.id as user_id,
  u.email as user_email,
  u.full_name as user_name,
  u.user_type,
  CASE 
    WHEN LOWER(pp.store_email) = LOWER(u.email) THEN '✅ EMAIL MATCH'
    WHEN LOWER(pp.store_name) = LOWER(u.full_name) THEN '📝 NAME MATCH'
    ELSE '❌ NO MATCH'
  END as match_status
FROM partner_profiles pp
CROSS JOIN users u
WHERE pp.user_id IS NULL 
  AND u.user_type = 'partner'
  AND (
    LOWER(pp.store_email) = LOWER(u.email) 
    OR LOWER(pp.store_name) = LOWER(u.full_name)
  )
ORDER BY pp.id, match_status DESC;

-- ========================================
-- 3. AUTO-LINK BASED ON EMAIL MATCHES
-- ========================================
DO $$
DECLARE
  linked_count INTEGER := 0;
BEGIN
  -- Update profiles where store_email matches user email
  UPDATE partner_profiles pp
  SET user_id = u.id
  FROM users u
  WHERE pp.user_id IS NULL
    AND u.user_type = 'partner'
    AND LOWER(pp.store_email) = LOWER(u.email);
    
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  IF linked_count > 0 THEN
    RAISE NOTICE '✅ Auto-linked % profiles based on email matches', linked_count;
  ELSE
    RAISE NOTICE 'ℹ️ No automatic email matches found';
  END IF;
END $$;

-- ========================================
-- 4. AUTO-LINK BASED ON NAME MATCHES
-- ========================================
DO $$
DECLARE
  linked_count INTEGER := 0;
BEGIN
  -- Update profiles where store_name matches user full_name (only if still unlinked)
  UPDATE partner_profiles pp
  SET user_id = u.id
  FROM users u
  WHERE pp.user_id IS NULL
    AND u.user_type = 'partner'
    AND LOWER(pp.store_name) = LOWER(u.full_name);
    
  GET DIAGNOSTICS linked_count = ROW_COUNT;
  
  IF linked_count > 0 THEN
    RAISE NOTICE '✅ Auto-linked % profiles based on name matches', linked_count;
  ELSE
    RAISE NOTICE 'ℹ️ No automatic name matches found';
  END IF;
END $$;

-- ========================================
-- 5. FINAL STATUS AFTER AUTO-LINKING
-- ========================================
SELECT 
  'Final Status After Auto-Linking' as info,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked_to_users,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as still_unlinked,
  ROUND(
    (COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 2
  ) as percentage_linked
FROM partner_profiles;

-- ========================================
-- 6. SHOW REMAINING UNLINKED PROFILES (if any)
-- ========================================
SELECT 
  'Still Unlinked Profiles' as info,
  pp.id as profile_id,
  pp.store_name,
  pp.store_email,
  'Manual linking required' as action_needed
FROM partner_profiles pp
WHERE pp.user_id IS NULL
ORDER BY pp.created_at;
