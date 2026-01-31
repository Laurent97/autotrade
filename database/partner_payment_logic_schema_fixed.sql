-- Partner Order Payment Logic Schema Updates (Fixed Version)
-- This migration adds support for base cost prices, selling prices, and payment tracking
-- Handles existing columns gracefully

-- 1. Update partner_products table to include pricing structure
-- Only add columns that don't already exist
DO $$
BEGIN
    -- Add base_cost_price if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_products' 
        AND column_name = 'base_cost_price'
    ) THEN
        ALTER TABLE partner_products 
        ADD COLUMN base_cost_price DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;

    -- Add selling_price if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_products' 
        AND column_name = 'selling_price'
    ) THEN
        ALTER TABLE partner_products 
        ADD COLUMN selling_price DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;

    -- Add markup_percentage if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_products' 
        AND column_name = 'markup_percentage'
    ) THEN
        ALTER TABLE partner_products 
        ADD COLUMN markup_percentage DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Update orders table to track payment amounts
DO $$
BEGIN
    -- Add base_cost_total if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'base_cost_total'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN base_cost_total DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add partner_payment_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'partner_payment_amount'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN partner_payment_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add partner_payout_amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'partner_payout_amount'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN partner_payout_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add partner_payment_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'partner_payment_status'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN partner_payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add partner_payout_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'partner_payout_status'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN partner_payout_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add partner_payment_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'partner_payment_at'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN partner_payment_at TIMESTAMP;
    END IF;

    -- Add partner_payout_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'partner_payout_at'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN partner_payout_at TIMESTAMP;
    END IF;
END $$;

-- 3. Create partner_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS partner_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payment', 'payout', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

-- 4. Create indexes for performance (only if they don't exist)
DO $$
BEGIN
    -- Index on partner_transactions.partner_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'partner_transactions' 
        AND indexname = 'idx_partner_transactions_partner_id'
    ) THEN
        CREATE INDEX idx_partner_transactions_partner_id ON partner_transactions(partner_id);
    END IF;

    -- Index on partner_transactions.order_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'partner_transactions' 
        AND indexname = 'idx_partner_transactions_order_id'
    ) THEN
        CREATE INDEX idx_partner_transactions_order_id ON partner_transactions(order_id);
    END IF;

    -- Index on partner_transactions.type_status
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'partner_transactions' 
        AND indexname = 'idx_partner_transactions_type_status'
    ) THEN
        CREATE INDEX idx_partner_transactions_type_status ON partner_transactions(transaction_type, status);
    END IF;

    -- Index on partner_transactions.created_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'partner_transactions' 
        AND indexname = 'idx_partner_transactions_created_at'
    ) THEN
        CREATE INDEX idx_partner_transactions_created_at ON partner_transactions(created_at);
    END IF;

    -- Index on orders.partner_payment_status
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'orders' 
        AND indexname = 'idx_orders_partner_payment_status'
    ) THEN
        CREATE INDEX idx_orders_partner_payment_status ON orders(partner_payment_status);
    END IF;

    -- Index on orders.partner_payout_status
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'orders' 
        AND indexname = 'idx_orders_partner_payout_status'
    ) THEN
        CREATE INDEX idx_orders_partner_payout_status ON orders(partner_payout_status);
    END IF;
END $$;

-- 5. Update existing partner_products with pricing data (only if needed)
-- This updates rows where base_cost_price is 0 (default value)
-- Handle both cases: when price exists and when it doesn't
UPDATE partner_products 
SET 
  base_cost_price = CASE 
    WHEN base_cost_price = 0 AND selling_price > 0 
    THEN ROUND(selling_price * 0.80, 2)
    WHEN base_cost_price = 0 AND selling_price = 0 
    THEN 0
    ELSE base_cost_price 
  END,
  markup_percentage = CASE 
    WHEN markup_percentage = 0 AND selling_price > 0 AND base_cost_price > 0
    THEN ROUND((selling_price - base_cost_price) / base_cost_price * 100, 2)
    ELSE markup_percentage
  END
WHERE base_cost_price = 0;

-- 6. Add constraints to ensure data integrity (only if they don't exist)
DO $$
BEGIN
    -- Check positive prices constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_prices'
    ) THEN
        ALTER TABLE partner_products 
        ADD CONSTRAINT check_positive_prices CHECK (base_cost_price >= 0 AND selling_price >= 0);
    END IF;

    -- Check selling price higher constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_selling_price_higher'
    ) THEN
        ALTER TABLE partner_products 
        ADD CONSTRAINT check_selling_price_higher CHECK (selling_price >= base_cost_price);
    END IF;

    -- Check markup percentage constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_markup_percentage'
    ) THEN
        ALTER TABLE partner_products 
        ADD CONSTRAINT check_markup_percentage CHECK (markup_percentage >= 0);
    END IF;

    -- Check positive payment amounts constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_positive_payment_amounts'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT check_positive_payment_amounts CHECK (
          base_cost_total >= 0 AND 
          partner_payment_amount >= 0 AND 
          partner_payout_amount >= 0
        );
    END IF;
END $$;

-- 7. Create function to calculate partner profit (only if it doesn't exist)
CREATE OR REPLACE FUNCTION calculate_partner_profit(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(partner_payout_amount, 0) - COALESCE(partner_payment_amount, 0)
    FROM orders
    WHERE id = order_id
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to calculate platform revenue (only if it doesn't exist)
CREATE OR REPLACE FUNCTION calculate_platform_revenue(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (
    SELECT total_amount - COALESCE(partner_payout_amount, 0)
    FROM orders
    WHERE id = order_id
  );
END;
$$ LANGUAGE plpgsql;

-- 9. Create view for partner financial summary (only if it doesn't exist)
DROP VIEW IF EXISTS partner_financial_summary;
CREATE VIEW partner_financial_summary AS
SELECT 
  p.id as partner_id,
  p.store_name,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(COALESCE(o.partner_payment_amount, 0)) as total_payments,
  SUM(COALESCE(o.partner_payout_amount, 0)) as total_payouts,
  SUM(COALESCE(o.partner_payout_amount, 0) - COALESCE(o.partner_payment_amount, 0)) as total_profit,
  AVG(CASE WHEN o.status = 'completed' THEN COALESCE(o.partner_payout_amount, 0) - COALESCE(o.partner_payment_amount, 0) ELSE NULL END) as avg_profit_per_order,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_amount - COALESCE(o.partner_payout_amount, 0)) as platform_revenue
FROM partner_profiles p
LEFT JOIN orders o ON p.id = o.partner_id
GROUP BY p.id, p.store_name;

-- 10. Add RLS policies for partner_transactions (only if they don't exist)
ALTER TABLE partner_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Partners can view their own transactions" ON partner_transactions;
    DROP POLICY IF EXISTS "Admins can view all transactions" ON partner_transactions;

    -- Create policies
    CREATE POLICY "Partners can view their own transactions" ON partner_transactions
      FOR SELECT USING (auth.uid() IN (
        SELECT user_id FROM partner_profiles WHERE id = partner_id
      ));

    -- Create admin policy - for now, allow all authenticated users to view
    -- TODO: Update this once proper admin role system is in place
    CREATE POLICY "Admins can view all transactions" ON partner_transactions
      FOR ALL USING (auth.uid() IS NOT NULL);
END $$;

-- 11. Create trigger to update transaction timestamps (only if they don't exist)
CREATE OR REPLACE FUNCTION update_transaction_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.processed_at = NOW();
  END IF;
  
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    NEW.failed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transaction_processed_at ON partner_transactions;
CREATE TRIGGER trigger_update_transaction_processed_at
  BEFORE UPDATE ON partner_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_processed_at();

-- 12. Create trigger to update order payment timestamps (only if they don't exist)
CREATE OR REPLACE FUNCTION update_order_payment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.partner_payment_status = 'completed' AND OLD.partner_payment_status != 'completed' THEN
    NEW.partner_payment_at = NOW();
  END IF;
  
  IF NEW.partner_payout_status = 'completed' AND OLD.partner_payout_status != 'completed' THEN
    NEW.partner_payout_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_payment_timestamps ON orders;
CREATE TRIGGER trigger_update_order_payment_timestamps
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_timestamps();

COMMIT;
