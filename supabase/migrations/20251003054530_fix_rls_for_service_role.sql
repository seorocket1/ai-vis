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