/*
  # Add platform column to prompts table

  1. Changes
    - Add `platform` column to `prompts` table
    - Default value is 'all' to support multi-platform monitoring
    - Allows tracking which AI platform each prompt is designed for

  2. Notes
    - Existing prompts will default to 'all' platform
    - No data loss - this is a non-destructive addition
*/

-- Add platform column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'platform'
  ) THEN
    ALTER TABLE prompts ADD COLUMN platform text DEFAULT 'all';
  END IF;
END $$;
