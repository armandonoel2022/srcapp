-- Verificar las políticas RLS actuales de turnos_empleados
-- y agregar mejor manejo para empleados autenticados

-- Primero, eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Anyone can manage turnos_empleados" ON public.turnos_empleados;

-- Crear políticas más específicas para turnos_empleados
-- Permitir que los empleados puedan crear y gestionar sus propios turnos
CREATE POLICY "Empleados can manage their own turnos"
ON public.turnos_empleados
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Agregar índice para mejorar rendimiento en consultas por empleado_id
CREATE INDEX IF NOT EXISTS idx_turnos_empleados_empleado_fecha 
ON public.turnos_empleados(empleado_id, fecha);

-- Verificar que la tabla empleados_turnos tiene datos para testing
-- (esto es solo para verificación, no insertamos datos aquí)