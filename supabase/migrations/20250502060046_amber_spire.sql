/*
  # Add private flag to prompts table

  1. Changes
    - Add `is_private` boolean column to prompts table with default false
    - Update RLS policies to respect private flag

  2. Security
    - Private prompts are only visible to their owner
    - Public prompts are visible to everyone
*/

-- Add is_private column
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update RLS policies
DROP POLICY IF EXISTS "Anyone can view prompts" ON prompts;
CREATE POLICY "Users can view public prompts"
  ON prompts
  FOR SELECT
  TO public
  USING (
    (NOT is_private) OR -- Public prompts are visible to everyone
    (auth.uid() = user_id) -- Private prompts are only visible to their owner
  );