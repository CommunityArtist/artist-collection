/*
  # Create prompts table and storage setup

  1. New Tables
    - `prompts`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `prompt` (text, not null)
      - `notes` (text)
      - `sref` (text)
      - `media_url` (text)
      - `created_at` (timestamp with time zone)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `prompts` table
    - Add policies for authenticated users to:
      - Read all prompts
      - Create their own prompts
      - Update their own prompts
      - Delete their own prompts
*/

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prompt text NOT NULL,
  notes text,
  sref text,
  media_url text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL
);

-- Enable RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view prompts"
  ON prompts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own prompts"
  ON prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON prompts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON prompts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);