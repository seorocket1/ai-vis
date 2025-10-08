-- ============================================
-- SUBSCRIPTION PLANS SETUP
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Add subscription and usage tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_query_limit INTEGER DEFAULT 5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS queries_used_this_month INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_query_reset_at TIMESTAMPTZ DEFAULT now();

-- Update existing users to have proper defaults
UPDATE profiles
SET
  subscription_plan = COALESCE(subscription_plan, 'free'),
  monthly_query_limit = COALESCE(monthly_query_limit, 5),
  queries_used_this_month = COALESCE(queries_used_this_month, 0),
  plan_started_at = COALESCE(plan_started_at, created_at),
  last_query_reset_at = COALESCE(last_query_reset_at, created_at)
WHERE subscription_plan IS NULL OR monthly_query_limit IS NULL;

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

-- Function to check if plan should be downgraded
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

-- Function to atomically increment query usage
CREATE OR REPLACE FUNCTION increment_query_usage(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET queries_used_this_month = queries_used_this_month + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_query_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_plan_expiration() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_queries() TO authenticated;

-- Update RLS policies for admin access
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

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger to prevent users from changing protected fields
CREATE OR REPLACE FUNCTION prevent_protected_field_changes()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if the user is an admin
  SELECT is_admin INTO is_admin_user
  FROM profiles
  WHERE id = auth.uid();

  -- If not admin, prevent changes to protected fields
  IF NOT COALESCE(is_admin_user, false) THEN
    NEW.is_admin := OLD.is_admin;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.monthly_query_limit := OLD.monthly_query_limit;
    NEW.queries_used_this_month := OLD.queries_used_this_month;
    NEW.plan_started_at := OLD.plan_started_at;
    NEW.last_query_reset_at := OLD.last_query_reset_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_subscription_fields ON profiles;
CREATE TRIGGER protect_subscription_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_protected_field_changes();
