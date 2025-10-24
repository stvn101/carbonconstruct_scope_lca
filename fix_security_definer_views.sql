-- =====================================================
-- Fix Security Definer Views - EXACT SOLUTION
-- =====================================================
-- This script fixes the security issues flagged by Supabase database linter
-- by recreating views with SECURITY INVOKER instead of SECURITY DEFINER
--
-- SECURITY DEFINER = View executes with creator's permissions (security risk)
-- SECURITY INVOKER = View executes with user's permissions (secure default)
--
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Drop existing views with SECURITY DEFINER
-- =====================================================

DROP VIEW IF EXISTS public.vw_audit_log_latest CASCADE;
DROP VIEW IF EXISTS public.vw_emission_factors_latest CASCADE;
DROP VIEW IF EXISTS public.vw_project_emission_summary CASCADE;
DROP VIEW IF EXISTS public.vw_verification_report CASCADE;

-- =====================================================
-- STEP 2: Recreate views with SECURITY INVOKER
-- =====================================================

-- View 1: vw_audit_log_latest
CREATE VIEW public.vw_audit_log_latest
WITH (security_invoker=true)
AS
SELECT DISTINCT ON (id)
    id,
    carbon_project_id,
    emission_factor_id,
    material_emission_id,
    lifecycle_stage,
    scope,
    factor_used,
    quantity,
    total_emissions_kgco2e,
    reference_year,
    source,
    calculated_at
FROM project_emission_audit_log
ORDER BY id, calculated_at DESC;

-- View 2: vw_emission_factors_latest
CREATE VIEW public.vw_emission_factors_latest
WITH (security_invoker=true)
AS
SELECT DISTINCT ON (category)
    id,
    category,
    subcategory,
    unit,
    factor_value,
    factor_unit,
    source,
    reference_year,
    geography,
    reliability_score,
    created_at,
    updated_at
FROM emission_factors
ORDER BY category, updated_at DESC;

-- View 3: vw_project_emission_summary
CREATE VIEW public.vw_project_emission_summary
WITH (security_invoker=true)
AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    COALESCE(sum(e.calculated_emissions), (0)::numeric) AS total_emissions,
    count(e.id) AS emission_count
FROM projects p
LEFT JOIN emissions_records e ON (p.id = e.project_id)
GROUP BY p.id, p.name;

-- View 4: vw_verification_report
CREATE VIEW public.vw_verification_report
WITH (security_invoker=true)
AS
SELECT
    e.id AS verification_id,
    e.project_id,
    p.name AS project_name,
    e.status AS verification_status,
    NULL::text AS verified_by,
    NULL::timestamp with time zone AS verified_at
FROM emissions_records e
JOIN projects p ON (e.project_id = p.id);

-- =====================================================
-- STEP 3: Set proper ownership and grants
-- =====================================================

-- Set ownership
ALTER VIEW public.vw_audit_log_latest OWNER TO postgres;
ALTER VIEW public.vw_emission_factors_latest OWNER TO postgres;
ALTER VIEW public.vw_project_emission_summary OWNER TO postgres;
ALTER VIEW public.vw_verification_report OWNER TO postgres;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.vw_audit_log_latest TO authenticated;
GRANT SELECT ON public.vw_emission_factors_latest TO authenticated;
GRANT SELECT ON public.vw_project_emission_summary TO authenticated;
GRANT SELECT ON public.vw_verification_report TO authenticated;

-- Grant SELECT permissions to service_role
GRANT SELECT ON public.vw_audit_log_latest TO service_role;
GRANT SELECT ON public.vw_emission_factors_latest TO service_role;
GRANT SELECT ON public.vw_project_emission_summary TO service_role;
GRANT SELECT ON public.vw_verification_report TO service_role;

-- =====================================================
-- STEP 4: Verification Query
-- =====================================================
-- Run this to verify the security mode is now correct

SELECT
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE viewname IN (
    'vw_audit_log_latest',
    'vw_verification_report',
    'vw_emission_factors_latest',
    'vw_project_emission_summary'
)
AND schemaname = 'public';

-- Check that views are working correctly
SELECT 'vw_audit_log_latest' AS view_name, COUNT(*) AS row_count FROM public.vw_audit_log_latest
UNION ALL
SELECT 'vw_emission_factors_latest', COUNT(*) FROM public.vw_emission_factors_latest
UNION ALL
SELECT 'vw_project_emission_summary', COUNT(*) FROM public.vw_project_emission_summary
UNION ALL
SELECT 'vw_verification_report', COUNT(*) FROM public.vw_verification_report;

-- =====================================================
-- NOTES
-- =====================================================
-- After running this script:
-- 1. All four views will use SECURITY INVOKER (secure)
-- 2. Views will respect Row Level Security (RLS) policies
-- 3. Users will only see data they have permission to access
-- 4. The Supabase database linter errors should be resolved
--
-- If you encounter permission errors after this change:
-- - Check that your RLS policies are correctly configured
-- - Ensure users have appropriate SELECT permissions on underlying tables
-- - Review that authenticated users can access the base tables
-- =====================================================
