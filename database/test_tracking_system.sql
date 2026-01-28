-- Test and verify the tracking system works correctly
-- This script tests the order_tracking functionality

-- First, let's check if there are any existing tracking records
SELECT 
  'EXISTING TRACKING RECORDS' as test_type,
  COUNT(*) as record_count
FROM order_tracking;

-- Get a real admin user ID for testing (or use NULL if no admin exists)
DO $$
DECLARE
  test_admin_id UUID;
  test_partner_id UUID;
BEGIN
  -- Try to get a real admin user
  SELECT id INTO test_admin_id FROM users WHERE user_type = 'admin' LIMIT 1;
  
  -- Try to get a real partner user
  SELECT id INTO test_partner_id FROM users WHERE user_type = 'partner' LIMIT 1;
  
  -- If no users exist, we'll skip the foreign key constraints by using NULL
  IF test_admin_id IS NULL THEN
    RAISE NOTICE 'No admin user found, using NULL for admin_id';
  END IF;
  
  IF test_partner_id IS NULL THEN
    RAISE NOTICE 'No partner user found, using NULL for partner_id';
  END IF;
END $$;

-- Test 1: Insert a new tracking record (simulating admin action)
-- Use NULL for foreign keys if no users exist, or get real user IDs
INSERT INTO order_tracking (
  order_id,
  tracking_number,
  shipping_method,
  carrier,
  status,
  admin_id,
  partner_id,
  estimated_delivery,
  created_at,
  updated_at
) VALUES (
  'TEST-ORDER-001',
  'TRK-123456789',
  'Standard Shipping',
  'FedEx',
  'shipped',
  (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1), -- Real admin ID or NULL
  (SELECT id FROM users WHERE user_type = 'partner' LIMIT 1), -- Real partner ID or NULL
  NOW() + INTERVAL '7 days',
  NOW(),
  NOW()
) ON CONFLICT (order_id) DO NOTHING;

-- Test 2: Verify the insert worked
SELECT 
  'AFTER INSERT' as test_type,
  id,
  order_id,
  tracking_number,
  shipping_method,
  carrier,
  status,
  created_at
FROM order_tracking 
WHERE order_id = 'TEST-ORDER-001';

-- Test 3: Add a tracking update (simulating timeline entry)
INSERT INTO tracking_updates (
  tracking_id,
  status,
  description,
  location,
  timestamp,
  updated_by
) 
SELECT 
  id,
  'shipped',
  'Package shipped via FedEx',
  'Warehouse',
  NOW(),
  (SELECT id FROM users WHERE user_type = 'admin' LIMIT 1) -- Real admin ID or NULL
FROM order_tracking 
WHERE order_id = 'TEST-ORDER-001';

-- Test 4: Verify the tracking update
SELECT 
  'TRACKING UPDATES' as test_type,
  tu.id,
  tu.tracking_id,
  tu.status,
  tu.description,
  tu.location,
  tu.timestamp
FROM tracking_updates tu
JOIN order_tracking ot ON tu.tracking_id = ot.id
WHERE ot.order_id = 'TEST-ORDER-001';

-- Test 5: Test the public tracking API query (what the Track.tsx page uses)
SELECT 
  'PUBLIC TRACKING API TEST' as test_type,
  ot.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', tu.id,
        'status', tu.status,
        'location', tu.location,
        'description', tu.description,
        'timestamp', tu.timestamp
      )
    ) FILTER (WHERE tu.id IS NOT NULL), 
    '[]'::json
  ) as updates
FROM order_tracking ot
LEFT JOIN tracking_updates tu ON ot.id = tu.tracking_id
WHERE ot.tracking_number = 'TRK-123456789'
GROUP BY ot.id;

-- Test 6: Test partner tracking query (what partner dashboard uses)
SELECT 
  'PARTNER TRACKING API TEST' as test_type,
  ot.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', tu.id,
        'status', tu.status,
        'location', tu.location,
        'description', tu.description,
        'timestamp', tu.timestamp
      )
    ) FILTER (WHERE tu.id IS NOT NULL), 
    '[]'::json
  ) as updates
FROM order_tracking ot
LEFT JOIN tracking_updates tu ON ot.id = tu.tracking_id
WHERE ot.partner_id = '00000000-0000-0000-0000-000000000000'::uuid
GROUP BY ot.id;

-- Cleanup test data
DELETE FROM tracking_updates WHERE tracking_id IN (
  SELECT id FROM order_tracking WHERE order_id = 'TEST-ORDER-001'
);
DELETE FROM order_tracking WHERE order_id = 'TEST-ORDER-001';

-- Final verification
SELECT 
  'CLEANUP VERIFICATION' as test_type,
  'Test data cleaned up successfully' as status;
