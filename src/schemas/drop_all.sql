-- ============================================
-- COMPLETE DATABASE CLEANUP - DROP EVERYTHING
-- ============================================
-- WARNING: This will delete ALL data, tables, functions, triggers, policies, and storage!
-- Run this script to completely reset your database
-- Use with EXTREME caution!
-- 
-- This script removes:
-- ✅ All RLS policies (table and storage)
-- ✅ All storage buckets and objects
-- ✅ All triggers
-- ✅ All functions
-- ✅ All tables
-- ✅ All indexes (dropped with tables)
-- ✅ All sequences (dropped with tables)
-- ✅ All grants/permissions
-- ✅ All views (if any)
-- ✅ All types (if any)
-- ⚠️  Extension pgcrypto (optional - commented out)

-- ============================================
-- DISABLE TRIGGERS AND CONSTRAINTS
-- ============================================
SET session_replication_role = 'replica';

-- ============================================
-- DROP ALL ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Drop policies on tables (must drop before tables)
DROP POLICY IF EXISTS "Allow all admin operations" ON admins;
DROP POLICY IF EXISTS "Allow all admin session operations" ON admin_sessions;
DROP POLICY IF EXISTS "Public can read published linktrees" ON linktrees;
DROP POLICY IF EXISTS "Service role has full access" ON linktrees;
DROP POLICY IF EXISTS "Public can read active links" ON links;
DROP POLICY IF EXISTS "Service role has full access" ON links;
DROP POLICY IF EXISTS "Service role has full access" ON page_views;
DROP POLICY IF EXISTS "Service role has full access" ON link_clicks;

-- Drop all policies dynamically (catch any we might have missed)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
    END LOOP;
END $$;

-- Disable RLS on all tables (before dropping tables)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I DISABLE ROW LEVEL SECURITY', table_record.tablename);
    END LOOP;
END $$;

-- ============================================
-- DROP STORAGE POLICIES
-- ============================================
-- Drop all storage policies dynamically
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename);
    END LOOP;
END $$;

-- ============================================
-- DROP STORAGE BUCKETS AND ALL OBJECTS
-- ============================================
-- Delete all objects in all buckets first
DO $$
DECLARE
    bucket_record RECORD;
BEGIN
    FOR bucket_record IN
        SELECT id FROM storage.buckets
    LOOP
        DELETE FROM storage.objects WHERE bucket_id = bucket_record.id;
    END LOOP;
END $$;

-- Delete all buckets
DELETE FROM storage.buckets;

-- ============================================
-- DROP ALL TRIGGERS (must drop before functions)
-- ============================================
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS check_unlock_admin ON admins;
DROP TRIGGER IF EXISTS update_linktrees_updated_at ON linktrees;
DROP TRIGGER IF EXISTS update_links_updated_at ON links;
DROP TRIGGER IF EXISTS reorder_links_on_delete ON links;

-- Drop all triggers dynamically (catch any we might have missed)
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name, event_object_table, event_object_schema
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
            trigger_record.trigger_name,
            trigger_record.event_object_schema,
            trigger_record.event_object_table);
    END LOOP;
END $$;

-- ============================================
-- REVOKE ALL GRANTS (drop permissions)
-- ============================================
-- Revoke grants on functions
REVOKE EXECUTE ON FUNCTION get_all_linktrees_analytics_optimized() FROM service_role, authenticated, public;
REVOKE EXECUTE ON FUNCTION get_total_analytics_optimized() FROM service_role, authenticated, public;
REVOKE EXECUTE ON FUNCTION get_linktree_analytics_optimized(UUID) FROM service_role, authenticated, public;

-- Revoke all grants dynamically
DO $$
DECLARE
    grant_record RECORD;
BEGIN
    -- Revoke grants on all functions
    FOR grant_record IN
        SELECT routine_schema, routine_name, specific_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_type = 'FUNCTION'
    LOOP
        BEGIN
            EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, authenticated, service_role', 
                grant_record.routine_schema,
                grant_record.routine_name,
                '');
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors for functions that don't exist or have no grants
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================
-- DROP ALL FUNCTIONS (CASCADE to drop dependent objects)
-- ============================================
-- Helper functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS auto_unlock_admin() CASCADE;
DROP FUNCTION IF EXISTS reorder_links_after_delete() CASCADE;
DROP FUNCTION IF EXISTS get_next_display_order(UUID) CASCADE;

-- Admin functions
DROP FUNCTION IF EXISTS verify_admin_password(VARCHAR, TEXT) CASCADE;
DROP FUNCTION IF EXISTS authenticate_and_create_session(VARCHAR, TEXT, TEXT, TIMESTAMPTZ, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_session_valid(TEXT) CASCADE;
DROP FUNCTION IF EXISTS logout_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS refresh_session_expiration(TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS get_admin_by_session(TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_and_refresh_session(TEXT, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS update_admin_password(UUID, TEXT) CASCADE;

-- Linktree functions
DROP FUNCTION IF EXISTS increment_linktree_views(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS increment_link_click(UUID) CASCADE;
DROP FUNCTION IF EXISTS reorder_links(UUID, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS recalculate_linktree_totals(UUID) CASCADE;
DROP FUNCTION IF EXISTS recalculate_all_linktree_counts(UUID) CASCADE;

-- Analytics functions
DROP FUNCTION IF EXISTS get_all_linktrees_analytics_optimized() CASCADE;
DROP FUNCTION IF EXISTS get_total_analytics_optimized() CASCADE;
DROP FUNCTION IF EXISTS get_linktree_analytics_optimized(UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_analytics_data() CASCADE;

-- Drop all remaining functions dynamically (catch any we might have missed)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as function_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname NOT LIKE 'pg_%'
          AND p.proname NOT LIKE '_%'
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', 
                func_record.function_name,
                func_record.function_args);
        EXCEPTION WHEN OTHERS THEN
            -- Continue if function doesn't exist or has dependencies
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================
-- DROP ALL VIEWS (if any exist)
-- ============================================
DROP VIEW IF EXISTS admin_session CASCADE;
DROP VIEW IF EXISTS link_cliks CASCADE;
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN
        SELECT table_schema, table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', 
            view_record.table_schema,
            view_record.table_name);
    END LOOP;
END $$;

-- ============================================
-- DROP ALL MATERIALIZED VIEWS (if any exist)
-- ============================================
DO $$
DECLARE
    matview_record RECORD;
BEGIN
    FOR matview_record IN
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.%I CASCADE', 
            matview_record.schemaname,
            matview_record.matviewname);
    END LOOP;
END $$;

-- Drop location columns from page_views and link_clicks (if they exist)
-- This ensures clean state before dropping tables
ALTER TABLE IF EXISTS page_views DROP COLUMN IF EXISTS country;
ALTER TABLE IF EXISTS page_views DROP COLUMN IF EXISTS city;
ALTER TABLE IF EXISTS page_views DROP COLUMN IF EXISTS region;
ALTER TABLE IF EXISTS page_views DROP COLUMN IF EXISTS latitude;
ALTER TABLE IF EXISTS page_views DROP COLUMN IF EXISTS longitude;
ALTER TABLE IF EXISTS page_views DROP COLUMN IF EXISTS timezone;

ALTER TABLE IF EXISTS link_clicks DROP COLUMN IF EXISTS country;
ALTER TABLE IF EXISTS link_clicks DROP COLUMN IF EXISTS city;
ALTER TABLE IF EXISTS link_clicks DROP COLUMN IF EXISTS region;
ALTER TABLE IF EXISTS link_clicks DROP COLUMN IF EXISTS latitude;
ALTER TABLE IF EXISTS link_clicks DROP COLUMN IF EXISTS longitude;
ALTER TABLE IF EXISTS link_clicks DROP COLUMN IF EXISTS timezone;

-- Drop status column from linktrees (if it exists)
ALTER TABLE IF EXISTS linktrees DROP COLUMN IF EXISTS status;

-- Drop unused indexes related to location columns
DROP INDEX IF EXISTS idx_page_views_location;
DROP INDEX IF EXISTS idx_page_views_referer;
DROP INDEX IF EXISTS idx_page_views_analytics;
DROP INDEX IF EXISTS idx_link_clicks_location;
DROP INDEX IF EXISTS idx_link_clicks_referer;
DROP INDEX IF EXISTS idx_link_clicks_analytics;

-- Drop unused view
DROP VIEW IF EXISTS link_cliks CASCADE;

-- Drop tables with foreign keys first
-- CASCADE will drop all dependent objects (indexes, constraints, sequences, etc.)
DROP TABLE IF EXISTS link_clicks CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS linktrees CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop any remaining user tables in public schema (keeps system tables like supabase_migrations)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('supabase_migrations', 'schema_migrations')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', 'public', table_record.tablename);
    END LOOP;
END $$;

-- ============================================
-- DROP ALL SEQUENCES (if any remain)
-- ============================================
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN
        SELECT sequence_schema, sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('DROP SEQUENCE IF EXISTS %I.%I CASCADE', 
            seq_record.sequence_schema,
            seq_record.sequence_name);
    END LOOP;
END $$;

-- ============================================
-- DROP ALL TYPES (if any exist)
-- ============================================
DO $$
DECLARE
    type_record RECORD;
BEGIN
    FOR type_record IN
        SELECT n.nspname as schema_name, t.typname as type_name
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.typtype = 'c'  -- composite types
          AND t.typname NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', 
            type_record.schema_name,
            type_record.type_name);
    END LOOP;
END $$;

-- ============================================
-- DROP ALL DOMAINS (if any exist)
-- ============================================
DO $$
DECLARE
    domain_record RECORD;
BEGIN
    FOR domain_record IN
        SELECT domain_schema, domain_name
        FROM information_schema.domains
        WHERE domain_schema = 'public'
    LOOP
        EXECUTE format('DROP DOMAIN IF EXISTS %I.%I CASCADE', 
            domain_record.domain_schema,
            domain_record.domain_name);
    END LOOP;
END $$;

-- ============================================
-- DROP EXTENSION (OPTIONAL - uncomment if needed)
-- ============================================
-- WARNING: Only drop if you're sure no other schemas use pgcrypto
-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- ============================================
-- RE-ENABLE CONSTRAINTS
-- ============================================
SET session_replication_role = 'origin';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check if tables were dropped
SELECT 
    'Tables remaining:' as check_type,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name NOT IN ('supabase_migrations', 'schema_migrations')
    AND table_type = 'BASE TABLE'
UNION ALL
-- Check if buckets were dropped
SELECT 
    'Storage buckets remaining:' as check_type,
    COUNT(*) as count
FROM storage.buckets
UNION ALL
-- Check if functions were dropped
SELECT 
    'Functions remaining:' as check_type,
    COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'pg_%'
UNION ALL
-- Check if triggers were dropped
SELECT 
    'Triggers remaining:' as check_type,
    COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_schema = 'public'
UNION ALL
-- Check if RLS policies were dropped
SELECT 
    'RLS policies remaining:' as check_type,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
-- Check if storage policies were dropped
SELECT 
    'Storage policies remaining:' as check_type,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'storage'
UNION ALL
-- Check if views were dropped
SELECT 
    'Views remaining:' as check_type,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
-- Check if sequences were dropped
SELECT 
    'Sequences remaining:' as check_type,
    COUNT(*) as count
FROM information_schema.sequences
WHERE sequence_schema = 'public'
UNION ALL
-- Check if types were dropped
SELECT 
    'Types remaining:' as check_type,
    COUNT(*) as count
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.typtype = 'c'
  AND t.typname NOT LIKE 'pg_%';

-- All counts should be 0 if cleanup was successful
