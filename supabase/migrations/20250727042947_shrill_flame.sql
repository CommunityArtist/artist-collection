/*
  # Fix foreign key constraint for user deletion

  1. Changes
    - Drop existing foreign key constraint on prompts table
    - Add new foreign key constraint with ON DELETE CASCADE
    - This allows users to be deleted along with all their prompts

  2. Security
    - Maintains existing RLS policies
    - Ensures data consistency when users are deleted
*/

-- Drop the existing foreign key constraint
ALTER TABLE prompts
DROP CONSTRAINT IF EXISTS prompts_user_id_fkey;

-- Add the foreign key constraint with CASCADE deletion
ALTER TABLE prompts
ADD CONSTRAINT prompts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Also update collections table to cascade user deletion
ALTER TABLE collections
DROP CONSTRAINT IF EXISTS collections_user_id_fkey;

ALTER TABLE collections
ADD CONSTRAINT collections_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Update api_config table to cascade user deletion
ALTER TABLE api_config
DROP CONSTRAINT IF EXISTS api_config_user_id_fkey;

ALTER TABLE api_config
ADD CONSTRAINT api_config_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;