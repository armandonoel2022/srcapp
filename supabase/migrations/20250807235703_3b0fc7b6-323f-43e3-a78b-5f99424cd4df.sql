-- Create admin user profile for existing user if needed
-- Note: This assumes you'll create the admin user manually in Supabase Auth first
-- Then we can set up the profile

-- First, let's create a function to help set up user profiles
CREATE OR REPLACE FUNCTION public.setup_user_profile(
  p_email TEXT,
  p_username TEXT,
  p_role user_role DEFAULT 'agente_seguridad'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from auth.users based on email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = p_email;
  
  IF user_uuid IS NULL THEN
    RETURN 'User not found with email: ' || p_email;
  END IF;
  
  -- Insert or update user profile
  INSERT INTO public.user_profiles (user_id, username, role, requires_password_change)
  VALUES (user_uuid, p_username, p_role, false)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    requires_password_change = false,
    updated_at = now();
    
  RETURN 'Profile created/updated for: ' || p_username || ' with role: ' || p_role;
END;
$$;

-- Create a temporary function to set up initial admin
-- This will be used after you create the users in Supabase Auth
CREATE OR REPLACE FUNCTION public.setup_initial_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Set up profiles for users once they exist in auth.users
  -- You'll need to create these users first in Supabase Auth dashboard
  
  -- Try to set up admin user (Admin_SRC / Src_Admin@2025)
  PERFORM public.setup_user_profile('admin@src.com', 'Admin_SRC', 'administrador');
  
  -- Try to set up agent user for current user
  PERFORM public.setup_user_profile('agente@src.com', 'Src_Control', 'agente_seguridad');
  
  RETURN 'Initial user setup completed. Please verify the profiles were created correctly.';
END;
$$;