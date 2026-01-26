-- Fix foreign key relationships for payment tables
-- This script ensures proper relationships between payment tables and users table

-- First, let's check if the tables exist and their structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('pending_payments', 'payment_security_logs', 'stripe_payment_attempts')
    AND column_name LIKE '%user%'
ORDER BY table_name, ordinal_position;

-- Drop and recreate pending_payments table with proper relationships
DROP TABLE IF EXISTS pending_payments CASCADE;

CREATE TABLE pending_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    crypto_xrp_tag VARCHAR(20),
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending_confirmation',
    admin_notes TEXT,
    confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for pending_payments
CREATE INDEX idx_pending_payments_status ON pending_payments (status, created_at);
CREATE INDEX idx_pending_admin_notify ON pending_payments (status, payment_method);
CREATE INDEX idx_pending_order ON pending_payments (order_id);
CREATE INDEX idx_pending_customer ON pending_payments (customer_id);

-- Drop and recreate payment_security_logs table with proper relationships
DROP TABLE IF EXISTS payment_security_logs CASCADE;

CREATE TABLE payment_security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for payment_security_logs
CREATE INDEX idx_security_logs_user ON payment_security_logs (user_id, created_at);
CREATE INDEX idx_security_logs_type ON payment_security_logs (event_type, created_at);
CREATE INDEX idx_security_logs_admin ON payment_security_logs (admin_id, created_at);

-- Drop and recreate stripe_payment_attempts table with proper relationships
DROP TABLE IF EXISTS stripe_payment_attempts CASCADE;

CREATE TABLE stripe_payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Create indexes for stripe_payment_attempts
CREATE INDEX idx_stripe_attempts_security ON stripe_payment_attempts (customer_id, created_at, status);
CREATE INDEX idx_stripe_attempts_order ON stripe_payment_attempts (order_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_pending_payments_updated_at ON pending_payments;
CREATE TRIGGER update_pending_payments_updated_at 
    BEFORE UPDATE ON pending_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_security_logs_updated_at ON payment_security_logs;
CREATE TRIGGER update_payment_security_logs_updated_at 
    BEFORE UPDATE ON payment_security_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_attempts_updated_at ON stripe_payment_attempts;
CREATE TRIGGER update_stripe_attempts_updated_at 
    BEFORE UPDATE ON stripe_payment_attempts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO pending_payments (order_id, customer_id, payment_method, amount, status) 
SELECT 
    'TEST-ORDER-' || gen_random_uuid(),
    id,
    'crypto',
    100.00,
    'pending_confirmation'
FROM auth.users 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 
    'pending_payments' as table_name,
    COUNT(*) as row_count
FROM pending_payments
UNION ALL
SELECT 
    'payment_security_logs' as table_name,
    COUNT(*) as row_count
FROM payment_security_logs
UNION ALL
SELECT 
    'stripe_payment_attempts' as table_name,
    COUNT(*) as row_count
FROM stripe_payment_attempts;

-- Success message
SELECT 'Payment tables with proper relationships created successfully!' as status;
