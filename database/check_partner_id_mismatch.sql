-- Check for partner ID mismatch between admin panel and partner dashboard
-- This will help identify why store visits are not showing up

-- Step 1: Check all users and their IDs
SELECT 
    id,
    email,
    user_type,
    created_at,
    CASE 
        WHEN user_type = 'partner' THEN '🏪 PARTNER'
        WHEN user_type = 'admin' THEN '🔧 ADMIN'
        ELSE '👤 USER'
    END as user_category
FROM users 
ORDER BY user_type, created_at DESC;

-- Step 2: Check partner profiles and their user_id references
SELECT 
    pp.id as profile_id,
    pp.user_id,
    pp.store_name,
    pp.is_active,
    u.email,
    u.user_type,
    CASE 
        WHEN pp.user_id = u.id THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as id_match
FROM partner_profiles pp
LEFT JOIN users u ON pp.user_id = u.id
ORDER BY pp.created_at DESC;

-- Step 3: Check store_visits and their partner_id references
SELECT 
    sv.id as visit_id,
    sv.partner_id,
    sv.visitor_id,
    sv.page_visited,
    sv.created_at,
    u.email as partner_email,
    u.user_type,
    CASE 
        WHEN sv.partner_id = u.id THEN '✅ Valid Partner'
        ELSE '❌ Invalid Partner'
    END as partner_validity
FROM store_visits sv
LEFT JOIN users u ON sv.partner_id = u.id
ORDER BY sv.created_at DESC
LIMIT 20;

-- Step 4: Check visit_distribution and their partner_id references
SELECT 
    vd.id as distribution_id,
    vd.partner_id,
    vd.total_visits,
    vd.total_distributed,
    vd.is_active,
    u.email as partner_email,
    u.user_type,
    CASE 
        WHEN vd.partner_id = u.id THEN '✅ Valid Partner'
        ELSE '❌ Invalid Partner'
    END as partner_validity
FROM visit_distribution vd
LEFT JOIN users u ON vd.partner_id = u.id
ORDER BY vd.created_at DESC;

-- Step 5: Find the specific partner causing issues
-- This checks for the ID mentioned in the error logs
WITH target_partner AS (
    SELECT '33235e84-d175-4d35-a260-1037ca5cfd0c'::uuid as target_id
)
SELECT 
    'USER CHECK' as check_type,
    u.id,
    u.email,
    u.user_type,
    CASE 
        WHEN u.id = (SELECT target_id FROM target_partner) THEN '🎯 TARGET PARTNER'
        ELSE 'OTHER USER'
    END as is_target
FROM users u
WHERE u.id = (SELECT target_id FROM target_partner)

UNION ALL

SELECT 
    'PARTNER PROFILE CHECK' as check_type,
    pp.user_id,
    pp.store_name as email,
    'partner' as user_type,
    CASE 
        WHEN pp.user_id = (SELECT target_id FROM target_partner) THEN '🎯 TARGET PROFILE'
        ELSE 'OTHER PROFILE'
    END as is_target
FROM partner_profiles pp
WHERE pp.user_id = (SELECT target_id FROM target_partner)

UNION ALL

SELECT 
    'STORE VISITS CHECK' as check_type,
    sv.partner_id,
    COUNT(*)::text as email,
    'visits' as user_type,
    CASE 
        WHEN sv.partner_id = (SELECT target_id FROM target_partner) THEN '🎯 TARGET VISITS'
        ELSE 'OTHER VISITS'
    END as is_target
FROM store_visits sv
WHERE sv.partner_id = (SELECT target_id FROM target_partner)
GROUP BY sv.partner_id

UNION ALL

SELECT 
    'VISIT DISTRIBUTION CHECK' as check_type,
    vd.partner_id,
    vd.total_visits::text as email,
    'distribution' as user_type,
    CASE 
        WHEN vd.partner_id = (SELECT target_id FROM target_partner) THEN '🎯 TARGET DISTRIBUTION'
        ELSE 'OTHER DISTRIBUTION'
    END as is_target
FROM visit_distribution vd
WHERE vd.partner_id = (SELECT target_id FROM target_partner);

-- Step 6: Check if there are multiple partner IDs for the same email
SELECT 
    u.email,
    COUNT(u.id) as id_count,
    ARRAY_AGG(u.id) as all_ids,
    ARRAY_AGG(u.user_type) as all_types
FROM users u
WHERE u.email IN (
    SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
)
GROUP BY u.email
ORDER BY id_count DESC;

-- Step 7: Get the actual partner ID that should be used
-- This shows what ID the partner dashboard is likely using
SELECT 
    'PARTNER DASHBOARD ID' as info_type,
    u.id as dashboard_user_id,
    u.email,
    u.user_type,
    pp.store_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM store_visits sv WHERE sv.partner_id = u.id) 
        THEN '✅ Has Visits'
        ELSE '❌ No Visits'
    END as visit_status
FROM users u
LEFT JOIN partner_profiles pp ON u.id = pp.user_id
WHERE u.user_type = 'partner'
ORDER BY u.created_at DESC;
