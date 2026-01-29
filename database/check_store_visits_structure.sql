-- Check and fix store_visits table structure
-- This script will help diagnose why visits aren't showing up

-- First, let's see the current structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'store_visits' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'store_visits';

-- Check if there are any records in store_visits
SELECT COUNT(*) as total_visits FROM store_visits;

-- Check if there are any records for specific partner (replace with actual partner_id)
SELECT COUNT(*) as partner_visits, 
       MIN(created_at) as earliest_visit,
       MAX(created_at) as latest_visit
FROM store_visits 
WHERE partner_id = 'your-partner-id-here';
