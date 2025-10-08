-- Add platform column to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS platform text DEFAULT 'all';

-- Add check constraint for valid platforms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prompts_platform_check'
  ) THEN
    ALTER TABLE prompts ADD CONSTRAINT prompts_platform_check 
    CHECK (platform IN ('all', 'perplexity', 'chatgpt', 'gemini', 'claude'));
  END IF;
END $$;
