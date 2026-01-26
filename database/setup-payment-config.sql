-- Complete Payment Configuration Setup Script
-- This script creates all necessary tables and configurations for payment methods
-- Run this in Supabase SQL Editor to fix all payment-related issues

-- Step 1: Create payment_method_config table if it doesn't exist
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

-- Step 2: Insert payment method configurations
INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
VALUES 
    ('stripe', true, false, true, true, false, false, '{"public_key": "pk_test_", "secret_key": "sk_test_"}')
ON CONFLICT (method_name) 
DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    customer_access = EXCLUDED.customer_access,
    partner_access = EXCLUDED.partner_access,
    admin_access = EXCLUDED.admin_access,
    admin_confirmation_required = EXCLUDED.admin_confirmation_required,
    collect_data_only = EXCLUDED.collect_data_only,
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
VALUES 
    ('paypal', true, true, true, true, true, false, '{"client_id": "paypal_client_id"}')
ON CONFLICT (method_name) 
DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    customer_access = EXCLUDED.customer_access,
    partner_access = EXCLUDED.partner_access,
    admin_access = EXCLUDED.admin_access,
    admin_confirmation_required = EXCLUDED.admin_confirmation_required,
    collect_data_only = EXCLUDED.collect_data_only,
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
VALUES 
    ('crypto', true, true, true, true, true, false, '{"wallets": {"BTC": "1FTUbAx5QNTWbxyerMPpxRbwqH3XnvwKQb", "USDT": "TYdFjAfhWL9DjaDBAe5LS7zUjBqpYGkRYB", "ETH": "0xd5fffaa3740af39c265563aec8c14bd08c05e838", "XRP": "rNxp4h8apvRis6mJf9Sh8C6iRxfrDWN7AV", "XRP_TAG": "476565842"}}')
ON CONFLICT (method_name) 
DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    customer_access = EXCLUDED.customer_access,
    partner_access = EXCLUDED.partner_access,
    admin_access = EXCLUDED.admin_access,
    admin_confirmation_required = EXCLUDED.admin_confirmation_required,
    collect_data_only = EXCLUDED.collect_data_only,
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

INSERT INTO payment_method_config (method_name, enabled, customer_access, partner_access, admin_access, admin_confirmation_required, collect_data_only, config_data) 
VALUES 
    ('bank', true, true, true, true, true, false, '{"supported_banks": ["Chase", "Bank of America", "Wells Fargo"]}')
ON CONFLICT (method_name) 
DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    customer_access = EXCLUDED.customer_access,
    partner_access = EXCLUDED.partner_access,
    admin_access = EXCLUDED.admin_access,
    admin_confirmation_required = EXCLUDED.admin_confirmation_required,
    collect_data_only = EXCLUDED.collect_data_only,
    config_data = EXCLUDED.config_data,
    updated_at = NOW();

-- Step 3: Create pending_payments table if it doesn't exist
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
    crypto_xrp_tag VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending_confirmation',
    admin_notes TEXT,
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create wallet_balances table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    payment_method VARCHAR(50),
    order_id VARCHAR(50),
    transaction_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Verify the setup
SELECT 
    'payment_method_config' as table_name,
    COUNT(*) as row_count
FROM payment_method_config
UNION ALL
SELECT 
    'pending_payments' as table_name,
    COUNT(*) as row_count
FROM pending_payments
UNION ALL
SELECT 
    'wallet_balances' as table_name,
    COUNT(*) as row_count
FROM wallet_balances
UNION ALL
SELECT 
    'wallet_transactions' as table_name,
    COUNT(*) as row_count
FROM wallet_transactions;

-- Step 7: Show payment method configurations
SELECT 
    method_name,
    enabled,
    customer_access,
    partner_access,
    admin_access,
    admin_confirmation_required,
    collect_data_only
FROM payment_method_config 
ORDER BY method_name;

-- Success message
SELECT 'Payment configuration setup completed successfully!' as status;
