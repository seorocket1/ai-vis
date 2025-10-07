-- Verification Script: Check that all required tables and columns exist

-- Check all tables exist
SELECT
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 8 THEN '✓ All tables exist'
    ELSE '✗ Missing tables'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'competitors',
    'prompts',
    'prompt_executions',
    'brand_mentions',
    'sentiment_analysis',
    'recommendations',
    'aggregated_metrics'
  );

-- Check prompt_executions has platform column
SELECT
  'Platform Column Check' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default,
  '✓ Platform column exists' as status
FROM information_schema.columns
WHERE table_name = 'prompt_executions'
  AND column_name = 'platform';

-- Check all prompt_executions columns
SELECT
  'Prompt Executions Columns' as check_type,
  COUNT(*) as column_count,
  CASE
    WHEN COUNT(*) >= 9 THEN '✓ All required columns exist'
    ELSE '✗ Missing columns'
  END as status
FROM information_schema.columns
WHERE table_name = 'prompt_executions';

-- List all prompt_executions columns for verification
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'prompt_executions'
ORDER BY ordinal_position;
