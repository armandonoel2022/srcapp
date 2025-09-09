-- Eliminar política restrictiva existente y crear una que permita a administradores ver todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Crear nueva política que permita a administradores ver todos los perfiles
CREATE POLICY "Administradores pueden ver todos los perfiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'administrador'::user_role 
    AND up.active = true
  )
);

-- También crear política para permitir la gestión completa por administradores
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
CREATE POLICY "Administradores pueden gestionar perfiles" 
ON public.user_profiles 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'administrador'::user_role 
    AND up.active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'administrador'::user_role 
    AND up.active = true
  )
);