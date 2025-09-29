-- Eliminar el registro de salida del último turno registrado
UPDATE public.turnos_empleados 
SET 
  hora_salida = NULL,
  ubicacion_salida = NULL,
  foto_salida = NULL,
  tipo_registro = 'entrada'
WHERE id = (
  SELECT id 
  FROM public.turnos_empleados 
  ORDER BY fecha DESC, created_at DESC 
  LIMIT 1
)
AND hora_salida IS NOT NULL;