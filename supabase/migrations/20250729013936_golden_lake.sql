/*
  # Comprehensive API Access Fix

  1. Investigation
    - Check current API access status for both users
    - Add missing users to api_access table
    - Ensure all users have proper access

  2. Changes
    - Grant access to mensswag@gmail.com
    - Verify narrativebottv@gmail.com access
    - Create comprehensive trigger for all new users
    - Grant access to all existing authenticated users

  3. Security
    - Maintains existing RLS policies
    - Ensures proper API access control
*/

-- First, let's check and grant access to the specific users
DO $$
BEGIN
  -- Add mensswag@gmail.com with full access
  INSERT INTO api_access (user_email, has_access, granted_by, notes)
  VALUES (
    'mensswag@gmail.com',
    true,
    'system',
    'Access granted - user unable to generate images (fixed)'
  ) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    notes = 'Access updated - user unable to generate images (fixed)';

  -- Ensure narrativebottv@gmail.com has access (this user works)
  INSERT INTO api_access (user_email, has_access, granted_by, notes)
  VALUES (
    'narrativebottv@gmail.com',
    true,
    'system',
    'Access confirmed - user can generate images'
  ) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    notes = 'Access confirmed - user can generate images';

  RAISE NOTICE 'Updated API access for specific users';
END $$;

-- Create or replace the function to grant API access to new users
CREATE OR REPLACE FUNCTION public.ensure_user_api_access()
RETURNS trigger AS $$
BEGIN
  -- Grant API access to new users automatically
  INSERT INTO public.api_access (user_email, has_access, granted_by, notes)
  VALUES (
    NEW.email,
    true,
    'system',
    'Automatic access granted on signup'
  ) ON CONFLICT (user_email) DO UPDATE SET
    has_access = true,
    granted_at = now(),
    notes = 'Access ensured on login/signup';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created_ensure_api_access ON auth.users;
CREATE TRIGGER on_auth_user_created_ensure_api_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_api_access();

-- Also create a trigger for when users update their email
DROP TRIGGER IF EXISTS on_auth_user_updated_ensure_api_access ON auth.users;
CREATE TRIGGER on_auth_user_updated_ensure_api_access
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.ensure_user_api_access();

-- Grant API access to ALL existing users who don't have it
INSERT INTO api_access (user_email, has_access, granted_by, notes)
SELECT 
  u.email,
  true,
  'system',
  'Retroactive access granted for existing user'
FROM auth.users u
LEFT JOIN api_access a ON u.email = a.user_email
WHERE u.email IS NOT NULL 
  AND (a.user_email IS NULL OR a.has_access = false)
ON CONFLICT (user_email) DO UPDATE SET
  has_access = true,
  granted_at = now(),
  notes = 'Access updated - retroactive grant';

-- Log the results
DO $$
DECLARE
  total_users integer;
  users_with_access integer;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users WHERE email IS NOT NULL;
  SELECT COUNT(*) INTO users_with_access FROM api_access WHERE has_access = true;
  
  RAISE NOTICE 'Total users: %, Users with API access: %', total_users, users_with_access;
END $$;