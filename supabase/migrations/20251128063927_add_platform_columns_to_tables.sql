/*
  # Add platform columns to prompts and prompt_executions tables

  1. New Columns
    - `prompts.platform` (text, nullable) - Platform filter for prompts (NULL = all platforms)
    - `prompts.location` (text, nullable) - Location filter for prompts
    - `prompt_executions.platform` (text, default 'gemini') - Platform used for execution
    - `prompt_executions.sources` (jsonb, nullable) - Sources cited in response
    - `prompt_executions.error_message` (text, nullable) - Error details if execution failed

  2. Constraints
    - Valid platform values: 'gemini', 'chatgpt', 'perplexity', 'aio', or NULL (for prompts)
    - prompt_executions must have a platform value

  3. Security
    - No RLS changes needed - existing policies cover new columns
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

-- Add location column to prompts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompts' AND column_name = 'location'
  ) THEN
    ALTER TABLE prompts ADD COLUMN location text;
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

-- Add sources column to prompt_executions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_executions' AND column_name = 'sources'
  ) THEN
    ALTER TABLE prompt_executions ADD COLUMN sources jsonb;
  END IF;
END $$;

-- Add error_message column to prompt_executions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_executions' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE prompt_executions ADD COLUMN error_message text;
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