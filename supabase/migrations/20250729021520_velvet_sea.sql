/*
  # Fix Migration Issues and Grant Admin API Access to All Users

  1. Investigation & Fixes
    - Check current API access status for problem users
    - Grant access to mensswag@gmail.com specifically
    - Ensure narrativebottv@gmail.com has proper access
    - Grant admin-level API access to ALL users

  2. Changes
    - Add comprehensive API access for all existing users
    - Create triggers for automatic access on signup and updates
    - Fix any existing migration issues
    - Log detailed results for debugging

  3. Security
    - Maintains RLS policies while ensuring API access
    - All users get admin-level access to AI features
    - Automatic access for all future signups
*/

-- Start with detailed logging of current state
DO $$
DECLARE
    total_users integer;
    users_with_access integer;
    problem_user_access boolean := false;
    working_user_access boolean := false;
BEGIN
    -- Log current state
    SELECT COUNT(*) INTO total_users FROM auth.users WHERE email IS NOT NULL;
    SELECT COUNT(*) INTO users_with_access FROM api_access WHERE has_access = true;
    
    RAISE NOTICE '=== MIGRATION START: API Access Analysis ===';
    RAISE NOTICE 'Total authenticated users: %', total_users;
    RAISE NOTICE 'Users with API access: %', users_with_access;
    
    -- Check specific problem user
    SELECT EXISTS(
        SELECT 1 FROM api_access 
        WHERE user_email = 'mensswag@gmail.com' AND has_access = true
    ) INTO problem_user_access;
    
    -- Check working user
    SELECT EXISTS(
        SELECT 1 FROM api_access 
        WHERE user_email = 'narrativebottv@gmail.com' AND has_access = true
    ) INTO working_user_access;
    
    RAISE NOTICE 'mensswag@gmail.com has access: %', problem_user_access;
    RAISE NOTICE 'narrativebottv@gmail.com has access: %', working_user_access;
    
    IF NOT problem_user_access THEN
        RAISE NOTICE 'ISSUE FOUND: mensswag@gmail.com lacks API access - FIXING NOW';
    END IF;
END $$;

-- Fix the specific problem user first
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
  'mensswag@gmail.com',
  true,
  'admin-migration',
  'FIXED: User was unable to generate images - granted admin API access'
) ON CONFLICT (user_email) DO UPDATE SET
  has_access = true,
  granted_at = now(),
  granted_by = 'admin-migration',
  notes = 'FIXED: User was unable to generate images - granted admin API access';

-- Ensure the working user maintains access
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
  'narrativebottv@gmail.com',
  true,
  'admin-migration',
  'CONFIRMED: User can generate images - maintaining admin API access'
) ON CONFLICT (user_email) DO UPDATE SET
  has_access = true,
  granted_at = now(),
  granted_by = 'admin-migration',
  notes = 'CONFIRMED: User can generate images - maintaining admin API access';

-- Grant ADMIN-LEVEL API access to ALL existing users
DO $$
DECLARE
    users_granted integer := 0;
    users_updated integer := 0;
BEGIN
    -- Insert new access records for users without any access
    WITH new_access AS (
        INSERT INTO api_access (user_email, has_access, granted_by, notes)
        SELECT 
            u.email,
            true,
            'admin-migration',
            'ADMIN ACCESS: Retroactive admin-level API access granted to all users'
        FROM auth.users u
        LEFT JOIN api_access a ON u.email = a.user_email
        WHERE u.email IS NOT NULL 
          AND a.user_email IS NULL
        ON CONFLICT (user_email) DO NOTHING
        RETURNING user_email
    )
    SELECT COUNT(*) INTO users_granted FROM new_access;
    
    -- Update existing users who had access disabled
    UPDATE api_access 
    SET 
        has_access = true,
        granted_at = now(),
        granted_by = 'admin-migration',
        notes = 'ADMIN ACCESS: Updated to admin-level API access for all users'
    WHERE has_access = false;
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    
    RAISE NOTICE '=== ADMIN ACCESS GRANTED ===';
    RAISE NOTICE 'New users granted admin API access: %', users_granted;
    RAISE NOTICE 'Existing users updated to admin access: %', users_updated;
END $$;

-- Create comprehensive trigger function for automatic admin access
CREATE OR REPLACE FUNCTION public.grant_admin_api_access()
RETURNS trigger AS $$
BEGIN
  -- Grant ADMIN-LEVEL API access to all new users automatically
  INSERT INTO public.api_access (user_email, has_access, granted_by, notes)
  VALUES (
    NEW.email,
    true,
    'auto-admin',
    'ADMIN ACCESS: Automatic admin-level API access granted on signup'
  ) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    granted_by = 'auto-admin',
    notes = 'ADMIN ACCESS: Automatic admin-level API access confirmed';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_ensure_api_access ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_ensure_api_access ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_grant_api_access ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_admin_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_api_access();

-- Create trigger for email updates
CREATE TRIGGER on_auth_user_updated_admin_access
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.grant_admin_api_access();

-- Final verification and logging
DO $$
DECLARE
    final_total_users integer;
    final_users_with_access integer;
    problem_user_fixed boolean := false;
    working_user_confirmed boolean := false;
BEGIN
    -- Final counts
    SELECT COUNT(*) INTO final_total_users FROM auth.users WHERE email IS NOT NULL;
    SELECT COUNT(*) INTO final_users_with_access FROM api_access WHERE has_access = true;
    
    -- Verify specific users
    SELECT EXISTS(
        SELECT 1 FROM api_access 
        WHERE user_email = 'mensswag@gmail.com' AND has_access = true
    ) INTO problem_user_fixed;
    
    SELECT EXISTS(
        SELECT 1 FROM api_access 
        WHERE user_email = 'narrativebottv@gmail.com' AND has_access = true
    ) INTO working_user_confirmed;
    
    RAISE NOTICE '=== MIGRATION COMPLETE: Final Status ===';
    RAISE NOTICE 'Total users: %', final_total_users;
    RAISE NOTICE 'Users with ADMIN API access: %', final_users_with_access;
    RAISE NOTICE 'mensswag@gmail.com FIXED: %', problem_user_fixed;
    RAISE NOTICE 'narrativebottv@gmail.com CONFIRMED: %', working_user_confirmed;
    
    IF final_total_users = final_users_with_access THEN
        RAISE NOTICE '✅ SUCCESS: ALL USERS NOW HAVE ADMIN-LEVEL API ACCESS';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % users may not have access', (final_total_users - final_users_with_access);
    END IF;
    
    RAISE NOTICE '=== ADMIN ACCESS CONFIGURATION COMPLETE ===';
END $$;