-- Fix notifications type constraint to match application requirements

-- First, let's check the current constraint
DO $$
BEGIN
    -- Drop the existing check constraint if it exists
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    -- Add the correct check constraint that matches our application
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping'));
    
    RAISE NOTICE 'Fixed notifications_type_check constraint';
END $$;

-- Verify the constraint was added correctly
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
  AND contype = 'c'
  AND conname = 'notifications_type_check';
