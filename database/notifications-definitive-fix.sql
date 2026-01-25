-- Definitive fix for notifications constraint issue

-- Step 1: Show current constraints
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
  AND contype = 'c'
  AND conname LIKE '%type%';

-- Step 2: Drop ALL type-related constraints (there might be duplicates)
DO $$
BEGIN
    -- Drop the first constraint (the problematic one with info/success/warning/error)
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    -- Drop any other type-related constraints that might exist
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check_1;
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check_2;
    
    RAISE NOTICE 'Dropped all existing type constraints';
END $$;

-- Step 3: Check what types exist after dropping constraints
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Step 4: Update any invalid types to valid ones
UPDATE notifications 
SET type = 'admin' 
WHERE type NOT IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping');

-- Step 5: Verify all types are now valid
SELECT 
    type,
    COUNT(*) as count,
    CASE 
        WHEN type IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping') THEN 'Valid'
        ELSE 'Invalid'
    END as status
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Step 6: Add the correct constraint only
DO $$
BEGIN
    -- Double-check no invalid types exist
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE type NOT IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping')
    ) THEN
        RAISE EXCEPTION 'Cannot add constraint: Invalid notification types still exist';
    END IF;
    
    -- Add the correct constraint
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping'));
    
    RAISE NOTICE 'Successfully added notifications_type_check constraint';
END $$;

-- Step 7: Verify the constraint was added correctly
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
  AND contype = 'c'
  AND conname = 'notifications_type_check';
