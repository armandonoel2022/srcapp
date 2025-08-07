-- Primero, insertar el empleado por defecto Anabel
INSERT INTO empleados (nombre, funcion) 
VALUES ('Anabel', 'Intendente')
ON CONFLICT DO NOTHING;

-- Actualizar las políticas RLS para permitir inserción sin autenticación requerida para las tablas operativas
DROP POLICY IF EXISTS "Only authenticated users can manage agente_seguridad" ON agente_seguridad;
DROP POLICY IF EXISTS "Only authenticated users can manage registros" ON registros;
DROP POLICY IF EXISTS "Only authenticated users can manage empleados" ON empleados;

CREATE POLICY "Anyone can manage agente_seguridad" 
ON agente_seguridad 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can manage registros" 
ON registros 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can manage empleados" 
ON empleados 
FOR ALL 
USING (true)
WITH CHECK (true);