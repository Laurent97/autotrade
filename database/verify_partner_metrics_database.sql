-- Comprehensive Database Verification for Partner Metrics Modal
-- Run this script in Supabase SQL Editor to verify all required tables and columns

-- ========================================
-- 1. CHECK PARTNER_PROFILES TABLE
-- ========================================

-- Check if partner_profiles table exists
SELECT 
  'partner_profiles table' as item,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'partner_profiles' AND table_schema = 'public'
  ) as exists_status
UNION ALL

-- Check all required columns in partner_profiles
SELECT 
  'store_visits column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'store_visits'
  ) as exists_status
UNION ALL
SELECT 
  'store_credit_score column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'store_credit_score'
  ) as exists_status
UNION ALL
SELECT 
  'store_rating column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'store_rating'
  ) as exists_status
UNION ALL
SELECT 
  'total_products column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'total_products'
  ) as exists_status
UNION ALL
SELECT 
  'active_products column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'active_products'
  ) as exists_status
UNION ALL
SELECT 
  'commission_rate column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'commission_rate'
  ) as exists_status
UNION ALL
SELECT 
  'is_verified column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'is_verified'
  ) as exists_status
UNION ALL
SELECT 
  'is_active column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'is_active'
  ) as exists_status

-- ========================================
-- 2. CHECK USERS TABLE
-- ========================================
UNION ALL
SELECT 
  'users table' as item,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users' AND table_schema = 'public'
  ) as exists_status
UNION ALL
SELECT 
  'users.id column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id'
  ) as exists_status
UNION ALL
SELECT 
  'users.email column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) as exists_status
UNION ALL
SELECT 
  'users.full_name column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) as exists_status
UNION ALL
SELECT 
  'users.user_type column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) as exists_status
UNION ALL
SELECT 
  'users.partner_status column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'partner_status'
  ) as exists_status

-- ========================================
-- 3. CHECK WALLET_BALANCES TABLE
-- ========================================
UNION ALL
SELECT 
  'wallet_balances table' as item,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wallet_balances' AND table_schema = 'public'
  ) as exists_status
UNION ALL
SELECT 
  'wallet_balances.user_id column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_balances' AND column_name = 'user_id'
  ) as exists_status
UNION ALL
SELECT 
  'wallet_balances.balance column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_balances' AND column_name = 'balance'
  ) as exists_status

-- ========================================
-- 4. CHECK VISIT_DISTRIBUTION TABLE
-- ========================================
UNION ALL
SELECT 
  'visit_distribution table' as item,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'visit_distribution' AND table_schema = 'public'
  ) as exists_status
UNION ALL
SELECT 
  'visit_distribution.partner_id column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_distribution' AND column_name = 'partner_id'
  ) as exists_status
UNION ALL
SELECT 
  'visit_distribution.total_visits column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_distribution' AND column_name = 'total_visits'
  ) as exists_status
UNION ALL
SELECT 
  'visit_distribution.time_period column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_distribution' AND column_name = 'time_period'
  ) as exists_status
UNION ALL
SELECT 
  'visit_distribution.visits_per_unit column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_distribution' AND column_name = 'visits_per_unit'
  ) as exists_status
UNION ALL
SELECT 
  'visit_distribution.is_active column' as item,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visit_distribution' AND column_name = 'is_active'
  ) as exists_status;

-- ========================================
-- 5. DETAILED COLUMN INFORMATION
-- ========================================

-- Get detailed information about partner_profiles columns
SELECT 
  'partner_profiles' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND table_schema = 'public'
  AND column_name IN (
    'store_visits', 'store_credit_score', 'store_rating', 
    'total_products', 'active_products', 'commission_rate',
    'is_verified', 'is_active'
  )
ORDER BY column_name;

-- ========================================
-- 6. SAMPLE DATA VERIFICATION
-- ========================================

-- Check if there are any partner users
SELECT 
  'Partner Users Count' as metric,
  COUNT(*) as count
FROM users 
WHERE user_type = 'partner';

-- Check if there are any partner profiles
SELECT 
  'Partner Profiles Count' as metric,
  COUNT(*) as count
FROM partner_profiles;

-- Check sample partner profile data
SELECT 
  'Sample Partner Profile' as info,
  json_build_object(
    'id', id,
    'user_id', user_id,
    'store_name', store_name,
    'has_store_visits', store_visits IS NOT NULL,
    'has_credit_score', store_credit_score IS NOT NULL,
    'has_rating', store_rating IS NOT NULL,
    'has_products', total_products IS NOT NULL,
    'has_commission', commission_rate IS NOT NULL,
    'is_verified', is_verified,
    'is_active', is_active
  ) as data
FROM partner_profiles 
LIMIT 1;

-- ========================================
-- 7. RELATIONSHIP VERIFICATION
-- ========================================

-- Check foreign key relationships
SELECT 
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
  AND tc.table_name IN ('partner_profiles', 'wallet_balances', 'visit_distribution')
ORDER BY tc.table_name, kcu.column_name;
