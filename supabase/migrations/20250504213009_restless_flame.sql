/*
  # Add collections and prompt_collections tables

  1. New Tables
    - `collections`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
    - `prompt_collections`
      - `prompt_id` (uuid, foreign key to prompts)
      - `collection_id` (uuid, foreign key to collections)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their collections
*/

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create prompt_collections junction table
CREATE TABLE IF NOT EXISTS prompt_collections (
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, collection_id)
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collections ENABLE ROW LEVEL SECURITY;

-- Policies for collections
CREATE POLICY "Users can create their own collections"
  ON collections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own collections"
  ON collections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for prompt_collections
CREATE POLICY "Users can manage their prompt collections"
  ON prompt_collections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections c
      WHERE c.id = collection_id
      AND c.user_id = auth.uid()
    )
  );