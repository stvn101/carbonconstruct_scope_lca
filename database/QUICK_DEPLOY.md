# Quick Deployment (2 Minutes)

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to: https://app.supabase.com
- Sign in
- Select your CarbonConstruct project
- Click **"SQL Editor"** (database icon in sidebar)

### 2. Deploy Schema
- Click **"+ New query"**
- Copy **ALL** of `agent_usage_schema.sql` (Ctrl+A, Ctrl+C in that file)
- Paste into SQL Editor (Ctrl+V)
- Click **"Run"** (or press Ctrl+Enter)
- Wait 5-10 seconds

**Expected Result**:
```
Success. No rows returned
```

### 3. Verify Deployment
- Clear the SQL Editor
- Copy **ALL** of `verify_deployment.sql`
- Paste and click **"Run"**

**Expected Output**:
```
✓ PASS: Both tables exist (agent_usage_log, agent_cache)
✓ PASS: All columns present (log: 11, cache: 10)
✓ PASS: Performance indexes created (found 7)
✓ PASS: Row Level Security enabled on both tables
✓ PASS: RLS policies created (found 6)
✓ PASS: Both views exist (agent_usage_stats, agent_monthly_usage)
✓ PASS: All 3 functions created
✓ PASS: Test insert successful
✓ PASS: Cache insert successful
✓ PASS: get_user_monthly_usage() executed successfully
```

### 4. Update Subscriptions Table (Optional)
If you have existing Pro/Enterprise users, add AI features:

```sql
-- Add features column (if not exists)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Enable AI for Pro users
UPDATE subscriptions
SET features = ARRAY['ai_agents', 'unlimited_projects', 'priority_support']
WHERE tier = 'pro' AND status = 'active';

-- Enable AI for Enterprise users
UPDATE subscriptions
SET features = ARRAY['ai_agents', 'unlimited_projects', 'priority_support', 'custom_branding', 'api_access']
WHERE tier = 'enterprise' AND status = 'active';

-- Verify
SELECT tier, features, COUNT(*) FROM subscriptions GROUP BY tier, features;
```

---

## Done! ✅

Your database is now ready for agent integration. Next steps:

1. Add `ANTHROPIC_API_KEY` to Vercel environment variables
2. Deploy your app to Vercel
3. Test AI mode in the calculator

---

## Troubleshooting

### If you see errors:

**"relation 'auth.users' does not exist"**
- Your Supabase project needs auth schema (should exist by default)
- Contact Supabase support if missing

**"permission denied"**
- Ensure you're using a database admin account
- Check project permissions in Supabase dashboard

**"function already exists"**
- Safe to ignore (means schema already deployed)
- Or run: `DROP FUNCTION IF EXISTS function_name CASCADE;` first

### Need help?
- Read full guide: `DEPLOYMENT_GUIDE.md`
- Check Supabase logs: Dashboard → Logs → Database
- Email: support@supabase.com
