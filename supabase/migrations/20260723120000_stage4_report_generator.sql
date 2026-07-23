-- =======================================================
-- SOCIAL REPORT PRO — STAGE 4 DATABASE MIGRATION
-- Migration: 20260723120000_stage4_report_generator.sql
-- =======================================================

-- 1. Ensure report_definitions table columns
CREATE TABLE IF NOT EXISTS public.report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Social Media Performance Report',
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    default_sections TEXT[] NOT NULL DEFAULT '{}',
    default_platforms TEXT[] NOT NULL DEFAULT '{}',
    prepared_by_default TEXT,
    created_by UUID REFERENCES public.profiles(id),
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns if report_definitions pre-existed from baseline init
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_definitions' AND column_name = 'report_type') THEN
        ALTER TABLE public.report_definitions ADD COLUMN report_type TEXT DEFAULT 'monthly';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_definitions' AND column_name = 'default_sections') THEN
        ALTER TABLE public.report_definitions ADD COLUMN default_sections TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_definitions' AND column_name = 'default_platforms') THEN
        ALTER TABLE public.report_definitions ADD COLUMN default_platforms TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_definitions' AND column_name = 'prepared_by_default') THEN
        ALTER TABLE public.report_definitions ADD COLUMN prepared_by_default TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_definitions' AND column_name = 'archived_at') THEN
        ALTER TABLE public.report_definitions ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Ensure generated_reports table columns
CREATE TABLE IF NOT EXISTS public.generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    report_definition_id UUID REFERENCES public.report_definitions(id) ON DELETE SET NULL,
    report_title TEXT NOT NULL DEFAULT 'Performance Report',
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    comparison_start DATE,
    comparison_end DATE,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    week_starts_on TEXT NOT NULL DEFAULT 'monday',
    prepared_by TEXT,
    generated_by UUID REFERENCES public.profiles(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'generated' NOT NULL CHECK (status IN ('draft', 'generating', 'generated', 'failed', 'archived')),
    included_platforms TEXT[] NOT NULL DEFAULT '{}',
    included_sections TEXT[] NOT NULL DEFAULT '{}',
    executive_summary TEXT,
    marketing_notes TEXT,
    recommendations TEXT,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_availability JSONB NOT NULL DEFAULT '[]'::jsonb,
    version_number INTEGER NOT NULL DEFAULT 1,
    revision_of UUID REFERENCES public.generated_reports(id) ON DELETE SET NULL,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'report_title') THEN
        ALTER TABLE public.generated_reports ADD COLUMN report_title TEXT DEFAULT 'Performance Report';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'report_type') THEN
        ALTER TABLE public.generated_reports ADD COLUMN report_type TEXT DEFAULT 'monthly';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'period_start') THEN
        ALTER TABLE public.generated_reports ADD COLUMN period_start DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'period_end') THEN
        ALTER TABLE public.generated_reports ADD COLUMN period_end DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'comparison_start') THEN
        ALTER TABLE public.generated_reports ADD COLUMN comparison_start DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'comparison_end') THEN
        ALTER TABLE public.generated_reports ADD COLUMN comparison_end DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'timezone') THEN
        ALTER TABLE public.generated_reports ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'week_starts_on') THEN
        ALTER TABLE public.generated_reports ADD COLUMN week_starts_on TEXT DEFAULT 'monday';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'generated_by') THEN
        ALTER TABLE public.generated_reports ADD COLUMN generated_by UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'included_platforms') THEN
        ALTER TABLE public.generated_reports ADD COLUMN included_platforms TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'included_sections') THEN
        ALTER TABLE public.generated_reports ADD COLUMN included_sections TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'marketing_notes') THEN
        ALTER TABLE public.generated_reports ADD COLUMN marketing_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'report_data') THEN
        ALTER TABLE public.generated_reports ADD COLUMN report_data JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'data_availability') THEN
        ALTER TABLE public.generated_reports ADD COLUMN data_availability JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'version_number') THEN
        ALTER TABLE public.generated_reports ADD COLUMN version_number INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'revision_of') THEN
        ALTER TABLE public.generated_reports ADD COLUMN revision_of UUID REFERENCES public.generated_reports(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'generated_reports' AND column_name = 'archived_at') THEN
        ALTER TABLE public.generated_reports ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Ensure report_exports table columns
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'xlsx')),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    checksum TEXT,
    generated_by UUID REFERENCES public.profiles(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    safe_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'company_id') THEN
        ALTER TABLE public.report_exports ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'file_name') THEN
        ALTER TABLE public.report_exports ADD COLUMN file_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'storage_path') THEN
        ALTER TABLE public.report_exports ADD COLUMN storage_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'file_size_bytes') THEN
        ALTER TABLE public.report_exports ADD COLUMN file_size_bytes BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'checksum') THEN
        ALTER TABLE public.report_exports ADD COLUMN checksum TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'generated_by') THEN
        ALTER TABLE public.report_exports ADD COLUMN generated_by UUID REFERENCES public.profiles(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'generated_at') THEN
        ALTER TABLE public.report_exports ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'status') THEN
        ALTER TABLE public.report_exports ADD COLUMN status TEXT DEFAULT 'completed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_exports' AND column_name = 'safe_error_message') THEN
        ALTER TABLE public.report_exports ADD COLUMN safe_error_message TEXT;
    END IF;
END $$;

-- 4. Ensure report_notes table columns
CREATE TABLE IF NOT EXISTS public.report_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    section_key TEXT NOT NULL DEFAULT 'general',
    note_type TEXT NOT NULL DEFAULT 'user_note',
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_notes' AND column_name = 'generated_report_id') THEN
        ALTER TABLE public.report_notes ADD COLUMN generated_report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_notes' AND column_name = 'section_key') THEN
        ALTER TABLE public.report_notes ADD COLUMN section_key TEXT DEFAULT 'general';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_notes' AND column_name = 'note_type') THEN
        ALTER TABLE public.report_notes ADD COLUMN note_type TEXT DEFAULT 'user_note';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'report_notes' AND column_name = 'content') THEN
        ALTER TABLE public.report_notes ADD COLUMN content TEXT;
    END IF;
END $$;

-- 5. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_generated_reports_company ON public.generated_reports (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_period ON public.generated_reports (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_generated_reports_revision ON public.generated_reports (revision_of);
CREATE INDEX IF NOT EXISTS idx_report_exports_report ON public.report_exports (generated_report_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_company ON public.report_exports (company_id);
CREATE INDEX IF NOT EXISTS idx_report_notes_report ON public.report_notes (generated_report_id);

-- 6. Enable RLS
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_notes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
DROP POLICY IF EXISTS "Members can view company report definitions" ON public.report_definitions;
CREATE POLICY "Members can view company report definitions"
    ON public.report_definitions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = report_definitions.company_id
              AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers and Admins can manage report definitions" ON public.report_definitions;
CREATE POLICY "Managers and Admins can manage report definitions"
    ON public.report_definitions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = report_definitions.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

DROP POLICY IF EXISTS "Members can view generated reports" ON public.generated_reports;
CREATE POLICY "Members can view generated reports"
    ON public.generated_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = generated_reports.company_id
              AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers and Admins can create and edit generated reports" ON public.generated_reports;
CREATE POLICY "Managers and Admins can create and edit generated reports"
    ON public.generated_reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = generated_reports.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

DROP POLICY IF EXISTS "Members can view report exports" ON public.report_exports;
CREATE POLICY "Members can view report exports"
    ON public.report_exports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = report_exports.company_id
              AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers and Admins can create report exports" ON public.report_exports;
CREATE POLICY "Managers and Admins can create report exports"
    ON public.report_exports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = report_exports.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

DROP POLICY IF EXISTS "Members can view report notes" ON public.report_notes;
CREATE POLICY "Members can view report notes"
    ON public.report_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = report_notes.company_id
              AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers and Admins can write report notes" ON public.report_notes;
CREATE POLICY "Managers and Admins can write report notes"
    ON public.report_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = report_notes.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

-- 8. Storage bucket initialization for report exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'report-exports',
    'report-exports',
    false,
    20971520, -- 20MB
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Storage Object Policies
DROP POLICY IF EXISTS "Report Exports Storage Select Policy" ON storage.objects;
CREATE POLICY "Report Exports Storage Select Policy"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'report-exports'
        AND EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id::text = (storage.foldername(name))[1]
              AND cm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Report Exports Storage Insert Policy" ON storage.objects;
CREATE POLICY "Report Exports Storage Insert Policy"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'report-exports'
        AND EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id::text = (storage.foldername(name))[1]
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

DROP POLICY IF EXISTS "Report Exports Storage Delete Policy" ON storage.objects;
CREATE POLICY "Report Exports Storage Delete Policy"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'report-exports'
        AND EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id::text = (storage.foldername(name))[1]
              AND cm.user_id = auth.uid()
              AND cm.role IN ('owner', 'admin')
        )
    );

NOTIFY pgrst, 'reload schema';
