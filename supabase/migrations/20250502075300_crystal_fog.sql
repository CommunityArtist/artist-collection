/*
  # Update OpenAI API key

  Updates the OpenAI API key in the api_config table with the new value
*/

-- Update the OpenAI API key
INSERT INTO api_config (key_name, key_value)
VALUES ('openai_api_key', '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')
ON CONFLICT (key_name) 
DO UPDATE SET key_value = EXCLUDED.key_value;