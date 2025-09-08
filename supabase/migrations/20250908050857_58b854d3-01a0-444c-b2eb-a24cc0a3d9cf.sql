-- Agregar el campo fecha_nacimiento a la tabla empleados si no existe
ALTER TABLE public.empleados 
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;