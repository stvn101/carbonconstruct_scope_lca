-- ========================================
-- Quick AI Testing Setup (No Stripe Required)
-- ========================================
-- Purpose: Enable AI features for your account to test immediately
-- Use this if you want to test AI features without setting up Stripe

-- ========================================
-- OPTION 1: Create simple subscriptions table + enable AI for current user
-- ========================================

-- Create minimal subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (true);

-- Grant permissions
GRANT SELECT ON subscriptions TO authenticated;

-- ========================================
-- Give yourself Pro access with AI features
-- ========================================

-- Insert/Update your account to Pro with AI enabled
INSERT INTO subscriptions (user_id, tier, status, features)
VALUES (
  auth.uid(),  -- Your current user ID
  'pro',
  'active',
  ARRAY['ai_agents', 'unlimited_projects', 'priority_support']
)
ON CONFLICT (user_id)
DO UPDATE SET
  tier = 'pro',
  status = 'active',
  features = ARRAY['ai_agents', 'unlimited_projects', 'priority_support'];

-- ========================================
-- Verify you have AI access
-- ========================================

SELECT
  'AI Features Enabled!' as message,
  tier,
  status,
  features,
  CASE WHEN 'ai_agents' = ANY(features) THEN '✓ YES' ELSE '✗ NO' END as has_ai_access
FROM subscriptions
WHERE user_id = auth.uid();

-- Expected output:
-- message: "AI Features Enabled!"
-- tier: "pro"
-- status: "active"
-- features: {ai_agents, unlimited_projects, priority_support}
-- has_ai_access: "✓ YES"
