-- Debug script to check for recent orders and the specific order
-- Run this in Supabase SQL Editor to see what's happening

-- Check if the specific order exists
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
WHERE order_number = 'ORD-1769170572390';

-- Check all orders created in the last hour
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check all orders for this user
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
WHERE customer_id = 'e2731c06-58b4-4f37-96c7-f721af43263c'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any orders at all
SELECT COUNT(*) as total_orders FROM orders;

-- Check the most recent orders overall
SELECT 
    id,
    order_number,
    customer_id,
    total_amount,
    status,
    payment_status,
    created_at
FROM orders 
ORDER BY created_at DESC
LIMIT 5;
