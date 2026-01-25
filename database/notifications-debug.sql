-- Debug and fix notifications constraint issue

-- Check table structure using information schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Check what data we actually have (sample)
SELECT 
    id, 
    user_id, 
    title, 
    type, 
    read, 
    priority, 
    created_at 
FROM notifications 
LIMIT 5;

-- Check what types exist and their counts
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Check if there are any NULL or invalid types
SELECT 
    id,
    type,
    CASE 
        WHEN type IS NULL THEN 'NULL type'
        WHEN type NOT IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping') THEN 'Invalid type: ' || type
        ELSE 'Valid type'
    END as type_status
FROM notifications 
WHERE type IS NULL OR type NOT IN ('payment', 'order', 'admin', 'system', 'promotion', 'shipping');

-- Check the exact constraint definition
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
  AND contype = 'c'
  AND conname LIKE '%type%';
