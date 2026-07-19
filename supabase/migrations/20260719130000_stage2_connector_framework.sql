-- Additive migration for Stage 2 Connector Framework

-- 1. Alter platform_connections table to allow new statuses
-- First, drop the check constraint. We can find the check constraint name. Since it might vary, we can drop the constraint safely by catching errors or doing it directly.
-- In PostgreSQL, if we create it inline, it is named platform_connections_connection_status_check. Let's drop it if it exists.
DO $$
BEGIN
    ALTER TABLE public.platform_connections DROP CONSTRAINT IF EXISTS platform_connections_connection_status_check;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

ALTER TABLE public.platform_connections ADD CONSTRAINT chk_platform_connections_status 
    CHECK (connection_status IN ('pending', 'awaiting_account_selection', 'connected', 'expired', 'permission_required', 'invalid', 'failed', 'disconnected', 'revoked'));

-- 2. Add extra columns to platform_connections if missing
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS provider_user_id TEXT;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS token_type TEXT;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS last_error_code TEXT;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS last_error_message_safe TEXT;
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS connected_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.platform_connections ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

-- 3. Create public.platform_credentials table for token data isolation
CREATE TABLE IF NOT EXISTS public.platform_credentials (
    connection_id UUID REFERENCES public.platform_connections(id) ON DELETE CASCADE PRIMARY KEY,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on platform_credentials (no policy is created, denying client queries entirely)
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;

-- 4. Extend social_accounts table
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS account_url TEXT;

-- Rename avatar_url to profile_image_url if profile_image_url is missing, or just add profile_image_url as alias/column
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 5. Enforce unique active primary account per provider per company using partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_active_selected 
ON public.social_accounts (company_id, provider) 
WHERE (is_selected = true AND archived_at IS NULL);

-- 6. Add trigger for updated_at on platform_credentials
CREATE TRIGGER tr_platform_credentials_updated_at 
BEFORE UPDATE ON public.platform_credentials 
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Secure helper to select from credentials table checking active company membership
CREATE OR REPLACE FUNCTION public.get_encrypted_credentials(p_connection_id UUID)
RETURNS TABLE (
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the calling user (auth.uid()) is a member of the company that owns the connection
    IF EXISTS (
        SELECT 1 
        FROM public.platform_connections pc
        JOIN public.company_members cm ON cm.company_id = pc.company_id
        WHERE pc.id = p_connection_id AND cm.user_id = auth.uid()
    ) THEN
        RETURN QUERY
        SELECT creds.access_token_encrypted, creds.refresh_token_encrypted
        FROM public.platform_credentials creds
        WHERE creds.connection_id = p_connection_id;
    ELSE
        RAISE EXCEPTION 'Access Denied: Insufficient company membership permissions.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
