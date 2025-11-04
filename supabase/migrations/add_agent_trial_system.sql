-- =====================================================
-- Agent Trial System Migration
-- =====================================================
-- Implements 14-day trial with 3 agent uses per day
-- Trial starts when payment card is added
-- Requires paid subscription after trial ends

-- =====================================================
-- 1. ADD TRIAL TRACKING TO USER_PROFILES
-- =====================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS agent_trial_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS has_payment_method BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS payment_method_added_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 2. CREATE AGENT_USAGE_LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL, -- cc-lca-analyst, compliance-checker, etc.
    action TEXT NOT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    request_data JSONB,
    response_data JSONB,
    execution_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_date DATE DEFAULT CURRENT_DATE -- For daily usage tracking
);

-- Enable Row Level Security
ALTER TABLE agent_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own agent usage" ON agent_usage_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent usage" ON agent_usage_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_usage_user_id ON agent_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_date ON agent_usage_log(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_usage_timestamp ON agent_usage_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_usage_user_date ON agent_usage_log(user_id, usage_date);

-- =====================================================
-- 3. FUNCTION: CHECK AGENT ACCESS
-- =====================================================

CREATE OR REPLACE FUNCTION check_agent_access(p_user_id UUID)
RETURNS TABLE (
    can_use_agents BOOLEAN,
    is_trial BOOLEAN,
    trial_days_remaining INTEGER,
    daily_uses_remaining INTEGER,
    access_reason TEXT
) AS $$
DECLARE
    v_has_payment BOOLEAN;
    v_trial_start TIMESTAMP WITH TIME ZONE;
    v_subscription_status TEXT;
    v_trial_end TIMESTAMP WITH TIME ZONE;
    v_days_remaining INTEGER;
    v_today_usage INTEGER;
    v_daily_limit INTEGER := 3; -- Trial limit: 3 per day
BEGIN
    -- Get user profile data
    SELECT
        COALESCE(has_payment_method, FALSE),
        agent_trial_started_at
    INTO v_has_payment, v_trial_start
    FROM user_profiles
    WHERE user_id = p_user_id;

    -- Check subscription status
    SELECT status
    INTO v_subscription_status
    FROM subscriptions
    WHERE user_id = p_user_id
        AND status IN ('active', 'trialing')
    ORDER BY created_at DESC
    LIMIT 1;

    -- If user has active paid subscription, allow unlimited access
    IF v_subscription_status = 'active' THEN
        RETURN QUERY SELECT
            TRUE, -- can_use_agents
            FALSE, -- is_trial
            0, -- trial_days_remaining
            999, -- daily_uses_remaining (effectively unlimited)
            'active_subscription'::TEXT; -- access_reason
        RETURN;
    END IF;

    -- If no payment method, deny access
    IF NOT v_has_payment THEN
        RETURN QUERY SELECT
            FALSE, -- can_use_agents
            FALSE, -- is_trial
            0, -- trial_days_remaining
            0, -- daily_uses_remaining
            'no_payment_method'::TEXT; -- access_reason
        RETURN;
    END IF;

    -- If payment method exists but trial not started, start it now
    IF v_trial_start IS NULL THEN
        UPDATE user_profiles
        SET agent_trial_started_at = NOW()
        WHERE user_id = p_user_id;

        v_trial_start := NOW();
    END IF;

    -- Calculate trial end (14 days from start)
    v_trial_end := v_trial_start + INTERVAL '14 days';

    -- Calculate days remaining
    v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_trial_end - NOW()))::INTEGER);

    -- Check if trial has expired
    IF NOW() > v_trial_end THEN
        RETURN QUERY SELECT
            FALSE, -- can_use_agents
            FALSE, -- is_trial
            0, -- trial_days_remaining
            0, -- daily_uses_remaining
            'trial_expired'::TEXT; -- access_reason
        RETURN;
    END IF;

    -- Trial is active - check daily usage
    SELECT COUNT(*)
    INTO v_today_usage
    FROM agent_usage_log
    WHERE user_id = p_user_id
        AND usage_date = CURRENT_DATE
        AND success = TRUE;

    -- Calculate remaining uses for today
    v_days_remaining := GREATEST(0, v_daily_limit - v_today_usage);

    -- Return trial status
    RETURN QUERY SELECT
        (v_today_usage < v_daily_limit), -- can_use_agents
        TRUE, -- is_trial
        v_days_remaining, -- trial_days_remaining (days, not uses)
        GREATEST(0, v_daily_limit - v_today_usage), -- daily_uses_remaining
        'trial_active'::TEXT; -- access_reason
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNCTION: LOG AGENT USAGE
-- =====================================================

CREATE OR REPLACE FUNCTION log_agent_usage(
    p_user_id UUID,
    p_agent_type TEXT,
    p_action TEXT,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_request_data JSONB DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO agent_usage_log (
        user_id,
        agent_type,
        action,
        success,
        error_message,
        request_data,
        response_data,
        execution_time_ms,
        usage_date
    ) VALUES (
        p_user_id,
        p_agent_type,
        p_action,
        p_success,
        p_error_message,
        p_request_data,
        p_response_data,
        p_execution_time_ms,
        CURRENT_DATE
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGER: UPDATE PAYMENT METHOD STATUS
-- =====================================================

-- This trigger should be called when Stripe confirms payment method
CREATE OR REPLACE FUNCTION update_payment_method_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When a subscription is created/updated with a valid payment method
    IF NEW.stripe_customer_id IS NOT NULL AND NEW.status IN ('active', 'trialing') THEN
        UPDATE user_profiles
        SET
            has_payment_method = TRUE,
            payment_method_added_at = COALESCE(payment_method_added_at, NOW()),
            stripe_customer_id = NEW.stripe_customer_id
        WHERE user_id = NEW.user_id
            AND has_payment_method IS NOT TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on subscriptions table
DROP TRIGGER IF EXISTS trg_update_payment_method ON subscriptions;
CREATE TRIGGER trg_update_payment_method
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_method_status();

-- =====================================================
-- 6. HELPER VIEW: USER AGENT STATUS
-- =====================================================

CREATE OR REPLACE VIEW user_agent_status AS
SELECT
    u.id AS user_id,
    u.email,
    up.has_payment_method,
    up.payment_method_added_at,
    up.agent_trial_started_at,
    CASE
        WHEN up.agent_trial_started_at IS NOT NULL
        THEN up.agent_trial_started_at + INTERVAL '14 days'
        ELSE NULL
    END AS trial_end_date,
    s.status AS subscription_status,
    s.plan_name,
    (SELECT COUNT(*) FROM agent_usage_log WHERE user_id = u.id AND usage_date = CURRENT_DATE) AS today_usage_count,
    (SELECT COUNT(*) FROM agent_usage_log WHERE user_id = u.id) AS total_usage_count
FROM auth.users u
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active', 'trialing');

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Allow authenticated users to execute functions
GRANT EXECUTE ON FUNCTION check_agent_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_agent_usage(UUID, TEXT, TEXT, BOOLEAN, TEXT, JSONB, JSONB, INTEGER) TO authenticated;

-- Allow authenticated users to view their agent status
GRANT SELECT ON user_agent_status TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Test the migration with a sample query:
-- SELECT * FROM check_agent_access(auth.uid());
