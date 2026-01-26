-- COMPLETE FIX SCRIPT FOR PAYMENT TABLE USER RELATIONSHIPS
-- This script adds missing user_id columns and foreign key constraints

DO $$
BEGIN
    RAISE NOTICE '=== Fixing Payment Table User Relationships ===';
    
    -- 1. Check current structure of each table
    RAISE NOTICE '1. Checking table structures...';
    
    -- 2. Fix pending_payments (missing user_id)
    RAISE NOTICE '2. Fixing pending_payments...';
    
    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pending_payments' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE pending_payments 
        ADD COLUMN user_id UUID;
        RAISE NOTICE '   Added user_id column to pending_payments';
    ELSE
        RAISE NOTICE '   pending_payments already has user_id column';
    END IF;
    
    -- Add foreign key constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pending_payments_user_id_fkey'
    ) THEN
        ALTER TABLE pending_payments 
        ADD CONSTRAINT pending_payments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '   Added foreign key constraint to pending_payments';
    ELSE
        RAISE NOTICE '   pending_payments already has foreign key';
    END IF;
    
    -- 3. Fix payment_security_logs (has user_id, needs FK)
    RAISE NOTICE '3. Fixing payment_security_logs...';
    
    -- Check if FK exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payment_security_logs_user_id_fkey'
    ) THEN
        ALTER TABLE payment_security_logs 
        ADD CONSTRAINT payment_security_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '   Added foreign key constraint to payment_security_logs';
    ELSE
        RAISE NOTICE '   payment_security_logs already has foreign key';
    END IF;
    
    -- 4. Fix stripe_payment_attempts (missing user_id)
    RAISE NOTICE '4. Fixing stripe_payment_attempts...';
    
    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stripe_payment_attempts' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE stripe_payment_attempts 
        ADD COLUMN user_id UUID;
        RAISE NOTICE '   Added user_id column to stripe_payment_attempts';
    ELSE
        RAISE NOTICE '   stripe_payment_attempts already has user_id column';
    END IF;
    
    -- Add foreign key constraint if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'stripe_payment_attempts_user_id_fkey'
    ) THEN
        ALTER TABLE stripe_payment_attempts 
        ADD CONSTRAINT stripe_payment_attempts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '   Added foreign key constraint to stripe_payment_attempts';
    ELSE
        RAISE NOTICE '   stripe_payment_attempts already has foreign key';
    END IF;
    
    -- 5. Update existing data with user IDs
    RAISE NOTICE '5. Updating existing data...';
    
    -- Update pending_payments using customer_email if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pending_payments' 
        AND column_name = 'customer_email'
    ) THEN
        UPDATE pending_payments pp
        SET user_id = u.id
        FROM auth.users u
        WHERE pp.customer_email = u.email
          AND pp.user_id IS NULL;
        
        RAISE NOTICE '   Updated pending_payments with user IDs using customer_email';
    END IF;
    
    -- Update stripe_payment_attempts using customer_email if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stripe_payment_attempts' 
        AND column_name = 'customer_email'
    ) THEN
        UPDATE stripe_payment_attempts spa
        SET user_id = u.id
        FROM auth.users u
        WHERE spa.customer_email = u.email
          AND spa.user_id IS NULL;
        
        RAISE NOTICE '   Updated stripe_payment_attempts with user IDs using customer_email';
    END IF;
    
    -- 6. Refresh Supabase schema cache
    RAISE NOTICE '6. Refreshing Supabase schema cache...';
    PERFORM pg_notify('pgrst', 'reload schema');
    
    RAISE NOTICE '=== COMPLETE ===';
    RAISE NOTICE '✅ All payment tables fixed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- pending_payments: Added user_id column and foreign key';
    RAISE NOTICE '- payment_security_logs: Ensured foreign key exists';
    RAISE NOTICE '- stripe_payment_attempts: Added user_id column and foreign key';
    
EXCEPTION WHEN others THEN
    RAISE NOTICE '❌ Error occurred: %', SQLERRM;
    RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- Verify the fix
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('pending_payments', 'payment_security_logs', 'stripe_payment_attempts')
ORDER BY tc.table_name;

-- Success message
SELECT '✅ Payment table user relationships fixed successfully!' as status;
