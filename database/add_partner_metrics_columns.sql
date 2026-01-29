-- Add missing columns to partner_profiles table
-- Run this script in Supabase SQL Editor to fix the schema

-- Add store_visits column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS store_visits jsonb DEFAULT '{"today": 0, "thisWeek": 0, "thisMonth": 0, "allTime": 0}'::jsonb;

-- Add store_credit_score column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS store_credit_score integer DEFAULT 750;

-- Add store_rating column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS store_rating numeric(3,2) DEFAULT 0.0;

-- Add total_products column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS total_products integer DEFAULT 0;

-- Add active_products column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS active_products integer DEFAULT 0;

-- Add commission_rate column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS commission_rate numeric(5,4) DEFAULT 0.1000;

-- Add is_verified column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add is_active column if it doesn't exist
ALTER TABLE partner_profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'partner_profiles' 
  AND column_name IN (
    'store_visits', 'store_credit_score', 'store_rating', 
    'total_products', 'active_products', 'commission_rate',
    'is_verified', 'is_active'
  )
ORDER BY column_name;
