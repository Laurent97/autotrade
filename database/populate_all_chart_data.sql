-- Populate sample data for ALL charts in the application
-- This script will create realistic data for revenue, earnings, orders, and analytics charts

-- First, let's see what partners we have
SELECT 
  COUNT(*) as total_partners,
  array_agg(u.id) as partner_ids
FROM users u 
WHERE u.user_type = 'partner';

-- 1. Populate sample orders for revenue charts
INSERT INTO orders (
  partner_id,
  customer_id,
  total_amount,
  status,
  payment_status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'customer_' || u.id::text || '_' || generate_series::text,
  -- Random order amounts between $50 and $500
  floor(random() * 451 + 50)::numeric,
  CASE 
    WHEN random() <= 0.6 THEN 'completed'
    WHEN random() <= 0.8 THEN 'paid'
    WHEN random() <= 0.95 THEN 'processing'
    ELSE 'pending'
  END,
  CASE 
    WHEN random() <= 0.8 THEN 'paid'
    ELSE 'pending'
  END,
  -- Distribute orders over the last 90 days
  NOW() - (generate_series * INTERVAL '1 hour'),
  NOW() - (generate_series * INTERVAL '1 hour')
FROM users u,
  generate_series(1, 50) -- 50 orders per partner
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.partner_id = u.id 
  LIMIT 1
);

-- 2. Add order items for each order
INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  unit_price,
  total_price
)
SELECT 
  o.id,
  'product_' || (floor(random() * 100) + 1)::text,
  floor(random() * 3 + 1), -- 1-3 items per order
  (o.total_amount / floor(random() * 3 + 1))::numeric,
  o.total_amount
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id
);

-- 3. Populate wallet transactions for earnings charts
INSERT INTO wallet_transactions (
  user_id,
  amount,
  type,
  status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  -- Commission earnings (10% of order amounts)
  (o.total_amount * 0.1)::numeric,
  'commission',
  'completed',
  o.created_at,
  o.created_at
FROM users u
JOIN orders o ON o.partner_id = u.id
WHERE u.user_type = 'partner'
AND o.status IN ('completed', 'paid')
AND o.payment_status = 'paid'
AND NOT EXISTS (
  SELECT 1 FROM wallet_transactions wt 
  WHERE wt.user_id = u.id 
  AND wt.type = 'commission'
  LIMIT 1
);

-- 4. Add some bonus transactions
INSERT INTO wallet_transactions (
  user_id,
  amount,
  type,
  status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  floor(random() * 500 + 100)::numeric,
  'bonus',
  'completed',
  NOW() - (generate_series * INTERVAL '1 day'),
  NOW() - (generate_series * INTERVAL '1 day')
FROM users u,
  generate_series(1, 3) -- 3 bonuses per partner
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM wallet_transactions wt 
  WHERE wt.user_id = u.id 
  AND wt.type = 'bonus'
  LIMIT 1
);

-- 5. Populate visit data for analytics charts
INSERT INTO store_visits (
  partner_id,
  visitor_id,
  page_visited,
  session_duration,
  created_at
)
SELECT 
  u.id,
  'visitor_' || u.id::text || '_' || generate_series::text || '_' || EXTRACT(EPOCH FROM NOW()),
  CASE 
    WHEN random() <= 0.4 THEN '/products'
    WHEN random() <= 0.7 THEN '/store'
    WHEN random() <= 0.85 THEN '/about'
    ELSE '/contact'
  END,
  floor(random() * 300 + 60), -- 60-360 seconds
  NOW() - (generate_series * INTERVAL '2 hours')
FROM users u,
  generate_series(1, 100) -- 100 visits per partner
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM store_visits sv 
  WHERE sv.partner_id = u.id 
  LIMIT 1
);

-- 6. Populate visit distribution for automated visits
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
  floor(random() * 800 + 200), -- 200-1000 visits
  'hour',
  round((floor(random() * 800 + 200))::numeric / 24, 2),
  true,
  NOW() - INTERVAL '3 hours',
  NOW() + INTERVAL '21 hours'
FROM users u
WHERE u.user_type = 'partner'
AND NOT EXISTS (
  SELECT 1 FROM visit_distribution vd 
  WHERE vd.partner_id = u.id
);

-- Verify the data was added
SELECT 
  'orders' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
FROM orders
UNION ALL
SELECT 
  'order_items' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN quantity > 1 THEN 1 END) as multi_item_orders
FROM order_items
UNION ALL
SELECT 
  'wallet_transactions' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN type = 'commission' THEN 1 END) as commission_transactions
FROM wallet_transactions
UNION ALL
SELECT 
  'store_visits' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_visits
FROM store_visits
UNION ALL
SELECT 
  'visit_distribution' as table_name,
  COUNT(*) as record_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_distributions
FROM visit_distribution;

-- Show summary by partner
SELECT 
  u.email,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  COUNT(wt.id) FILTER (WHERE wt.type = 'commission') as commission_transactions,
  COUNT(sv.id) as total_visits
FROM users u
LEFT JOIN orders o ON o.partner_id = u.id
LEFT JOIN wallet_transactions wt ON wt.user_id = u.id
LEFT JOIN store_visits sv ON sv.partner_id = u.id
WHERE u.user_type = 'partner'
GROUP BY u.email
ORDER BY total_revenue DESC NULLS LAST;
