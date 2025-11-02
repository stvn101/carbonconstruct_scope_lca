-- ========================================
-- Subscriptions Table Creation
-- ========================================
-- Purpose: Manage user subscriptions and feature access
-- Integrates with: Stripe webhooks, Supabase Auth

-- ========================================
-- Create subscriptions table
-- ========================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),

  -- Subscription details
  tier VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  status VARCHAR(50) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing')),

  -- Features (AI agents, unlimited projects, etc.)
  features TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Billing
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- ========================================
-- Indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ========================================
-- Row Level Security
-- ========================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own subscription (for self-service)
CREATE POLICY "Users can update own subscription"
ON subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
ON subscriptions FOR ALL
USING (true);

-- ========================================
-- Trigger: Update updated_at timestamp
-- ========================================

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ========================================
-- Helper function: Get user subscription
-- ========================================

CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  tier VARCHAR,
  status VARCHAR,
  features TEXT[],
  has_ai_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.tier,
    s.status,
    s.features,
    (s.status = 'active' AND 'ai_agents' = ANY(s.features)) as has_ai_access
  FROM subscriptions s
  WHERE s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Insert default free tier for existing users
-- ========================================

-- Add free tier subscription for all existing auth users who don't have one
INSERT INTO subscriptions (user_id, tier, status, features)
SELECT
  u.id,
  'free',
  'active',
  ARRAY[]::TEXT[]
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- Grant permissions
-- ========================================

GRANT SELECT ON subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO authenticated;

-- ========================================
-- Comments
-- ========================================

COMMENT ON TABLE subscriptions IS 'User subscription tiers and feature access';
COMMENT ON COLUMN subscriptions.features IS 'Array of enabled features (ai_agents, unlimited_projects, etc.)';
COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier: free, pro, or enterprise';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status: active, inactive, cancelled, past_due, trialing';

-- ========================================
-- Verification
-- ========================================

-- Check table created
SELECT
  'Subscriptions table created successfully!' as message,
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE tier = 'free') as free_tier,
  COUNT(*) FILTER (WHERE tier = 'pro') as pro_tier,
  COUNT(*) FILTER (WHERE tier = 'enterprise') as enterprise_tier
FROM subscriptions;

-- Show RLS policies
SELECT
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;
