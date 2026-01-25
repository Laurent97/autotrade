-- Quick fix for invitation codes - Create working codes immediately

-- First, let's check what's currently in partner_profiles
SELECT store_id, store_name, invitation_code, referral_code, partner_status, is_active
FROM partner_profiles 
WHERE invitation_code IS NOT NULL OR referral_code IS NOT NULL
LIMIT 10;

-- Create a simple admin partner profile if it doesn't exist
INSERT INTO partner_profiles (
    id,
    user_id,
    store_id,
    store_name,
    store_description,
    partner_status,
    is_active,
    invitation_code,
    referral_code,
    referral_bonus_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    COALESCE((SELECT id FROM auth.users LIMIT 1), gen_random_uuid()),
    'ADMIN001',
    'AutoTradeHub Admin',
    'System administrator account for managing partner invitations',
    'approved',
    true,
    'ADMIN2025',
    'ADMIN2025',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM partner_profiles WHERE store_id = 'ADMIN001');

-- Create a public parent profile if it doesn't exist
INSERT INTO partner_profiles (
    id,
    user_id,
    store_id,
    store_name,
    store_description,
    partner_status,
    is_active,
    invitation_code,
    referral_code,
    referral_bonus_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    COALESCE((SELECT id FROM auth.users LIMIT 1), gen_random_uuid()),
    'PARENT',
    'Parent Invitation',
    'Parent invitation code for general use',
    'approved',
    true,
    'PARENT2025',
    'PARENT2025',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM partner_profiles WHERE store_id = 'PARENT');

-- Create additional public codes
INSERT INTO partner_profiles (
    id,
    user_id,
    store_id,
    store_name,
    store_description,
    partner_status,
    is_active,
    invitation_code,
    referral_code,
    referral_bonus_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    COALESCE((SELECT id FROM auth.users LIMIT 1), gen_random_uuid()),
    'WELCOME',
    'Welcome Code',
    'Public welcome invitation code',
    'approved',
    true,
    'WELCOME2025',
    'WELCOME2025',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM partner_profiles WHERE store_id = 'WELCOME');

-- Show all available invitation codes
SELECT 
    store_id,
    store_name,
    invitation_code,
    referral_code,
    partner_status,
    is_active,
    referral_bonus_active,
    created_at
FROM partner_profiles 
WHERE invitation_code IS NOT NULL 
  AND partner_status = 'approved' 
  AND is_active = true
ORDER BY store_id;

-- Test the validation query that the form uses
SELECT 
    store_id, 
    store_name, 
    store_logo, 
    referral_bonus_active,
    'Test successful' as test_result
FROM partner_profiles 
WHERE (store_id = 'ADMIN2025' OR referral_code = 'ADMIN2025' OR invitation_code = 'ADMIN2025')
  AND partner_status = 'approved'
  AND is_active = true;

-- Test public codes
SELECT 
    store_id, 
    store_name, 
    store_logo, 
    referral_bonus_active,
    'Test successful' as test_result
FROM partner_profiles 
WHERE (store_id = 'PARENT2025' OR referral_code = 'PARENT2025' OR invitation_code = 'PARENT2025')
  AND partner_status = 'approved'
  AND is_active = true;
