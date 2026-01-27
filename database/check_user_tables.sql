-- Check which user tables exist and their structure

-- Check if users table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'users'
) as users_table_exists;

-- Check if auth.users exists (this should always exist in Supabase)
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'auth' 
   AND table_name = 'users'
) as auth_users_table_exists;

-- Show structure of users table if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show structure of auth.users (should exist in Supabase)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- Show sample data from users table if it exists
SELECT 'Sample data from public.users table:' as info;
SELECT id, email, full_name, user_type 
FROM users 
LIMIT 3;

-- Show sample data from auth.users (should exist in Supabase)
SELECT 'Sample data from auth.users table:' as info;
SELECT id, email, raw_user_meta_data 
FROM auth.users 
LIMIT 3;

-- Count users in each table
SELECT 
    'public.users' as table_name,
    COUNT(*) as user_count
FROM users
UNION ALL
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users;
