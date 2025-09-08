-- Limpiar empleados que tienen "Sin especificar" como apellidos
UPDATE public.empleados 
SET apellidos = NULL 
WHERE apellidos = 'Sin especificar';