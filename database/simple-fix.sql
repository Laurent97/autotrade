-- SIMPLE FIX - Create views directly without dynamic SQL
-- This should work without any syntax errors

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_pending_payments_with_users;
DROP VIEW IF EXISTS v_payment_security_logs_with_users;
DROP VIEW IF EXISTS v_stripe_payment_attempts_with_users;

-- Create view for pending_payments using existing customer_id
CREATE VIEW v_pending_payments_with_users AS
SELECT 
    pp.*,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM pending_payments pp
LEFT JOIN auth.users u ON u.id = pp.customer_id;

-- Create view for payment_security_logs using existing user_id
CREATE VIEW v_payment_security_logs_with_users AS
SELECT 
    psl.*,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM payment_security_logs psl
LEFT JOIN auth.users u ON u.id = psl.user_id;

-- Create view for stripe_payment_attempts using existing customer_id
CREATE VIEW v_stripe_payment_attempts_with_users AS
SELECT 
    spa.*,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM stripe_payment_attempts spa
LEFT JOIN auth.users u ON u.id = spa.customer_id;

-- Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';

-- Test the views
SELECT 'Testing v_pending_payments_with_users:' as test;
SELECT COUNT(*) as record_count FROM v_pending_payments_with_users;

SELECT 'Testing v_payment_security_logs_with_users:' as test;
SELECT COUNT(*) as record_count FROM v_payment_security_logs_with_users;

SELECT 'Testing v_stripe_payment_attempts_with_users:' as test;
SELECT COUNT(*) as record_count FROM v_stripe_payment_attempts_with_users;

SELECT '✅ Simple fix completed! Frontend should now work.' as status;
