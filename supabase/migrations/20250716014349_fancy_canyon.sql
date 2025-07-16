/*
  # Create API Access Control Table

  1. New Tables
    - `api_access`
      - `id` (uuid, primary key)
      - `user_email` (text, unique)
      - `has_access` (boolean, default false)
      - `granted_by` (text, admin who granted access)
      - `granted_at` (timestamp)
      - `notes` (text, optional notes)

  2. Security
    - Enable RLS on `api_access` table
    - Add policy for admins to manage access
    - Add policy for users to check their own access
*/

CREATE TABLE IF NOT EXISTS api_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  has_access boolean DEFAULT true,
  granted_by text DEFAULT 'admin',
  granted_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_access ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all access records
CREATE POLICY "Admins can manage all API access"
  ON api_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.username = 'ADMIN'
    )
  );

-- Policy for users to check their own access
CREATE POLICY "Users can view their own API access"
  ON api_access
  FOR SELECT
  TO authenticated
  USING (user_email = auth.email());

-- Insert the specific user you want to grant access to
INSERT INTO api_access (user_email, has_access, granted_by, notes)
VALUES (
  'tammysolayne@gmail.com',
  true,
  'admin',
  'Initial access granted by admin'
) ON CONFLICT (user_email) DO UPDATE SET
  has_access = true,
  granted_at = now(),
  notes = 'Access updated by admin';