/*
  # Add Subscription Plans and Usage Tracking

  1. Schema Changes
    - Add subscription_plan column to profiles (free/pro)
    - Add plan_started_at timestamp
    - Add monthly_query_limit and queries_used_this_month
    - Add last_query_reset_at timestamp

  2. Default Values
    - All users default to 'free' plan
    - Free plan: 5 queries per month
    - Pro plan: 500 queries per month
    - Automatic reset on 30-day intervals

  3. Security
    - Update RLS policies to allow admin full access
    - Add policies for users to read their own subscription info
*/

-- Add subscription and usage tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_query_limit INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS queries_used_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_query_reset_at TIMESTAMPTZ DEFAULT now();

-- Update existing users to have proper defaults
UPDATE profiles
SET
  subscription_plan = 'free',
  monthly_query_limit = 5,
  queries_used_this_month = 0,
  plan_started_at = COALESCE(plan_started_at, created_at),
  last_query_reset_at = COALESCE(last_query_reset_at, created_at)
WHERE subscription_plan IS NULL;

-- Function to update query limits based on plan
CREATE OR REPLACE FUNCTION update_query_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_plan = 'free' THEN
    NEW.monthly_query_limit := 5;
  ELSIF NEW.subscription_plan = 'pro' THEN
    NEW.monthly_query_limit := 500;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update query limits when plan changes
DROP TRIGGER IF EXISTS set_query_limit_on_plan_change ON profiles;
CREATE TRIGGER set_query_limit_on_plan_change
  BEFORE UPDATE OF subscription_plan ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_query_limit();

-- Function to check if plan should be downgraded (30 days elapsed for pro users)
CREATE OR REPLACE FUNCTION check_plan_expiration()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    subscription_plan = 'free',
    monthly_query_limit = 5,
    plan_started_at = now()
  WHERE
    subscription_plan = 'pro'
    AND plan_started_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly query usage
CREATE OR REPLACE FUNCTION reset_monthly_queries()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    queries_used_this_month = 0,
    last_query_reset_at = now()
  WHERE last_query_reset_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to fix admin access issues
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow users to update their own profile (but not admin status or subscription)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Users cannot change these fields
      (NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin)
      AND (NEW.subscription_plan IS NOT DISTINCT FROM OLD.subscription_plan)
      AND (NEW.monthly_query_limit IS NOT DISTINCT FROM OLD.monthly_query_limit)
    )
  );
