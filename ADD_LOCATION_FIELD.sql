-- Add location field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text DEFAULT 'United States';
