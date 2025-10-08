# URGENT: Fix Platform Column Error

## The Problem
The `prompts` table is missing the `platform` column, causing the onboarding to fail after generating prompts.

## The Solution
Run this SQL in your Supabase SQL Editor:

```sql
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
```

## Steps to Fix

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL above
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Refresh your application

## What This Does
- Adds a `platform` column to the `prompts` table
- Sets default value to `'all'` for multi-platform monitoring
- Uses `IF NOT EXISTS` to prevent errors if column already exists
- Safe to run multiple times

## After Running
The onboarding will work correctly and save your generated prompts!
