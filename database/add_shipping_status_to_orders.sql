-- Add shipping_status column to orders table
-- This column will store the detailed logistics status from the order_tracking table

-- Add shipping_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_status VARCHAR(100);
    END IF;
END $$;

-- Add shipping_updated_at column if it doesn't exist (for tracking when shipping status was last updated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for faster queries on shipping_status
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Create index for faster queries on shipping_updated_at
CREATE INDEX IF NOT EXISTS idx_orders_shipping_updated_at ON orders(shipping_updated_at);

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND column_name IN ('shipping_status', 'shipping_updated_at')
ORDER BY column_name;
