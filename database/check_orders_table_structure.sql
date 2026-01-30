-- Check current orders table structure
-- This will help identify if there are any missing columns causing the 400 error

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check if there are any orders with problematic data
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN partner_id IS NOT NULL THEN 1 END) as orders_with_partner,
    COUNT(CASE WHEN shipping_status IS NOT NULL THEN 1 END) as orders_with_shipping_status
FROM orders;

-- Try a simple query to see if basic orders fetch works
SELECT 
    id,
    order_number,
    status,
    partner_id,
    created_at
FROM orders 
LIMIT 5;
