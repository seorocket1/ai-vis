/*
  # Add platform columns to prompts and prompt_executions tables

  1. Changes
    - Add `platform` column to `prompts` table (nullable, for multi-platform prompts)
    - Add `platform` column to `prompt_executions` table (for tracking which platform was used)

  2. Notes
    - Existing prompts will have NULL platform (meaning they run on all platforms)
    - Existing executions will need platform data backfilled
*/

-- Add platform column to prompts table (nullable - NULL means run on all platforms)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'platform'
  ) THEN
    ALTER TABLE prompts ADD COLUMN platform text;
  END IF;
END $$;

-- Add platform column to prompt_executions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_executions' AND column_name = 'platform'
  ) THEN
    ALTER TABLE prompt_executions ADD COLUMN platform text DEFAULT 'gemini';
  END IF;
END $$;

-- Add check constraint for valid platforms on prompt_executions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompt_executions_platform_check'
  ) THEN
    ALTER TABLE prompt_executions ADD CONSTRAINT prompt_executions_platform_check 
    CHECK (platform IN ('gemini', 'chatgpt', 'perplexity', 'aio'));
  END IF;
END $$;