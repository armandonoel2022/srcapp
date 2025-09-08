-- Permitir que el campo apellidos sea nullable
ALTER TABLE public.empleados 
ALTER COLUMN apellidos DROP NOT NULL;

-- Limpiar empleados que tienen "Sin especificar" como apellidos
UPDATE public.empleados 
SET apellidos = NULL 
WHERE apellidos = 'Sin especificar';