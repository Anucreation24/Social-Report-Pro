-- Migration File: supabase/migrations/20260723000000_repair_stage3_missing_columns.sql
-- Comprehensive, Additive, and Idempotent Repair for Stage 3 Tables & Columns

-- 1. Ensure public.analytics_snapshots exists and has all Stage 3 columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_snapshots') THEN
        CREATE TABLE public.analytics_snapshots (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
            provider TEXT NOT NULL DEFAULT 'facebook',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;

    -- Add missing columns safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'social_account_id') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN social_account_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'platform_connection_id') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN platform_connection_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'provider') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN provider TEXT DEFAULT 'facebook';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'snapshot_date') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN snapshot_date DATE DEFAULT CURRENT_DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'aggregation_level') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN aggregation_level TEXT DEFAULT 'daily';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'metric_name') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN metric_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'metric_value') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN metric_value NUMERIC DEFAULT 0;
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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'updated_at') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- Drop legacy NOT NULL constraints that block new writes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'provider_account_id') THEN
        ALTER TABLE public.analytics_snapshots ALTER COLUMN provider_account_id DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'aggregation_period') THEN
        ALTER TABLE public.analytics_snapshots ALTER COLUMN aggregation_period DROP NOT NULL;
    END IF;
END $$;


-- 2. Ensure public.content_items exists and has all Stage 3 columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_items') THEN
        CREATE TABLE public.content_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
            provider TEXT NOT NULL DEFAULT 'facebook',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;

    -- Add missing columns safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'social_account_id') THEN
        ALTER TABLE public.content_items ADD COLUMN social_account_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'platform_connection_id') THEN
        ALTER TABLE public.content_items ADD COLUMN platform_connection_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'provider') THEN
        ALTER TABLE public.content_items ADD COLUMN provider TEXT DEFAULT 'facebook';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'provider_content_id') THEN
        ALTER TABLE public.content_items ADD COLUMN provider_content_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'content_type') THEN
        ALTER TABLE public.content_items ADD COLUMN content_type TEXT DEFAULT 'post';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'title') THEN
        ALTER TABLE public.content_items ADD COLUMN title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'caption_excerpt') THEN
        ALTER TABLE public.content_items ADD COLUMN caption_excerpt TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'permalink') THEN
        ALTER TABLE public.content_items ADD COLUMN permalink TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE public.content_items ADD COLUMN thumbnail_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'published_at') THEN
        ALTER TABLE public.content_items ADD COLUMN published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'duration_seconds') THEN
        ALTER TABLE public.content_items ADD COLUMN duration_seconds NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'provider_metadata') THEN
        ALTER TABLE public.content_items ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'archived_at') THEN
        ALTER TABLE public.content_items ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'updated_at') THEN
        ALTER TABLE public.content_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- Drop legacy NOT NULL constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'provider_account_id') THEN
        ALTER TABLE public.content_items ALTER COLUMN provider_account_id DROP NOT NULL;
    END IF;
END $$;


-- 3. Ensure public.content_metrics exists and has all Stage 3 columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_metrics') THEN
        CREATE TABLE public.content_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;

    -- Add missing columns safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'company_id') THEN
        ALTER TABLE public.content_metrics ADD COLUMN company_id UUID;
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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'updated_at') THEN
        ALTER TABLE public.content_metrics ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;

    -- Drop legacy NOT NULL constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'snapshot_date') THEN
        ALTER TABLE public.content_metrics ALTER COLUMN snapshot_date DROP NOT NULL;
    END IF;
END $$;


-- 4. Ensure public.sync_jobs & public.sync_logs have all Stage 3 columns
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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_jobs' AND column_name = 'platform_connection_id') THEN
        ALTER TABLE public.sync_jobs ADD COLUMN platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE CASCADE;
    END IF;

    -- Sync Logs columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'status') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN status DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'platform') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN platform DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'log_message') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN log_message DROP NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'provider') THEN
        ALTER TABLE public.sync_logs ADD COLUMN provider TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'level') THEN
        ALTER TABLE public.sync_logs ADD COLUMN level TEXT DEFAULT 'info';
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


-- 5. Safe Backfills for Existing Data
DO $$
BEGIN
    -- Backfill analytics_snapshots
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'aggregation_period') THEN
        UPDATE public.analytics_snapshots
        SET aggregation_level = aggregation_period
        WHERE aggregation_level IS NULL AND aggregation_period IS NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'provider_account_id') THEN
        UPDATE public.analytics_snapshots a
        SET social_account_id = sa.id
        FROM public.social_accounts sa
        WHERE a.social_account_id IS NULL
          AND a.company_id = sa.company_id
          AND a.provider = sa.provider
          AND a.provider_account_id = sa.provider_account_id;
    END IF;

    -- Backfill content_items
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'caption') THEN
        UPDATE public.content_items
        SET caption_excerpt = caption
        WHERE caption_excerpt IS NULL AND caption IS NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'provider_account_id') THEN
        UPDATE public.content_items c
        SET social_account_id = sa.id
        FROM public.social_accounts sa
        WHERE c.social_account_id IS NULL
          AND c.company_id = sa.company_id
          AND c.provider = sa.provider
          AND c.provider_account_id = sa.provider_account_id;
    END IF;

    -- Backfill content_metrics
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'snapshot_date') THEN
        UPDATE public.content_metrics
        SET metric_date = snapshot_date
        WHERE metric_date IS NULL AND snapshot_date IS NOT NULL;
    END IF;

    UPDATE public.content_metrics cm
    SET company_id = ci.company_id
    FROM public.content_items ci
    WHERE cm.company_id IS NULL
      AND cm.content_item_id = ci.id;
END $$;


-- 6. Add Foreign Keys safely if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_analytics_snapshots_social_account' AND table_name = 'analytics_snapshots') THEN
        ALTER TABLE public.analytics_snapshots ADD CONSTRAINT fk_analytics_snapshots_social_account
            FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_analytics_snapshots_connection' AND table_name = 'analytics_snapshots') THEN
        ALTER TABLE public.analytics_snapshots ADD CONSTRAINT fk_analytics_snapshots_connection
            FOREIGN KEY (platform_connection_id) REFERENCES public.platform_connections(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_content_items_social_account' AND table_name = 'content_items') THEN
        ALTER TABLE public.content_items ADD CONSTRAINT fk_content_items_social_account
            FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_content_items_connection' AND table_name = 'content_items') THEN
        ALTER TABLE public.content_items ADD CONSTRAINT fk_content_items_connection
            FOREIGN KEY (platform_connection_id) REFERENCES public.platform_connections(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_content_metrics_company' AND table_name = 'content_metrics') THEN
        ALTER TABLE public.content_metrics ADD CONSTRAINT fk_content_metrics_company
            FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- 7. Update CHECK Constraints
DO $$
BEGIN
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_aggregation_period_check;
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS chk_analytics_snapshots_aggregation;
    ALTER TABLE public.analytics_snapshots ADD CONSTRAINT chk_analytics_snapshots_aggregation
        CHECK (aggregation_level IN ('daily', 'weekly', 'monthly', 'lifetime'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_status_check;
    ALTER TABLE public.sync_jobs DROP CONSTRAINT IF EXISTS chk_sync_jobs_status;
    ALTER TABLE public.sync_jobs ADD CONSTRAINT chk_sync_jobs_status 
        CHECK (status IN ('queued', 'running', 'partially_completed', 'completed', 'failed', 'cancelled'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- 8. Drop legacy conflicting unique constraints and create Stage 3 unique indexes
DO $$
BEGIN
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_company_id_provider_provider_account_key;
    ALTER TABLE public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_unique_key;
    ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_company_id_provider_provider_account_id_provid_key;
    ALTER TABLE public.content_metrics DROP CONSTRAINT IF EXISTS content_metrics_content_item_id_snapshot_date_key;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create Unique Indexes conditionally after ensuring columns exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'social_account_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_snapshots' AND column_name = 'aggregation_level') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshots_unique_snapshot
        ON public.analytics_snapshots (company_id, social_account_id, provider, snapshot_date, aggregation_level, metric_name);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'social_account_id') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_unique_provider_content
        ON public.content_items (provider, social_account_id, provider_content_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'content_metrics' AND column_name = 'metric_date') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_content_metrics_unique_metric
        ON public.content_metrics (content_item_id, metric_date, metric_name);
    END IF;
END $$;


-- 9. Re-assert RLS Policies
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

-- 10. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
