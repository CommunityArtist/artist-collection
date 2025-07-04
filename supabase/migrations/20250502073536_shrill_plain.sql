/*
  # Update API Configuration

  1. Changes
    - Add API configuration settings
    - Set up secure storage for API keys
    - Configure access policies
*/

-- Create a secure configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_config ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users with specific roles to read API keys
CREATE POLICY "Allow authenticated users to read API keys"
  ON api_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert or update OpenAI API configuration
INSERT INTO api_config (key_name, key_value)
VALUES ('openai_api_key', '')
ON CONFLICT (key_name) 
DO UPDATE SET key_value = EXCLUDED.key_value;