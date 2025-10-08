-- ============================================
-- COMPLETE FIX FOR ALL ISSUES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- PART 1: Drop all existing policies to start fresh
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can read own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON prompts;

DROP POLICY IF EXISTS "Users can read own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can insert own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can update own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can delete own competitors" ON competitors;

DROP POLICY IF EXISTS "Users can read own executions" ON prompt_executions;
DROP POLICY IF EXISTS "Users can insert own executions" ON prompt_executions;
DROP POLICY IF EXISTS "Users can update own executions" ON prompt_executions;

-- PART 2: Create simple, non-recursive policies
-- ============================================

-- PROFILES TABLE
-- SELECT: Users see own profile OR if they're admin (check via raw metadata)
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

-- INSERT: Users can insert their own profile
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own profile
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PROMPTS TABLE
CREATE POLICY "prompts_select_policy"
  ON prompts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "prompts_insert_policy"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_update_policy"
  ON prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_delete_policy"
  ON prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- COMPETITORS TABLE
CREATE POLICY "competitors_select_policy"
  ON competitors FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "competitors_insert_policy"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitors_update_policy"
  ON competitors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitors_delete_policy"
  ON competitors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- PROMPT_EXECUTIONS TABLE
CREATE POLICY "executions_select_policy"
  ON prompt_executions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "executions_insert_policy"
  ON prompt_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "executions_update_policy"
  ON prompt_executions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- BRAND_MENTIONS TABLE (if exists)
DROP POLICY IF EXISTS "Users can read own brand mentions" ON brand_mentions;
CREATE POLICY "brand_mentions_select_policy"
  ON brand_mentions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompt_executions pe
      WHERE pe.id = brand_mentions.execution_id
      AND pe.user_id = auth.uid()
    )
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "brand_mentions_insert_policy"
  ON brand_mentions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompt_executions pe
      WHERE pe.id = brand_mentions.execution_id
      AND pe.user_id = auth.uid()
    )
  );

-- SENTIMENT_ANALYSIS TABLE (if exists)
DROP POLICY IF EXISTS "Users can read own sentiment" ON sentiment_analysis;
CREATE POLICY "sentiment_select_policy"
  ON sentiment_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompt_executions pe
      WHERE pe.id = sentiment_analysis.execution_id
      AND pe.user_id = auth.uid()
    )
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "sentiment_insert_policy"
  ON sentiment_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompt_executions pe
      WHERE pe.id = sentiment_analysis.execution_id
      AND pe.user_id = auth.uid()
    )
  );

-- RECOMMENDATIONS TABLE (if exists)
DROP POLICY IF EXISTS "Users can read own recommendations" ON recommendations;
CREATE POLICY "recommendations_select_policy"
  ON recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompt_executions pe
      WHERE pe.id = recommendations.execution_id
      AND pe.user_id = auth.uid()
    )
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "recommendations_insert_policy"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompt_executions pe
      WHERE pe.id = recommendations.execution_id
      AND pe.user_id = auth.uid()
    )
  );

-- AGGREGATED_METRICS TABLE (if exists)
DROP POLICY IF EXISTS "Users can read own metrics" ON aggregated_metrics;
CREATE POLICY "metrics_select_policy"
  ON aggregated_metrics FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "metrics_insert_policy"
  ON aggregated_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "metrics_update_policy"
  ON aggregated_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PART 3: Set up admin profile
-- ============================================
DO $$
DECLARE
  admin_id UUID;
  admin_email_val TEXT;
BEGIN
  SELECT id, email INTO admin_id, admin_email_val
  FROM auth.users
  WHERE email = 'nigamaakash101@gmail.com';

  IF admin_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE id = admin_id) THEN
      UPDATE profiles
      SET
        is_admin = true,
        onboarding_completed = true
      WHERE id = admin_id;
    ELSE
      INSERT INTO profiles (id, email, is_admin, onboarding_completed)
      VALUES (admin_id, admin_email_val, true, true);
    END IF;
  END IF;
END $$;

-- PART 4: Fix trigger for protected fields
-- ============================================
CREATE OR REPLACE FUNCTION prevent_protected_field_changes()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Get the email from JWT
  admin_email := auth.jwt() ->> 'email';

  -- If not admin, prevent changes to protected fields
  IF admin_email != 'nigamaakash101@gmail.com' THEN
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

-- PART 5: Auto-create profile trigger (optional but recommended)
-- ============================================
-- This automatically creates a profile when a new user signs up
-- So users don't need to manually create profiles

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarding_completed)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE! All policies fixed.
-- No more infinite recursion!
-- Profiles will be auto-created on signup!
-- ============================================
