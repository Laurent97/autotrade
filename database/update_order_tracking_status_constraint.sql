-- Update the order_tracking_status_check constraint to include comprehensive logistics status values

-- First, drop the existing constraint
ALTER TABLE order_tracking DROP CONSTRAINT IF EXISTS order_tracking_status_check;

-- Add the new constraint with comprehensive status values
ALTER TABLE order_tracking 
ADD CONSTRAINT order_tracking_status_check 
CHECK (
  status IN (
    -- Pre-Shipment statuses
    'ORDER_RECEIVED',
    'PAYMENT_AUTHORIZED', 
    'ORDER_VERIFIED',
    'INVENTORY_ALLOCATED',
    'pending',
    'confirmed',
    'waiting_confirmation',
    
    -- Fulfillment statuses
    'ORDER_PROCESSING',
    'PICKING_STARTED',
    'PICKING_COMPLETED',
    'PACKING_STARTED',
    'PACKING_COMPLETED',
    'READY_TO_SHIP',
    'processing',
    
    -- Shipping statuses
    'CARRIER_PICKUP_SCHEDULED',
    'PICKED_UP',
    'IN_TRANSIT',
    'in_transit',
    'shipped',
    
    -- Out for Delivery statuses
    'OUT_FOR_DELIVERY',
    'out_for_delivery',
    'OUT FOR DELIVERY',
    
    -- Delivered statuses
    'DELIVERED',
    'delivered',
    'completed',
    
    -- Other statuses
    'cancelled'
  )
);

-- Verify the constraint was updated
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'order_tracking_status_check';
