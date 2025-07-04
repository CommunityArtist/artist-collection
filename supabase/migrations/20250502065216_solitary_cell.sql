/*
  # Fix prompts table foreign key constraint

  1. Changes
    - Drop existing foreign key constraint that points to public.users
    - Add new foreign key constraint pointing to auth.users
    
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- First drop the existing foreign key constraint
ALTER TABLE prompts
DROP CONSTRAINT IF EXISTS prompts_user_id_fkey;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE prompts
ADD CONSTRAINT prompts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id);