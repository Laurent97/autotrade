-- Add missing payout columns to orders table
-- These columns are needed for the payout functionality

-- Add paid_out column (boolean to track if partner has been paid)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS paid_out BOOLEAN DEFAULT FALSE;

-- Add payout_amount column (decimal to store the amount paid to partner)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payout_amount DECIMAL(10, 2);

-- Add payout_date column (timestamp to track when payout was processed)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payout_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on paid_out status
CREATE INDEX IF NOT EXISTS idx_orders_paid_out ON orders(paid_out);

-- Create index for faster queries on payout_date
CREATE INDEX IF NOT EXISTS idx_orders_payout_date ON orders(payout_date);

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
    AND column_name IN ('paid_out', 'payout_amount', 'payout_date')
ORDER BY column_name;
