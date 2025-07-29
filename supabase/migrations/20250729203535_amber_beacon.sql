/*
  # Add Nebius AI API Key Configuration

  1. Changes
    - Add Nebius AI API key to api_config table
    - Set as global key (user_id = NULL) for system-wide use

  2. Security
    - Maintains existing RLS policies
    - Global key accessible by Edge Functions
*/

-- Add the Nebius AI API key as a global configuration
INSERT INTO api_config (key_name, key_value, user_id)
VALUES (
  'nebius_api_key', 
  'eyJhbGciOiJIUzI1NiIsImtpZCI6IlV6SXJWd1h0dnprLVRvdzlLZWstc0M1akptWXBvX1VaVkxUZlpnMDRlOFUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJnb29nbGUtb2F1dGgyfDEwODUzMjU3MzAzNTg3Nzc1MjY2MCIsInNjb3BlIjoib3BlbmlkIG9mZmxpbmVfYWNjZXNzIiwiaXNzIjoiYXBpX2tleV9pc3N1ZXIiLCJhdWQiOlsiaHR0cHM6Ly9uZWJpdXMtaW5mZXJlbmNlLmV1LmF1dGgwLmNvbS9hcGkvdjIvIl0sImV4cCI6MTkxMTUwMDkwNSwidXVpZCI6IjQ3ZjU3NTNhLTJjNWUtNGM4NC05YjcwLTI2ZWZmNGJmMWE3NCIsIm5hbWUiOiJOZWJpdXMgQm9sdCIsImV4cGlyZXNfYXQiOiIyMDMwLTA3LTI4VDIwOjI4OjI1KzAwMDAifQ.0nXA0vPVoRySHOc63j5OJl3uYQfnnkJ03AJUR_bMA-Q',
  NULL -- NULL user_id means global/system key
) ON CONFLICT (user_id, key_name) 
WHERE user_id IS NULL
DO UPDATE SET 
  key_value = EXCLUDED.key_value;

-- Log the configuration
DO $$
BEGIN
  RAISE NOTICE '=== Nebius AI API Key Configuration ===';
  RAISE NOTICE 'Nebius AI API key configured for Edge Functions';
  RAISE NOTICE 'Key expires: 2030-07-28T20:28:25+0000';
  RAISE NOTICE 'Edge Functions can now access Nebius AI';
  RAISE NOTICE '====================================';
END $$;