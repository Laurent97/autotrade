-- Fix missing foreign key relationship in partner_profiles table
-- This script adds the missing foreign key constraint: partner_profiles.user_id → users.id

-- First, check if the foreign key already exists
SELECT 
  'user_id foreign key check' as status,
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'partner_profiles' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  ) as exists_status;

-- Add the missing foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'partner_profiles' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE partner_profiles 
    ADD CONSTRAINT fk_partner_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint: partner_profiles.user_id → users.id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists: partner_profiles.user_id → users.id';
  END IF;
END $$;

-- Verify the fix
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
  AND tc.table_name = 'partner_profiles'
ORDER BY kcu.column_name;
