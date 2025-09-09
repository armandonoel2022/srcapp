-- Eliminar todas las políticas restrictivas de user_profiles y crear unas más simples
DROP POLICY IF EXISTS "Administradores pueden ver todos los perfiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Administradores pueden gestionar perfiles" ON public.user_profiles;
DROP POLICY IF EXISTS "User access to own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Clientes can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow user profile creation during signup" ON public.user_profiles;

-- Crear políticas más simples para administradores
CREATE POLICY "Administradores pueden gestionar todos los perfiles" 
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

-- Permitir que usuarios vean y actualicen sus propios perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir inserción de perfiles durante registro
CREATE POLICY "Permitir creación de perfiles durante registro" 
ON public.user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);