/*
  # Fix OpenAI API Key

  Updates the OpenAI API key in the api_config table with a placeholder that needs to be replaced with a real key
*/

-- Update the OpenAI API key with a placeholder - REPLACE WITH YOUR ACTUAL OPENAI API KEY
INSERT INTO api_config (key_name, key_value)
VALUES ('openai_api_key', 'sk-YOUR_ACTUAL_OPENAI_API_KEY_HERE')
ON CONFLICT (key_name) 
DO UPDATE SET key_value = EXCLUDED.key_value;