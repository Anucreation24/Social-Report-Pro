-- Additive migration for stage 1 settings and company management

-- 1. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Add triggers for updated_at
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_workspace_members_updated_at BEFORE UPDATE ON public.workspace_members FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_company_members_updated_at BEFORE UPDATE ON public.company_members FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_company_preferences_updated_at BEFORE UPDATE ON public.company_preferences FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 3. Secure RPC for creating an additional company
CREATE OR REPLACE FUNCTION public.create_additional_company(
    ws_id UUID,
    comp_name TEXT,
    comp_slug TEXT,
    comp_industry TEXT,
    comp_country TEXT,
    comp_timezone TEXT,
    comp_week_starts_on TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    current_user_id UUID;
    created_comp_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- 1. Check authentication
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Verify workspace permission (must be owner or admin of the workspace)
    SELECT EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = ws_id
        AND workspace_members.user_id = current_user_id
        AND workspace_members.role IN ('owner', 'admin')
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Insufficient workspace permissions';
    END IF;

    -- 3. Create company
    INSERT INTO public.companies (
        workspace_id,
        name,
        slug,
        industry,
        country,
        timezone,
        week_starts_on,
        status,
        created_by
    )
    VALUES (
        ws_id,
        comp_name,
        comp_slug,
        comp_industry,
        comp_country,
        comp_timezone,
        comp_week_starts_on,
        'active',
        current_user_id
    )
    RETURNING id INTO created_comp_id;

    -- 4. Add user to company_members as owner
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (created_comp_id, current_user_id, 'owner');

    -- 5. Create default company preferences
    INSERT INTO public.company_preferences (company_id, settings)
    VALUES (created_comp_id, '{}'::jsonb)
    ON CONFLICT (company_id) DO NOTHING;

    -- 6. Log Audit Log
    INSERT INTO public.audit_logs (workspace_id, company_id, user_id, action, entity_type, entity_id, summary)
    VALUES (ws_id, created_comp_id, current_user_id, 'company_created', 'company', created_comp_id::text, 'Company created successfully: ' || comp_name);

    RETURN created_comp_id;
END;
$$;

-- 4. Enable RLS and verify policies
-- Additional check for company preference updates (only company owners and admins can update company preferences)
CREATE POLICY "Company owners and admins can insert preferences" ON public.company_preferences
    FOR INSERT WITH CHECK (has_company_role(company_id, ARRAY['owner', 'admin']));

CREATE POLICY "Company owners and admins can update preferences" ON public.company_preferences
    FOR UPDATE USING (has_company_role(company_id, ARRAY['owner', 'admin']));

-- Ensure user preferences can be inserted by authenticated users
CREATE POLICY "Users can insert preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
