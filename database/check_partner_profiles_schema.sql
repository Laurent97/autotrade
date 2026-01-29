-- Check partner_profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
ORDER BY ordinal_position;

-- Check if there are any missing columns we need
SELECT 
  'store_visits' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'store_visits'
  ) as exists_in_table
UNION ALL
SELECT 
  'store_credit_score' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'store_credit_score'
  ) as exists_in_table
UNION ALL
SELECT 
  'store_rating' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'store_rating'
  ) as exists_in_table
UNION ALL
SELECT 
  'total_products' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'total_products'
  ) as exists_in_table
UNION ALL
SELECT 
  'active_products' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'active_products'
  ) as exists_in_table
UNION ALL
SELECT 
  'commission_rate' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'commission_rate'
  ) as exists_in_table
UNION ALL
SELECT 
  'is_verified' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'is_verified'
  ) as exists_in_table
UNION ALL
SELECT 
  'is_active' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_profiles' AND column_name = 'is_active'
  ) as exists_in_table;
