-- ============================================
-- FIX ALL RLS POLICIES FOR ONBOARDING
-- Run this script in Supabase SQL Editor
-- ============================================

-- 1. profiles: Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. profiles: Simplify update policy for users
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Trigger to prevent users from changing protected fields
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

-- 4. prompts: Allow users to insert their own prompts
DROP POLICY IF EXISTS "Users can insert own prompts" ON prompts;
CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. competitors: Allow users to insert their own competitors
DROP POLICY IF EXISTS "Users can insert own competitors" ON competitors;
CREATE POLICY "Users can insert own competitors"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. prompt_executions: Allow users to insert their own executions
DROP POLICY IF EXISTS "Users can insert own executions" ON prompt_executions;
CREATE POLICY "Users can insert own executions"
  ON prompt_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DONE! Policies are now fixed.
-- Try onboarding again after running this.
-- ============================================
