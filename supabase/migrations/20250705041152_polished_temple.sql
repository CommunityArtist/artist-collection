/*
  # Fix API Config User Association

  1. Schema Changes
    - Add `user_id` column to `api_config` table
    - Add foreign key constraint to reference `auth.users`
    - Update unique constraint to include `user_id`

  2. Security Updates
    - Update RLS policies to allow users to manage their own API keys
    - Add INSERT and UPDATE policies for authenticated users
*/

-- Add user_id column to api_config table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_config' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE api_config ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing unique constraint and create new one with user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'api_config' AND constraint_name = 'api_config_key_name_key'
  ) THEN
    ALTER TABLE api_config DROP CONSTRAINT api_config_key_name_key;
  END IF;
END $$;

-- Create new unique constraint on user_id and key_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'api_config' AND constraint_name = 'api_config_user_id_key_name_key'
  ) THEN
    ALTER TABLE api_config ADD CONSTRAINT api_config_user_id_key_name_key UNIQUE (user_id, key_name);
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read API keys" ON api_config;

-- Create new RLS policies for user-specific API key management
CREATE POLICY "Users can read their own API keys"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_config
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_config
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_config
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);