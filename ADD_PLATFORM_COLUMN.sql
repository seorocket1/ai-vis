-- Quick Fix: Add platform column to prompt_executions table
-- Run this in Supabase SQL Editor to fix the "platform column not found" error

-- Add the platform column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_executions' AND column_name = 'platform'
  ) THEN
    ALTER TABLE prompt_executions ADD COLUMN platform text NOT NULL DEFAULT 'gemini';
  END IF;
END $$;

-- Create index on platform column for better query performance
CREATE INDEX IF NOT EXISTS idx_prompt_executions_platform ON prompt_executions(platform);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'prompt_executions'
ORDER BY ordinal_position;
