-- Additive Database Migration for Stage 3 — Historical Analytics Sync Engine
-- File: supabase/migrations/20260722000000_stage3_historical_sync_engine.sql

-- 1. Upgrade public.analytics_snapshots Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'social_account_id') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'platform_connection_id') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'aggregation_level') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN aggregation_level TEXT DEFAULT 'daily' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'metric_unit') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN metric_unit TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'provider_metric_name') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN provider_metric_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'provider_metadata') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'source_period_start') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN source_period_start TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'source_period_end') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN source_period_end TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update constraints on analytics_snapshots
DO $$
BEGIN
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_aggregation_period_check;
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS chk_analytics_snapshots_aggregation;
    ALTER TABLE public.analytics_snapshots ADD CONSTRAINT chk_analytics_snapshots_aggregation
        CHECK (aggregation_level IN ('daily', 'weekly', 'monthly', 'lifetime'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop legacy unique constraint if present and create idempotent unique index
DO $$
BEGIN
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_company_id_provider_provider_account_key;
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_unique_key;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshots_unique_snapshot
ON public.analytics_snapshots (company_id, social_account_id, provider, snapshot_date, aggregation_level, metric_name);


-- 2. Upgrade public.content_items Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'social_account_id') THEN
        ALTER TABLE public.content_items ADD COLUMN social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'platform_connection_id') THEN
        ALTER TABLE public.content_items ADD COLUMN platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'caption_excerpt') THEN
        ALTER TABLE public.content_items ADD COLUMN caption_excerpt TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'archived_at') THEN
        ALTER TABLE public.content_items ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'provider_metadata') THEN
        ALTER TABLE public.content_items ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_unique_provider_content
ON public.content_items (provider, social_account_id, provider_content_id);


-- 3. Upgrade public.content_metrics Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'company_id') THEN
        ALTER TABLE public.content_metrics ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'metric_date') THEN
        ALTER TABLE public.content_metrics ADD COLUMN metric_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'metric_name') THEN
        ALTER TABLE public.content_metrics ADD COLUMN metric_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'metric_value') THEN
        ALTER TABLE public.content_metrics ADD COLUMN metric_value NUMERIC DEFAULT 0 NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'provider_metric_name') THEN
        ALTER TABLE public.content_metrics ADD COLUMN provider_metric_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'provider_metadata') THEN
        ALTER TABLE public.content_metrics ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;
END $$;

-- Drop legacy unique constraint on content_metrics if present
DO $$
BEGIN
    ALTER TABLE public.content_metrics DROP CONSTRAINT IF EXISTS content_metrics_content_item_id_snapshot_date_key;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_metrics_unique_metric
ON public.content_metrics (content_item_id, metric_date, metric_name);


-- 4. Upgrade public.sync_jobs Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'provider') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN provider TEXT NOT NULL DEFAULT 'facebook';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'job_type') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN job_type TEXT DEFAULT 'manual' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'requested_by') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN requested_by UUID REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'attempt_count') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN attempt_count INTEGER DEFAULT 1 NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'error_category') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN error_category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'safe_error_message') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN safe_error_message TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'metadata') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;
END $$;

-- Update status check on sync_jobs
DO $$
BEGIN
    ALTER TABLE public.sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_status_check;
    ALTER TABLE public.sync_jobs DROP CONSTRAINT IF EXISTS chk_sync_jobs_status;
    ALTER TABLE public.sync_jobs ADD CONSTRAINT chk_sync_jobs_status 
        CHECK (status IN ('queued', 'running', 'partially_completed', 'completed', 'failed', 'cancelled'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- 5. Upgrade public.sync_logs Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'provider') THEN
        ALTER TABLE public.sync_logs ADD COLUMN provider TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'level') THEN
        ALTER TABLE public.sync_logs ADD COLUMN level TEXT DEFAULT 'info' NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'step') THEN
        ALTER TABLE public.sync_logs ADD COLUMN step TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'safe_message') THEN
        ALTER TABLE public.sync_logs ADD COLUMN safe_message TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'metadata') THEN
        ALTER TABLE public.sync_logs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;
END $$;


-- 6. Configure Row Level Security (RLS) Policies
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Analytics Snapshots RLS
DROP POLICY IF EXISTS "Company members read analytics" ON public.analytics_snapshots;
DROP POLICY IF EXISTS "Company managers manage analytics" ON public.analytics_snapshots;

CREATE POLICY "Company members read analytics" ON public.analytics_snapshots 
    FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Company managers manage analytics" ON public.analytics_snapshots 
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Content Items RLS
DROP POLICY IF EXISTS "Company members read content" ON public.content_items;
DROP POLICY IF EXISTS "Company managers manage content" ON public.content_items;

CREATE POLICY "Company members read content" ON public.content_items 
    FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Company managers manage content" ON public.content_items 
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Content Metrics RLS
DROP POLICY IF EXISTS "Company members read content metrics" ON public.content_metrics;
DROP POLICY IF EXISTS "Company managers manage content metrics" ON public.content_metrics;

CREATE POLICY "Company members read content metrics" ON public.content_metrics 
    FOR SELECT USING (company_id IS NOT NULL AND is_company_member(company_id));

CREATE POLICY "Company managers manage content metrics" ON public.content_metrics 
    FOR ALL USING (company_id IS NOT NULL AND has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Sync Jobs RLS
DROP POLICY IF EXISTS "Company members read sync jobs" ON public.sync_jobs;
DROP POLICY IF EXISTS "Company managers manage sync jobs" ON public.sync_jobs;

CREATE POLICY "Company members read sync jobs" ON public.sync_jobs 
    FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Company managers manage sync jobs" ON public.sync_jobs 
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Sync Logs RLS
DROP POLICY IF EXISTS "Company members read sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Company managers manage sync logs" ON public.sync_logs;

CREATE POLICY "Company members read sync logs" ON public.sync_logs 
    FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Company managers manage sync logs" ON public.sync_logs 
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
