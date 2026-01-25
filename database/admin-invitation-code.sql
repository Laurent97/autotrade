-- Create parent invitation code for admin use

-- First, let's check if there are any existing approved partners
SELECT id, store_id, store_name, partner_status, is_active 
FROM partner_profiles 
WHERE partner_status = 'approved' AND is_active = true
LIMIT 5;

-- If no approved partners exist, create a system admin partner profile first
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email = 'admin@autotradehub.com' LIMIT 1),
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
) ON CONFLICT (store_id) DO NOTHING;

-- Verify the admin invitation code was created
SELECT store_id, store_name, invitation_code, referral_code, partner_status, is_active
FROM partner_profiles 
WHERE store_id = 'ADMIN001' OR invitation_code = 'ADMIN2025';

-- Create a simple parent invitation code that can be used by anyone
-- This will be a fallback code that doesn't require a specific referrer
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
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM auth.users WHERE email = 'system@autotradehub.com' LIMIT 1),
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
) ON CONFLICT (store_id) DO NOTHING;

-- Verify the parent invitation code
SELECT store_id, store_name, invitation_code, referral_code, partner_status, is_active
FROM partner_profiles 
WHERE store_id = 'PARENT' OR invitation_code = 'PARENT2025';

-- Show all available invitation codes
SELECT 
    store_id,
    store_name,
    invitation_code,
    referral_code,
    partner_status,
    is_active,
    referral_bonus_active
FROM partner_profiles 
WHERE invitation_code IS NOT NULL 
  AND partner_status = 'approved' 
  AND is_active = true
ORDER BY store_id;
