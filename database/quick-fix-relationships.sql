-- QUICK FIX FOR PAYMENT TABLE RELATIONSHIPS
-- Run this script first before testing the frontend

-- Step 1: Add user_id columns if they don't exist
ALTER TABLE pending_payments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE stripe_payment_attempts ADD COLUMN IF NOT EXISTS user_id;

-- Step 2: Add foreign key constraints to auth.users
ALTER TABLE pending_payments 
ADD CONSTRAINT IF NOT EXISTS pending_payments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE payment_security_logs 
ADD CONSTRAINT IF NOT EXISTS payment_security_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE stripe_payment_attempts 
ADD CONSTRAINT IF NOT EXISTS stripe_payment_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Create views as backup solution
CREATE OR REPLACE VIEW v_pending_payments_with_users AS
SELECT 
    pp.*,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM pending_payments pp
LEFT JOIN auth.users u ON u.id::text = pp.customer_id::text OR u.email = pp.customer_email;

CREATE OR REPLACE VIEW v_payment_security_logs_with_users AS
SELECT 
    psl.*,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM payment_security_logs psl
LEFT JOIN auth.users u ON u.id = psl.user_id;

CREATE OR REPLACE VIEW v_stripe_payment_attempts_with_users AS
SELECT 
    spa.*,
    u.id as user_id,
    u.full_name as user_full_name,
    u.email as user_email,
    u.avatar_url as user_avatar
FROM stripe_payment_attempts spa
LEFT JOIN auth.users u ON u.id::text = spa.customer_id::text OR u.email = spa.customer_email;

-- Step 4: Refresh PostgREST schema
NOTIFY pgrst, 'reload schema';

-- Step 5: Test the views
SELECT 'Testing v_pending_payments_with_users view:' as test;
SELECT * FROM v_pending_payments_with_users LIMIT 1;

SELECT 'Testing v_payment_security_logs_with_users view:' as test;
SELECT * FROM v_payment_security_logs_with_users LIMIT 1;

SELECT 'Testing v_stripe_payment_attempts_with_users view:' as test;
SELECT * FROM v_stripe_payment_attempts_with_users LIMIT 1;

SELECT '✅ Quick fix completed! Try using the views in your frontend queries.' as status;
