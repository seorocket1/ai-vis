/*
  # Fix RLS Policies for Service Role Access

  1. Changes
    - Add service role policies for sentiment_analysis table
    - Add service role policies for aggregated_metrics table
    - Add service role policies for brand_mentions table
    - Add service role policies for recommendations table
    - These policies allow edge functions (using service role) to insert/update data

  2. Security
    - Service role can insert data for any user
    - Regular users can still only access their own data
    - This is necessary for n8n-callback edge function to work
*/

-- sentiment_analysis: Allow service role to insert
DROP POLICY IF EXISTS "Service role can insert sentiment" ON sentiment_analysis;
CREATE POLICY "Service role can insert sentiment"
  ON sentiment_analysis FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update sentiment" ON sentiment_analysis;
CREATE POLICY "Service role can update sentiment"
  ON sentiment_analysis FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- aggregated_metrics: Allow service role to insert/update
DROP POLICY IF EXISTS "Service role can insert metrics" ON aggregated_metrics;
CREATE POLICY "Service role can insert metrics"
  ON aggregated_metrics FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update metrics" ON aggregated_metrics;
CREATE POLICY "Service role can update metrics"
  ON aggregated_metrics FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- brand_mentions: Allow service role to insert
DROP POLICY IF EXISTS "Service role can insert mentions" ON brand_mentions;
CREATE POLICY "Service role can insert mentions"
  ON brand_mentions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- recommendations: Allow service role to insert
DROP POLICY IF EXISTS "Service role can insert recommendations" ON recommendations;
CREATE POLICY "Service role can insert recommendations"
  ON recommendations FOR INSERT
  TO service_role
  WITH CHECK (true);

-- prompt_executions: Allow service role to update (for marking complete)
DROP POLICY IF EXISTS "Service role can update executions" ON prompt_executions;
CREATE POLICY "Service role can update executions"
  ON prompt_executions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
