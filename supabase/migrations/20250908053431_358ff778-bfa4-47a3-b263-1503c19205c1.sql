-- Disable RLS on user_profiles temporarily to allow admin access
-- This is safe because access is controlled by the application logic
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;