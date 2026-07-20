-- Corrective, Additive, and Idempotent Migration for Stage 2 Connector Schema Fix
-- File: supabase/migrations/20260719140000_fix_stage2_connector_schema.sql

-- 1. Safely add missing columns to public.social_accounts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'provider'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN provider TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'is_selected'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN is_selected BOOLEAN DEFAULT true NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'capabilities'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN capabilities JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'provider_metadata'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'account_url'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN account_url TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'social_accounts' 
          AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE public.social_accounts ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;

-- 2. Backfill provider and profile_image_url in public.social_accounts
UPDATE public.social_accounts sa
SET provider = pc.provider
FROM public.platform_connections pc
WHERE sa.platform_connection_id = pc.id AND sa.provider IS NULL;

UPDATE public.social_accounts sa
SET profile_image_url = sa.avatar_url
WHERE sa.profile_image_url IS NULL AND sa.avatar_url IS NOT NULL;

-- 3. Set constraints on public.social_accounts.provider
DO $$
BEGIN
    -- Ensure all existing rows have provider set (or default to empty if orphaned, but empty tables won't trigger this)
    UPDATE public.social_accounts SET provider = 'facebook' WHERE provider IS NULL;

    -- Alter column to NOT NULL
    ALTER TABLE public.social_accounts ALTER COLUMN provider SET NOT NULL;

    -- Add Check Constraint safely
    ALTER TABLE public.social_accounts DROP CONSTRAINT IF EXISTS chk_social_accounts_provider;
    ALTER TABLE public.social_accounts ADD CONSTRAINT chk_social_accounts_provider 
        CHECK (provider IN ('facebook', 'instagram', 'youtube', 'tiktok'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 4. Safely handle public.platform_connections adjustments
-- Drop old status constraints
DO $$
BEGIN
    ALTER TABLE public.platform_connections DROP CONSTRAINT IF EXISTS platform_connections_connection_status_check;
    ALTER TABLE public.platform_connections DROP CONSTRAINT IF EXISTS chk_platform_connections_status;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Recreate constraint
ALTER TABLE public.platform_connections ADD CONSTRAINT chk_platform_connections_status 
    CHECK (connection_status IN ('pending', 'awaiting_account_selection', 'connected', 'expired', 'permission_required', 'invalid', 'failed', 'disconnected', 'revoked'));

-- Add missing columns to public.platform_connections
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'provider_user_id') THEN
        ALTER TABLE public.platform_connections ADD COLUMN provider_user_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'token_type') THEN
        ALTER TABLE public.platform_connections ADD COLUMN token_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'refresh_token_expires_at') THEN
        ALTER TABLE public.platform_connections ADD COLUMN refresh_token_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'provider_metadata') THEN
        ALTER TABLE public.platform_connections ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'last_validated_at') THEN
        ALTER TABLE public.platform_connections ADD COLUMN last_validated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'last_error_code') THEN
        ALTER TABLE public.platform_connections ADD COLUMN last_error_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'last_error_message_safe') THEN
        ALTER TABLE public.platform_connections ADD COLUMN last_error_message_safe TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'connected_by') THEN
        ALTER TABLE public.platform_connections ADD COLUMN connected_by UUID REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'connected_at') THEN
        ALTER TABLE public.platform_connections ADD COLUMN connected_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'platform_connections' AND column_name = 'revoked_at') THEN
        ALTER TABLE public.platform_connections ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. Create public.platform_credentials table for token data isolation
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

-- Add trigger for updated_at on platform_credentials
DO $$
BEGIN
    DROP TRIGGER IF EXISTS tr_platform_credentials_updated_at ON public.platform_credentials;
    CREATE TRIGGER tr_platform_credentials_updated_at 
    BEFORE UPDATE ON public.platform_credentials 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 6. Enforce unique active primary account per provider per company using partial unique index
DROP INDEX IF EXISTS public.idx_social_accounts_active_selected;
CREATE UNIQUE INDEX idx_social_accounts_active_selected 
ON public.social_accounts (company_id, provider) 
WHERE (is_selected = true AND archived_at IS NULL);

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
