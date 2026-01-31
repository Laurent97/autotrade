-- Add sample store visits data for testing
-- This will populate the store_visits JSONB column with sample data

-- Update a sample partner with some visit data (replace with actual partner user_id)
UPDATE partner_profiles 
SET store_visits = '{"today": 15, "thisWeek": 87, "thisMonth": 342, "allTime": 1256}'
WHERE user_id = 'YOUR_PARTNER_USER_ID_HERE';

-- Or update all partners with sample data
UPDATE partner_profiles 
SET store_visits = 
  CASE 
    WHEN store_visits = '{"today": 0, "thisWeek": 0, "thisMonth": 0, "allTime": 0}' OR store_visits IS NULL
    THEN '{"today": 25, "thisWeek": 120, "thisMonth": 450, "allTime": 1800}'
    ELSE store_visits
  END;

-- Verify the update
SELECT 
  user_id,
  store_name,
  store_visits,
  updated_at
FROM partner_profiles 
WHERE store_visits IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
