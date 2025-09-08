-- Create a policy to allow admins to view all user profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'administrador'
  )
);

-- Create a policy to allow admins to update user profiles
CREATE POLICY "Admins can update all profiles"
ON user_profiles 
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'administrador'
  )
);