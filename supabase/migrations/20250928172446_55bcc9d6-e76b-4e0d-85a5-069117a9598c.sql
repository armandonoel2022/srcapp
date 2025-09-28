-- Remove exit record from the most recent entry to test overlay functionality
UPDATE turnos_empleados 
SET 
  hora_salida = NULL,
  ubicacion_salida = NULL,
  foto_salida = NULL
WHERE id = 'd6091a90-fd60-4481-bded-96e060772c7b';