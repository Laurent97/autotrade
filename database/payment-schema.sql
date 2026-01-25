-- Payment System Schema for AutoTradeHub

-- Stripe Payment Attempts Table (for security monitoring)
CREATE TABLE IF NOT EXISTS stripe_payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_intent_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'rejected',
    rejection_reason VARCHAR(255) DEFAULT 'customer_not_allowed_stripe',
    collected_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes separately for PostgreSQL
CREATE INDEX IF NOT EXISTS idx_stripe_attempts_security ON stripe_payment_attempts (customer_id, created_at, status);

-- Payment Security Logs Table
CREATE TABLE IF NOT EXISTS payment_security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_user ON payment_security_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON payment_security_logs (event_type, created_at);

-- Pending Payments Table (for PayPal and Crypto)
CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES auth.users(id),
    payment_method VARCHAR(20) NOT NULL, -- 'paypal' or 'crypto'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- PayPal Specific Fields
    paypal_email VARCHAR(255),
    paypal_transaction_id VARCHAR(255),
    
    -- Crypto Specific Fields
    crypto_address VARCHAR(255),
    crypto_transaction_id VARCHAR(255),
    crypto_type VARCHAR(20), -- 'BTC', 'ETH', 'USDT'
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending_confirmation',
    admin_notes TEXT,
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments (status, created_at);
CREATE INDEX IF NOT EXISTS idx_pending_admin_notify ON pending_payments (status, payment_method);
CREATE INDEX IF NOT EXISTS idx_pending_order ON pending_payments (order_id);

-- Admin Payment Notifications Table
CREATE TABLE IF NOT EXISTS admin_payment_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    payment_id UUID REFERENCES pending_payments(id),
    notification_type VARCHAR(50),
    message TEXT,
    viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_admin ON admin_payment_notifications (admin_id, viewed);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON admin_payment_notifications (notification_type, created_at);

-- Update orders table to include payment fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Paid orders archive table
CREATE TABLE IF NOT EXISTS paid_orders (
    LIKE orders INCLUDING ALL,
    archived_at TIMESTAMP DEFAULT NOW()
);

-- Function to move verified orders to archive
CREATE OR REPLACE FUNCTION move_to_paid_orders(order_id_param VARCHAR(50))
RETURNS void AS $$
BEGIN
  INSERT INTO paid_orders 
  SELECT *, NOW() FROM orders WHERE order_number = order_id_param;
  
  DELETE FROM orders WHERE order_number = order_id_param;
END;
$$ LANGUAGE plpgsql;

-- Crypto addresses configuration
CREATE TABLE IF NOT EXISTS crypto_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crypto_type VARCHAR(20) NOT NULL UNIQUE, -- 'BTC', 'ETH', 'USDT'
    address VARCHAR(255) NOT NULL,
    network VARCHAR(50), -- 'mainnet', 'testnet'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default crypto addresses
INSERT INTO crypto_addresses (crypto_type, address, network) VALUES
('BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'mainnet'),
('ETH', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'mainnet'),
('USDT', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'mainnet')
ON CONFLICT (crypto_type) DO NOTHING;

-- Payment method configuration
CREATE TABLE IF NOT EXISTS payment_method_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    method_name VARCHAR(20) NOT NULL UNIQUE, -- 'stripe', 'paypal', 'crypto', 'wallet'
    enabled BOOLEAN DEFAULT TRUE,
    customer_access BOOLEAN DEFAULT TRUE,
    partner_access BOOLEAN DEFAULT TRUE,
    admin_access BOOLEAN DEFAULT TRUE,
    admin_confirmation_required BOOLEAN DEFAULT FALSE,
    collect_data_only BOOLEAN DEFAULT FALSE, -- For stripe with customers
    config_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default payment method configurations
INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) VALUES
('stripe', true, false, true, true, false, false, '{"public_key": "pk_test_...", "secret_key": "sk_test_..."}'),
('paypal', true, true, true, true, true, false, '{"email": "payments@autotradehub.com", "currency": "USD"}'),
('crypto', true, true, true, true, true, false, '{"supported_types": ["BTC", "ETH", "USDT"]}'),
('wallet', true, false, true, true, false, false, '{"min_balance": 0}')
ON CONFLICT (method_name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER IF NOT EXISTS update_stripe_attempts_updated_at 
    BEFORE UPDATE ON stripe_payment_attempts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_pending_payments_updated_at 
    BEFORE UPDATE ON pending_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_crypto_addresses_updated_at 
    BEFORE UPDATE ON crypto_addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_payment_method_config_updated_at 
    BEFORE UPDATE ON payment_method_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
