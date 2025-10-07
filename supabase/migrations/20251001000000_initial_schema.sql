/*
  # Initial Schema Setup

  ## Overview
  This migration creates the foundational database schema for the Brand Visibility Platform.
  The platform helps users track their brand mentions, analyze sentiment, and monitor competitors.

  ## New Tables

  ### 1. profiles
  User profile information linked to auth.users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text, unique) - User's email address
  - `website_url` (text, nullable) - User's website URL
  - `brand_name` (text, nullable) - User's brand name
  - `subscription_tier` (text) - Subscription level (free, pro, enterprise)
  - `subscription_status` (text) - Current subscription status
  - `subscription_end_date` (timestamptz, nullable) - When subscription ends
  - `onboarding_completed` (boolean) - Whether user completed onboarding
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. competitors
  Competitor brands that users want to track
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - References profiles.id
  - `name` (text) - Competitor brand name
  - `website_url` (text, nullable) - Competitor's website
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. prompts
  AI prompts configured by users
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - References profiles.id
  - `text` (text) - The prompt text
  - `is_active` (boolean) - Whether prompt is active
  - `frequency` (text) - How often to run (daily, weekly, etc)
  - `last_triggered_at` (timestamptz, nullable) - Last execution time
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. prompt_executions
  Records of prompt executions
  - `id` (uuid, primary key) - Unique identifier
  - `prompt_id` (uuid) - References prompts.id
  - `user_id` (uuid) - References profiles.id
  - `model` (text) - AI model used
  - `status` (text) - Execution status (pending, running, completed, failed)
  - `ai_response` (text, nullable) - AI's response
  - `executed_at` (timestamptz) - When execution started
  - `completed_at` (timestamptz, nullable) - When execution finished

  ### 5. brand_mentions
  Brand mentions found in AI responses
  - `id` (uuid, primary key) - Unique identifier
  - `execution_id` (uuid) - References prompt_executions.id
  - `brand_name` (text) - Name of the brand mentioned
  - `mention_count` (integer) - Number of times mentioned
  - `is_user_brand` (boolean) - Whether this is the user's brand
  - `created_at` (timestamptz) - Creation timestamp

  ### 6. sentiment_analysis
  Sentiment analysis results for executions
  - `id` (uuid, primary key) - Unique identifier
  - `execution_id` (uuid) - References prompt_executions.id
  - `positive_percentage` (numeric) - Positive sentiment percentage
  - `neutral_percentage` (numeric) - Neutral sentiment percentage
  - `negative_percentage` (numeric) - Negative sentiment percentage
  - `created_at` (timestamptz) - Creation timestamp

  ### 7. recommendations
  AI-generated recommendations
  - `id` (uuid, primary key) - Unique identifier
  - `execution_id` (uuid) - References prompt_executions.id
  - `recommendation_id` (text) - Internal recommendation ID
  - `text` (text) - Recommendation text
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - All tables have Row Level Security (RLS) enabled
  - Users can only access their own data
  - Each table has appropriate policies for SELECT, INSERT, UPDATE, DELETE operations
  - Foreign key constraints ensure data integrity
  - Cascading deletes maintain referential integrity

  ## Indexes
  - Foreign key columns are indexed for query performance
  - User-scoped queries are optimized with composite indexes
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  website_url text,
  brand_name text,
  subscription_tier text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  subscription_end_date timestamptz,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitors"
  ON competitors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own competitors"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own competitors"
  ON competitors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_active boolean DEFAULT true,
  frequency text DEFAULT 'daily',
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_active ON prompts(user_id, is_active);

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

-- Create prompt_executions table
CREATE TABLE IF NOT EXISTS prompt_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model text DEFAULT 'gpt-4',
  status text DEFAULT 'pending',
  ai_response text,
  executed_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_executions_user_id ON prompt_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_prompt_id ON prompt_executions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON prompt_executions(user_id, status);

ALTER TABLE prompt_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions"
  ON prompt_executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions"
  ON prompt_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own executions"
  ON prompt_executions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create brand_mentions table
CREATE TABLE IF NOT EXISTS brand_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  mention_count integer DEFAULT 0,
  is_user_brand boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentions_execution_id ON brand_mentions(execution_id);

ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand mentions"
  ON brand_mentions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompt_executions
      WHERE prompt_executions.id = brand_mentions.execution_id
      AND prompt_executions.user_id = auth.uid()
    )
  );

-- Create sentiment_analysis table
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  positive_percentage numeric DEFAULT 0,
  neutral_percentage numeric DEFAULT 0,
  negative_percentage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_execution_id ON sentiment_analysis(execution_id);

ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sentiment analysis"
  ON sentiment_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompt_executions
      WHERE prompt_executions.id = sentiment_analysis.execution_id
      AND prompt_executions.user_id = auth.uid()
    )
  );

-- Create recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES prompt_executions(id) ON DELETE CASCADE,
  recommendation_id text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_execution_id ON recommendations(execution_id);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prompt_executions
      WHERE prompt_executions.id = recommendations.execution_id
      AND prompt_executions.user_id = auth.uid()
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
