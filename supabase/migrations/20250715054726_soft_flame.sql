/*
  # Case-insensitive username uniqueness constraint

  1. Changes
    - Drop existing unique constraint on username
    - Add case-insensitive unique constraint using LOWER() function
    - Create unique index on LOWER(username) for performance

  2. Security
    - Prevents users from creating usernames like "Admin", "ADMIN", "admin" when one already exists
    - Maintains data integrity with proper constraints
*/

-- Drop the existing unique constraint on username
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Create a unique index on the lowercase version of username
-- This prevents case-insensitive duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique 
ON profiles (LOWER(username));

-- Add a check constraint to ensure usernames are stored in a consistent format
-- This is optional but helps maintain consistency
ALTER TABLE profiles 
ADD CONSTRAINT username_format_check 
CHECK (username = TRIM(username) AND LENGTH(username) >= 1);