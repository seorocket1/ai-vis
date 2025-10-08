-- ============================================
-- COMPLETE FIX - DROP EVERYTHING AND RECREATE
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update all profiles" ON profiles;

DROP POLICY IF EXISTS "prompts_select_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_insert_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_update_policy" ON prompts;
DROP POLICY IF EXISTS "prompts_delete_policy" ON prompts;
DROP POLICY IF EXISTS "Users can read own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can insert own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON prompts;

DROP POLICY IF EXISTS "competitors_select_policy" ON competitors;
DROP POLICY IF EXISTS "competitors_insert_policy" ON competitors;
DROP POLICY IF EXISTS "competitors_update_policy" ON competitors;
DROP POLICY IF EXISTS "competitors_delete_policy" ON competitors;
DROP POLICY IF EXISTS "Users can read own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can insert own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can update own competitors" ON competitors;
DROP POLICY IF EXISTS "Users can delete own competitors" ON competitors;

DROP POLICY IF EXISTS "executions_select_policy" ON prompt_executions;
DROP POLICY IF EXISTS "executions_insert_policy" ON prompt_executions;
DROP POLICY IF EXISTS "executions_update_policy" ON prompt_executions;
DROP POLICY IF EXISTS "Users can read own executions" ON prompt_executions;
DROP POLICY IF EXISTS "Users can insert own executions" ON prompt_executions;
DROP POLICY IF EXISTS "Users can update own executions" ON prompt_executions;

DROP POLICY IF EXISTS "brand_mentions_select_policy" ON brand_mentions;
DROP POLICY IF EXISTS "brand_mentions_insert_policy" ON brand_mentions;
DROP POLICY IF EXISTS "Users can read own brand mentions" ON brand_mentions;

DROP POLICY IF EXISTS "sentiment_select_policy" ON sentiment_analysis;
DROP POLICY IF EXISTS "sentiment_insert_policy" ON sentiment_analysis;
DROP POLICY IF EXISTS "Users can read own sentiment" ON sentiment_analysis;

DROP POLICY IF EXISTS "recommendations_select_policy" ON recommendations;
DROP POLICY IF EXISTS "recommendations_insert_policy" ON recommendations;
DROP POLICY IF EXISTS "Users can read own recommendations" ON recommendations;

DROP POLICY IF EXISTS "metrics_select_policy" ON aggregated_metrics;
DROP POLICY IF EXISTS "metrics_insert_policy" ON aggregated_metrics;
DROP POLICY IF EXISTS "metrics_update_policy" ON aggregated_metrics;
DROP POLICY IF EXISTS "Users can read own metrics" ON aggregated_metrics;

-- STEP 2: CREATE SIMPLE POLICIES (NO RECURSION)
-- ============================================

CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com');

CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "prompts_select_policy" ON prompts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com');

CREATE POLICY "prompts_insert_policy" ON prompts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_update_policy" ON prompts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_delete_policy" ON prompts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "competitors_select_policy" ON competitors FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com');

CREATE POLICY "competitors_insert_policy" ON competitors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitors_update_policy" ON competitors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competitors_delete_policy" ON competitors FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "executions_select_policy" ON prompt_executions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com');

CREATE POLICY "executions_insert_policy" ON prompt_executions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "executions_update_policy" ON prompt_executions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brand_mentions_select_policy" ON brand_mentions FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM prompt_executions pe WHERE pe.id = brand_mentions.execution_id AND pe.user_id = auth.uid())
    OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "brand_mentions_insert_policy" ON brand_mentions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM prompt_executions pe WHERE pe.id = brand_mentions.execution_id AND pe.user_id = auth.uid())
  );

CREATE POLICY "sentiment_select_policy" ON sentiment_analysis FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM prompt_executions pe WHERE pe.id = sentiment_analysis.execution_id AND pe.user_id = auth.uid())
    OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "sentiment_insert_policy" ON sentiment_analysis FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM prompt_executions pe WHERE pe.id = sentiment_analysis.execution_id AND pe.user_id = auth.uid())
  );

CREATE POLICY "recommendations_select_policy" ON recommendations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM prompt_executions pe WHERE pe.id = recommendations.execution_id AND pe.user_id = auth.uid())
    OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com'
  );

CREATE POLICY "recommendations_insert_policy" ON recommendations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM prompt_executions pe WHERE pe.id = recommendations.execution_id AND pe.user_id = auth.uid())
  );

CREATE POLICY "metrics_select_policy" ON aggregated_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'nigamaakash101@gmail.com');

CREATE POLICY "metrics_insert_policy" ON aggregated_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "metrics_update_policy" ON aggregated_metrics FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- STEP 3: SET UP ADMIN
-- ============================================

DO $$
DECLARE
  admin_id UUID;
  admin_email_val TEXT;
BEGIN
  SELECT id, email INTO admin_id, admin_email_val FROM auth.users WHERE email = 'nigamaakash101@gmail.com';
  IF admin_id IS NOT NULL THEN
    INSERT INTO profiles (id, email, is_admin, onboarding_completed) VALUES (admin_id, admin_email_val, true, true)
    ON CONFLICT (id) DO UPDATE SET is_admin = true, onboarding_completed = true;
  END IF;
END $$;

-- STEP 4: AUTO-CREATE PROFILES
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarding_completed) VALUES (NEW.id, NEW.email, false) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 5: PROTECT FIELDS
-- ============================================

CREATE OR REPLACE FUNCTION prevent_protected_field_changes() RETURNS TRIGGER AS $$
DECLARE admin_email TEXT;
BEGIN
  admin_email := auth.jwt() ->> 'email';
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
CREATE TRIGGER protect_subscription_fields BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION prevent_protected_field_changes();
