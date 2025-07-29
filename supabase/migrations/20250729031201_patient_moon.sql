/*
  # Grant Universal API Access - Give Everyone Same Permissions as narrativebottv@gmail.com

  1. Problem Analysis
    - narrativebottv@gmail.com can generate images
    - Other users get "OpenAI API key not found" error
    - Issue is API access control, not the actual API key

  2. Solution
    - Grant API access to ALL existing users
    - Create automatic triggers for future users
    - Ensure consistent permissions across all users

  3. Security
    - Maintains existing RLS policies
    - All users get same API access as working users
*/

-- First, let's see what permissions narrativebottv@gmail.com has
DO $$
DECLARE
    working_user_access record;
    total_users integer;
    users_with_access integer;
BEGIN
    -- Check the working user's access
    SELECT * INTO working_user_access 
    FROM api_access 
    WHERE user_email = 'narrativebottv@gmail.com'
    LIMIT 1;
    
    -- Get current stats
    SELECT COUNT(*) INTO total_users FROM auth.users WHERE email IS NOT NULL;
    SELECT COUNT(*) INTO users_with_access FROM api_access WHERE has_access = true;
    
    RAISE NOTICE '=== UNIVERSAL API ACCESS GRANT ===';
    RAISE NOTICE 'Working user (narrativebottv@gmail.com) access: %', 
        CASE WHEN working_user_access.has_access THEN 'GRANTED' ELSE 'DENIED' END;
    RAISE NOTICE 'Total users in system: %', total_users;
    RAISE NOTICE 'Users with API access before fix: %', users_with_access;
    RAISE NOTICE 'Users without access: %', (total_users - users_with_access);
END $$;

-- Grant the SAME permissions as narrativebottv@gmail.com to ALL users
INSERT INTO api_access (user_email, has_access, granted_by, notes)
SELECT 
    u.email,
    true, -- Same access level as narrativebottv@gmail.com
    'universal-grant',
    'UNIVERSAL ACCESS: Same permissions as narrativebottv@gmail.com - can generate images'
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    granted_by = 'universal-grant',
    notes = 'UNIVERSAL ACCESS: Updated to match narrativebottv@gmail.com permissions';

-- Ensure narrativebottv@gmail.com maintains their access (reference user)
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
    'narrativebottv@gmail.com',
    true,
    'reference-user',
    'REFERENCE USER: Original working user - maintains image generation access'
) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    granted_by = 'reference-user',
    notes = 'REFERENCE USER: Original working user - maintains image generation access';

-- Also ensure kingofcleanstaff@gmail.com has access (mentioned as working)
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
    'kingofcleanstaff@gmail.com',
    true,
    'reference-user',
    'REFERENCE USER: Another working user - maintains image generation access'
) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    granted_by = 'reference-user',
    notes = 'REFERENCE USER: Another working user - maintains image generation access';

-- Create comprehensive trigger to grant same access to ALL new users
CREATE OR REPLACE FUNCTION public.grant_universal_api_access()
RETURNS trigger AS $$
BEGIN
  -- Grant the SAME access as narrativebottv@gmail.com to all new users
  INSERT INTO public.api_access (user_email, has_access, granted_by, notes)
  VALUES (
    NEW.email,
    true, -- Same access level as reference users
    'auto-universal',
    'UNIVERSAL ACCESS: Automatic grant - same permissions as narrativebottv@gmail.com'
  ) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    granted_by = 'auto-universal',
    notes = 'UNIVERSAL ACCESS: Automatic grant - same permissions as narrativebottv@gmail.com';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop any conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created_admin_access ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_admin_access ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_ensure_api_access ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_ensure_api_access ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_grant_api_access ON auth.users;

-- Create triggers for universal access
CREATE TRIGGER on_auth_user_created_universal_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_universal_api_access();

CREATE TRIGGER on_auth_user_updated_universal_access
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.grant_universal_api_access();

-- Final verification and logging
DO $$
DECLARE
    final_total_users integer;
    final_users_with_access integer;
    reference_user_confirmed boolean := false;
    all_users_record record;
BEGIN
    -- Final counts
    SELECT COUNT(*) INTO final_total_users FROM auth.users WHERE email IS NOT NULL;
    SELECT COUNT(*) INTO final_users_with_access FROM api_access WHERE has_access = true;
    
    -- Verify reference user still has access
    SELECT EXISTS(
        SELECT 1 FROM api_access 
        WHERE user_email = 'narrativebottv@gmail.com' AND has_access = true
    ) INTO reference_user_confirmed;
    
    RAISE NOTICE '=== UNIVERSAL ACCESS GRANT COMPLETE ===';
    RAISE NOTICE 'Total users in system: %', final_total_users;
    RAISE NOTICE 'Users with API access: %', final_users_with_access;
    RAISE NOTICE 'Reference user (narrativebottv@gmail.com) confirmed: %', reference_user_confirmed;
    
    -- Show some example users with access
    RAISE NOTICE '=== SAMPLE USERS WITH ACCESS ===';
    FOR all_users_record IN 
        SELECT user_email, has_access, granted_by, notes 
        FROM api_access 
        WHERE has_access = true 
        ORDER BY granted_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE 'User: % | Access: % | Granted by: %', 
            all_users_record.user_email, 
            all_users_record.has_access, 
            all_users_record.granted_by;
    END LOOP;
    
    IF final_total_users = final_users_with_access THEN
        RAISE NOTICE '✅ SUCCESS: ALL USERS NOW HAVE SAME API ACCESS AS narrativebottv@gmail.com';
        RAISE NOTICE '✅ ALL USERS CAN NOW GENERATE IMAGES';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % users may still lack access', (final_total_users - final_users_with_access);
    END IF;
    
    RAISE NOTICE '=== UNIVERSAL ACCESS CONFIGURATION COMPLETE ===';
END $$;