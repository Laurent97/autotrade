-- Create automated visit distribution system
-- This implements the backend logic to process visit_distribution configurations

-- Step 1: Create the main distribution function
CREATE OR REPLACE FUNCTION distribute_visits()
RETURNS TABLE(
    partner_id UUID,
    visits_added INTEGER,
    total_distributed_now INTEGER,
    message TEXT
) AS $$
DECLARE
    config RECORD;
    visits_to_add INTEGER;
    seconds_since_last BIGINT;
    visits_per_second DECIMAL;
    i INTEGER;
    result RECORD;
BEGIN
    -- Create temporary table for results
    CREATE TEMP TABLE IF NOT EXISTS distribution_results (
        partner_id UUID,
        visits_added INTEGER,
        total_distributed_now INTEGER,
        message TEXT
    ) ON COMMIT DROP;
    
    -- Loop through all active distributions
    FOR config IN 
        SELECT * FROM visit_distribution 
        WHERE is_active = true 
        AND (end_time IS NULL OR end_time > NOW())
        AND total_distributed < total_visits
    LOOP
        -- Calculate time since last distribution (or start_time if never distributed)
        IF config.last_distribution IS NULL THEN
            seconds_since_last := EXTRACT(EPOCH FROM (NOW() - config.start_time))::BIGINT;
        ELSE
            seconds_since_last := EXTRACT(EPOCH FROM (NOW() - config.last_distribution))::BIGINT;
        END IF;
        
        -- Skip if less than 1 second passed
        IF seconds_since_last < 1 THEN
            INSERT INTO distribution_results VALUES (config.partner_id, 0, config.total_distributed, 'Too soon to distribute');
            CONTINUE;
        END IF;
        
        -- Calculate visits to add based on time period
        CASE config.time_period
            WHEN 'hour' THEN
                visits_per_second := config.visits_per_unit / 3600.0;
            WHEN 'minute' THEN
                visits_per_second := config.visits_per_unit / 60.0;
            WHEN 'second' THEN
                visits_per_second := config.visits_per_unit;
            ELSE
                visits_per_second := 0;
        END CASE;
        
        visits_to_add := FLOOR(visits_per_second * seconds_since_last);
        
        -- Don't exceed total_visits
        IF config.total_distributed + visits_to_add > config.total_visits THEN
            visits_to_add := config.total_visits - config.total_distributed;
        END IF;
        
        -- Add the visits
        IF visits_to_add > 0 THEN
            FOR i IN 1..visits_to_add LOOP
                INSERT INTO store_visits (
                    partner_id,
                    visitor_id,
                    page_visited,
                    session_duration,
                    created_at
                ) VALUES (
                    config.partner_id,
                    'auto_' || config.partner_id || '_' || EXTRACT(EPOCH FROM NOW()) || '_' || i,
                    CASE (i % 5)
                        WHEN 0 THEN '/store'
                        WHEN 1 THEN '/products'
                        WHEN 2 THEN '/categories'
                        WHEN 3 THEN '/cart'
                        ELSE '/checkout'
                    END,
                    FLOOR(random() * 300 + 60), -- 60-360 seconds
                    NOW() - (random() * seconds_since_last || ' seconds')::INTERVAL
                );
            END LOOP;
            
            -- Update distribution record
            UPDATE visit_distribution 
            SET 
                total_distributed = total_distributed + visits_to_add,
                last_distribution = NOW(),
                updated_at = NOW()
            WHERE id = config.id;
            
            INSERT INTO distribution_results VALUES (
                config.partner_id, 
                visits_to_add, 
                config.total_distributed + visits_to_add, 
                'Successfully distributed'
            );
            
            RAISE NOTICE 'Added % visits for partner % (total: %)', visits_to_add, config.partner_id, config.total_distributed + visits_to_add;
        ELSE
            INSERT INTO distribution_results VALUES (config.partner_id, 0, config.total_distributed, 'No visits to distribute');
        END IF;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT * FROM distribution_results;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a function to manually trigger distribution for a specific partner
CREATE OR REPLACE FUNCTION distribute_visits_for_partner(
    target_partner_id UUID,
    manual_visits INTEGER DEFAULT 100
)
RETURNS TABLE(
    success BOOLEAN,
    visits_added INTEGER,
    message TEXT
) AS $$
DECLARE
    config_id UUID;
    current_distributed INTEGER;
    i INTEGER;
BEGIN
    -- Get the active config for this partner
    SELECT id, total_distributed INTO config_id, current_distributed
    FROM visit_distribution 
    WHERE partner_id = target_partner_id 
    AND is_active = true
    LIMIT 1;
    
    IF config_id IS NULL THEN
        RETURN QUERY SELECT false, 0::INTEGER, 'No active distribution found for partner'::TEXT;
        RETURN;
    END IF;
    
    -- Add manual visits
    FOR i IN 1..manual_visits LOOP
        INSERT INTO store_visits (
            partner_id,
            visitor_id,
            page_visited,
            session_duration,
            created_at
        ) VALUES (
            target_partner_id,
            'manual_dist_' || EXTRACT(EPOCH FROM NOW()) || '_' || i,
            CASE (i % 5)
                WHEN 0 THEN '/store'
                WHEN 1 THEN '/products'
                WHEN 2 THEN '/categories'
                WHEN 3 THEN '/cart'
                ELSE '/checkout'
            END,
            FLOOR(random() * 300 + 60),
            NOW() - (random() * 86400 || ' seconds')::INTERVAL -- Within last 24 hours
        );
    END LOOP;
    
    -- Update distribution count
    UPDATE visit_distribution 
    SET 
        total_distributed = total_distributed + manual_visits,
        last_distribution = NOW(),
        updated_at = NOW()
    WHERE id = config_id;
    
    RETURN QUERY SELECT true, manual_visits, 'Successfully added manual visits'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to sync existing visits with distribution counts
CREATE OR REPLACE FUNCTION sync_distribution_counts()
RETURNS TABLE(
    partner_id UUID,
    actual_visits INTEGER,
    recorded_distributed INTEGER,
    updated BOOLEAN,
    message TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH actual_visit_counts AS (
        SELECT 
            vd.partner_id,
            COUNT(sv.id) as actual_visits,
            vd.total_distributed as recorded_distributed,
            MIN(sv.created_at) as earliest_visit,
            MAX(sv.created_at) as latest_visit
        FROM visit_distribution vd
        LEFT JOIN store_visits sv ON vd.partner_id = sv.partner_id
            AND sv.created_at >= COALESCE(vd.start_time, sv.created_at)
            AND (vd.end_time IS NULL OR sv.created_at <= vd.end_time)
        WHERE vd.is_active = true
        GROUP BY vd.id, vd.partner_id, vd.total_distributed
    )
    SELECT 
        avc.partner_id,
        avc.actual_visits,
        avc.recorded_distributed,
        (UPDATE visit_distribution 
         SET 
             total_distributed = avc.actual_visits,
             last_distribution = avc.latest_visit,
             updated_at = NOW()
         WHERE partner_id = avc.partner_id
         AND is_active = true) IS NOT NULL as updated,
        CASE 
            WHEN avc.actual_visits != avc.recorded_distributed 
            THEN 'Synced ' || (avc.actual_visits - avc.recorded_distributed) || ' visits'
            ELSE 'Already in sync'
        END as message
    FROM actual_visit_counts avc;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Test the functions
-- First, sync existing visits
SELECT * FROM sync_distribution_counts();

-- Then test manual distribution for your specific partner
SELECT * FROM distribute_visits_for_partner('e2731c06-58b4-4f37-96c7-f721af43263c', 50);

-- Test the main distribution function
SELECT * FROM distribute_visits();

-- Check the results
SELECT 
    vd.partner_id,
    vd.total_visits,
    vd.total_distributed,
    vd.visits_per_unit,
    vd.time_period,
    vd.is_active,
    COUNT(sv.id) as actual_store_visits,
    CASE 
        WHEN vd.total_distributed = COUNT(sv.id) THEN '✅ In Sync'
        ELSE '❌ Out of Sync'
    END as sync_status
FROM visit_distribution vd
LEFT JOIN store_visits sv ON vd.partner_id = sv.partner_id
    AND sv.created_at >= COALESCE(vd.start_time, sv.created_at)
    AND (vd.end_time IS NULL OR sv.created_at <= vd.end_time)
WHERE vd.is_active = true
GROUP BY 
    vd.id, 
    vd.partner_id, 
    vd.total_visits, 
    vd.total_distributed,
    vd.visits_per_unit,
    vd.time_period,
    vd.is_active
ORDER BY vd.partner_id;
