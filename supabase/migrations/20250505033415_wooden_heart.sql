/*
  # Add sequential IDs to prompts table

  1. Changes
    - Add prompt_id column as a sequential identifier
    - Update existing rows with sequential IDs
    - Add trigger to auto-increment prompt_id for new rows
    
  2. Security
    - Maintains existing RLS policies
    - No additional security changes needed
*/

-- Add prompt_id column
ALTER TABLE prompts 
ADD COLUMN prompt_id SERIAL;

-- Create function to generate next prompt ID
CREATE OR REPLACE FUNCTION generate_prompt_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the maximum prompt_id and increment by 1
  SELECT COALESCE(MAX(prompt_id), 0) + 1 INTO NEW.prompt_id FROM prompts;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate prompt_id
CREATE TRIGGER set_prompt_id
  BEFORE INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION generate_prompt_id();

-- Update existing prompts with sequential IDs
WITH numbered_prompts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_id
  FROM prompts
)
UPDATE prompts p
SET prompt_id = n.new_id
FROM numbered_prompts n
WHERE p.id = n.id;