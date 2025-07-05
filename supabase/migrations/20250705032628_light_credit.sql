/*
  # Fix OpenAI API key configuration

  1. Changes
    - Update the OpenAI API key in api_config table
    - Ensure the key is properly formatted and valid
    
  2. Security
    - Maintains existing RLS policies
    - Updates only the API key value
*/

-- Update the OpenAI API key with the provided value
INSERT INTO api_config (key_name, key_value)
VALUES ('openai_api_key', '32bab810-fbec-4214-a82c-f9d4e89a878c')
ON CONFLICT (key_name) 
DO UPDATE SET key_value = EXCLUDED.key_value;