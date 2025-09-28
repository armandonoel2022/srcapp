-- Corregir registros inconsistentes: convertir salidas sin entrada en entradas sin salida
UPDATE public.turnos_empleados 
SET 
  hora_entrada = hora_salida,
  ubicacion_entrada = ubicacion_salida,
  foto_entrada = foto_salida,
  hora_salida = NULL,
  ubicacion_salida = NULL,
  foto_salida = NULL,
  tipo_registro = 'entrada'
WHERE hora_entrada IS NULL 
  AND hora_salida IS NOT NULL;