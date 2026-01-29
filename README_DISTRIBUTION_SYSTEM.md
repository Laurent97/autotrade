# Visit Distribution System - Complete Setup Guide

## 🎯 Problem Solved
The `visit_distribution` table was showing `total_distributed: 0` because there was no automated system to process the distribution configurations. This system now automatically distributes visits based on your settings.

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the Distribution System Setup
```sql
-- Run this in Supabase SQL Editor
-- File: database/create_distribution_system.sql
```

### Step 2: Sync Existing Visits
```sql
-- This will update total_distributed to match actual visits
SELECT * FROM sync_distribution_counts();
```

### Step 3: Test Manual Distribution
```sql
-- Test with your partner ID (replace with actual ID)
SELECT * FROM distribute_visits_for_partner('e2731c06-58b4-4f37-96c7-f721af43263c', 50);
```

### Step 4: Set Up Automatic Distribution
```sql
-- Run this to enable automatic distribution every minute
-- File: database/setup_distribution_cron.sql
```

## 📊 How It Works

### 1. **Distribution Function** (`distribute_visits()`)
- Reads all active `visit_distribution` configurations
- Calculates how many visits should be distributed based on time elapsed
- Adds visits to `store_visits` table
- Updates `total_distributed` and `last_distribution`

### 2. **Manual Distribution** (`distribute_visits_for_partner()`)
- Allows manual distribution for testing
- Adds specified number of visits immediately
- Updates distribution tracking

### 3. **Sync Function** (`sync_distribution_counts()`)
- Syncs `total_distributed` with actual visit counts
- Fixes any discrepancies between configuration and reality

### 4. **Cron Jobs** (Automatic)
- **Every minute**: Run distribution for active configs
- **Every 5 minutes**: Sync distribution counts
- **Daily at 2 AM**: Clean up old visits (optional)

## 🔧 Configuration Examples

### Example 1: 150,000 visits over 24 hours
```sql
-- This will distribute ~6,250 visits per hour
-- ~104 visits per minute
-- ~1.7 visits per second
INSERT INTO visit_distribution (
  partner_id,
  total_visits,
  time_period,
  visits_per_unit,
  is_active,
  start_time,
  end_time
) VALUES (
  'your-partner-id',
  150000,
  'hour',
  6250.00,
  true,
  NOW(),
  NOW() + INTERVAL '24 hours'
);
```

### Example 2: 2,000 visits over 1 hour
```sql
-- This will distribute ~33 visits per minute
-- ~0.55 visits per second
INSERT INTO visit_distribution (
  partner_id,
  total_visits,
  time_period,
  visits_per_unit,
  is_active,
  start_time,
  end_time
) VALUES (
  'your-partner-id',
  2000,
  'minute',
  33.33,
  true,
  NOW(),
  NOW() + INTERVAL '1 hour'
);
```

## 📈 Monitoring & Debugging

### Check Distribution Status
```sql
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
    END as sync_status,
    ROUND((vd.total_distributed / NULLIF(vd.total_visits, 0)) * 100, 2) as completion_percentage
FROM visit_distribution vd
LEFT JOIN store_visits sv ON vd.partner_id = sv.partner_id
WHERE vd.is_active = true
GROUP BY vd.id
ORDER BY vd.partner_id;
```

### Check Cron Jobs
```sql
SELECT jobname, schedule, active FROM cron.job ORDER BY jobid;
```

### Manual Distribution Test
```sql
-- Run distribution manually
SELECT * FROM distribute_visits();

-- Check results
SELECT partner_id, visits_added, total_distributed_now, message 
FROM distribute_visits();
```

## 🛠️ Troubleshooting

### Issue: `total_distributed` still shows 0
**Solution:**
1. Run `SELECT * FROM sync_distribution_counts();`
2. Check if cron jobs are active: `SELECT * FROM cron.job;`
3. Manually trigger: `SELECT * FROM distribute_visits();`

### Issue: Visits not appearing in analytics
**Solution:**
1. Check RLS policies: Run `fix_rls_policies_final.sql`
2. Verify foreign key: Run `fix_foreign_key_final.sql`
3. Check partner authentication in analytics

### Issue: Distribution running too fast/slow
**Solution:**
1. Adjust `visits_per_unit` in the configuration
2. Change `time_period` ('hour', 'minute', 'second')
3. Update cron job frequency if needed

## 🔄 Edge Function Alternative

If you prefer Edge Functions over cron jobs:

1. Deploy the Edge Function:
```bash
supabase functions deploy distribute-visits
```

2. Set up external cron (using cron-job.org, GitHub Actions, etc.):
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/distribute-visits' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

## 📝 Files Created

1. **`database/create_distribution_system.sql`** - Main distribution functions
2. **`database/setup_distribution_cron.sql`** - Automatic scheduling setup
3. **`supabase/functions/distribute-visits/index.ts`** - Edge Function alternative
4. **`database/fix_rls_policies_final.sql`** - RLS policy fixes
5. **`database/fix_foreign_key_final.sql`** - Foreign key constraint fixes

## 🎯 Expected Results

After setup:
- ✅ `total_distributed` will automatically increase
- ✅ Visits will appear in partner analytics
- ✅ Distribution runs automatically every minute
- ✅ System stays in sync with actual visits
- ✅ Manual override available for testing

## 🚨 Important Notes

- The system respects `total_visits` limits
- Distribution stops when `end_time` is reached
- `is_active = false` pauses distribution
- All visits have realistic session durations and page paths
- System handles multiple partners simultaneously

## 🎉 Success Indicators

You'll know it's working when:
1. `total_distributed` > 0 in `visit_distribution` table
2. New visits appear in `store_visits` table
3. Analytics page shows real visit data
4. Cron jobs are active and running
5. Distribution status shows "✅ In Sync"
