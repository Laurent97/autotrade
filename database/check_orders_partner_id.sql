-- Check which partner ID has the orders
-- This will help us understand why stats show 0 after the fix

-- Step 1: Check orders for both user IDs
SELECT 
    'ORDERS FOR CURRENT USER' as check_type,
    partner_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
FROM orders 
WHERE partner_id = 'e2731c06-58b4-4f37-96c7-f721af43263c'

UNION ALL

SELECT 
    'ORDERS FOR OLD USER' as check_type,
    partner_id,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders
FROM orders 
WHERE partner_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 2: Check wallet balances for both IDs
SELECT 
    'WALLET BALANCE FOR CURRENT USER' as check_type,
    user_id,
    balance,
    pending_balance,
    updated_at
FROM wallet_balances 
WHERE user_id = 'e2731c06-58b4-4f37-96c7-f721af43263c'

UNION ALL

SELECT 
    'WALLET BALANCE FOR OLD USER' as check_type,
    user_id,
    balance,
    pending_balance,
    updated_at
FROM wallet_balances 
WHERE user_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 3: Check partner profiles for both IDs
SELECT 
    'PARTNER PROFILE FOR CURRENT USER' as check_type,
    user_id,
    store_name,
    is_active,
    is_verified,
    commission_rate
FROM partner_profiles 
WHERE user_id = 'e2731c06-58b4-4f37-96c7-f721af43263c'

UNION ALL

SELECT 
    'PARTNER PROFILE FOR OLD USER' as check_type,
    user_id,
    store_name,
    is_active,
    is_verified,
    commission_rate
FROM partner_profiles 
WHERE user_id = '33235e84-d175-4d35-a260-1037ca5cfd0c';

-- Step 4: Check which user should be the "real" partner
SELECT 
    u.id,
    u.email,
    u.user_type,
    u.created_at,
    pp.store_name,
    pp.is_active,
    CASE 
        WHEN u.id = 'e2731c06-58b4-4f37-96c7-f721af43263c' THEN '🎯 CURRENT USER'
        WHEN u.id = '33235e84-d175-4d35-a260-1037ca5cfd0c' THEN '🔄 OLD USER'
        ELSE '❓ OTHER'
    END as user_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM orders o WHERE o.partner_id = u.id) THEN '📦 HAS ORDERS'
        ELSE '📭 NO ORDERS'
    END as order_status
FROM users u
LEFT JOIN partner_profiles pp ON u.id = pp.user_id
WHERE u.email = 'laurentjean535@gmail.com'
ORDER BY u.created_at;
