-- Stage 5: AI Executive Intelligence Engine Schema Migration
-- Table: ai_report_snapshots

CREATE TABLE IF NOT EXISTS public.ai_report_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'weekly',
    summary_length TEXT NOT NULL DEFAULT 'medium',
    executive_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    growth_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    platform_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    content_intelligence JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    posting_time_intelligence JSONB NOT NULL DEFAULT '{}'::jsonb,
    trend_detection JSONB NOT NULL DEFAULT '{}'::jsonb,
    forecast JSONB NOT NULL DEFAULT '{}'::jsonb,
    performance_grade JSONB NOT NULL DEFAULT '{}'::jsonb,
    executive_kpis JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_report_snapshots ENABLE ROW LEVEL SECURITY;

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_ai_snapshots_company_date 
    ON public.ai_report_snapshots(company_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_snapshots_company_period 
    ON public.ai_report_snapshots(company_id, period_start, period_end);

-- RLS Policies
CREATE POLICY "Users can view AI report snapshots for their company"
    ON public.ai_report_snapshots
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = ai_report_snapshots.company_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners, admins and managers can insert AI report snapshots"
    ON public.ai_report_snapshots
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = ai_report_snapshots.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin', 'marketing_manager')
        )
    );

CREATE POLICY "Owners and admins can delete AI report snapshots"
    ON public.ai_report_snapshots
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = ai_report_snapshots.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );
