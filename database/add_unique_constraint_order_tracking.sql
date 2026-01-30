-- Add unique constraint to order_id column in order_tracking table
-- This will allow proper upsert operations with onConflict clause

-- First, check if there are any duplicate order_id values
SELECT 
    order_id, 
    COUNT(*) as duplicate_count
FROM order_tracking 
WHERE order_id IS NOT NULL
GROUP BY order_id 
HAVING COUNT(*) > 1;

-- If there are duplicates, we need to handle them first
-- Option 1: Keep the most recent record and delete older duplicates
DO $$
BEGIN
    -- Check if there are any duplicates first
    IF EXISTS (
        SELECT 1 FROM (
            SELECT order_id, COUNT(*) as cnt
            FROM order_tracking 
            WHERE order_id IS NOT NULL
            GROUP BY order_id 
            HAVING COUNT(*) > 1
        ) duplicates
    ) THEN
        -- Delete duplicates, keeping the most recent one
        DELETE FROM order_tracking 
        WHERE id NOT IN (
            SELECT DISTINCT ON (order_id) id
            FROM order_tracking 
            WHERE order_id IS NOT NULL
            ORDER BY order_id, created_at DESC
        );
        
        RAISE NOTICE 'Duplicate order_id records removed';
    END IF;
END $$;

-- Now add the unique constraint
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'order_tracking' 
          AND constraint_name = 'order_tracking_order_id_unique'
          AND constraint_type = 'UNIQUE'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE order_tracking 
        ADD CONSTRAINT order_tracking_order_id_unique UNIQUE (order_id);
        
        RAISE NOTICE 'Unique constraint added to order_id column';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on order_id column';
    END IF;
END $$;

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'order_tracking'
  AND tc.constraint_name = 'order_tracking_order_id_unique';

-- Final verification - check for any remaining duplicates
SELECT 
    'Duplicate check' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT order_id) as unique_order_ids,
    COUNT(*) - COUNT(DISTINCT order_id) as duplicate_count
FROM order_tracking 
WHERE order_id IS NOT NULL;
