/*
  # Add subscription_plan column to profiles table

  1. Changes
    - Add `subscription_plan` column to `profiles` table to replace `subscription_tier`
    - Set default value to 'free'
    - This aligns with the code that checks for subscription_plan
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Nullable column with default value
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan text DEFAULT 'free';
  END IF;
END $$;