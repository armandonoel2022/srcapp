-- Arreglar la foreign key constraint entre turnos_empleados y empleados_turnos

-- Primero, eliminar cualquier foreign key existente que pueda estar mal configurada
ALTER TABLE public.turnos_empleados 
DROP CONSTRAINT IF EXISTS turnos_empleados_empleado_id_fkey;

-- Agregar la foreign key correcta que referencia a empleados_turnos
ALTER TABLE public.turnos_empleados 
ADD CONSTRAINT turnos_empleados_empleado_id_fkey 
FOREIGN KEY (empleado_id) REFERENCES public.empleados_turnos(id) ON DELETE CASCADE;

-- Verificar que todos los empleado_id existentes en turnos_empleados son válidos
-- Si hay registros con empleado_id inválidos, esto fallará y nos dirá cuáles son
-- Primero veamos si hay registros problemáticos
SELECT te.empleado_id, te.fecha 
FROM public.turnos_empleados te 
LEFT JOIN public.empleados_turnos et ON te.empleado_id = et.id 
WHERE et.id IS NULL
LIMIT 5;