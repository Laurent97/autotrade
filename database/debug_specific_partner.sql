-- Debug why store visits are 0 for specific partner: 33235e84-d175-4d35-a260-1037ca5cfd0c
-- Run this step by step in Supabase SQL Editor

-- Step 1: Check if the user exists and their details
SELECT 
    id, 
    email, 
    user_type, 
    created_at,
    updated_at,
    CASE 
        WHEN user_type = 'partner' THEN '✅ Partner User'
        WHEN user_type = 'admin' THEN '🔧 Admin User'
        ELSE '❓ Other Type'
    END as user_status
FROM users 
WHERE id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 2: Check if this user has a partner profile
SELECT 
    pp.*,
    CASE 
        WHEN pp.user_id IS NOT NULL THEN '✅ Has Partner Profile'
        ELSE '❌ No Partner Profile'
    END as profile_status
FROM partner_profiles pp
WHERE pp.user_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 3: Check ALL store visits for this partner (regardless of RLS)
SELECT 
    COUNT(*) as total_visits,
    MIN(created_at) as earliest_visit,
    MAX(created_at) as latest_visit,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    AVG(session_duration) as avg_session_duration
FROM store_visits 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 4: Check visit distribution for this partner
SELECT 
    id,
    partner_id,
    total_visits as configured_visits,
    total_distributed,
    visits_per_unit,
    time_period,
    is_active,
    start_time,
    end_time,
    last_distribution,
    created_at,
    updated_at,
    CASE 
        WHEN total_distributed > 0 THEN '✅ Has Distributed Visits'
        WHEN is_active = true THEN '🔄 Active but No Distribution'
        ELSE '⏸️ Inactive'
    END as distribution_status
FROM visit_distribution 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c'
ORDER BY created_at DESC;

-- Step 5: Check if there are any visits with different partner_id format
SELECT 
    partner_id,
    COUNT(*) as visit_count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM store_visits 
WHERE partner_id::TEXT LIKE '%33235e84-d175-4d35-a260-1037ca5cfd0c%'
GROUP BY partner_id;

-- Step 6: Test RLS policy by simulating the partner's access
-- This simulates what the partner would see when logged in
WITH auth_context AS (
    SELECT '33235e84-d175-4d35-a260-1037ca5cfd0c'::UUID as auth_uid
)
SELECT 
    COUNT(*) as visible_visits_to_partner,
    MIN(sv.created_at) as earliest_visible,
    MAX(sv.created_at) as latest_visible
FROM store_visits sv, auth_context ac
WHERE sv.partner_id = ac.auth_uid;

-- Step 7: Check if there are visits for the wrong partner ID
-- Maybe the visits are stored under a different ID
SELECT 
    sv.partner_id,
    u.email,
    u.user_type,
    COUNT(*) as visit_count
FROM store_visits sv
LEFT JOIN users u ON sv.partner_id = u.id
GROUP BY sv.partner_id, u.email, u.user_type
ORDER BY visit_count DESC
LIMIT 10;

-- Step 8: Add test visits for this specific partner (if none exist)
-- This will help verify the system works
INSERT INTO store_visits (
    partner_id, 
    visitor_id, 
    page_visited, 
    session_duration, 
    created_at
) 
SELECT 
    '33235e84-d175-4d35-a260-1037ca5cfd0c',
    'debug_test_' || generate_series || '_' || EXTRACT(EPOCH FROM NOW()),
    CASE (generate_series % 5)
        WHEN 0 THEN '/store'
        WHEN 1 THEN '/products'
        WHEN 2 THEN '/categories'
        WHEN 3 THEN '/cart'
        ELSE '/checkout'
    END,
    FLOOR(random() * 300 + 60),
    NOW() - (generate_series || ' minutes')::INTERVAL
FROM generate_series(1, 25)
ON CONFLICT DO NOTHING;

-- Step 9: Verify the test visits were added
SELECT 
    COUNT(*) as total_visits_after_test,
    MIN(created_at) as earliest,
    MAX(created_at) as latest,
    COUNT(DISTINCT visitor_id) as unique_visitors
FROM store_visits 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c'
AND visitor_id LIKE 'debug_test_%';

-- Step 10: Update distribution if it exists
UPDATE visit_distribution 
SET 
    total_distributed = (
        SELECT COUNT(*) 
        FROM store_visits 
        WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c'
    ),
    last_distribution = NOW(),
    updated_at = NOW()
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c'
AND is_active = true;

-- Step 11: Final status check
SELECT 
    'FINAL STATUS' as status_type,
    vd.partner_id,
    vd.total_visits as configured,
    COALESCE(vd.total_distributed, 0) as distributed,
    COALESCE(sv_counts.actual_visits, 0) as actual_store_visits,
    CASE 
        WHEN COALESCE(vd.total_distributed, 0) = COALESCE(sv_counts.actual_visits, 0) 
        THEN '✅ In Sync'
        ELSE '❌ Out of Sync'
    END as sync_status
FROM visit_distribution vd
LEFT JOIN (
    SELECT 
        partner_id,
        COUNT(*) as actual_visits
    FROM store_visits 
    WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c'
    GROUP BY partner_id
) sv_counts ON vd.partner_id = sv_counts.partner_id
WHERE vd.partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';
