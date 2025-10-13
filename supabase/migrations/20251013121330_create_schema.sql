/*
  # Complete Database Schema

  1. Tables Created
    - profiles: User profile information
    - prompts: AI prompts with platform field
    - prompt_executions: Execution records with platform and error_message fields
    - competitors: Competitor tracking
    - brand_mentions: Brand mention analysis
    - sentiment_analysis: Sentiment tracking
    - recommendations: AI recommendations
    - aggregated_metrics: Aggregated analytics

  2. Features
    - All tables have RLS enabled
    - Auto-create profile on signup trigger
    - Subscription and usage tracking
    - Location field in profiles
    - Platform field in prompts and executions
    - Error tracking in executions
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  website_url text,
  brand_name text,
  location text,
  subscription_tier text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  subscription_end_date timestamptz,
  onboarding_completed boolean DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro')),
  plan_started_at TIMESTAMPTZ DEFAULT now(),
  monthly_query_limit INTEGER DEFAULT 5,
  queries_used_this_month INTEGER DEFAULT 0,
  last_query_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- prompt table with platform column
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  platform text DEFAULT 'all',
  is_active boolean DEFAULT true,
  frequency text DEFAULT 'daily',
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- prompt_executions with platform and error_message
CREATE TABLE IF NOT EXISTS prompt_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model text DEFAULT 'gpt-4',
  platform text,
  status text DEFAULT 'pending',
  ai_response text,
  error_message text,
  executed_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;

-- Other tables
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS brand_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  mention_count integer DEFAULT 0,
  is_user_brand boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  positive_percentage numeric DEFAULT 0,
  neutral_percentage numeric DEFAULT 0,
  negative_percentage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  recommendation_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS aggregated_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  time_period text NOT NULL DEFAULT 'all',
  avg_sentiment_score numeric DEFAULT 0,
  avg_brand_visibility numeric DEFAULT 0,
  share_of_voice numeric DEFAULT 0,
  competitive_rank integer DEFAULT 0,
  response_quality numeric DEFAULT 0,
  platform_coverage integer DEFAULT 0,
  total_executions integer DEFAULT 0,
  total_brand_mentions integer DEFAULT 0,
  total_competitor_mentions integer DEFAULT 0,
  top_competitor text,
  avg_positive_sentiment numeric DEFAULT 0,
  avg_neutral_sentiment numeric DEFAULT 0,
  avg_negative_sentiment numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, time_period)
);

ALTER TABLE aggregated_metrics ENABLE ROW LEVEL SECURITY;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
