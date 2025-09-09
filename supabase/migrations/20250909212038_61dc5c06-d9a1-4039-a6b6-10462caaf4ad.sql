-- Eliminar todas las políticas existentes y crear una política simple que funcione
DROP POLICY IF EXISTS "Administradores pueden gestionar ubicaciones_trabajo" ON public.ubicaciones_trabajo;
DROP POLICY IF EXISTS "Empleados pueden ver ubicaciones_trabajo activas" ON public.ubicaciones_trabajo;  
DROP POLICY IF EXISTS "Permitir operaciones temporales en ubicaciones_trabajo" ON public.ubicaciones_trabajo;

-- Crear una política muy permisiva que permita todo a cualquier usuario
CREATE POLICY "Permitir todas las operaciones en ubicaciones_trabajo"
ON public.ubicaciones_trabajo
FOR ALL
USING (true)
WITH CHECK (true);

-- Verificar que RLS esté habilitado pero con la política permisiva
-- Si hay problemas, podemos temporalmente deshabilitar RLS
-- ALTER TABLE public.ubicaciones_trabajo DISABLE ROW LEVEL SECURITY;