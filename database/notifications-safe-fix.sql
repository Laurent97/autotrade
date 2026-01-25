-- Safe fix for notifications constraint issue

-- Step 1: Drop the existing constraint first (before trying to modify data)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Check what types exist after dropping constraint
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Step 3: Update any invalid types to valid ones
UPDATE notifications 
SET type = 'admin' 
WHERE type NOT IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping');

-- Step 4: Verify all types are now valid
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

-- Step 5: Add the constraint back only if all data is clean
DO $$
BEGIN
    -- Double-check no invalid types exist
    IF EXISTS (
        SELECT 1 FROM notifications 
        WHERE type NOT IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping')
    ) THEN
        RAISE EXCEPTION 'Cannot add constraint: Invalid notification types still exist';
    END IF;
    
    -- Add the constraint
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping'));
    
    RAISE NOTICE 'Successfully added notifications_type_check constraint';
END $$;

-- Step 6: Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
  AND contype = 'c'
  AND conname = 'notifications_type_check';
