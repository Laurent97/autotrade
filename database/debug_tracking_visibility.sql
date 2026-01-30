-- Debug script to check tracking visibility issue
-- This will help identify why partners can't see tracking data

-- 1. Check if there are any tracking records at all
SELECT 
    'Total tracking records' as info,
    COUNT(*) as count
FROM order_tracking;

-- 2. Check tracking records with partner_id
SELECT 
    'Tracking records with partner_id' as info,
    COUNT(*) as count
FROM order_tracking 
WHERE partner_id IS NOT NULL;

-- 3. Show sample tracking records with partner info
SELECT 
    ot.id,
    ot.order_id,
    ot.partner_id,
    ot.tracking_number,
    ot.carrier,
    ot.current_status,
    pp.store_name as partner_store,
    pp.user_id as partner_user_id,
    o.order_number as order_number_from_orders,
    o.partner_id as order_partner_id
FROM order_tracking ot
LEFT JOIN partner_profiles pp ON ot.partner_id = pp.id
LEFT JOIN orders o ON ot.order_id::text = o.id::text  -- Cast both to text for comparison
LIMIT 10;

-- 4. Check specific partner's tracking (replace with actual partner ID)
-- Uncomment and replace with actual partner ID from your system
-- SELECT * FROM order_tracking WHERE partner_id = 'YOUR_PARTNER_ID_HERE';

-- 5. Check orders with partner assignments
SELECT 
    o.id,
    o.order_number,
    o.partner_id,
    pp.store_name,
    pp.user_id
FROM orders o
LEFT JOIN partner_profiles pp ON o.partner_id = pp.id
WHERE o.partner_id IS NOT NULL
LIMIT 10;

-- 6. Check order_tracking table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_tracking' 
ORDER BY ordinal_position;
