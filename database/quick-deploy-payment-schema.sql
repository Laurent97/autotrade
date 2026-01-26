-- QUICK DEPLOY: Payment Schema for AutoTradeHub
-- Copy this entire script and run it in your Supabase SQL Editor
-- This will fix the payment-related database issues

-- Step 1: Create the main payment tables
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

CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES auth.users(id),
    payment_method VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    paypal_email VARCHAR(255),
    paypal_transaction_id VARCHAR(255),
    crypto_address VARCHAR(255),
    crypto_transaction_id VARCHAR(255),
    crypto_type VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending_confirmation',
    admin_notes TEXT,
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(100),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_attempts_customer ON stripe_payment_attempts(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pending_payments_status ON pending_payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON payment_security_logs(user_id, created_at);

-- Step 3: Create payment method configuration
CREATE TABLE IF NOT EXISTS payment_method_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    method_name VARCHAR(20) NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    customer_access BOOLEAN DEFAULT TRUE,
    partner_access BOOLEAN DEFAULT TRUE,
    admin_access BOOLEAN DEFAULT TRUE,
    admin_confirmation_required BOOLEAN DEFAULT FALSE,
    collect_data_only BOOLEAN DEFAULT FALSE,
    config_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Insert default configurations
INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
SELECT 'stripe', true, false, true, true, false, false, '{"public_key": "pk_test_", "secret_key": "sk_test_"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_method_config WHERE method_name = 'stripe');

INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
SELECT 'paypal', true, true, true, true, true, false, '{"client_id": "paypal_client_id"}'
WHERE NOT EXISTS (SELECT 1 FROM payment_method_config WHERE method_name = 'paypal');

INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
SELECT 'crypto', true, true, true, true, true, false, '{"wallets": {"BTC": "bc1q...", "ETH": "0x...", "USDT": "0x..."}}'
WHERE NOT EXISTS (SELECT 1 FROM payment_method_config WHERE method_name = 'crypto');

-- Step 5: Update orders table with payment fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Success message
SELECT 'Payment schema deployed successfully!' as status;
