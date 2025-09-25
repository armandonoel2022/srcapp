-- Add tolerance field to empleados_turnos table
ALTER TABLE empleados_turnos 
ADD COLUMN tolerancia_ubicacion INTEGER DEFAULT 100;