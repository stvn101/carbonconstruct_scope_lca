-- ========================================
-- Agent Usage Logging Schema
-- ========================================
-- Purpose: Track agent invocations for analytics, billing, and rate limiting
-- Created: 2025-11-02

-- Agent Usage Log Table
CREATE TABLE IF NOT EXISTS agent_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(100) NOT NULL CHECK (agent_type IN ('cc-lca-analyst', 'compliance-checker', 'materials-database-manager', 'construction-estimator')),
  action VARCHAR(100) NOT NULL,
  execution_time NUMERIC(10,3), -- seconds
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  input_data JSONB, -- Store input payload for debugging
  output_data JSONB, -- Store output for caching
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cost NUMERIC(10,4) DEFAULT 0, -- Cost in USD

  CONSTRAINT valid_execution_time CHECK (execution_time >= 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_usage_user_id ON agent_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_timestamp ON agent_usage_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_usage_agent_type ON agent_usage_log(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_usage_success ON agent_usage_log(success);

-- Index for rate limiting queries (user + month)
CREATE INDEX IF NOT EXISTS idx_agent_usage_rate_limit ON agent_usage_log(user_id, timestamp);

-- ========================================
-- Row Level Security Policies
-- ========================================

-- Enable RLS
ALTER TABLE agent_usage_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage logs
CREATE POLICY "Users can view own agent usage"
ON agent_usage_log FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can insert usage logs (API endpoint)
CREATE POLICY "Service role can insert agent usage"
ON agent_usage_log FOR INSERT
WITH CHECK (true); -- API endpoint uses service role

-- Policy: Service role can update usage logs
CREATE POLICY "Service role can update agent usage"
ON agent_usage_log FOR UPDATE
USING (true); -- Only service role should update

-- ========================================
-- Agent Cache Table
-- ========================================
-- Purpose: Cache agent responses for identical requests

CREATE TABLE IF NOT EXISTS agent_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  agent_type VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  input_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of input
  output_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  CONSTRAINT valid_access_count CHECK (access_count >= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_cache_key ON agent_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_agent_cache_hash ON agent_cache(input_hash);
CREATE INDEX IF NOT EXISTS idx_agent_cache_expires ON agent_cache(expires_at);

-- Enable RLS
ALTER TABLE agent_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage cache
CREATE POLICY "Service role can manage cache"
ON agent_cache FOR ALL
USING (true);

-- ========================================
-- Usage Statistics View
-- ========================================

CREATE OR REPLACE VIEW agent_usage_stats AS
SELECT
  user_id,
  agent_type,
  COUNT(*) as total_invocations,
  COUNT(*) FILTER (WHERE success = true) as successful_invocations,
  COUNT(*) FILTER (WHERE success = false) as failed_invocations,
  AVG(execution_time) FILTER (WHERE success = true) as avg_execution_time,
  SUM(cost) as total_cost,
  MIN(timestamp) as first_usage,
  MAX(timestamp) as last_usage
FROM agent_usage_log
GROUP BY user_id, agent_type;

-- ========================================
-- Monthly Usage View (for Rate Limiting)
-- ========================================

CREATE OR REPLACE VIEW agent_monthly_usage AS
SELECT
  user_id,
  agent_type,
  DATE_TRUNC('month', timestamp) as month,
  COUNT(*) as invocations,
  SUM(cost) as total_cost
FROM agent_usage_log
WHERE success = true
GROUP BY user_id, agent_type, DATE_TRUNC('month', timestamp);

-- ========================================
-- Functions
-- ========================================

-- Function: Get user's monthly usage count
CREATE OR REPLACE FUNCTION get_user_monthly_usage(
  p_user_id UUID,
  p_agent_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  agent_type VARCHAR,
  invocations BIGINT,
  limit_remaining INTEGER
) AS $$
DECLARE
  v_tier VARCHAR;
  v_limit INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  -- Default to free tier
  v_tier := COALESCE(v_tier, 'free');

  -- Set limits based on tier
  v_limit := CASE v_tier
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 50
    WHEN 'enterprise' THEN 999999
    ELSE 5
  END;

  -- Return usage stats
  RETURN QUERY
  SELECT
    aul.agent_type::VARCHAR,
    COUNT(*)::BIGINT as invocations,
    (v_limit - COUNT(*)::INTEGER)::INTEGER as limit_remaining
  FROM agent_usage_log aul
  WHERE aul.user_id = p_user_id
    AND aul.timestamp >= DATE_TRUNC('month', NOW())
    AND aul.success = true
    AND (p_agent_type IS NULL OR aul.agent_type = p_agent_type)
  GROUP BY aul.agent_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agent_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update cache access
CREATE OR REPLACE FUNCTION update_cache_access(p_cache_key VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_cache
  SET
    accessed_at = NOW(),
    access_count = access_count + 1
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Triggers
-- ========================================

-- Trigger: Auto-clean expired cache (daily)
-- Note: This would typically be done with pg_cron extension
-- For now, manual cleanup or API cron job

-- ========================================
-- Sample Data (for testing)
-- ========================================

-- Insert sample usage log (commented out for production)
-- INSERT INTO agent_usage_log (user_id, agent_type, action, execution_time, success) VALUES
-- ('00000000-0000-0000-0000-000000000000', 'cc-lca-analyst', 'calculate_lca', 2.5, true);

-- ========================================
-- Grants
-- ========================================

-- Grant access to authenticated users
GRANT SELECT ON agent_usage_log TO authenticated;
GRANT SELECT ON agent_usage_stats TO authenticated;
GRANT SELECT ON agent_monthly_usage TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_user_monthly_usage(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION clean_expired_cache() TO service_role;
GRANT EXECUTE ON FUNCTION update_cache_access(VARCHAR) TO service_role;

-- ========================================
-- Comments
-- ========================================

COMMENT ON TABLE agent_usage_log IS 'Tracks all agent invocations for analytics, billing, and rate limiting';
COMMENT ON TABLE agent_cache IS 'Caches agent responses for identical requests to reduce costs';
COMMENT ON VIEW agent_usage_stats IS 'Aggregated statistics of agent usage per user and agent type';
COMMENT ON VIEW agent_monthly_usage IS 'Monthly usage summary for rate limiting';
COMMENT ON FUNCTION get_user_monthly_usage IS 'Returns user monthly usage with remaining limit based on subscription tier';
COMMENT ON FUNCTION clean_expired_cache IS 'Removes expired cache entries';
COMMENT ON FUNCTION update_cache_access IS 'Updates cache access timestamp and counter';

-- ========================================
-- Notes
-- ========================================

/*
Rate Limiting Logic:
- Free tier: 5 invocations/month
- Pro tier: 50 invocations/month
- Enterprise: Unlimited (999999)

Cache Strategy:
- Cache expires after 1 hour
- Cache key = SHA-256(agent_type + action + input)
- Update access_count on cache hit

Cost Tracking:
- Estimated costs based on Anthropic API pricing
- LCA analysis: ~$0.10 per invocation
- Compliance check: ~$0.05 per invocation
- Database sync: ~$0.02 per invocation

Usage:
1. Run this schema in Supabase SQL editor
2. Verify tables created with: SELECT * FROM agent_usage_log LIMIT 1;
3. Test rate limiting with: SELECT * FROM get_user_monthly_usage(auth.uid());
4. Monitor usage with: SELECT * FROM agent_usage_stats WHERE user_id = auth.uid();
*/
