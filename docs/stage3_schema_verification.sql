-- Verification SQL for Stage 3 Schema & Production Database Health
-- File: docs/stage3_schema_verification.sql

-- 1. Verify Required Columns on analytics_snapshots
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'analytics_snapshots'
  AND column_name IN ('social_account_id', 'platform_connection_id', 'provider', 'snapshot_date', 'aggregation_level', 'metric_name', 'metric_value', 'provider_metric_name', 'provider_metadata', 'source_period_start', 'source_period_end', 'updated_at')
ORDER BY column_name;

-- 2. Verify Required Columns on content_items
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'content_items'
  AND column_name IN ('social_account_id', 'platform_connection_id', 'provider', 'provider_content_id', 'content_type', 'title', 'caption_excerpt', 'permalink', 'thumbnail_url', 'published_at', 'duration_seconds', 'provider_metadata', 'archived_at')
ORDER BY column_name;

-- 3. Verify Required Columns on content_metrics
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'content_metrics'
  AND column_name IN ('company_id', 'metric_date', 'metric_name', 'metric_value', 'provider_metric_name', 'provider_metadata')
ORDER BY column_name;

-- 4. Verify Unique Indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_analytics_snapshots_unique_snapshot', 'idx_content_items_unique_provider_content', 'idx_content_metrics_unique_metric');

-- 5. Verify Foreign Key Constraints
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('analytics_snapshots', 'content_items', 'content_metrics');

-- 6. Verify Row Level Security Policies
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('analytics_snapshots', 'content_items', 'content_metrics', 'sync_jobs', 'sync_logs')
ORDER BY tablename, policyname;

-- 7. Query Production Row Counts
SELECT 'analytics_snapshots' AS table_name, COUNT(*) AS total_rows FROM public.analytics_snapshots
UNION ALL
SELECT 'content_items' AS table_name, COUNT(*) AS total_rows FROM public.content_items
UNION ALL
SELECT 'content_metrics' AS table_name, COUNT(*) AS total_rows FROM public.content_metrics
UNION ALL
SELECT 'sync_jobs' AS table_name, COUNT(*) AS total_rows FROM public.sync_jobs
UNION ALL
SELECT 'sync_logs' AS table_name, COUNT(*) AS total_rows FROM public.sync_logs;
