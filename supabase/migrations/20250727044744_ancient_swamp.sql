/*
  # Ensure all users have API access

  1. Changes
    - Add the specific user to api_access table
    - Create a trigger to automatically grant API access to new users
    - Update existing users without API access

  2. Security
    - Maintains existing RLS policies
    - Ensures all legitimate users can use AI features
*/

-- Add the specific user who is having issues
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
  'nersoulmuzik1@gmail.com',
  true,
  'system',
  'Automatic access granted - user unable to generate images'
) ON CONFLICT (user_email) DO UPDATE SET
  has_access = true,
  granted_at = now(),
  notes = 'Access updated - user unable to generate images';

-- Also add the original email in case there was a typo
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
  'nersoulmuzik@gmail.com',
  true,
  'system',
  'Automatic access granted - user unable to generate images'
) ON CONFLICT (user_email) DO UPDATE SET
  has_access = true,
  granted_at = now(),
  notes = 'Access updated - user unable to generate images';

-- Create function to automatically grant API access to new users
CREATE OR REPLACE FUNCTION public.grant_api_access_to_new_user()
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
    granted_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to grant API access when new users sign up
DROP TRIGGER IF EXISTS on_auth_user_created_grant_api_access ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_api_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_api_access_to_new_user();

-- Grant API access to all existing users who don't have it
INSERT INTO api_access (user_email, has_access, granted_by, notes)
SELECT 
  u.email,
  true,
  'system',
  'Retroactive access granted for existing user'
FROM auth.users u
LEFT JOIN api_access a ON u.email = a.user_email
WHERE a.user_email IS NULL AND u.email IS NOT NULL
ON CONFLICT (user_email) DO NOTHING;