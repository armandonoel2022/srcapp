-- Eliminar las políticas actuales que causan recursión
DROP POLICY IF EXISTS "Administradores pueden gestionar todos los perfiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir creación de perfiles durante registro" ON public.user_profiles;

-- Crear función SECURITY DEFINER para evitar recursión
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT role FROM public.user_profiles 
    WHERE user_id = auth.uid() AND active = true;
$$;

-- Políticas simplificadas usando la función
CREATE POLICY "Administradores pueden gestionar todos los perfiles" 
ON public.user_profiles 
FOR ALL 
TO authenticated 
USING (public.get_current_user_role() = 'administrador')
WITH CHECK (public.get_current_user_role() = 'administrador');

-- Permitir que usuarios vean y actualicen sus propios perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR public.get_current_user_role() = 'administrador');

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR public.get_current_user_role() = 'administrador')
WITH CHECK (auth.uid() = user_id OR public.get_current_user_role() = 'administrador');

-- Permitir inserción de perfiles durante registro
CREATE POLICY "Permitir creación de perfiles durante registro" 
ON public.user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR public.get_current_user_role() = 'administrador');