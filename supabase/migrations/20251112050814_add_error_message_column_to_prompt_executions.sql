/*
  # Add error_message column to prompt_executions table

  1. Changes
    - Add `error_message` column to `prompt_executions` table as TEXT type
    - This will store error messages when executions fail
  
  2. Notes
    - Column is nullable since successful executions won't have errors
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_executions' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.prompt_executions ADD COLUMN error_message text;
  END IF;
END $$;