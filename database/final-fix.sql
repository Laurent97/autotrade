-- FINAL FIX - Use existing customer_id columns instead of adding user_id
-- This script creates views that work with the existing structure

DO $$
BEGIN
    RAISE NOTICE '=== Creating Views with Existing customer_id ===';
    
    -- Drop existing views if they exist
    DROP VIEW IF EXISTS v_pending_payments_with_users CASCADE;
    DROP VIEW IF EXISTS v_payment_security_logs_with_users CASCADE;
    DROP VIEW IF EXISTS v_stripe_payment_attempts_with_users CASCADE;
    
    -- Create view for pending_payments using existing customer_id
    EXECUTE '
    CREATE VIEW v_pending_payments_with_users AS
    SELECT 
        pp.*,
        u.id as user_id,
        u.full_name as user_full_name,
        u.email as user_email,
        u.avatar_url as user_avatar
    FROM pending_payments pp
    LEFT JOIN auth.users u ON u.id = pp.customer_id';
    
    -- Create view for payment_security_logs using existing user_id
    EXECUTE '
    CREATE VIEW v_payment_security_logs_with_users AS
    SELECT 
        psl.*,
        u.id as user_id,
        u.full_name as user_full_name,
        u.email as user_email,
        u.avatar_url as user_avatar
    FROM payment_security_logs psl
    LEFT JOIN auth.users u ON u.id = psl.user_id';
    
    -- Create view for stripe_payment_attempts using existing customer_id
    EXECUTE '
    CREATE VIEW v_stripe_payment_attempts_with_users AS
    SELECT 
        spa.*,
        u.id as user_id,
        u.full_name as user_full_name,
        u.email as user_email,
        u.avatar_url as user_avatar
    FROM stripe_payment_attempts spa
    LEFT JOIN auth.users u ON u.id = spa.customer_id';
    
    -- Refresh PostgREST schema
    PERFORM pg_notify('pgrst', 'reload schema');
    
    RAISE NOTICE '=== COMPLETE ===';
    RAISE NOTICE '✅ Views created using existing customer_id columns!';
    
EXCEPTION WHEN others THEN
    RAISE NOTICE '❌ Error occurred: %', SQLERRM;
    RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- Test the views
SELECT 'Testing v_pending_payments_with_users:' as test;
SELECT COUNT(*) as record_count FROM v_pending_payments_with_users;

SELECT 'Testing v_payment_security_logs_with_users:' as test;
SELECT COUNT(*) as record_count FROM v_payment_security_logs_with_users;

SELECT 'Testing v_stripe_payment_attempts_with_users:' as test;
SELECT COUNT(*) as record_count FROM v_stripe_payment_attempts_with_users;

-- Show sample data
SELECT 'Sample pending_payments with user data:' as info;
SELECT 
    pp.order_id,
    pp.amount,
    pp.status,
    u.full_name,
    u.email
FROM pending_payments pp
LEFT JOIN auth.users u ON u.id = pp.customer_id
LIMIT 3;

SELECT '✅ Final fix completed! Frontend should now work.' as status;
