-- Add location field to profiles table with India as default
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text DEFAULT 'India';
