-- Migration to fix platform_credentials RLS and secure write/delete access
-- File: supabase/migrations/20260719160000_fix_credentials_rls.sql

-- 1. Create secure store_encrypted_credentials helper function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.store_encrypted_credentials(
    p_connection_id UUID,
    p_access_token_encrypted TEXT,
    p_refresh_token_encrypted TEXT,
    p_token_expires_at TIMESTAMP WITH TIME ZONE,
    p_refresh_token_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the executing user is a member of the company that owns the connection
    -- restricting authorization to 'owner', 'admin', and 'marketing_manager' roles
    IF EXISTS (
        SELECT 1 
        FROM public.platform_connections pc
        JOIN public.company_members cm ON cm.company_id = pc.company_id
        WHERE pc.id = p_connection_id 
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin', 'marketing_manager')
    ) THEN
        INSERT INTO public.platform_credentials (
            connection_id,
            access_token_encrypted,
            refresh_token_encrypted,
            token_expires_at,
            refresh_token_expires_at,
            updated_at
        )
        VALUES (
            p_connection_id,
            p_access_token_encrypted,
            p_refresh_token_encrypted,
            p_token_expires_at,
            p_refresh_token_expires_at,
            now()
        )
        ON CONFLICT (connection_id) 
        DO UPDATE SET
            access_token_encrypted = EXCLUDED.access_token_encrypted,
            refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
            token_expires_at = EXCLUDED.token_expires_at,
            refresh_token_expires_at = EXCLUDED.refresh_token_expires_at,
            updated_at = now();
    ELSE
        RAISE EXCEPTION 'Access Denied: Insufficient company membership permissions to write credentials.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create secure delete_encrypted_credentials helper function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.delete_encrypted_credentials(
    p_connection_id UUID
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the executing user is a member of the company that owns the connection
    -- restricting authorization to 'owner', 'admin', and 'marketing_manager' roles
    IF EXISTS (
        SELECT 1 
        FROM public.platform_connections pc
        JOIN public.company_members cm ON cm.company_id = pc.company_id
        WHERE pc.id = p_connection_id 
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'admin', 'marketing_manager')
    ) THEN
        DELETE FROM public.platform_credentials
        WHERE connection_id = p_connection_id;
    ELSE
        RAISE EXCEPTION 'Access Denied: Insufficient company membership permissions to delete credentials.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure RLS is enabled on platform_credentials with no permissive policies
-- This prevents direct client SELECT/INSERT/UPDATE/DELETE operations completely, securing encrypted tokens
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
