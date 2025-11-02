# Database Schema Deployment Guide

## Quick Start (5 minutes)

### Step 1: Access Supabase SQL Editor

1. Open your browser and go to: **https://app.supabase.com**
2. Sign in to your account
3. Select your CarbonConstruct project
4. Click **"SQL Editor"** in the left sidebar (database icon)
5. Click **"+ New query"** button

### Step 2: Copy and Execute Schema

**Option A: Copy-Paste (Recommended)**

1. Open `agent_usage_schema.sql` in a text editor
2. Copy **ALL contents** (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (bottom right)
5. Wait for "Success. No rows returned" message

**Option B: Upload File**

1. In SQL Editor, click the "..." menu → "Import SQL"
2. Select `agent_usage_schema.sql`
3. Click "Run"

### Step 3: Verify Deployment

Run this verification query in SQL Editor:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agent_usage_log', 'agent_cache');

-- Expected output: 2 rows
-- agent_usage_log
-- agent_cache
```

If you see both tables, **deployment succeeded!** ✅

---

## Detailed Deployment Steps

### Pre-Deployment Checklist

- [ ] You have admin access to Supabase project
- [ ] Project is in active/healthy state (check Supabase dashboard)
- [ ] Database is accessible (no maintenance mode)
- [ ] You have a backup of existing data (if any)

### What Will Be Created

The schema creates the following database objects:

**Tables** (2):
1. `agent_usage_log` - Tracks all agent invocations
2. `agent_cache` - Caches agent responses for 1 hour

**Views** (2):
1. `agent_usage_stats` - Aggregated usage statistics
2. `agent_monthly_usage` - Monthly usage for rate limiting

**Functions** (3):
1. `get_user_monthly_usage()` - Returns user's quota status
2. `clean_expired_cache()` - Removes old cache entries
3. `update_cache_access()` - Updates cache hit counter

**Indexes** (7):
- Performance indexes on user_id, timestamp, agent_type
- Composite index for rate limiting queries

**RLS Policies** (6):
- Users can view own logs
- Service role can insert/update logs
- Service role can manage cache

### Deployment Process

#### 1. Open Supabase Dashboard

```
URL: https://app.supabase.com/project/YOUR_PROJECT_ID
```

Navigate: **Database** → **SQL Editor**

#### 2. Create New Query

Click: **"+ New query"** (or use existing unnamed query)

#### 3. Copy Schema SQL

Open file: `database/agent_usage_schema.sql`

Copy all contents (Ctrl+A, Ctrl+C)

**File size**: ~8 KB, ~300 lines

#### 4. Paste and Execute

1. Paste into SQL Editor (Ctrl+V)
2. Review the SQL (optional but recommended)
3. Click **"Run"** button (play icon ▶)
4. Wait 5-10 seconds for execution

#### 5. Check for Errors

**Success Message**:
```
Success. No rows returned
```

**If you see errors**, check:
- Is `auth.users` table present? (Required for foreign keys)
- Do you have CREATE TABLE permissions?
- Is another session blocking?

#### 6. Verify Tables Created

Run this query:

```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE '%agent%'
ORDER BY table_name;
```

**Expected Output**:
```
agent_cache          | 10 columns
agent_usage_log      | 11 columns
```

#### 7. Verify RLS Policies

```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_usage_log', 'agent_cache')
ORDER BY tablename, policyname;
```

**Expected Output**: 6 policies (3 for each table)

#### 8. Verify Functions

```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%agent%'
ORDER BY routine_name;
```

**Expected Output**: 3 functions

#### 9. Test Functions

```sql
-- Test get_user_monthly_usage (should return empty result set initially)
SELECT * FROM get_user_monthly_usage(auth.uid());

-- Should complete without errors
```

---

## Post-Deployment Configuration

### 1. Update Subscription Table

Add `features` column to subscriptions table (if not already present):

```sql
-- Check if features column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'features';

-- If not found, add it:
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing Pro subscriptions
UPDATE subscriptions
SET features = ARRAY['ai_agents', 'unlimited_projects', 'priority_support']
WHERE tier = 'pro'
  AND status = 'active'
  AND (features IS NULL OR NOT 'ai_agents' = ANY(features));

-- Update existing Enterprise subscriptions
UPDATE subscriptions
SET features = ARRAY['ai_agents', 'unlimited_projects', 'priority_support', 'custom_branding', 'api_access']
WHERE tier = 'enterprise'
  AND status = 'active'
  AND (features IS NULL OR NOT 'ai_agents' = ANY(features));

-- Verify updates
SELECT tier, features, COUNT(*)
FROM subscriptions
GROUP BY tier, features;
```

### 2. Grant Permissions (if needed)

If you have custom roles, grant permissions:

```sql
-- Grant SELECT on usage logs to authenticated users
GRANT SELECT ON agent_usage_log TO authenticated;
GRANT SELECT ON agent_usage_stats TO authenticated;
GRANT SELECT ON agent_monthly_usage TO authenticated;

-- Grant EXECUTE on functions
GRANT EXECUTE ON FUNCTION get_user_monthly_usage(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION clean_expired_cache() TO service_role;
GRANT EXECUTE ON FUNCTION update_cache_access(VARCHAR) TO service_role;
```

### 3. Set Up Scheduled Cache Cleanup (Optional)

**Option A: Using pg_cron (if enabled)**

```sql
-- Schedule daily cache cleanup at 3 AM
SELECT cron.schedule(
  'clean-agent-cache',
  '0 3 * * *',
  'SELECT clean_expired_cache();'
);
```

**Option B: Manual Cleanup Script**

Save this as a Vercel cron job or GitHub Action:

```javascript
// api/cron/clean-cache.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.rpc('clean_expired_cache');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ cleaned: data, timestamp: new Date().toISOString() });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/clean-cache",
    "schedule": "0 3 * * *"
  }]
}
```

---

## Testing the Deployment

### Test 1: Manual Insert

```sql
-- Insert a test log entry
INSERT INTO agent_usage_log (
  user_id,
  agent_type,
  action,
  execution_time,
  success,
  cost
) VALUES (
  auth.uid(),  -- Your user ID
  'cc-lca-analyst',
  'test_action',
  1.234,
  true,
  0.0231
);

-- Verify insert
SELECT * FROM agent_usage_log
WHERE action = 'test_action';

-- Clean up test data
DELETE FROM agent_usage_log
WHERE action = 'test_action';
```

### Test 2: Usage Statistics View

```sql
-- Should return empty or existing stats
SELECT * FROM agent_usage_stats
WHERE user_id = auth.uid();
```

### Test 3: Monthly Usage Function

```sql
-- Should return empty array or usage breakdown
SELECT * FROM get_user_monthly_usage(auth.uid());

-- Example output after some usage:
-- agent_type           | invocations | limit_remaining
-- cc-lca-analyst      | 5           | 45
-- compliance-checker  | 2           | 48
```

### Test 4: Cache Insert

```sql
-- Insert test cache entry
INSERT INTO agent_cache (
  cache_key,
  agent_type,
  action,
  input_hash,
  output_data,
  expires_at
) VALUES (
  'test_cache_key',
  'cc-lca-analyst',
  'calculate_lca',
  'abc123',
  '{"result": "test"}',
  NOW() + INTERVAL '1 hour'
);

-- Verify cache entry
SELECT * FROM agent_cache
WHERE cache_key = 'test_cache_key';

-- Clean up
DELETE FROM agent_cache
WHERE cache_key = 'test_cache_key';
```

### Test 5: RLS Policies

```sql
-- Test as authenticated user (should only see own logs)
-- Switch to authenticated context
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'YOUR_USER_ID';

-- Should only return your logs
SELECT * FROM agent_usage_log;

-- Reset role
RESET ROLE;
```

---

## Troubleshooting

### Error: "relation 'auth.users' does not exist"

**Solution**: Supabase auth schema not initialized. This should not happen in normal Supabase projects.

```sql
-- Verify auth schema exists
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'auth';
```

If missing, contact Supabase support.

### Error: "permission denied for table agent_usage_log"

**Solution**: Grant proper permissions.

```sql
-- As postgres/admin user
GRANT ALL ON agent_usage_log TO postgres;
GRANT SELECT ON agent_usage_log TO authenticated;
```

### Error: "function gen_random_uuid() does not exist"

**Solution**: Enable pgcrypto extension.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: "duplicate key value violates unique constraint"

**Solution**: Policy or index already exists. Safe to ignore if using `IF NOT EXISTS`.

### Tables Created But Functions Missing

**Solution**: Re-run the function creation portion of the schema.

```sql
-- Extract function definitions from agent_usage_schema.sql
-- Run only the CREATE FUNCTION sections
```

### RLS Blocking API Inserts

**Solution**: Ensure API uses service role key, not anon key.

```javascript
// In api/invoke-agent.js
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Not SUPABASE_ANON_KEY!
);
```

---

## Rollback Procedure

If you need to undo the deployment:

```sql
-- Drop tables (cascades to views and policies)
DROP TABLE IF EXISTS agent_usage_log CASCADE;
DROP TABLE IF EXISTS agent_cache CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_monthly_usage(UUID, VARCHAR);
DROP FUNCTION IF EXISTS clean_expired_cache();
DROP FUNCTION IF EXISTS update_cache_access(VARCHAR);

-- Drop views (if not cascade-deleted)
DROP VIEW IF EXISTS agent_usage_stats;
DROP VIEW IF EXISTS agent_monthly_usage;
```

**WARNING**: This will delete all agent usage data!

---

## Monitoring and Maintenance

### Daily Checks

```sql
-- Check total agent invocations today
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_invocations,
  COUNT(*) FILTER (WHERE success = true) as successful,
  SUM(cost) as total_cost
FROM agent_usage_log
WHERE timestamp >= CURRENT_DATE
GROUP BY DATE(timestamp);
```

### Weekly Checks

```sql
-- Top users by usage
SELECT
  user_id,
  COUNT(*) as invocations,
  SUM(cost) as total_cost,
  AVG(execution_time) as avg_time
FROM agent_usage_log
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id
ORDER BY invocations DESC
LIMIT 10;
```

### Monthly Reports

```sql
-- Monthly cost breakdown
SELECT
  agent_type,
  COUNT(*) as invocations,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost_per_invocation,
  AVG(execution_time) as avg_execution_time
FROM agent_usage_log
WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY agent_type
ORDER BY total_cost DESC;
```

### Cache Performance

```sql
-- Cache hit rate
SELECT
  COUNT(*) as total_cache_entries,
  AVG(access_count) as avg_hits_per_entry,
  SUM(access_count) as total_cache_hits,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_entries
FROM agent_cache;
```

---

## Security Best Practices

1. **Use Service Role Key in API**: Never use anon key for writes
2. **Rotate Keys Regularly**: Update Supabase keys every 90 days
3. **Monitor Unusual Activity**: Set up alerts for spike in usage
4. **Audit Logs**: Keep agent_usage_log for 90 days minimum
5. **Backup Before Changes**: Always backup before schema modifications

---

## Next Steps After Deployment

- [ ] Verify tables created successfully
- [ ] Update subscription table with `features` column
- [ ] Test agent invocation from frontend (AI mode toggle)
- [ ] Monitor first few agent calls in `agent_usage_log`
- [ ] Set up cache cleanup cron job
- [ ] Configure monitoring alerts (optional)
- [ ] Document deployment date and version

---

## Support

If you encounter issues:

1. **Check Supabase Logs**: Dashboard → Logs → Database
2. **Review Error Messages**: Copy full error text
3. **Verify Permissions**: Ensure admin access
4. **Contact Support**: support@supabase.com (if needed)

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Notes**: _____________

---

**Schema Version**: 1.0.0
**Last Updated**: 2025-11-02
