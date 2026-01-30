-- Comprehensive update to orders table to allow ALL logistics statuses
-- This will support the full logistics workflow with detailed tracking

-- First, check the current constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the comprehensive constraint with ALL logistics statuses
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (
  status = ANY (
    array[
      -- Basic order statuses
      'pending'::text,
      'waiting_confirmation'::text,
      'confirmed'::text,
      'processing'::text,
      'shipped'::text,
      'delivered'::text,
      'completed'::text,
      'cancelled'::text,
      
      -- Detailed logistics statuses
      'in_transit'::text,
      'out_for_delivery'::text,
      
      -- Pre-shipment statuses
      'order_received'::text,
      'order_verified'::text,
      'inventory_allocated'::text,
      'order_processing'::text,
      'picking_started'::text,
      'picking_completed'::text,
      'packing_started'::text,
      'packing_completed'::text,
      'ready_to_ship'::text,
      
      -- Shipping statuses
      'carrier_pickup_scheduled'::text,
      'picked_up'::text,
      'arrived_at_origin'::text,
      'departed_origin'::text,
      'arrived_at_sort'::text,
      'processed_at_sort'::text,
      'departed_sort'::text,
      'arrived_at_destination'::text,
      
      -- Delivery statuses
      'delivery_attempted'::text,
      
      -- Exception statuses
      'delayed'::text,
      'weather_delay'::text,
      'mechanical_delay'::text,
      'security_delay'::text,
      'customs_hold'::text,
      'damaged'::text,
      'lost'::text,
      'address_issue'::text,
      'customer_unavailable'::text
    ]
  )
);

-- Verify the new constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass
  AND conname = 'orders_status_check';

-- Test the constraint with various statuses
-- Test with detailed logistics status (should succeed)
-- INSERT INTO orders (order_number, customer_id, total_amount, status, shipping_address, payment_status)
-- VALUES ('TEST-001', '00000000-0000-0000-0000-000000000000', 100.00, 'arrived_at_origin', '{"address": "123 Test St"}', 'pending')
-- ON CONFLICT (order_number) DO NOTHING;

-- Test with exception status (should succeed)
-- INSERT INTO orders (order_number, customer_id, total_amount, status, shipping_address, payment_status)
-- VALUES ('TEST-002', '00000000-0000-0000-0000-000000000000', 200.00, 'weather_delay', '{"address": "456 Test Ave"}', 'pending')
-- ON CONFLICT (order_number) DO NOTHING;

-- Test with invalid status (should fail)
-- INSERT INTO orders (order_number, customer_id, total_amount, status, shipping_address, payment_status)
-- VALUES ('TEST-003', '00000000-0000-0000-0000-000000000000', 300.00, 'invalid_status', '{"address": "789 Test Blvd"}', 'pending');

-- Clean up test data
-- DELETE FROM orders WHERE order_number LIKE 'TEST-%';

-- Check current status distribution after update
SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status IN ('pending', 'waiting_confirmation', 'confirmed', 'processing') THEN 'Pre-Shipment'
    WHEN status IN ('shipped', 'in_transit', 'out_for_delivery') THEN 'In Transit'
    WHEN status IN ('delivered', 'completed') THEN 'Completed'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status IN ('delayed', 'weather_delay', 'mechanical_delay', 'security_delay', 'customs_hold', 'damaged', 'lost') THEN 'Exception'
    ELSE 'Other'
  END as category
FROM orders 
GROUP BY status, 
  CASE 
    WHEN status IN ('pending', 'waiting_confirmation', 'confirmed', 'processing') THEN 'Pre-Shipment'
    WHEN status IN ('shipped', 'in_transit', 'out_for_delivery') THEN 'In Transit'
    WHEN status IN ('delivered', 'completed') THEN 'Completed'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status IN ('delayed', 'weather_delay', 'mechanical_delay', 'security_delay', 'customs_hold', 'damaged', 'lost') THEN 'Exception'
    ELSE 'Other'
  END
ORDER BY category, status;
