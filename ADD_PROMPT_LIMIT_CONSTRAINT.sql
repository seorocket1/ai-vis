-- Add database-level constraint to enforce prompt limits
-- This ensures limits are enforced even if frontend checks are bypassed

CREATE OR REPLACE FUNCTION check_prompt_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan TEXT;
  prompt_count INTEGER;
  max_prompts INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM profiles
  WHERE id = NEW.user_id;

  -- Set limit based on plan
  IF user_plan = 'pro' THEN
    max_prompts := 50;
  ELSE
    max_prompts := 5;
  END IF;

  -- Count existing prompts
  SELECT COUNT(*) INTO prompt_count
  FROM prompts
  WHERE user_id = NEW.user_id;

  -- Check if limit exceeded
  IF prompt_count >= max_prompts THEN
    RAISE EXCEPTION 'Prompt limit exceeded. Your plan allows % prompts. Upgrade to Pro for 50 prompts!', max_prompts;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_prompt_limit ON prompts;

-- Create trigger to run before insert
CREATE TRIGGER enforce_prompt_limit
  BEFORE INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION check_prompt_limit();

-- Optional: Delete excess prompts for users over limit (run carefully!)
-- Uncomment the line below if you want to automatically remove excess prompts
-- DELETE FROM prompts WHERE id IN (
--   SELECT id FROM prompts WHERE user_id IN (
--     SELECT user_id FROM (
--       SELECT user_id, COUNT(*) as cnt FROM prompts GROUP BY user_id HAVING COUNT(*) > 5
--     ) subq WHERE user_id IN (SELECT id FROM profiles WHERE subscription_plan = 'free')
--   )
--   ORDER BY created_at DESC
--   OFFSET 5
-- );
