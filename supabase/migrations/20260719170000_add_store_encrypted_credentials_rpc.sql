-- Migration to explicitly define store_encrypted_credentials with correct permissions
-- File: supabase/migrations/20260719170000_add_store_encrypted_credentials_rpc.sql

-- Drop existing functions to ensure clean signature and type registration
DROP FUNCTION IF EXISTS public.store_encrypted_credentials(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.store_encrypted_credentials(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.delete_encrypted_credentials(UUID);

-- 1. Create store_encrypted_credentials with exact parameter types and secure checks
CREATE OR REPLACE FUNCTION public.store_encrypted_credentials(
    p_connection_id UUID,
    p_access_token_encrypted TEXT,
    p_refresh_token_encrypted TEXT,
    p_token_expires_at TIMESTAMPTZ,
    p_refresh_token_expires_at TIMESTAMPTZ
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

-- 2. Create delete_encrypted_credentials with secure checks
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

-- 3. Revoke EXECUTE privileges from PUBLIC to prevent direct anonymous/unauthorized access
REVOKE ALL ON FUNCTION public.store_encrypted_credentials(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_encrypted_credentials(UUID) FROM PUBLIC;

-- 4. Grant EXECUTE privileges to authorized roles so PostgREST exposes them to the schema cache
GRANT EXECUTE ON FUNCTION public.store_encrypted_credentials(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_encrypted_credentials(UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_encrypted_credentials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_encrypted_credentials(UUID) TO service_role;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
