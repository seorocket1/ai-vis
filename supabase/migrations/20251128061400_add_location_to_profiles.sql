/*
  # Add location column to profiles table

  1. Changes
    - Add `location` column to `profiles` table to store user's default location
    - Set default value to 'India' for existing records
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Nullable column with default value
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text DEFAULT 'India';
  END IF;
END $$;