-- Migration: 20260727120000_stage45_manual_import.sql
-- Description: Stage 4.5 — Manual Data Import & Manual KPI Entry Module
-- Additive & Idempotent migration for Social Report Pro

-- 1. Create data_import_batches table
CREATE TABLE IF NOT EXISTS public.data_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    import_type TEXT NOT NULL,
    source_type TEXT NOT NULL,
    reporting_period_start DATE,
    reporting_period_end DATE,
    original_file_name TEXT,
    file_size_bytes BIGINT,
    file_checksum TEXT,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded',
    total_rows INTEGER DEFAULT 0,
    valid_rows INTEGER DEFAULT 0,
    invalid_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    imported_rows INTEGER DEFAULT 0,
    imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    imported_at TIMESTAMPTZ,
    safe_error_message TEXT,
    mapping_config JSONB,
    validation_summary JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Index for fast company and platform batch lookups
CREATE INDEX IF NOT EXISTS idx_import_batches_company ON public.data_import_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_platform ON public.data_import_batches(company_id, platform);
CREATE INDEX IF NOT EXISTS idx_import_batches_checksum ON public.data_import_batches(company_id, file_checksum);

-- 2. Create data_import_rows table
CREATE TABLE IF NOT EXISTS public.data_import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_batch_id UUID NOT NULL REFERENCES public.data_import_batches(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    row_type TEXT,
    source_data JSONB,
    normalized_data JSONB,
    validation_status TEXT NOT NULL DEFAULT 'valid',
    validation_errors JSONB,
    duplicate_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_rows_batch ON public.data_import_rows(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_dup_key ON public.data_import_rows(company_id, duplicate_key);

-- 3. Extend analytics_snapshots table with provenance fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_snapshots' AND column_name='data_source') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN data_source TEXT DEFAULT 'api';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_snapshots' AND column_name='import_batch_id') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN import_batch_id UUID REFERENCES public.data_import_batches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_snapshots' AND column_name='imported_by') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_snapshots' AND column_name='imported_at') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN imported_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_snapshots' AND column_name='source_reference') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN source_reference TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_snapshots' AND column_name='source_priority') THEN
        ALTER TABLE public.analytics_snapshots ADD COLUMN source_priority INTEGER DEFAULT 1;
    END IF;
END $$;

-- 4. Extend content_items table with provenance fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='data_source') THEN
        ALTER TABLE public.content_items ADD COLUMN data_source TEXT DEFAULT 'api';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='import_batch_id') THEN
        ALTER TABLE public.content_items ADD COLUMN import_batch_id UUID REFERENCES public.data_import_batches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='imported_by') THEN
        ALTER TABLE public.content_items ADD COLUMN imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='imported_at') THEN
        ALTER TABLE public.content_items ADD COLUMN imported_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='source_reference') THEN
        ALTER TABLE public.content_items ADD COLUMN source_reference TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='source_priority') THEN
        ALTER TABLE public.content_items ADD COLUMN source_priority INTEGER DEFAULT 1;
    END IF;
END $$;

-- 5. Extend content_metrics table with provenance fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_metrics' AND column_name='data_source') THEN
        ALTER TABLE public.content_metrics ADD COLUMN data_source TEXT DEFAULT 'api';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_metrics' AND column_name='import_batch_id') THEN
        ALTER TABLE public.content_metrics ADD COLUMN import_batch_id UUID REFERENCES public.data_import_batches(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_metrics' AND column_name='imported_by') THEN
        ALTER TABLE public.content_metrics ADD COLUMN imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_metrics' AND column_name='imported_at') THEN
        ALTER TABLE public.content_metrics ADD COLUMN imported_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_metrics' AND column_name='source_reference') THEN
        ALTER TABLE public.content_metrics ADD COLUMN source_reference TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_metrics' AND column_name='source_priority') THEN
        ALTER TABLE public.content_metrics ADD COLUMN source_priority INTEGER DEFAULT 1;
    END IF;
END $$;

-- Backfill existing rows with 'api' data_source
UPDATE public.analytics_snapshots SET data_source = 'api', source_priority = 1 WHERE data_source IS NULL;
UPDATE public.content_items SET data_source = 'api', source_priority = 1 WHERE data_source IS NULL;
UPDATE public.content_metrics SET data_source = 'api', source_priority = 1 WHERE data_source IS NULL;

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.data_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_import_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_import_batches
DROP POLICY IF EXISTS "Company members can view data_import_batches" ON public.data_import_batches;
CREATE POLICY "Company members can view data_import_batches" ON public.data_import_batches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = public.data_import_batches.company_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Company managers/admins/owners can insert data_import_batches" ON public.data_import_batches;
CREATE POLICY "Company managers/admins/owners can insert data_import_batches" ON public.data_import_batches
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = public.data_import_batches.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

DROP POLICY IF EXISTS "Company managers/admins/owners can update data_import_batches" ON public.data_import_batches;
CREATE POLICY "Company managers/admins/owners can update data_import_batches" ON public.data_import_batches
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = public.data_import_batches.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

-- RLS Policies for data_import_rows
DROP POLICY IF EXISTS "Company members can view data_import_rows" ON public.data_import_rows;
CREATE POLICY "Company members can view data_import_rows" ON public.data_import_rows
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = public.data_import_rows.company_id
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Company managers/admins/owners can insert data_import_rows" ON public.data_import_rows;
CREATE POLICY "Company managers/admins/owners can insert data_import_rows" ON public.data_import_rows
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = public.data_import_rows.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

-- 7. Provision Private Storage Bucket 'data-imports'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'data-imports',
    'data-imports',
    false,
    10485760, -- 10MB
    ARRAY[
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760;

-- Storage RLS Policies for 'data-imports'
DROP POLICY IF EXISTS "Company members can view data-imports files" ON storage.objects;
CREATE POLICY "Company members can view data-imports files" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'data-imports' AND
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id::text = (storage.foldername(name))[1]
            AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Company managers can upload data-imports files" ON storage.objects;
CREATE POLICY "Company managers can upload data-imports files" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'data-imports' AND
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id::text = (storage.foldername(name))[1]
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

NOTIFY pgrst, 'reload schema';
