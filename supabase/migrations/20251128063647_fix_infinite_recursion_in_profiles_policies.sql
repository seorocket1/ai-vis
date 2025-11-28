/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Admin policies were querying profiles table within profiles policies
    - This caused infinite recursion when checking permissions
  
  2. Solution
    - Drop all existing policies
    - Recreate policies without recursive queries
    - Use simple auth.uid() checks only
  
  3. Security
    - Users can only access their own profile data
    - Service role has full access for system operations
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can select profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role policy (no recursion issue with service_role)
CREATE POLICY "Service role has full access"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);