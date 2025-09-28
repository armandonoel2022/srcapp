-- Ensure the latest record has no exit info (robust cleanup)
-- 1) Nullify by known recent IDs (if they exist)
UPDATE turnos_empleados 
SET hora_salida = NULL, ubicacion_salida = NULL, foto_salida = NULL
WHERE id IN (
  'd6091a90-fd60-4481-bded-96e060772c7b',
  '7543ce8a-a330-44fa-8861-f4d2eea31108'
);

-- 2) Also nullify the true latest record by created_at just in case
UPDATE turnos_empleados t
SET hora_salida = NULL, ubicacion_salida = NULL, foto_salida = NULL
FROM (
  SELECT id FROM turnos_empleados ORDER BY created_at DESC LIMIT 1
) AS latest
WHERE t.id = latest.id;