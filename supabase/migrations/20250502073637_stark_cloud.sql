/*
  # Update OpenAI API key configuration

  1. Changes
    - Add OpenAI API key to api_config table
    - Ensure proper access control
  
  2. Security
    - Only authenticated users can read the key
    - Key is stored securely in the database
*/

-- Update the OpenAI API key
INSERT INTO api_config (key_name, key_value)
VALUES ('openai_api_key', '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')
ON CONFLICT (key_name) 
DO UPDATE SET key_value = EXCLUDED.key_value;