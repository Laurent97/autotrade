-- Setup sample visit data for testing store visits display
-- This script will populate both visit_distribution and store_visits tables

-- First, let's see if we have any partners to work with
SELECT id, email, user_type FROM users WHERE user_type = 'partner' LIMIT 5;

-- Add sample visit distribution for automated visits (replace with actual partner user_id)
INSERT INTO visit_distribution (
  partner_id,
  total_visits,
  time_period,
  visits_per_unit,
  is_active,
  start_time,
  end_time
) VALUES 
(
  'YOUR_PARTNER_USER_ID_HERE', -- Replace with actual partner user_id from users table
  500,
  'hour',
  20.83,
  true,
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '22 hours'
) ON CONFLICT (partner_id) DO UPDATE SET
  total_visits = EXCLUDED.total_visits,
  is_active = EXCLUDED.is_active,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  updated_at = NOW();

-- Add some manual store visits for testing
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  'YOUR_PARTNER_USER_ID_HERE', -- Replace with actual partner user_id
  'visitor_' || generate_series(1, 50) || '_' || EXTRACT(EPOCH FROM NOW()),
  CASE WHEN random() > 0.5 THEN '/products' ELSE '/store' END,
  floor(random() * 300 + 60), -- 60-360 seconds
  NOW() - (generate_series(1, 50) || ' minutes')::interval
WHERE NOT EXISTS (
  SELECT 1 FROM store_visits WHERE partner_id = 'YOUR_PARTNER_USER_ID_HERE'
);

-- Or add visits for all partners (if you have multiple)
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  u.id,
  'visitor_' || generate_series(1, 20) || '_' || EXTRACT(EPOCH FROM NOW()),
  CASE WHEN random() > 0.5 THEN '/products' ELSE '/store' END,
  floor(random() * 300 + 60),
  NOW() - (generate_series(1, 20) || ' minutes')::interval
FROM users u
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM store_visits sv WHERE sv.partner_id = u.id LIMIT 1
);

-- Verify the data was added
SELECT 
  'visit_distribution' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_distributions
FROM visit_distribution
UNION ALL
SELECT 
  'store_visits' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as recent_visits
FROM store_visits;

-- Check visits by partner
SELECT 
  u.email,
  vd.partner_id,
  vd.total_visits as scheduled_visits,
  vd.is_active,
  COUNT(sv.id) as actual_manual_visits
FROM visit_distribution vd
LEFT JOIN users u ON u.id = vd.partner_id
LEFT JOIN store_visits sv ON sv.partner_id = vd.partner_id
GROUP BY u.email, vd.partner_id, vd.total_visits, vd.is_active
ORDER BY vd.is_active DESC, u.email;
