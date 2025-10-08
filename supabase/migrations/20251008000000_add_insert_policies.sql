/*
  # Add INSERT Policies for Analysis Tables

  1. Changes
    - Add INSERT policies for brand_mentions, sentiment_analysis, and recommendations
    - Users can insert data for executions they own
    - Add INSERT policy for aggregated_metrics

  2. Security
    - All policies verify ownership through prompt_executions table
    - Users can only insert data for their own executions
*/

-- brand_mentions: Allow authenticated users to insert mentions for their executions
DROP POLICY IF EXISTS "Users can insert own brand mentions" ON brand_mentions;
CREATE POLICY "Users can insert own brand mentions"
  ON brand_mentions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompt_executions
      WHERE prompt_executions.id = brand_mentions.execution_id
      AND prompt_executions.user_id = auth.uid()
    )
  );

-- sentiment_analysis: Allow authenticated users to insert sentiment for their executions
DROP POLICY IF EXISTS "Users can insert own sentiment analysis" ON sentiment_analysis;
CREATE POLICY "Users can insert own sentiment analysis"
  ON sentiment_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompt_executions
      WHERE prompt_executions.id = sentiment_analysis.execution_id
      AND prompt_executions.user_id = auth.uid()
    )
  );

-- recommendations: Allow authenticated users to insert recommendations for their executions
DROP POLICY IF EXISTS "Users can insert own recommendations" ON recommendations;
CREATE POLICY "Users can insert own recommendations"
  ON recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prompt_executions
      WHERE prompt_executions.id = recommendations.execution_id
      AND prompt_executions.user_id = auth.uid()
    )
  );

-- aggregated_metrics: Allow authenticated users to insert their own metrics
DROP POLICY IF EXISTS "Users can insert own metrics" ON aggregated_metrics;
CREATE POLICY "Users can insert own metrics"
  ON aggregated_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- aggregated_metrics: Allow authenticated users to view their own metrics
DROP POLICY IF EXISTS "Users can view own metrics" ON aggregated_metrics;
CREATE POLICY "Users can view own metrics"
  ON aggregated_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- aggregated_metrics: Allow authenticated users to update their own metrics
DROP POLICY IF EXISTS "Users can update own metrics" ON aggregated_metrics;
CREATE POLICY "Users can update own metrics"
  ON aggregated_metrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
