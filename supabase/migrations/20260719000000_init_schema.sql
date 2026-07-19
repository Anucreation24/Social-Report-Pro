-- 20260719000000_init_schema.sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    appearance_preference TEXT DEFAULT 'system' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Workspace Members Table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'pending')),
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (workspace_id, user_id)
);

-- 4. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    logo_url TEXT,
    industry TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'UTC' NOT NULL,
    week_starts_on TEXT DEFAULT 'monday' NOT NULL CHECK (week_starts_on IN ('sunday', 'monday')),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- 5. Company Members Table
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'marketing_manager', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, user_id)
);

-- Helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_company_member(comp_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = comp_id
    AND company_members.user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(comp_id UUID, roles TEXT[])
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = comp_id
    AND company_members.user_id = auth.uid()
    AND company_members.role = ANY(roles)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = ws_id
    AND workspace_members.user_id = auth.uid()
  );
END;
$$;

-- 6. Platform Connections Table
CREATE TABLE IF NOT EXISTS public.platform_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('facebook', 'instagram', 'youtube', 'tiktok')),
    provider_account_id TEXT NOT NULL,
    provider_account_name TEXT NOT NULL,
    account_type TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    granted_scopes TEXT[],
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connection_status TEXT DEFAULT 'connected' NOT NULL CHECK (connection_status IN ('pending', 'connected', 'expired', 'permission_required', 'failed', 'disconnected')),
    connection_error TEXT,
    last_successful_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_attempt_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (company_id, provider, provider_account_id)
);

-- 7. Social Accounts Table
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE CASCADE NOT NULL,
    provider_account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    username TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, platform_connection_id, provider_account_id)
);

-- 8. Analytics Snapshots Table
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('facebook', 'instagram', 'youtube', 'tiktok')),
    provider_account_id TEXT NOT NULL,
    snapshot_date DATE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    aggregation_period TEXT NOT NULL CHECK (aggregation_period IN ('daily', 'weekly', 'monthly')),
    raw_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, provider, provider_account_id, snapshot_date, metric_name, aggregation_period)
);

-- 9. Content Items Table
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('facebook', 'instagram', 'youtube', 'tiktok')),
    provider_account_id TEXT NOT NULL,
    provider_content_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    caption TEXT,
    permalink TEXT,
    thumbnail_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds NUMERIC,
    status TEXT,
    raw_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, provider, provider_account_id, provider_content_id)
);

-- 10. Content Metrics Table
CREATE TABLE IF NOT EXISTS public.content_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
    snapshot_date DATE NOT NULL,
    likes INTEGER DEFAULT 0 NOT NULL,
    comments INTEGER DEFAULT 0 NOT NULL,
    shares INTEGER DEFAULT 0 NOT NULL,
    saves INTEGER DEFAULT 0 NOT NULL,
    views INTEGER DEFAULT 0 NOT NULL,
    engagements INTEGER DEFAULT 0 NOT NULL,
    reach INTEGER DEFAULT 0 NOT NULL,
    impressions INTEGER DEFAULT 0 NOT NULL,
    watch_time_seconds NUMERIC DEFAULT 0 NOT NULL,
    raw_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (content_item_id, snapshot_date)
);

-- 11. Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'youtube', 'tiktok', 'cross_platform')),
    metric TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    baseline_value NUMERIC DEFAULT 0 NOT NULL,
    current_value NUMERIC DEFAULT 0 NOT NULL,
    progress_percentage NUMERIC DEFAULT 0 NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'in_progress' NOT NULL CHECK (status IN ('not_started', 'in_progress', 'achieved', 'missed', 'archived')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Report Definitions Table
CREATE TABLE IF NOT EXISTS public.report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
    platforms TEXT[] NOT NULL,
    sections TEXT[] NOT NULL,
    prepared_by TEXT,
    report_preferences JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Generated Reports Table
CREATE TABLE IF NOT EXISTS public.generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    report_definition_id UUID REFERENCES public.report_definitions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    prepared_by TEXT,
    executive_summary TEXT,
    platform_notes JSONB,
    recommendations TEXT,
    metrics_snapshot JSONB,
    content_snapshot JSONB,
    goals_snapshot JSONB,
    marketing_score INTEGER,
    status TEXT DEFAULT 'published' NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Report Exports Table
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'excel')),
    file_url TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Report Notes Table
CREATE TABLE IF NOT EXISTS public.report_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    note_date DATE NOT NULL,
    note_text TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (company_id, platform, note_date)
);

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Sync Jobs Table
CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Sync Logs Table
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_job_id UUID REFERENCES public.sync_jobs(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('info', 'warning', 'error')),
    log_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    summary TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'system' NOT NULL,
    personal_timezone TEXT DEFAULT 'UTC' NOT NULL,
    notification_settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 21. Company Preferences Table
CREATE TABLE IF NOT EXISTS public.company_preferences (
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE PRIMARY KEY,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 22. Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    features JSONB DEFAULT '{}'::jsonb NOT NULL,
    max_companies INTEGER DEFAULT 2 NOT NULL,
    max_connections INTEGER DEFAULT 4 NOT NULL,
    max_users INTEGER DEFAULT 3 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 23. Workspace Subscriptions Table
CREATE TABLE IF NOT EXISTS public.workspace_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'trialing' NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days') NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- RLS ENABLING FOR ADDITIONAL TABLES
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR ADDITIONAL TABLES

-- Platform Connections
CREATE POLICY "Company members read connections" ON public.platform_connections
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage connections" ON public.platform_connections
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Social Accounts
CREATE POLICY "Company members read social accounts" ON public.social_accounts
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage social accounts" ON public.social_accounts
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Analytics Snapshots
CREATE POLICY "Company members read analytics" ON public.analytics_snapshots
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage analytics" ON public.analytics_snapshots
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Content Items
CREATE POLICY "Company members read content" ON public.content_items
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage content" ON public.content_items
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Content Metrics
CREATE POLICY "Company members read content metrics" ON public.content_metrics
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.content_items WHERE content_items.id = content_item_id AND is_company_member(content_items.company_id)));
CREATE POLICY "Company managers manage content metrics" ON public.content_metrics
    FOR ALL USING (EXISTS (SELECT 1 FROM public.content_items WHERE content_items.id = content_item_id AND has_company_role(content_items.company_id, ARRAY['owner', 'admin', 'marketing_manager'])));

-- Goals
CREATE POLICY "Company members read goals" ON public.goals
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers edit goals" ON public.goals
    FOR INSERT WITH CHECK (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));
CREATE POLICY "Company managers update goals" ON public.goals
    FOR UPDATE USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));
CREATE POLICY "Company owners delete goals" ON public.goals
    FOR DELETE USING (has_company_role(company_id, ARRAY['owner', 'admin']));

-- Report Definitions
CREATE POLICY "Company members read report definitions" ON public.report_definitions
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage report definitions" ON public.report_definitions
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Generated Reports
CREATE POLICY "Company members read reports" ON public.generated_reports
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers generate reports" ON public.generated_reports
    FOR INSERT WITH CHECK (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));
CREATE POLICY "Company managers update reports" ON public.generated_reports
    FOR UPDATE USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));
CREATE POLICY "Company owners delete reports" ON public.generated_reports
    FOR DELETE USING (has_company_role(company_id, ARRAY['owner', 'admin']));

-- Report Exports
CREATE POLICY "Company members read exports" ON public.report_exports
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.generated_reports WHERE generated_reports.id = generated_report_id AND is_company_member(generated_reports.company_id)));
CREATE POLICY "Company managers manage exports" ON public.report_exports
    FOR ALL USING (EXISTS (SELECT 1 FROM public.generated_reports WHERE generated_reports.id = generated_report_id AND has_company_role(generated_reports.company_id, ARRAY['owner', 'admin', 'marketing_manager'])));

-- Report Notes
CREATE POLICY "Company members read notes" ON public.report_notes
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage notes" ON public.report_notes
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Notifications
CREATE POLICY "Users read notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users manage notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- Sync Jobs
CREATE POLICY "Company members read sync jobs" ON public.sync_jobs
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company managers manage sync jobs" ON public.sync_jobs
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin', 'marketing_manager']));

-- Sync Logs
CREATE POLICY "Company members read sync logs" ON public.sync_logs
    FOR SELECT USING (is_company_member(company_id));

-- Audit Logs
CREATE POLICY "Workspace members read audit logs" ON public.audit_logs
    FOR SELECT USING (is_workspace_member(workspace_id));

-- User Preferences
CREATE POLICY "Users read preferences" ON public.user_preferences
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users manage preferences" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Company Preferences
CREATE POLICY "Company members read company preferences" ON public.company_preferences
    FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Company owners manage company preferences" ON public.company_preferences
    FOR ALL USING (has_company_role(company_id, ARRAY['owner', 'admin']));

-- Subscription Plans
CREATE POLICY "Plans are readable by authenticated" ON public.subscription_plans
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Workspace Subscriptions
CREATE POLICY "Workspace members view subscriptions" ON public.workspace_subscriptions
    FOR SELECT USING (is_workspace_member(workspace_id));


-- Triggers for Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
      updated_at = NOW();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.profiles
  SET email = new.email,
      full_name = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', full_name),
      avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', avatar_url),
      updated_at = NOW()
  WHERE id = new.id;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_update_user();
