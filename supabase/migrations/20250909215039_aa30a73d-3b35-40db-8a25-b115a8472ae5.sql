-- Identificar qué tabla no tiene RLS habilitado y corregirlo
-- Verificar y habilitar RLS en ubicaciones_trabajo (que fue modificada anteriormente)
ALTER TABLE public.ubicaciones_trabajo ENABLE ROW LEVEL SECURITY;