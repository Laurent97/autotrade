-- Check the check constraint on order_tracking table
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%order_tracking_status_check%';

-- Check the table definition for status column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'order_tracking' 
AND column_name = 'status';

-- Check existing status values in the table
SELECT DISTINCT status FROM order_tracking ORDER BY status;

-- Check if there are any ENUM types defined
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%order_tracking%' 
OR t.typname LIKE '%tracking_status%'
ORDER BY enum_name, enumlabel;

-- Alternative: Check all constraints on order_tracking table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.order_tracking'::regclass
ORDER BY conname;
