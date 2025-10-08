/*
  # Add Query Increment Function

  1. New Functions
    - `increment_query_usage`: Safely increment user's query usage count

  2. Security
    - Function executes with SECURITY DEFINER for atomic updates
    - Only authenticated users can call it
*/

-- Function to atomically increment query usage
CREATE OR REPLACE FUNCTION increment_query_usage(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET queries_used_this_month = queries_used_this_month + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_query_usage(UUID) TO authenticated;
