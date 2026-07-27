-- =====================================================================
-- Social Report Pro — Stage 4.6 Migration
-- Agency & Client Portal, Secure Report Share Links, Universal Import Profiles,
-- Client Reviews & Comments, Branding Settings, Invitations, & Notifications
-- File: supabase/migrations/20260728000000_stage46_agency_client_portal.sql
-- =====================================================================

-- 1. Create Report Share Links Table
CREATE TABLE IF NOT EXISTS public.report_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  generated_report_id UUID NOT NULL REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INT NOT NULL DEFAULT 0,
  allow_pdf_download BOOLEAN NOT NULL DEFAULT true,
  allow_excel_download BOOLEAN NOT NULL DEFAULT true,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  safe_label TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for share links
CREATE INDEX IF NOT EXISTS idx_report_share_links_token_hash ON public.report_share_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_report_share_links_company_id ON public.report_share_links(company_id);
CREATE INDEX IF NOT EXISTS idx_report_share_links_generated_report ON public.report_share_links(generated_report_id);
CREATE INDEX IF NOT EXISTS idx_report_share_links_expires_at ON public.report_share_links(expires_at);

-- 2. Create Reusable Import Profiles Table
CREATE TABLE IF NOT EXISTS public.import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  file_signature TEXT NOT NULL,
  sheet_name_pattern TEXT,
  header_signature TEXT[],
  mapping_config JSONB NOT NULL,
  date_format TEXT NOT NULL DEFAULT 'auto',
  unit_config JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_profiles_company_platform ON public.import_profiles(company_id, platform);
CREATE INDEX IF NOT EXISTS idx_import_profiles_signature ON public.import_profiles(file_signature);

-- 3. Create Client Report Reviews Table
CREATE TABLE IF NOT EXISTS public.client_report_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  generated_report_id UUID NOT NULL REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'internal_draft' CHECK (status IN ('internal_draft', 'ready_for_client', 'shared_with_client', 'client_viewed', 'approved', 'revision_requested')),
  client_comment TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_report_reviews_report ON public.client_report_reviews(generated_report_id);

-- 4. Create Client Report Comments Table (Internal vs Client Visible)
CREATE TABLE IF NOT EXISTS public.client_report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  generated_report_id UUID NOT NULL REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  is_internal BOOLEAN NOT NULL DEFAULT true, -- true = agency internal, false = client visible
  comment_text TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_report_comments_report ON public.client_report_comments(generated_report_id);

-- 5. Create Branding Settings Table
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE, -- NULL means Agency default
  agency_name TEXT,
  agency_logo_url TEXT,
  company_logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#4F46E5',
  secondary_color TEXT NOT NULL DEFAULT '#06B6D4',
  accent_color TEXT NOT NULL DEFAULT '#10B981',
  footer_text TEXT,
  support_email TEXT,
  website_url TEXT,
  portal_welcome_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create Company Invitations Table
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client_viewer' CHECK (role IN ('client_viewer', 'viewer', 'marketing_manager', 'admin', 'owner')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  welcome_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON public.company_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_company_invitations_company_email ON public.company_invitations(company_id, email);

-- 7. Create In-App Notifications Table
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user ON public.in_app_notifications(user_id, is_read);

-- =====================================================================
-- Enable Row Level Security (RLS)
-- =====================================================================
ALTER TABLE public.report_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_report_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Company Access
CREATE OR REPLACE FUNCTION public.has_company_access(target_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = target_company_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Company members can view report share links" ON public.report_share_links
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Agency admins and managers can insert share links" ON public.report_share_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_id = report_share_links.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'marketing_manager')
    )
  );

CREATE POLICY "Company members can view import profiles" ON public.import_profiles
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Agency managers can create import profiles" ON public.import_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_id = import_profiles.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'marketing_manager')
    )
  );

CREATE POLICY "Company members can view reviews" ON public.client_report_reviews
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Company members can create reviews" ON public.client_report_reviews
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Company members can view comments" ON public.client_report_comments
  FOR SELECT USING (
    public.has_company_access(company_id) AND (
      is_internal = false OR EXISTS (
        SELECT 1 FROM public.company_members
        WHERE company_id = client_report_comments.company_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin', 'marketing_manager')
      )
    )
  );

CREATE POLICY "Company members can insert comments" ON public.client_report_comments
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Company members can view branding settings" ON public.branding_settings
  FOR SELECT USING (company_id IS NULL OR public.has_company_access(company_id));

CREATE POLICY "Admins can update branding settings" ON public.branding_settings
  FOR ALL USING (
    company_id IS NULL OR EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_id = branding_settings.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view their notifications" ON public.in_app_notifications
  FOR SELECT USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
