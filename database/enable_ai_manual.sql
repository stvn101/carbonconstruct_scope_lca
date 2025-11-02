-- ========================================
-- Enable AI Features - Manual Setup
-- ========================================

-- ========================================
-- STEP 1: Create subscriptions table
-- ========================================

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

-- RLS policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (true);

-- Grant permissions
GRANT SELECT ON subscriptions TO authenticated;

-- ========================================
-- STEP 2: Find your user ID
-- ========================================

SELECT
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Copy your user_id from the results above, then use it in STEP 3

-- ========================================
-- STEP 3: Enable AI for your account
-- ========================================

-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from STEP 2

INSERT INTO subscriptions (user_id, tier, status, features)
VALUES (
  'YOUR_USER_ID_HERE',  -- ⚠️ REPLACE THIS with your user ID from STEP 2
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
-- STEP 4: Verify AI access enabled
-- ========================================

SELECT
  u.email,
  s.tier,
  s.status,
  s.features,
  CASE WHEN 'ai_agents' = ANY(s.features) THEN '✓ AI ENABLED' ELSE '✗ NO AI' END as ai_status
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC;
