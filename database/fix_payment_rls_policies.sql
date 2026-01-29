-- Fix RLS policies for payment tables
-- This script adds missing INSERT policies for payment recording

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view own pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can view all pending payments" ON pending_payments;
DROP POLICY IF EXISTS "Admins can update pending payments" ON pending_payments;

-- Create new comprehensive policies for pending_payments
CREATE POLICY "Users can insert own pending payments" ON pending_payments
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can view own pending payments" ON pending_payments
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all pending payments" ON pending_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update pending payments" ON pending_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert pending payments" ON pending_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Fix stripe_payment_attempts policies
DROP POLICY IF EXISTS "Users can view own stripe attempts" ON stripe_payment_attempts;
DROP POLICY IF EXISTS "Admins can view all stripe attempts" ON stripe_payment_attempts;

CREATE POLICY "Users can insert own stripe attempts" ON stripe_payment_attempts
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can view own stripe attempts" ON stripe_payment_attempts
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all stripe attempts" ON stripe_payment_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert stripe attempts" ON stripe_payment_attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Fix wallet_transactions policies
DROP POLICY IF EXISTS "Users can view own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admins can update wallet transactions" ON wallet_transactions;

CREATE POLICY "Users can insert own wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update wallet transactions" ON wallet_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Fix wallet_balances policies
DROP POLICY IF EXISTS "Users can view own wallet balance" ON wallet_balances;
DROP POLICY IF EXISTS "Users can update own wallet balance" ON wallet_balances;
DROP POLICY IF EXISTS "Admins can view all wallet balances" ON wallet_balances;
DROP POLICY IF EXISTS "Admins can update all wallet balances" ON wallet_balances;

CREATE POLICY "Users can insert own wallet balance" ON wallet_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wallet balance" ON wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balance" ON wallet_balances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet balances" ON wallet_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can update all wallet balances" ON wallet_balances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Admins can insert wallet balances" ON wallet_balances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Re-grant permissions to ensure authenticated users can insert
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Verify policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('pending_payments', 'stripe_payment_attempts', 'wallet_transactions', 'wallet_balances')
ORDER BY tablename, policyname;
