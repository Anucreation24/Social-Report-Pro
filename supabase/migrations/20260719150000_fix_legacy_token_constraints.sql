-- Migration to fix legacy token constraints on platform_connections
-- Dropping NOT NULL constraints and defaults to support token isolation in platform_credentials

ALTER TABLE public.platform_connections 
    ALTER COLUMN access_token_encrypted DROP NOT NULL,
    ALTER COLUMN access_token_encrypted DROP DEFAULT,
    ALTER COLUMN refresh_token_encrypted DROP NOT NULL,
    ALTER COLUMN refresh_token_encrypted DROP DEFAULT;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
