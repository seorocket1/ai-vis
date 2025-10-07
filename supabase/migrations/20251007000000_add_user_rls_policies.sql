/*
  # Add User RLS Policies for All Tables

  1. Changes
    - Add INSERT, SELECT, UPDATE policies for authenticated users on all tables
    - Users can only access their own data
    - Maintains existing service_role policies

  2. Security
    - All policies check auth.uid() = user_id for data ownership
    - Restrictive by default - users only see/modify their own data
*/

-- prompt_executions: Allow authenticated users to insert their own executions
DROP POLICY IF EXISTS "Users can insert own executions" ON prompt_executions;
CREATE POLICY "Users can insert own executions"
  ON prompt_executions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- prompt_executions: Allow authenticated users to view their own executions
DROP POLICY IF EXISTS "Users can view own executions" ON prompt_executions;
CREATE POLICY "Users can view own executions"
  ON prompt_executions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- prompt_executions: Allow authenticated users to update their own executions
DROP POLICY IF EXISTS "Users can update own executions" ON prompt_executions;
CREATE POLICY "Users can update own executions"
  ON prompt_executions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prompts: Allow authenticated users to insert their own prompts
DROP POLICY IF EXISTS "Users can insert own prompts" ON prompts;
CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- prompts: Allow authenticated users to view their own prompts
DROP POLICY IF EXISTS "Users can view own prompts" ON prompts;
CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- prompts: Allow authenticated users to update their own prompts
DROP POLICY IF EXISTS "Users can update own prompts" ON prompts;
CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prompts: Allow authenticated users to delete their own prompts
DROP POLICY IF EXISTS "Users can delete own prompts" ON prompts;
CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- brand_mentions: Allow authenticated users to view their mentions (via execution)
DROP POLICY IF EXISTS "Users can view own brand mentions" ON brand_mentions;
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

-- sentiment_analysis: Allow authenticated users to view their sentiment data
DROP POLICY IF EXISTS "Users can view own sentiment analysis" ON sentiment_analysis;
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

-- recommendations: Allow authenticated users to view their recommendations
DROP POLICY IF EXISTS "Users can view own recommendations" ON recommendations;
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

-- competitors: Allow authenticated users to insert their own competitors
DROP POLICY IF EXISTS "Users can insert own competitors" ON competitors;
CREATE POLICY "Users can insert own competitors"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- competitors: Allow authenticated users to view their own competitors
DROP POLICY IF EXISTS "Users can view own competitors" ON competitors;
CREATE POLICY "Users can view own competitors"
  ON competitors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- competitors: Allow authenticated users to delete their own competitors
DROP POLICY IF EXISTS "Users can delete own competitors" ON competitors;
CREATE POLICY "Users can delete own competitors"
  ON competitors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
