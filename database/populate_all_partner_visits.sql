-- Populate sample visit data for ALL partners automatically
-- This script will add sample visits for all existing partners in the system

-- First, let's see how many partners we have
SELECT 
  COUNT(*) as total_partners,
  array_agg(u.id) as partner_ids
FROM users u 
WHERE u.user_type = 'partner';

-- Add sample visit distribution for ALL partners
INSERT INTO visit_distribution (
  partner_id,
  total_visits,
  time_period,
  visits_per_unit,
  is_active,
  start_time,
  end_time
)
SELECT 
  u.id,
  -- Random total visits between 200-1000 for each partner
  floor(random() * 801 + 200),
  'hour',
  -- Calculate visits per unit (total_visits / 24 hours)
  round((floor(random() * 801 + 200))::numeric / 24, 2),
  true,
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '22 hours'
FROM users u 
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM visit_distribution vd 
  WHERE vd.partner_id = u.id AND vd.is_active = true
)
ON CONFLICT (partner_id) DO UPDATE SET
  total_visits = EXCLUDED.total_visits,
  is_active = EXCLUDED.is_active,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  updated_at = NOW();

-- Add sample store visits for ALL partners (last 30 days of data)
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  u.id,
  -- Generate unique visitor IDs
  'visitor_' || u.id::text || '_' || generate_series::text || '_' || EXTRACT(EPOCH FROM NOW()),
  CASE 
    WHEN random() > 0.6 THEN '/products'
    WHEN random() > 0.3 THEN '/store'
    WHEN random() > 0.1 THEN '/about'
    ELSE '/contact'
  END,
  -- Random session duration between 30-300 seconds
  floor(random() * 271 + 30),
  -- Distribute visits over the last 30 days
  NOW() - (generate_series * INTERVAL '1 hour')
FROM users u,
  generate_series(1, 50) -- 50 visits per partner
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM store_visits sv 
  WHERE sv.partner_id = u.id 
  LIMIT 1
);

-- Add more visits for some partners to create variety
INSERT INTO store_visits (partner_id, visitor_id, page_visited, session_duration, created_at)
SELECT 
  u.id,
  'visitor_' || u.id::text || '_recent_' || generate_series::text || '_' || EXTRACT(EPOCH FROM NOW()),
  CASE 
    WHEN random() > 0.5 THEN '/products'
    WHEN random() > 0.25 THEN '/store'
    ELSE '/checkout'
  END,
  floor(random() * 180 + 60),
  -- Recent visits (last 7 days)
  NOW() - (generate_series * INTERVAL '2 hours')
FROM users u,
  generate_series(1, 20) -- 20 recent visits per partner
WHERE u.user_type = 'partner'
AND random() > 0.3 -- Only for 70% of partners (creates variety)
AND EXISTS (
  SELECT 1 FROM store_visits sv 
  WHERE sv.partner_id = u.id 
  LIMIT 1
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
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_visits
FROM store_visits;

-- Show visit distribution by partner
SELECT 
  u.email,
  vd.partner_id,
  vd.total_visits as scheduled_visits,
  vd.is_active,
  COUNT(sv.id) as actual_visits
FROM visit_distribution vd
LEFT JOIN users u ON u.id = vd.partner_id
LEFT JOIN store_visits sv ON sv.partner_id = vd.partner_id
GROUP BY u.email, vd.partner_id, vd.total_visits, vd.is_active
ORDER BY actual_visits DESC NULLS LAST
LIMIT 10;
