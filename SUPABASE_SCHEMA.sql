-- =====================================================
-- CarbonConstruct Supabase Database Schema
-- =====================================================
-- This file contains all required table schemas for the CarbonConstruct application
-- Run these SQL commands in your Supabase SQL editor

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Stores additional user profile information beyond Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. SUBSCRIPTIONS TABLE
-- =====================================================
-- Stores Stripe subscription information
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    status TEXT NOT NULL, -- active, trialing, past_due, canceled, etc.
    plan_id TEXT NOT NULL, -- starter, professional, enterprise
    plan_name TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 3. INVOICES TABLE
-- =====================================================
-- Stores billing history from Stripe
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    status TEXT NOT NULL, -- paid, open, void, etc.
    invoice_number TEXT,
    description TEXT,
    invoice_pdf TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 4. PROJECTS TABLE
-- =====================================================
-- Stores user carbon calculation projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft', -- draft, complete, archived
    project_type TEXT, -- residential, commercial, industrial, etc.
    location TEXT,
    total_carbon NUMERIC DEFAULT 0, -- Total CO2e in kg
    material_count INTEGER DEFAULT 0,
    ncc_compliant BOOLEAN DEFAULT FALSE,
    data JSONB, -- Store all project calculations and materials
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- =====================================================
-- 5. UNIFIED MATERIALS TABLE
-- =====================================================
-- Your existing materials database (54,343+ materials)
-- This table should already exist from your EPD/NABERS import
-- Including here for reference and to add indexes if needed

-- Verify table exists and add indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_name ON unified_materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON unified_materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_source ON unified_materials(source);

-- Enable full-text search on material names and descriptions
CREATE INDEX IF NOT EXISTS idx_materials_search 
ON unified_materials USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =====================================================
-- 6. ACTIVITY LOG TABLE
-- =====================================================
-- Tracks user activity for dashboard recent activity
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- project_created, calculation_run, export, etc.
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own activity" ON activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity" ON activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);

-- =====================================================
-- 7. USER PREFERENCES TABLE
-- =====================================================
-- Stores user notification and app preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    project_updates BOOLEAN DEFAULT TRUE,
    subscription_reminders BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    theme TEXT DEFAULT 'light', -- light, dark, auto
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. WEBHOOK ERRORS TABLE
-- =====================================================
-- Logs webhook errors for debugging
CREATE TABLE IF NOT EXISTS webhook_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_id TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for debugging
CREATE INDEX IF NOT EXISTS idx_webhook_errors_created_at ON webhook_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_errors_event_type ON webhook_errors(event_type);

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. INITIAL DATA SETUP
-- =====================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your setup

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 
    'subscriptions', 
    'invoices', 
    'projects', 
    'activity_log', 
    'user_preferences',
    'webhook_errors'
);

-- Check unified_materials table
SELECT COUNT(*) as material_count FROM unified_materials;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Your unified_materials table with 54,343+ materials should already exist
--    from your NABERS/EPD import. This schema doesn't recreate it.
--
-- 2. All tables use Row Level Security (RLS) for data isolation
--    Users can only access their own data
--
-- 3. The webhook handler will populate subscriptions and invoices tables
--    when Stripe events are received
--
-- 4. Projects table uses JSONB for flexible storage of calculation data
--    This allows storing complex material lists and calculations
--
-- 5. Activity log is optional but useful for dashboard "recent activity"
--
-- 6. Make sure to configure Supabase Auth with:
--    - Email/Password enabled
--    - Google OAuth configured
--    - GitHub OAuth configured
--    - Email templates customized
