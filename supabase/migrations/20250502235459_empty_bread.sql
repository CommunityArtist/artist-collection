/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Add new policies for:
      - Inserting new profiles (authenticated users only)
      - Updating existing profiles (own profile only)
      - Selecting profiles (public access)
  
  2. Security
    - Enable RLS on profiles table
    - Add policies to ensure users can only modify their own profiles
    - Allow public read access to all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow public read access to all profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);