-- ============================================
-- WAFAYE SPONSER - COMPLETE DATABASE SCHEMA
-- ============================================
-- This file contains all database tables, functions, triggers, and initial data
-- Run this file once to set up the entire database
-- Template definitions now reside in application JSON configs; see src/lib/templates.

-- ============================================
-- EXTENSIONS & UTILITY FUNCTIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_cron extension for scheduled jobs (if available)
-- Note: pg_cron may not be available on all Supabase plans
-- If not available, use external cron service to call /api/cron/cleanup-analytics
CREATE EXTENSION IF NOT EXISTS "pg_cron";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(150) NOT NULL,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all admin operations" ON admins
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- ADMIN_SESSIONS TABLE
-- ============================================
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    session_expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_expires ON admin_sessions(session_token, session_expires_at DESC);

CREATE TRIGGER update_admin_sessions_updated_at
    BEFORE UPDATE ON admin_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all admin session operations" ON admin_sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE OR REPLACE VIEW admin_session AS
SELECT * FROM admin_sessions;

-- ============================================
-- LINKTREES TABLE
-- ============================================
CREATE TABLE linktrees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    subtitle TEXT, -- Subtitle/short description (new field)
    seo_name VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly slug
    uid VARCHAR(50) UNIQUE NOT NULL, -- Public unique identifier
    
    -- Visual customization
    image TEXT, -- Profile/image URL
    background_color VARCHAR(50) DEFAULT '#ffffff', -- Background color (white default)
    template_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dynamic template configuration
    
    -- Expiration
    expire_date TIMESTAMPTZ,
    
    -- Footer customization (new fields)
    footer_text TEXT, -- Footer text (e.g., "سپۆنسەر کراوە لەلایەن")
    footer_phone VARCHAR(20), -- Footer phone number (e.g., "9647503639119")
    footer_hidden BOOLEAN DEFAULT false, -- Hide footer entirely for this linktree
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT name_length CHECK (char_length(name) >= 3),
    CONSTRAINT seo_name_length CHECK (char_length(seo_name) >= 3),
    CONSTRAINT uid_length CHECK (char_length(uid) >= 3),
    CONSTRAINT uid_format CHECK (uid ~ '^[a-z0-9-]+$'), -- Only lowercase, numbers, and hyphens
    CONSTRAINT seo_name_format CHECK (seo_name ~ '^[a-z0-9-]+$')
);

-- Indexes for faster lookups
CREATE INDEX idx_linktrees_uid ON linktrees(uid);
CREATE INDEX idx_linktrees_seo_name ON linktrees(seo_name);
CREATE INDEX idx_linktrees_expire_date ON linktrees(expire_date);
CREATE INDEX idx_linktrees_created_at ON linktrees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_linktrees_template_config ON linktrees USING GIN (template_config);

-- ============================================
-- MIGRATION: Add new fields to existing linktrees table (if not already present)
-- ============================================
-- This section ensures backward compatibility with existing databases
-- It safely adds new columns if they don't exist

-- Add subtitle column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linktrees' AND column_name = 'subtitle'
    ) THEN
        ALTER TABLE linktrees ADD COLUMN subtitle TEXT;
    END IF;
END $$;

-- Add footer_text column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linktrees' AND column_name = 'footer_text'
    ) THEN
        ALTER TABLE linktrees ADD COLUMN footer_text TEXT;
    END IF;
END $$;

-- Add footer_phone column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linktrees' AND column_name = 'footer_phone'
    ) THEN
        ALTER TABLE linktrees ADD COLUMN footer_phone VARCHAR(20);
    END IF;
END $$;

-- Remove snowfall_enabled column (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linktrees' AND column_name = 'snowfall_enabled'
    ) THEN
        ALTER TABLE linktrees DROP COLUMN snowfall_enabled;
    END IF;
END $$;

-- ============================================
-- MIGRATION: Dynamic Templates (New Method)
-- ============================================
-- Frontend sends template data → stored in linktrees.template_config
-- Database returns template data → consumers render directly
-- Each linktree owns its template metadata; legacy templates table is removed

-- Ensure template_config column exists and migrate legacy template data
DO $$
DECLARE
    has_template_key BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'linktrees' AND column_name = 'template_key'
    );
    has_template_style BOOLEAN := EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'linktrees' AND column_name = 'template_style'
    );
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'linktrees' AND column_name = 'template_config'
    ) THEN
        ALTER TABLE linktrees ADD COLUMN template_config JSONB DEFAULT '{}'::jsonb;
    END IF;

    UPDATE linktrees
    SET template_config = COALESCE(template_config, '{}'::jsonb);

    IF has_template_key THEN
        UPDATE linktrees
        SET template_config = jsonb_set(
            template_config,
            '{templateKey}',
            to_jsonb(COALESCE(NULLIF(template_key, ''), 'colorful-pills'))
        )
        WHERE (template_config ->> 'templateKey') IS NULL
           OR template_config ->> 'templateKey' = '';

        ALTER TABLE linktrees DROP CONSTRAINT IF EXISTS linktrees_template_key_fkey;
        ALTER TABLE linktrees DROP COLUMN template_key;
    END IF;

    IF has_template_style THEN
        UPDATE linktrees
        SET template_config = jsonb_set(
            template_config,
            '{templateKey}',
            to_jsonb(
                CASE COALESCE(template_style, '')
                    WHEN 'modern-glass' THEN 'colorful-pills'
                    WHEN 'panorama-split' THEN 'colorful-pills'
                    WHEN '' THEN 'colorful-pills'
                    ELSE template_style
                END
            )
        )
        WHERE (template_config ->> 'templateKey') IS NULL
           OR template_config ->> 'templateKey' = '';

        ALTER TABLE linktrees DROP COLUMN template_style;
    END IF;

    UPDATE linktrees
    SET template_config = jsonb_set(
        template_config,
        '{templateKey}',
            to_jsonb('colorful-pills'::text)
    )
    WHERE (template_config ->> 'templateKey') IS NULL
       OR template_config ->> 'templateKey' = '';

    ALTER TABLE linktrees ALTER COLUMN template_config SET DEFAULT '{}'::jsonb;
    ALTER TABLE linktrees ALTER COLUMN template_config SET NOT NULL;
    COMMENT ON COLUMN linktrees.template_config IS 'Stores dynamic template configuration/data sent from the application. Each linktree manages its own template settings.';
END $$;

-- Remove total_views and total_clicks columns (if they exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linktrees' AND column_name = 'total_views'
    ) THEN
        ALTER TABLE linktrees DROP COLUMN total_views;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'linktrees' AND column_name = 'total_clicks'
    ) THEN
        ALTER TABLE linktrees DROP COLUMN total_clicks;
    END IF;
END $$;

-- Update default linktree footer fields if they don't exist
UPDATE linktrees 
SET footer_text = COALESCE(footer_text, 'سپۆنسەر کراوە لەلایەن'),
    footer_phone = COALESCE(footer_phone, '9647503639119'),
    template_config = jsonb_set(
        COALESCE(template_config, '{}'::jsonb),
        '{templateKey}',
        to_jsonb('colorful-pills'::text)
    )
WHERE uid = 'suhaibcenter' 
  AND (footer_text IS NULL OR footer_phone IS NULL);

UPDATE linktrees
SET template_config = jsonb_set(
    template_config,
    '{templateKey}',
    to_jsonb('colorful-pills'::text)
    )
WHERE (template_config ->> 'templateKey') IS NULL
   OR template_config ->> 'templateKey' = '';

CREATE TRIGGER update_linktrees_updated_at 
    BEFORE UPDATE ON linktrees
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-EXPIRE LINKTREE TRIGGER
-- ============================================
-- Note: Expiration is now handled in application logic
-- The expire_date column is still used for filtering in queries

-- ============================================
-- ROW LEVEL SECURITY (RLS) - LINKTREES
-- ============================================
ALTER TABLE linktrees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published linktrees" ON linktrees
    FOR SELECT
    USING (expire_date IS NULL OR expire_date > NOW());

-- Service role policy: Only apply to service_role to avoid multiple permissive policies
CREATE POLICY "Service role has full access" ON linktrees
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- LINKS TABLE
-- ============================================
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to linktree
    linktree_id UUID NOT NULL REFERENCES linktrees(id) ON DELETE CASCADE,
    
    -- Platform information
    platform VARCHAR(50) NOT NULL, -- whatsapp, telegram, instagram, etc.
    url TEXT NOT NULL, -- Full URL to the platform link
    
    -- Display information
    display_name VARCHAR(255), -- Custom button label/name (if not provided, uses platform name)
    description TEXT, -- Optional button description/tooltip
    default_message TEXT, -- Default message to send with messaging platforms (WhatsApp, Telegram, Viber)
    
    -- Display order
    display_order INTEGER NOT NULL DEFAULT 0, -- Order in which links appear
    
    -- Analytics (denormalized for performance)
    click_count INTEGER DEFAULT 0,
    
    -- Additional metadata (JSONB for flexible storage)
    -- Stores: original_input_value, country_code, custom_icon, custom_color, etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT platform_not_empty CHECK (char_length(platform) > 0),
    CONSTRAINT url_not_empty CHECK (char_length(url) > 0),
    CONSTRAINT url_format CHECK (url ~ '^https?://|^tel:|^mailto:|^viber://'), -- Must start with http://, https://, tel:, mailto:, or viber://
    CONSTRAINT display_order_positive CHECK (display_order >= 0)
);

-- Indexes for faster lookups
CREATE INDEX idx_links_linktree_id ON links(linktree_id);
CREATE INDEX idx_links_platform ON links(platform);
-- Composite index for common queries (linktree_id + display_order for ordering)
CREATE INDEX idx_links_linktree_order ON links(linktree_id, display_order);
CREATE INDEX idx_links_created_at ON links(created_at DESC);

CREATE TRIGGER update_links_updated_at 
    BEFORE UPDATE ON links
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-REORDER DISPLAY ORDER TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION reorder_links_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Reorder links for the same linktree
    UPDATE links
    SET display_order = display_order - 1
    WHERE linktree_id = OLD.linktree_id 
        AND display_order > OLD.display_order;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reorder_links_on_delete
    AFTER DELETE ON links
    FOR EACH ROW
    EXECUTE FUNCTION reorder_links_after_delete();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - LINKS
-- ============================================
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read links" ON links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM linktrees lt 
            WHERE lt.id = links.linktree_id 
                AND (lt.expire_date IS NULL OR lt.expire_date > NOW())
        )
    );

-- Service role policy: Only apply to service_role to avoid multiple permissive policies
CREATE POLICY "Service role has full access" ON links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PAGE_VIEWS TABLE
-- ============================================
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to linktree
    linktree_id UUID NOT NULL REFERENCES linktrees(id) ON DELETE CASCADE,
    
    -- Visitor information
    ip_address INET NOT NULL,
    user_agent TEXT,
    referer TEXT,
    
    -- Device information
    device_type VARCHAR(100), -- mobile, desktop, tablet
    browser VARCHAR(255),
    os VARCHAR(255),
    
    -- Timestamp
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Session tracking
    session_id VARCHAR(255), -- For deduplication
    
    -- Constraints
    CONSTRAINT ip_address_not_null CHECK (ip_address IS NOT NULL)
);

-- Essential indexes only (simplified for free tier)
CREATE INDEX idx_page_views_linktree_date ON page_views(linktree_id, viewed_at DESC);
CREATE INDEX idx_page_views_session_id ON page_views(session_id) WHERE session_id IS NOT NULL;
-- Composite index for deduplication queries (optimizes view tracking)
CREATE INDEX IF NOT EXISTS idx_page_views_dedup ON page_views(linktree_id, ip_address, viewed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - PAGE_VIEWS
-- ============================================
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Service role policy: Only apply to service_role to avoid multiple permissive policies
CREATE POLICY "Service role has full access" ON page_views
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- LINK_CLICKS TABLE
-- ============================================
CREATE TABLE link_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to link
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    
    -- Foreign key to linktree (denormalized for faster queries)
    linktree_id UUID NOT NULL REFERENCES linktrees(id) ON DELETE CASCADE,
    
    -- Visitor information
    ip_address INET NOT NULL,
    user_agent TEXT,
    referer TEXT,
    
    -- Device information
    device_type VARCHAR(100), -- mobile, desktop, tablet
    browser VARCHAR(255),
    os VARCHAR(255),
    
    -- Timestamp
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Session tracking
    session_id VARCHAR(255), -- For deduplication
    
    -- Constraints
    CONSTRAINT ip_address_not_null CHECK (ip_address IS NOT NULL)
);

-- Essential indexes only (simplified for free tier)
CREATE INDEX idx_link_clicks_linktree_date ON link_clicks(linktree_id, clicked_at DESC);
CREATE INDEX idx_link_clicks_link_id ON link_clicks(link_id);
CREATE INDEX idx_link_clicks_session_id ON link_clicks(session_id) WHERE session_id IS NOT NULL;
-- Composite index for deduplication queries (optimizes click tracking)
CREATE INDEX IF NOT EXISTS idx_link_clicks_dedup ON link_clicks(link_id, ip_address, clicked_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - LINK_CLICKS
-- ============================================
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- Service role policy: Only apply to service_role to avoid multiple permissive policies
CREATE POLICY "Service role has full access" ON link_clicks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS - ADMINS
-- ============================================
-- Note: Removed unused functions: is_admin_locked, record_failed_login, record_successful_login
-- These are replaced by authenticate_and_create_session which handles everything in one call

-- Function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(
    p_username VARCHAR,
    p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
    is_valid BOOLEAN;
BEGIN
    -- Get stored password hash
    SELECT password_hash INTO stored_hash
    FROM admins
    WHERE username = p_username;
    
    -- If no user found, return false
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verify password using crypt function
    -- crypt() compares the plain password with stored hash
    SELECT (crypt(p_password, stored_hash) = stored_hash) INTO is_valid;
    
    RETURN COALESCE(is_valid, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Optimized function: Authenticate and create session in single transaction
-- This reduces database round trips from 3 to 1, making login much faster
CREATE OR REPLACE FUNCTION authenticate_and_create_session(
    p_username VARCHAR,
    p_password TEXT,
    p_session_token TEXT,
    p_session_expires_at TIMESTAMPTZ,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    admin_id UUID,
    username VARCHAR,
    name VARCHAR
) AS $$
DECLARE
    v_admin_id UUID;
    v_password_hash TEXT;
    v_admin_username VARCHAR;
    v_admin_name VARCHAR;
    v_password_valid BOOLEAN;
BEGIN
    -- Get admin data and password hash in single query
    SELECT 
        a.id,
        a.password_hash,
        a.username,
        a.name
    INTO 
        v_admin_id,
        v_password_hash,
        v_admin_username,
        v_admin_name
    FROM admins a
    WHERE a.username = p_username;
    
    -- If admin not found, return failure
    IF v_admin_id IS NULL OR v_password_hash IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;
    
    -- Verify password
    SELECT (crypt(p_password, v_password_hash) = v_password_hash) INTO v_password_valid;
    
    -- If password invalid, return failure
    IF NOT v_password_valid THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;
    
    -- Password valid - update admin record and create session in single transaction
    UPDATE admins
    SET 
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = NOW(),
        last_login_ip = p_ip_address
    WHERE id = v_admin_id;
    
    -- Create session
    INSERT INTO admin_sessions (
        admin_id,
        session_token,
        session_expires_at,
        ip_address,
        user_agent,
        last_used_at
    ) VALUES (
        v_admin_id,
        p_session_token,
        p_session_expires_at,
        p_ip_address,
        p_user_agent,
        NOW()
    )
    ON CONFLICT (session_token) DO UPDATE SET
        session_expires_at = EXCLUDED.session_expires_at,
        last_used_at = NOW();
    
    -- Return success with admin data
    RETURN QUERY SELECT TRUE, v_admin_id, v_admin_username, v_admin_name;
END;
$$ LANGUAGE plpgsql;

-- Function to validate session (updated to use admin_sessions table)
CREATE OR REPLACE FUNCTION is_session_valid(session_tok TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    SELECT 
        CASE 
            WHEN session_token = session_tok 
                AND session_expires_at > NOW() 
            THEN TRUE
            ELSE FALSE
        END INTO is_valid
    FROM admin_sessions
    WHERE session_token = session_tok;
    
    RETURN COALESCE(is_valid, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to logout (updated to delete specific session from admin_sessions)
CREATE OR REPLACE FUNCTION logout_admin(session_tok TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM admin_sessions
    WHERE session_token = session_tok;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh session expiration
CREATE OR REPLACE FUNCTION refresh_session_expiration(
    session_tok TEXT,
    new_expires_at TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
    UPDATE admin_sessions
    SET 
        session_expires_at = new_expires_at,
        last_used_at = NOW()
    WHERE session_token = session_tok;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin by session token (updated to use admin_sessions)
CREATE OR REPLACE FUNCTION get_admin_by_session(session_tok TEXT)
RETURNS TABLE (
    admin_id UUID,
    username VARCHAR,
    name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.username,
        a.name
    FROM admins a
    INNER JOIN admin_sessions s ON a.id = s.admin_id
    WHERE s.session_token = session_tok
        AND s.session_expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Optimized function: Validate session, refresh expiration, and get admin in single call
-- This reduces database round trips from 3 to 1, making session checks much faster
CREATE OR REPLACE FUNCTION validate_and_refresh_session(
    p_session_token TEXT,
    p_new_expires_at TIMESTAMPTZ
)
RETURNS TABLE (
    admin_id UUID,
    username VARCHAR,
    name VARCHAR
) AS $$
BEGIN
    -- Update session expiration and last_used_at, then return admin data in single query
    -- Only updates if session is valid (exists and not expired)
    RETURN QUERY
    WITH updated_session AS (
        UPDATE admin_sessions
        SET 
            session_expires_at = p_new_expires_at,
            last_used_at = NOW()
        WHERE session_token = p_session_token
            AND session_expires_at > NOW()
        RETURNING admin_id
    )
    SELECT 
        a.id,
        a.username,
        a.name
    FROM admins a
    INNER JOIN updated_session s ON a.id = s.admin_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update admin password (invalidates all sessions for security)
CREATE OR REPLACE FUNCTION update_admin_password(
    p_admin_id UUID,
    p_new_password TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE admins
    SET 
        password_hash = crypt(p_new_password, gen_salt('bf', 10)),
        password_changed_at = NOW()
    WHERE id = p_admin_id;
    
    -- Invalidate all sessions when password is changed (security best practice)
    DELETE FROM admin_sessions
    WHERE admin_id = p_admin_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTIONS - LINKTREES
-- ============================================
-- Note: Removed unused functions: generate_linktree_uid (app uses nanoid), 
-- increment_linktree_clicks (clicks tracked via link_clicks table),
-- is_linktree_expired (checked in app code), get_linktree_by_uid (app uses direct queries)

-- Removed increment_linktree_views - no longer needed (views tracked in page_views table)

-- ============================================
-- HELPER FUNCTIONS - LINKS
-- ============================================

-- Function to increment link click count
CREATE OR REPLACE FUNCTION increment_link_click(link_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE links
    SET click_count = click_count + 1
    WHERE id = link_id;
    
    -- Note: linktree clicks are tracked in link_clicks table, not denormalized
END;
$$ LANGUAGE plpgsql;

-- Note: Removed get_links_by_linktree - application uses direct queries with JOINs for better performance

-- Function to get next display order for a linktree
CREATE OR REPLACE FUNCTION get_next_display_order(p_linktree_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_order INTEGER;
BEGIN
    SELECT COALESCE(MAX(display_order), -1) + 1 INTO max_order
    FROM links
    WHERE linktree_id = p_linktree_id;
    
    RETURN max_order;
END;
$$ LANGUAGE plpgsql;

-- Templates table removed; dynamic configuration now stored on linktrees.template_config

-- Optimized function to get per-linktree analytics across the entire dataset
-- Returns unique counts for every linktree in a single query
CREATE OR REPLACE FUNCTION get_all_linktrees_analytics_optimized()
RETURNS TABLE (
    linktree_id UUID,
    unique_views BIGINT,
    unique_clicks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH view_stats AS (
        SELECT 
            linktree_id,
            COUNT(DISTINCT ip_address)::BIGINT AS unique_views
        FROM page_views
        GROUP BY linktree_id
    ),
    click_stats AS (
        SELECT 
            linktree_id,
            COUNT(DISTINCT ip_address)::BIGINT AS unique_clicks
        FROM link_clicks
        GROUP BY linktree_id
    )
    SELECT 
        lt.id AS linktree_id,
        COALESCE(vs.unique_views, 0)::BIGINT AS unique_views,
        COALESCE(cs.unique_clicks, 0)::BIGINT AS unique_clicks
    FROM linktrees lt
    LEFT JOIN view_stats vs ON lt.id = vs.linktree_id
    LEFT JOIN click_stats cs ON lt.id = cs.linktree_id;
END;
$$ LANGUAGE plpgsql;

-- Optimized function to get total analytics across all linktrees
-- Uses database aggregation for maximum performance
CREATE OR REPLACE FUNCTION get_total_analytics_optimized()
RETURNS TABLE (
    unique_views BIGINT,
    unique_clicks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH view_stats AS (
        SELECT 
            -- Unique views: Count DISTINCT IP addresses (same user visiting multiple times = 1 unique)
            COUNT(DISTINCT ip_address)::BIGINT as unique_views
        FROM page_views
    ),
    click_stats AS (
        SELECT 
            -- Unique clicks: Count DISTINCT IP addresses (same user clicking multiple times = 1 unique)
            COUNT(DISTINCT ip_address)::BIGINT as unique_clicks
        FROM link_clicks
    )
    SELECT 
        vs.unique_views,
        cs.unique_clicks
    FROM view_stats vs
    CROSS JOIN click_stats cs;
END;
$$ LANGUAGE plpgsql;

-- Optimized function to get analytics for a single linktree using database aggregation
CREATE OR REPLACE FUNCTION get_linktree_analytics_optimized(p_linktree_id UUID)
RETURNS TABLE (
    unique_views BIGINT,
    unique_clicks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH view_stats AS (
        SELECT 
            -- Unique views: Count DISTINCT IP addresses (same user visiting multiple times = 1 unique)
            COUNT(DISTINCT ip_address)::BIGINT as unique_views
        FROM page_views
        WHERE linktree_id = p_linktree_id
    ),
    click_stats AS (
        SELECT 
            -- Unique clicks: Count DISTINCT IP addresses (same user clicking multiple times = 1 unique)
            COUNT(DISTINCT ip_address)::BIGINT as unique_clicks
        FROM link_clicks
        WHERE linktree_id = p_linktree_id
    )
    SELECT 
        COALESCE(vs.unique_views, 0)::BIGINT as unique_views,
        COALESCE(cs.unique_clicks, 0)::BIGINT as unique_clicks
    FROM view_stats vs
    FULL OUTER JOIN click_stats cs ON true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT EXECUTE PERMISSIONS FOR OPTIMIZED ANALYTICS FUNCTIONS
-- ============================================

-- Grant execute permission for get_all_linktrees_analytics_optimized
GRANT EXECUTE ON FUNCTION get_all_linktrees_analytics_optimized() 
TO service_role, authenticated;

-- Grant execute permission for get_total_analytics_optimized
GRANT EXECUTE ON FUNCTION get_total_analytics_optimized() 
TO service_role, authenticated;

-- Grant execute permission for get_linktree_analytics_optimized
GRANT EXECUTE ON FUNCTION get_linktree_analytics_optimized(UUID) 
TO service_role, authenticated;

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- ============================================
-- Username: admin
-- Password: Wafayeadmin@1234
-- Name: Suhaib Center

INSERT INTO admins (
    username,
    password_hash,
    name
) VALUES (
    'suhaibcenter',
    crypt('suhaibcenter@123', gen_salt('bf', 10)),
    'Suhaib Center'
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- INSERT DEFAULT PAGE (Root Page)
-- ============================================
-- This creates the default Suhaib Center page at root (/)

INSERT INTO linktrees (
    name,
    subtitle,
    seo_name,
    uid,
    image,
    background_color,
    expire_date,
    footer_text,
    footer_phone,
    template_config
) VALUES (
    'Suhaib Center',
    'بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە',
    'suhaibcenter',
    'suhaibcenter',
    '/images/Logo.jpg',
    '#ffffff',
    NULL, -- No expiration
    'Suhaib Center',
    '9647503639119',
    jsonb_build_object('templateKey', 'colorful-pills')
) ON CONFLICT (uid) DO UPDATE SET
    name = EXCLUDED.name,
    subtitle = EXCLUDED.subtitle,
    image = EXCLUDED.image,
    footer_text = EXCLUDED.footer_text,
    footer_phone = EXCLUDED.footer_phone,
    background_color = EXCLUDED.background_color,
    template_config = COALESCE(linktrees.template_config, '{}'::jsonb) || EXCLUDED.template_config;

-- Get the linktree ID and insert links
DO $$
DECLARE
    v_linktree_id UUID;
    v_order INTEGER := 0;
BEGIN
    -- Get linktree ID
    SELECT id INTO v_linktree_id
    FROM linktrees
    WHERE uid = 'suhaibcenter';
    
    IF v_linktree_id IS NULL THEN
        RAISE EXCEPTION 'Failed to create default linktree';
    END IF;
    
    -- Delete existing links for this linktree (in case of update)
    DELETE FROM links WHERE linktree_id = v_linktree_id;
    
    -- Insert WhatsApp link (phone number format: country code + number without + sign, with default message in URL)
    INSERT INTO links (linktree_id, platform, url, display_name, default_message, display_order, metadata)
    VALUES (v_linktree_id, 'whatsapp', 'https://wa.me/9647503639119?text=%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%DB%8C%DA%A9%D9%85%20%D8%A8%DB%95%D8%B1%DB%8E%D8%B2%20%D8%A8%DB%8E%20%D8%B2%DB%95%D8%AD%D9%85%DB%95%D8%AA%20%D9%86%D8%B1%D8%AE.', 'واتساپ', 'سلام علیکم بەرێز بێ زەحمەت نرخ.', v_order, '{"original_input": "7503639119", "country_code": "964"}'::jsonb);
    v_order := v_order + 1;
    
    -- Insert Viber link (phone number format: country code + number without + sign)
    INSERT INTO links (linktree_id, platform, url, display_name, default_message, display_order, metadata)
    VALUES (v_linktree_id, 'viber', 'viber://chat?number=9647503639119', 'ڤایبەر', 'سلام علیکم بەرێز بێ زەحمەت نرخ.', v_order, '{"original_input": "7503639119", "country_code": "964"}'::jsonb);
    v_order := v_order + 1;
    
    -- Insert Phone link (tel: format with + sign) - No default message for phone calls
    INSERT INTO links (linktree_id, platform, url, display_name, display_order, metadata)
    VALUES (v_linktree_id, 'phone', 'tel:+9647503639119', 'ژمارەی مۆبایل', v_order, '{"original_input": "7503639119", "country_code": "964"}'::jsonb);
    
    RAISE NOTICE 'Default page created successfully with ID: %', v_linktree_id;
END $$;

-- ============================================
-- SUPABASE STORAGE BUCKET SETUP
-- ============================================
-- This creates a storage bucket for linktree images

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'linktree-images',
  'linktree-images',
  true, -- Public bucket (images need to be accessible)
  512000, -- 500 KB limit (in bytes)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING; -- Don't error if bucket already exists

-- ============================================
-- STORAGE POLICIES (RLS)
-- ============================================
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Policy 1: Allow Public Read Access
-- Anyone can view images (they're public anyway)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'linktree-images');

-- Policy 2: Allow Authenticated Upload
-- Only authenticated users (admins) can upload images
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'linktree-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow Authenticated Update
-- Only authenticated users (admins) can update images
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'linktree-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow Authenticated Delete
-- Only authenticated users (admins) can delete images
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'linktree-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- MIGRATION: Update VARCHAR Limits for Analytics Tables
-- ============================================
-- These ALTER TABLE statements update existing databases to match the new schema
-- Safe to run on new databases (no-op if columns already have correct size)
-- Safe to run multiple times

-- Update page_views table columns
DO $$ 
BEGIN
    -- Increase timezone from VARCHAR(100) to VARCHAR(255) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'timezone' 
        AND character_maximum_length < 255
    ) THEN
        ALTER TABLE page_views ALTER COLUMN timezone TYPE VARCHAR(255);
    END IF;
    
    -- Increase device_type from VARCHAR(50) to VARCHAR(100) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'device_type' 
        AND character_maximum_length < 100
    ) THEN
        ALTER TABLE page_views ALTER COLUMN device_type TYPE VARCHAR(100);
    END IF;
    
    -- Increase browser from VARCHAR(100) to VARCHAR(255) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'browser' 
        AND character_maximum_length < 255
    ) THEN
        ALTER TABLE page_views ALTER COLUMN browser TYPE VARCHAR(255);
    END IF;
    
    -- Increase os from VARCHAR(100) to VARCHAR(255) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'os' 
        AND character_maximum_length < 255
    ) THEN
        ALTER TABLE page_views ALTER COLUMN os TYPE VARCHAR(255);
    END IF;
END $$;

-- Update link_clicks table columns
DO $$ 
BEGIN
    -- Increase timezone from VARCHAR(100) to VARCHAR(255) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_clicks' 
        AND column_name = 'timezone' 
        AND character_maximum_length < 255
    ) THEN
        ALTER TABLE link_clicks ALTER COLUMN timezone TYPE VARCHAR(255);
    END IF;
    
    -- Increase device_type from VARCHAR(50) to VARCHAR(100) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_clicks' 
        AND column_name = 'device_type' 
        AND character_maximum_length < 100
    ) THEN
        ALTER TABLE link_clicks ALTER COLUMN device_type TYPE VARCHAR(100);
    END IF;
    
    -- Increase browser from VARCHAR(100) to VARCHAR(255) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_clicks' 
        AND column_name = 'browser' 
        AND character_maximum_length < 255
    ) THEN
        ALTER TABLE link_clicks ALTER COLUMN browser TYPE VARCHAR(255);
    END IF;
    
    -- Increase os from VARCHAR(100) to VARCHAR(255) if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'link_clicks' 
        AND column_name = 'os' 
        AND character_maximum_length < 255
    ) THEN
        ALTER TABLE link_clicks ALTER COLUMN os TYPE VARCHAR(255);
    END IF;
END $$;

-- ============================================
-- ANALYTICS CLEANUP FUNCTION
-- ============================================
-- Function to clean up ALL analytics data (page_views and link_clicks)
-- This is called daily at 3am via pg_cron to reset all analytics data
CREATE OR REPLACE FUNCTION cleanup_analytics_data()
RETURNS TABLE (
    deleted_views BIGINT,
    deleted_clicks BIGINT,
    reset_links BIGINT
) AS $$
DECLARE
    v_deleted_views BIGINT;
    v_deleted_clicks BIGINT;
    v_reset_links BIGINT;
BEGIN
    -- Delete ALL page views (no WHERE clause - deletes everything)
    DELETE FROM page_views;
    GET DIAGNOSTICS v_deleted_views = ROW_COUNT;
    
    -- Delete ALL link clicks (no WHERE clause - deletes everything)
    DELETE FROM link_clicks;
    GET DIAGNOSTICS v_deleted_clicks = ROW_COUNT;
    
    -- Reset click counts on ALL links (no WHERE clause - resets everything)
    UPDATE links SET click_count = 0;
    GET DIAGNOSTICS v_reset_links = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_views, v_deleted_clicks, v_reset_links;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_analytics_data() TO service_role;

-- ============================================
-- PG_CRON SCHEDULED JOB
-- ============================================
-- Schedule cleanup function to run daily at 3:00 AM UTC
-- Cron format: minute hour day month day-of-week
-- 0 3 * * * = Every day at 3:00 AM UTC
-- 
-- This will automatically reset ALL analytics data (page_views and link_clicks) daily

-- Remove existing job if it exists (to avoid duplicates)
SELECT cron.unschedule('cleanup-analytics-daily')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-analytics-daily'
);

-- Schedule the cleanup job to run daily at 3:00 AM UTC
-- This will automatically call cleanup_analytics_data() every day
-- The function will delete ALL page_views and link_clicks, and reset ALL link click counts
SELECT cron.schedule(
    'cleanup-analytics-daily',           -- Job name
    '0 3 * * *',                         -- Cron schedule: 3 AM UTC daily
    $$SELECT cleanup_analytics_data()$$  -- SQL to execute (resets ALL analytics data)
);



