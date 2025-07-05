/*
  # Fix API key configuration

  1. Changes
    - Check current API key value
    - Update with proper OpenAI API key format
    
  2. Security
    - Maintains existing RLS policies
*/

-- Check if the current API key looks like a valid OpenAI key
DO $$
DECLARE
    current_key text;
BEGIN
    SELECT key_value INTO current_key 
    FROM api_config 
    WHERE key_name = 'openai_api_key';
    
    -- Log the current key format (first 10 chars only for security)
    RAISE NOTICE 'Current API key starts with: %', LEFT(current_key, 10);
    
    -- If it doesn't start with 'sk-', it's likely not a valid OpenAI key
    IF current_key IS NULL OR NOT current_key LIKE 'sk-%' THEN
        RAISE NOTICE 'API key does not appear to be a valid OpenAI key format';
        
        -- Update with placeholder that clearly indicates it needs to be replaced
        INSERT INTO api_config (key_name, key_value)
        VALUES ('openai_api_key', 'sk-REPLACE_WITH_YOUR_ACTUAL_OPENAI_API_KEY_FROM_PLATFORM_OPENAI_COM')
        ON CONFLICT (key_name) 
        DO UPDATE SET key_value = EXCLUDED.key_value;
        
        RAISE NOTICE 'Updated API key with placeholder - please replace with your actual OpenAI API key';
    ELSE
        RAISE NOTICE 'API key appears to be in correct format';
    END IF;
END $$;