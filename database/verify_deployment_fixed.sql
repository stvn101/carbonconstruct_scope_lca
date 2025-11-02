-- ========================================
-- Database Deployment Verification Script (FIXED)
-- ========================================
-- Purpose: Verify agent_usage_schema.sql deployed correctly
-- Run this in Supabase SQL Editor after deploying the schema

-- ========================================
-- CHECK 1: Tables Exist
-- ========================================
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('agent_usage_log', 'agent_cache');

  IF table_count = 2 THEN
    RAISE NOTICE '✓ PASS: Both tables exist (agent_usage_log, agent_cache)';
  ELSE
    RAISE WARNING '✗ FAIL: Expected 2 tables, found %', table_count;
  END IF;
END $$;

-- ========================================
-- CHECK 2: Columns Exist
-- ========================================
DO $$
DECLARE
  log_columns INTEGER;
  cache_columns INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO log_columns
  FROM information_schema.columns
  WHERE table_name = 'agent_usage_log';

  SELECT COUNT(*)
  INTO cache_columns
  FROM information_schema.columns
  WHERE table_name = 'agent_cache';

  IF log_columns >= 10 AND cache_columns >= 9 THEN
    RAISE NOTICE '✓ PASS: All columns present (log: %, cache: %)', log_columns, cache_columns;
  ELSE
    RAISE WARNING '✗ FAIL: Missing columns (log: %, cache: %)', log_columns, cache_columns;
  END IF;
END $$;

-- ========================================
-- CHECK 3: Indexes Created
-- ========================================
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('agent_usage_log', 'agent_cache')
    AND indexname LIKE 'idx_%';

  IF index_count >= 6 THEN
    RAISE NOTICE '✓ PASS: Performance indexes created (found %)', index_count;
  ELSE
    RAISE WARNING '✗ FAIL: Expected at least 6 indexes, found %', index_count;
  END IF;
END $$;

-- ========================================
-- CHECK 4: RLS Enabled
-- ========================================
DO $$
DECLARE
  rls_log BOOLEAN;
  rls_cache BOOLEAN;
BEGIN
  SELECT relrowsecurity
  INTO rls_log
  FROM pg_class
  WHERE relname = 'agent_usage_log';

  SELECT relrowsecurity
  INTO rls_cache
  FROM pg_class
  WHERE relname = 'agent_cache';

  IF rls_log AND rls_cache THEN
    RAISE NOTICE '✓ PASS: Row Level Security enabled on both tables';
  ELSE
    RAISE WARNING '✗ FAIL: RLS not enabled (log: %, cache: %)', rls_log, rls_cache;
  END IF;
END $$;

-- ========================================
-- CHECK 5: RLS Policies Exist
-- ========================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('agent_usage_log', 'agent_cache');

  IF policy_count >= 5 THEN
    RAISE NOTICE '✓ PASS: RLS policies created (found %)', policy_count;
  ELSE
    RAISE WARNING '✗ FAIL: Expected at least 5 policies, found %', policy_count;
  END IF;
END $$;

-- ========================================
-- CHECK 6: Views Exist
-- ========================================
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name IN ('agent_usage_stats', 'agent_monthly_usage');

  IF view_count = 2 THEN
    RAISE NOTICE '✓ PASS: Both views exist (agent_usage_stats, agent_monthly_usage)';
  ELSE
    RAISE WARNING '✗ FAIL: Expected 2 views, found %', view_count;
  END IF;
END $$;

-- ========================================
-- CHECK 7: Functions Exist
-- ========================================
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_monthly_usage', 'clean_expired_cache', 'update_cache_access');

  IF function_count = 3 THEN
    RAISE NOTICE '✓ PASS: All 3 functions created';
  ELSE
    RAISE WARNING '✗ FAIL: Expected 3 functions, found %', function_count;
  END IF;
END $$;

-- ========================================
-- CHECK 8: Test Insert (Agent Log)
-- ========================================
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Insert test record
  INSERT INTO agent_usage_log (
    user_id,
    agent_type,
    action,
    execution_time,
    success,
    cost
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'cc-lca-analyst',
    'test_verification',
    1.234,
    true,
    0.0231
  ) RETURNING id INTO test_id;

  IF test_id IS NOT NULL THEN
    RAISE NOTICE '✓ PASS: Test insert successful (ID: %)', test_id;
    DELETE FROM agent_usage_log WHERE id = test_id;
    RAISE NOTICE '  Cleanup: Test record deleted';
  ELSE
    RAISE WARNING '✗ FAIL: Test insert failed';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '✗ FAIL: Test insert error: %', SQLERRM;
END $$;

-- ========================================
-- CHECK 9: Test Insert (Cache)
-- ========================================
DO $$
DECLARE
  test_id UUID;
BEGIN
  INSERT INTO agent_cache (
    cache_key,
    agent_type,
    action,
    input_hash,
    output_data,
    expires_at
  ) VALUES (
    'test_verification_cache',
    'cc-lca-analyst',
    'test_action',
    'abc123',
    '{"test": true}'::JSONB,
    NOW() + INTERVAL '1 hour'
  ) RETURNING id INTO test_id;

  IF test_id IS NOT NULL THEN
    RAISE NOTICE '✓ PASS: Cache insert successful (ID: %)', test_id;
    DELETE FROM agent_cache WHERE id = test_id;
    RAISE NOTICE '  Cleanup: Test cache entry deleted';
  ELSE
    RAISE WARNING '✗ FAIL: Cache insert failed';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '✗ FAIL: Cache insert error: %', SQLERRM;
END $$;

-- ========================================
-- CHECK 10: Test Function
-- ========================================
DO $$
DECLARE
  result_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO result_count
  FROM get_user_monthly_usage('00000000-0000-0000-0000-000000000000'::UUID);

  RAISE NOTICE '✓ PASS: get_user_monthly_usage() executed successfully';

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '✗ FAIL: Function execution error: %', SQLERRM;
END $$;

-- ========================================
-- SUMMARY
-- ========================================
SELECT
  '=== DEPLOYMENT SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('agent_usage_log', 'agent_cache')) as tables_created,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name IN ('agent_usage_stats', 'agent_monthly_usage')) as views_created,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('get_user_monthly_usage', 'clean_expired_cache', 'update_cache_access')) as functions_created,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('agent_usage_log', 'agent_cache') AND indexname LIKE 'idx_%') as indexes_created,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('agent_usage_log', 'agent_cache')) as policies_created;

-- ========================================
-- DETAILED OBJECTS LIST
-- ========================================
SELECT '=== TABLES ===' as category, table_name as name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%agent%'
UNION ALL
SELECT '=== VIEWS ===', table_name
FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE '%agent%'
UNION ALL
SELECT '=== FUNCTIONS ===', p.proname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname LIKE '%agent%'
UNION ALL
SELECT '=== INDEXES ===', indexname
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_agent%'
ORDER BY category, name;

-- ========================================
-- TABLE STRUCTURES (Supabase-compatible)
-- ========================================

-- agent_usage_log columns
SELECT
  '=== agent_usage_log STRUCTURE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agent_usage_log'
ORDER BY ordinal_position;

-- agent_cache columns
SELECT
  '=== agent_cache STRUCTURE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agent_cache'
ORDER BY ordinal_position;

-- RLS Policies detail
SELECT
  '=== RLS POLICIES ===' as info,
  tablename,
  policyname,
  cmd as command,
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No conditions'
  END as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('agent_usage_log', 'agent_cache')
ORDER BY tablename, policyname;
