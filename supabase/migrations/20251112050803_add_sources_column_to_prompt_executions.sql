/*
  # Add sources column to prompt_executions table

  1. Changes
    - Add `sources` column to `prompt_executions` table as JSONB type
    - This will store the source URLs/references from AI responses
  
  2. Notes
    - Column is nullable since existing records won't have sources
    - JSONB type allows flexible storage of source arrays/objects
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_executions' AND column_name = 'sources'
  ) THEN
    ALTER TABLE public.prompt_executions ADD COLUMN sources jsonb;
  END IF;
END $$;