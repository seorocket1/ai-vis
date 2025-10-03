/*
  # Add Aggregated Metrics Table

  1. New Tables
    - aggregated_metrics table with comprehensive metrics storage
  
  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

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

CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_user_period 
  ON aggregated_metrics(user_id, time_period);

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