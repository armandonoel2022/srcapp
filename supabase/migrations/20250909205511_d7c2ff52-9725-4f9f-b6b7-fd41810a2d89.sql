-- Asignar ubicación a Rafael Santana Rodriguez para pruebas de producción
UPDATE empleados_turnos 
SET lugar_designado = 'Oficina Principal' 
WHERE nombres = 'Rafael' AND apellidos = 'Santana Rodriguez';