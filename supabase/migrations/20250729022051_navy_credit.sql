/*
  # Fix OpenAI API Key Environment Configuration

  1. Investigation
    - Users getting "OpenAI API key not found" error
    - Edge Functions looking for OPENAI_API_KEY environment variable
    - Need to ensure API key is properly configured

  2. Changes
    - Insert a global OpenAI API key into api_config table
    - Update Edge Functions to use fallback logic
    - Ensure key is accessible by Edge Functions

  3. Security
    - Maintains existing RLS policies
    - Global API key for system use
*/

-- Insert a global OpenAI API key (not user-specific)
-- This will be used as fallback by Edge Functions
INSERT INTO api_config (key_name, key_value, user_id)
VALUES (
  'openai_api_key', 
  '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',
  NULL -- NULL user_id means global/system key
) ON CONFLICT (user_id, key_name) 
WHERE user_id IS NULL
DO UPDATE SET 
  key_value = EXCLUDED.key_value;

-- Log the configuration
DO $$
BEGIN
  RAISE NOTICE '=== OpenAI API Key Configuration ===';
  RAISE NOTICE 'Global OpenAI API key configured for Edge Functions';
  RAISE NOTICE 'Edge Functions will now be able to access the API key';
  RAISE NOTICE '===================================';
END $$;