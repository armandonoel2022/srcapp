-- Add foreign key constraint to link turnos_empleados with empleados_turnos
ALTER TABLE turnos_empleados 
ADD CONSTRAINT fk_turnos_empleados_empleado_id 
FOREIGN KEY (empleado_id) REFERENCES empleados_turnos(id);

-- Update the hook to use the correct join
-- This will help with the "empleados_1.nombre does not exist" error