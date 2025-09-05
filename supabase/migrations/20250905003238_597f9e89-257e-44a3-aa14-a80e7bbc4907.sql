-- Habilitar RLS para la tabla turnos_empleados
ALTER TABLE public.turnos_empleados ENABLE ROW LEVEL SECURITY;

-- Crear política para que cualquier usuario autenticado pueda gestionar turnos
CREATE POLICY "Anyone can manage turnos_empleados" 
ON public.turnos_empleados 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);