@@ .. @@
 END $$;
+
+-- Ensure OpenAI API key is properly configured as environment variable
+-- This should be done in Supabase Dashboard -> Project Settings -> Edge Functions -> Environment Variables
+-- Add: OPENAI_API_KEY = your_actual_openai_api_key_here
+
+-- For now, let's check if we can read from the database and provide fallback
+-- Update the Edge Functions to use a fallback approach