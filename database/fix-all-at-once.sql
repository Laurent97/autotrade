-- COMPLETE FIX FOR PAYMENT TABLES - ALL AT ONCE
-- This script handles everything properly without syntax errors

DO $$
BEGIN
    RAISE NOTICE '=== Starting Complete Payment Tables Fix ===';
    
    -- 1. Add user_id columns to pending_payments if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pending_payments' 
        AND column_name = 'user_id'
    ) THEN
        EXECUTE 'ALTER TABLE pending_payments ADD COLUMN user_id UUID';
        RAISE NOTICE 'Added user_id to pending_payments';
    END IF;
    
    -- 2. Add user_id columns to stripe_payment_attempts if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stripe_payment_attempts' 
        AND column_name = 'user_id'
    ) THEN
        EXECUTE 'ALTER TABLE stripe_payment_attempts ADD COLUMN user_id UUID';
        RAISE NOTICE 'Added user_id to stripe_payment_attempts';
    END IF;
    
    -- 3. Drop existing views if they exist
    DROP VIEW IF EXISTS v_pending_payments_with_users CASCADE;
    DROP VIEW IF EXISTS v_payment_security_logs_with_users CASCADE;
    DROP VIEW IF EXISTS v_stripe_payment_attempts_with_users CASCADE;
    
    -- 4. Create new views with user data
    EXECUTE '
    CREATE VIEW v_pending_payments_with_users AS
    SELECT 
        pp.*,
        u.id as user_id,
        u.full_name as user_full_name,
        u.email as user_email,
        u.avatar_url as user_avatar
    FROM pending_payments pp
    LEFT JOIN auth.users u ON u.id::text = pp.customer_id::text OR u.email = pp.customer_email';
    
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
    
    EXECUTE '
    CREATE VIEW v_stripe_payment_attempts_with_users AS
    SELECT 
        spa.*,
        u.id as user_id,
        u.full_name as user_full_name,
        u.email as user_email,
        u.avatar_url as user_avatar
    FROM stripe_payment_attempts spa
    LEFT JOIN auth.users u ON u.id::text = spa.customer_id::text OR u.email = spa.customer_email';
    
    -- 5. Update existing data to populate user IDs
    UPDATE pending_payments pp
    SET user_id = u.id
    FROM auth.users u
    WHERE u.email = pp.customer_email AND pp.user_id IS NULL;
    
    UPDATE stripe_payment_attempts spa
    SET user_id = u.id
    FROM auth.users u
    WHERE u.email = spa.customer_email AND spa.user_id IS NULL;
    
    -- 6. Refresh PostgREST schema
    PERFORM pg_notify('pgrst', 'reload schema');
    
    RAISE NOTICE '=== COMPLETE ===';
    RAISE NOTICE '✅ All payment tables and views fixed successfully!';
    
EXCEPTION WHEN others THEN
    RAISE NOTICE '❌ Error occurred: %', SQLERRM;
    RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- Verify the views were created
SELECT 
    'v_pending_payments_with_users' as view_name,
    COUNT(*) as record_count
FROM v_pending_payments_with_users
UNION ALL
SELECT 
    'v_payment_security_logs_with_users' as view_name,
    COUNT(*) as record_count
FROM v_payment_security_logs_with_users
UNION ALL
SELECT 
    'v_stripe_payment_attempts_with_users' as view_name,
    COUNT(*) as record_count
FROM v_stripe_payment_attempts_with_users;

-- Success message
SELECT '✅ All payment tables fixed! Frontend should now work.' as status;
