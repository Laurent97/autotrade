-- Check partner_products table structure to identify the correct column names
-- This will help us fix the RPC function error

-- Check the actual structure of partner_products table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data to understand the actual column structure
SELECT 
  'Sample Data' as info,
  *
FROM partner_profiles 
LIMIT 1;

-- Check if there's an RPC function that needs to be fixed
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc 
WHERE proname = 'get_partner_products'
LIMIT 1;
