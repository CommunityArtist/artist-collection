/*
  # Add tags support to prompts table

  1. Changes
    - Add tags array column to prompts table
    - Update existing RLS policies to include the new column
    
  2. Security
    - Maintains existing RLS policies
    - No additional security changes needed
*/

-- Add tags array column to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- No need to modify RLS policies as they already cover all columns