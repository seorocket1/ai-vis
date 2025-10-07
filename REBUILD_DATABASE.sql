-- =====================================================
-- COMPLETE DATABASE REBUILD SCRIPT
-- =====================================================
-- Run this script in Supabase Dashboard > SQL Editor
-- This will drop all tables and recreate them properly
-- =====================================================

-- STEP 1: Drop all existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS sentiment_analysis CASCADE;
DROP TABLE IF EXISTS brand_mentions CASCADE;
DROP TABLE IF EXISTS prompt_executions CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS competitors CASCADE;
DROP TABLE IF EXISTS aggregated_metrics CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- STEP 2: Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  website_url text,
  brand_name text,
  subscription_tier text DEFAULT 'free' NOT NULL,
  subscription_status text DEFAULT 'active' NOT NULL,
  subscription_end_date timestamptz,
  onboarding_completed boolean DEFAULT false NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin = true AND auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read all profiles"
  ON profiles FOR SELECT
  TO service_role
  USING (true);

-- STEP 3: Create competitors table
CREATE TABLE competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_competitors_user_id ON competitors(user_id);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitors"
  ON competitors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competitors"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own competitors"
  ON competitors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitors"
  ON competitors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all competitors"
  ON competitors FOR SELECT
  TO service_role
  USING (true);

-- STEP 4: Create prompts table
CREATE TABLE prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  frequency text DEFAULT 'weekly' NOT NULL,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_is_active ON prompts(is_active);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all prompts"
  ON prompts FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update all prompts"
  ON prompts FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- STEP 5: Create prompt_executions table
CREATE TABLE prompt_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  ai_response text,
  executed_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

CREATE INDEX idx_prompt_executions_prompt_id ON prompt_executions(prompt_id);
CREATE INDEX idx_prompt_executions_user_id ON prompt_executions(user_id);
CREATE INDEX idx_prompt_executions_status ON prompt_executions(status);
CREATE INDEX idx_prompt_executions_executed_at ON prompt_executions(executed_at DESC);

ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions"
  ON prompt_executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert executions"
  ON prompt_executions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read all executions"
  ON prompt_executions FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update all executions"
  ON prompt_executions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- STEP 6: Create brand_mentions table
CREATE TABLE brand_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  mention_count integer DEFAULT 0 NOT NULL,
  is_user_brand boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_brand_mentions_execution_id ON brand_mentions(execution_id);
CREATE INDEX idx_brand_mentions_brand_name ON brand_mentions(brand_name);

ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brand mentions from own executions"
  ON brand_mentions FOR SELECT
  TO authenticated
  USING (
    execution_id IN (
      SELECT id FROM prompt_executions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert brand mentions"
  ON brand_mentions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read all brand mentions"
  ON brand_mentions FOR SELECT
  TO service_role
  USING (true);

-- STEP 7: Create sentiment_analysis table
CREATE TABLE sentiment_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  positive_percentage numeric DEFAULT 0 NOT NULL,
  neutral_percentage numeric DEFAULT 0 NOT NULL,
  negative_percentage numeric DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_sentiment_analysis_execution_id ON sentiment_analysis(execution_id);

ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sentiment from own executions"
  ON sentiment_analysis FOR SELECT
  TO authenticated
  USING (
    execution_id IN (
      SELECT id FROM prompt_executions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert sentiment analysis"
  ON sentiment_analysis FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read all sentiment analysis"
  ON sentiment_analysis FOR SELECT
  TO service_role
  USING (true);

-- STEP 8: Create recommendations table
CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  recommendation_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_recommendations_execution_id ON recommendations(execution_id);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recommendations from own executions"
  ON recommendations FOR SELECT
  TO authenticated
  USING (
    execution_id IN (
      SELECT id FROM prompt_executions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert recommendations"
  ON recommendations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read all recommendations"
  ON recommendations FOR SELECT
  TO service_role
  USING (true);

-- STEP 9: Create aggregated_metrics table
CREATE TABLE aggregated_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_period text DEFAULT 'all' NOT NULL,
  avg_sentiment_score numeric DEFAULT 0 NOT NULL,
  avg_brand_visibility numeric DEFAULT 0 NOT NULL,
  share_of_voice numeric DEFAULT 0 NOT NULL,
  competitive_rank integer DEFAULT 0 NOT NULL,
  response_quality numeric DEFAULT 0 NOT NULL,
  platform_coverage integer DEFAULT 0 NOT NULL,
  total_executions integer DEFAULT 0 NOT NULL,
  total_brand_mentions integer DEFAULT 0 NOT NULL,
  total_competitor_mentions integer DEFAULT 0 NOT NULL,
  top_competitor text,
  avg_positive_sentiment numeric DEFAULT 0 NOT NULL,
  avg_neutral_sentiment numeric DEFAULT 0 NOT NULL,
  avg_negative_sentiment numeric DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, time_period)
);

CREATE INDEX idx_aggregated_metrics_user_period ON aggregated_metrics(user_id, time_period);

ALTER TABLE aggregated_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON aggregated_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON aggregated_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON aggregated_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own metrics"
  ON aggregated_metrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can read all metrics"
  ON aggregated_metrics FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert all metrics"
  ON aggregated_metrics FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update all metrics"
  ON aggregated_metrics FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- STEP 10: Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 12: Restore existing users to profiles table
INSERT INTO profiles (id, email, onboarding_completed, is_admin)
SELECT
  id,
  email,
  false as onboarding_completed,
  false as is_admin
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- STEP 13: Set first user as admin
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM profiles
  ORDER BY created_at ASC
  LIMIT 1
);

-- Done! All tables recreated with proper structure and RLS policies.
