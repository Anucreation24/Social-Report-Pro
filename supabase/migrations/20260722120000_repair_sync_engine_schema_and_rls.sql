-- Additive Database Repair Migration for Stage 3 Production Sync Engine
-- File: supabase/migrations/20260722120000_repair_sync_engine_schema_and_rls.sql

-- 1. Align public.sync_logs Table Schema
DO $$
BEGIN
    -- Make legacy columns nullable so new writes using provider, level, step, safe_message don't fail
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'status') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN status DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'platform') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN platform DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sync_logs' AND column_name = 'log_message') THEN
        ALTER TABLE public.sync_logs ALTER COLUMN log_message DROP NOT NULL;
    END IF;

    -- Ensure new Stage 3 columns exist
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


-- 2. Align public.sync_jobs Table Schema and Constraints
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
END $$;

-- Update status check constraint on sync_jobs
DO $$
BEGIN
    ALTER TABLE public.sync_jobs DROP CONSTRAINT IF EXISTS sync_jobs_status_check;
    ALTER TABLE public.sync_jobs DROP CONSTRAINT IF EXISTS chk_sync_jobs_status;
    ALTER TABLE public.sync_jobs ADD CONSTRAINT chk_sync_jobs_status 
        CHECK (status IN ('queued', 'running', 'partially_completed', 'completed', 'failed', 'cancelled'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;


-- 3. Re-assert Row Level Security Policies
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;

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
