-- =====================================================
-- Fix Security Definer Views - READY TO RUN
-- =====================================================
-- This script fixes all 4 security issues flagged by Supabase
-- Copy and paste this ENTIRE file into Supabase SQL Editor and click RUN
--
-- What this does:
-- - Drops views with SECURITY DEFINER (insecure)
-- - Recreates them with SECURITY INVOKER (secure)
-- - Sets proper permissions
-- =====================================================

-- Drop existing views
DROP VIEW IF EXISTS public.vw_audit_log_latest CASCADE;
DROP VIEW IF EXISTS public.vw_emission_factors_latest CASCADE;
DROP VIEW IF EXISTS public.vw_project_emission_summary CASCADE;
DROP VIEW IF EXISTS public.vw_verification_report CASCADE;

-- Recreate View 1: vw_audit_log_latest
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

-- Recreate View 2: vw_emission_factors_latest
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

-- Recreate View 3: vw_project_emission_summary
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

-- Recreate View 4: vw_verification_report
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

-- Set ownership
ALTER VIEW public.vw_audit_log_latest OWNER TO postgres;
ALTER VIEW public.vw_emission_factors_latest OWNER TO postgres;
ALTER VIEW public.vw_project_emission_summary OWNER TO postgres;
ALTER VIEW public.vw_verification_report OWNER TO postgres;

-- Grant permissions to authenticated users
GRANT SELECT ON public.vw_audit_log_latest TO authenticated;
GRANT SELECT ON public.vw_emission_factors_latest TO authenticated;
GRANT SELECT ON public.vw_project_emission_summary TO authenticated;
GRANT SELECT ON public.vw_verification_report TO authenticated;

-- Grant permissions to service_role
GRANT SELECT ON public.vw_audit_log_latest TO service_role;
GRANT SELECT ON public.vw_emission_factors_latest TO service_role;
GRANT SELECT ON public.vw_project_emission_summary TO service_role;
GRANT SELECT ON public.vw_verification_report TO service_role;

-- Verify the fix
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
