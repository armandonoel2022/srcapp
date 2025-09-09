-- Deshabilitar temporalmente RLS para ubicaciones_trabajo hasta que la autenticación esté completa
ALTER TABLE public.ubicaciones_trabajo DISABLE ROW LEVEL SECURITY;

-- Nota: Esto es temporal para desarrollo. Cuando la autenticación esté implementada
-- se debe volver a habilitar RLS y configurar políticas apropiadas:
-- ALTER TABLE public.ubicaciones_trabajo ENABLE ROW LEVEL SECURITY;