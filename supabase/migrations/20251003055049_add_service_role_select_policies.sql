-- Add SELECT policies for service role to read data for calculating metrics

-- sentiment_analysis: Allow service role to select
DROP POLICY IF EXISTS "Service role can select sentiment" ON sentiment_analysis;
CREATE POLICY "Service role can select sentiment"
  ON sentiment_analysis FOR SELECT
  TO service_role
  USING (true);

-- aggregated_metrics: Allow service role to select
DROP POLICY IF EXISTS "Service role can select metrics" ON aggregated_metrics;
CREATE POLICY "Service role can select metrics"
  ON aggregated_metrics FOR SELECT
  TO service_role
  USING (true);

-- brand_mentions: Allow service role to select
DROP POLICY IF EXISTS "Service role can select mentions" ON brand_mentions;
CREATE POLICY "Service role can select mentions"
  ON brand_mentions FOR SELECT
  TO service_role
  USING (true);

-- recommendations: Allow service role to select
DROP POLICY IF EXISTS "Service role can select recommendations" ON recommendations;
CREATE POLICY "Service role can select recommendations"
  ON recommendations FOR SELECT
  TO service_role
  USING (true);

-- prompt_executions: Allow service role to select
DROP POLICY IF EXISTS "Service role can select executions" ON prompt_executions;
CREATE POLICY "Service role can select executions"
  ON prompt_executions FOR SELECT
  TO service_role
  USING (true);

-- profiles: Allow service role to select
DROP POLICY IF EXISTS "Service role can select profiles" ON profiles;
CREATE POLICY "Service role can select profiles"
  ON profiles FOR SELECT
  TO service_role
  USING (true);