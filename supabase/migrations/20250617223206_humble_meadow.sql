/*
  # Fix Community Library RLS policies

  1. Changes
    - Update RLS policies to properly handle public prompts
    - Ensure community library can display all public prompts with images
    
  2. Security
    - Maintains security for private prompts
    - Allows proper access to public prompts for all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view public prompts" ON prompts;

-- Create new policy that properly handles public access
CREATE POLICY "Users can view public prompts"
  ON prompts
  FOR SELECT
  TO public
  USING (
    (NOT is_private) OR 
    (auth.uid() = user_id)
  );

-- Ensure authenticated users can still manage their own prompts
DROP POLICY IF EXISTS "Users can create their own prompts" ON prompts;
CREATE POLICY "Users can create their own prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
CREATE POLICY "Users can update their own prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;
CREATE POLICY "Users can delete their own prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);