-- Real-time visit simulation function (FIXED VERSION)
-- This function can be called periodically to simulate ongoing store visits

-- Create a function to simulate random visits for active partners
CREATE OR REPLACE FUNCTION simulate_partner_visits()
RETURNS void AS $$
DECLARE
  partner_record RECORD;
  visits_to_add integer;
  new_visitor_id text;
  page_choice text;
  session_duration integer;
  results_text text;
BEGIN
  -- Create a temporary table to store results
  CREATE TEMPORARY TABLE IF NOT EXISTS temp_simulation_results (
    partner_id uuid,
    visits_added integer,
    partner_email text
  );
  
  -- Loop through all active partners
  FOR partner_record IN 
    SELECT u.id, u.email
    FROM users u
    WHERE u.user_type = 'partner'
    AND EXISTS (
      SELECT 1 FROM partner_profiles pp 
      WHERE pp.user_id = u.id 
      AND pp.is_active = true
    )
  LOOP
    -- Random number of visits to add (0-3 visits per simulation)
    visits_to_add := floor(random() * 4);
    
    -- Add visits for this partner
    FOR i IN 1..visits_to_add LOOP
      -- Generate unique visitor ID
      new_visitor_id := 'visitor_' || partner_record.id::text || '_' || EXTRACT(EPOCH FROM NOW())::text || '_' || i;
      
      -- Random page choice
      page_choice := CASE random()
        WHEN 0.0 < random() AND random() <= 0.4 THEN '/products'
        WHEN 0.4 < random() AND random() <= 0.7 THEN '/store'
        WHEN 0.7 < random() AND random() <= 0.85 THEN '/about'
        WHEN 0.85 < random() AND random() <= 0.95 THEN '/contact'
        ELSE '/checkout'
      END;
      
      -- Random session duration (30-300 seconds)
      session_duration := floor(random() * 271 + 30);
      
      -- Insert the visit
      INSERT INTO store_visits (
        partner_id,
        visitor_id,
        page_visited,
        session_duration,
        created_at
      ) VALUES (
        partner_record.id,
        new_visitor_id,
        page_choice,
        session_duration,
        NOW() - (floor(random() * 60) || ' seconds')::interval
      );
    END LOOP;
    
    -- Store results for this partner
    IF visits_to_add > 0 THEN
      INSERT INTO temp_simulation_results VALUES (partner_record.id, visits_to_add, partner_record.email);
    END IF;
  END LOOP;
  
  -- Show results
  RAISE NOTICE 'Visit simulation completed. Results:';
  FOR results_text IN 
    SELECT format('Partner %s (%s): %d visits added', partner_email, partner_id, visits_added)
    FROM temp_simulation_results
    ORDER BY visits_added DESC
  LOOP
    RAISE NOTICE '%', results_text;
  END LOOP;
  
  -- Clean up
  DROP TABLE IF EXISTS temp_simulation_results;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get visit statistics
CREATE OR REPLACE FUNCTION get_visit_statistics()
RETURNS TABLE(
  total_partners integer,
  total_visits integer,
  visits_today integer,
  visits_this_week integer,
  avg_visits_per_partner numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT u.id) as total_partners,
    COUNT(sv.id) as total_visits,
    COUNT(CASE WHEN sv.created_at >= CURRENT_DATE THEN 1 END) as visits_today,
    COUNT(CASE WHEN sv.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as visits_this_week,
    CASE 
      WHEN COUNT(DISTINCT u.id) > 0 
      THEN ROUND(COUNT(sv.id)::numeric / COUNT(DISTINCT u.id), 2)
      ELSE 0
    END as avg_visits_per_partner
  FROM users u
  LEFT JOIN store_visits sv ON sv.partner_id = u.id
  WHERE u.user_type = 'partner';
END;
$$ LANGUAGE plpgsql;

-- Test the simulation function (run this to see it in action)
-- SELECT simulate_partner_visits();

-- Get current statistics
-- SELECT * FROM get_visit_statistics();

-- Create a simple trigger to add visits when products are viewed (optional)
CREATE OR REPLACE FUNCTION log_store_visit()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called when someone views a store page
  -- You can call this manually to simulate visits
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Manual trigger for testing visits
CREATE OR REPLACE FUNCTION add_manual_visit(partner_uuid uuid, page_name text DEFAULT '/store')
RETURNS void AS $$
BEGIN
  INSERT INTO store_visits (
    partner_id,
    visitor_id,
    page_visited,
    session_duration,
    created_at
  ) VALUES (
    partner_uuid,
    'manual_visit_' || EXTRACT(EPOCH FROM NOW())::text,
    page_name,
    floor(random() * 180 + 60),
    NOW()
  );
  
  RAISE NOTICE 'Manual visit added for partner %', partner_uuid;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT add_manual_visit('your-partner-uuid-here', '/products');
-- SELECT add_manual_visit('your-partner-uuid-here', '/store');
