-- Setup cron job for automatic visit distribution
-- This creates a scheduled task to run the distribution system

-- Step 1: Enable the cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create a cron job to run distribution every minute
-- This will automatically distribute visits based on active configurations
SELECT cron.schedule(
  'distribute-visits-every-minute',
  '* * * * *',  -- Every minute
  $$
  SELECT * FROM distribute_visits();
  $$
);

-- Step 3: Create a cron job to sync distribution counts every 5 minutes
-- This ensures the total_distributed stays in sync with actual visits
SELECT cron.schedule(
  'sync-distribution-counts',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT * FROM sync_distribution_counts();
  $$
);

-- Step 4: Create a cron job to clean up old visits (optional)
-- This removes visits older than 30 days to keep the table clean
SELECT cron.schedule(
  'cleanup-old-visits',
  '0 2 * * *',  -- Every day at 2 AM
  $$
  DELETE FROM store_visits 
  WHERE created_at < NOW() - INTERVAL '30 days'
  RETURNING COUNT(*) as deleted_visits;
  $$
);

-- Step 5: View all scheduled jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job 
ORDER BY jobid;

-- Step 6: Test the distribution system manually
-- This will run the distribution immediately
SELECT * FROM distribute_visits();

-- Step 7: Check current distribution status
SELECT 
    vd.partner_id,
    vd.total_visits,
    vd.total_distributed,
    vd.visits_per_unit,
    vd.time_period,
    vd.is_active,
    vd.start_time,
    vd.end_time,
    vd.last_distribution,
    COUNT(sv.id) as actual_store_visits,
    CASE 
        WHEN vd.total_distributed = COUNT(sv.id) THEN '✅ In Sync'
        ELSE '❌ Out of Sync'
    END as sync_status,
    ROUND((vd.total_distributed / NULLIF(vd.total_visits, 0)) * 100, 2) as completion_percentage
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
    vd.is_active,
    vd.start_time,
    vd.end_time,
    vd.last_distribution
ORDER BY vd.partner_id;

-- Step 8: Manual trigger for specific partner (for testing)
-- Replace 'e2731c06-58b4-4f37-96c7-f721af43263c' with your partner ID
SELECT * FROM distribute_visits_for_partner('e2731c06-58b4-4f37-96c7-f721af43263c', 100);

-- Step 9: Stop all cron jobs (if needed)
-- Uncomment these lines if you want to stop the automatic distribution
-- SELECT cron.unschedule('distribute-visits-every-minute');
-- SELECT cron.unschedule('sync-distribution-counts');
-- SELECT cron.unschedule('cleanup-old-visits');
