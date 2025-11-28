/*
  # Fix profiles INSERT policy for onboarding

  1. Changes
    - Add INSERT policy to allow authenticated users to create their own profile
    - This enables users to complete onboarding even if email is not verified
  
  2. Security
    - Policy ensures users can only insert their own profile (auth.uid() = id)
    - Maintains data security while allowing onboarding to complete
*/

DO $$ 
BEGIN
  -- Drop existing insert policy if it exists
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  
  -- Create new insert policy
  CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
END $$;