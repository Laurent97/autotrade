-- Disable email confirmation for instant sign-up access
-- Run this in your Supabase SQL Editor

-- Update auth.users to disable email confirmation requirement
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Alternatively, you can disable email confirmation in Supabase Dashboard:
-- 1. Go to Authentication -> Settings
-- 2. Find "Enable email confirmations" 
-- 3. Toggle it OFF
-- 4. Save changes

-- This query ensures all existing users are marked as verified
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email_confirmed_at IS NULL;
