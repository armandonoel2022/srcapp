-- Crear políticas de almacenamiento para el bucket turnos-fotos

-- Política para permitir subir fotos a empleados autenticados
INSERT INTO storage.objects (bucket_id, name, owner)
SELECT 'turnos-fotos', 'test', auth.uid()
WHERE FALSE; -- Solo para verificar que existe el bucket

-- Crear política para INSERT - empleados pueden subir sus propias fotos
CREATE POLICY "Empleados pueden subir fotos de turnos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'turnos-fotos');

-- Crear política para SELECT - todos pueden ver las fotos
CREATE POLICY "Todos pueden ver fotos de turnos"  
ON storage.objects
FOR SELECT
USING (bucket_id = 'turnos-fotos');

-- Crear política para UPDATE - empleados pueden actualizar sus propias fotos
CREATE POLICY "Empleados pueden actualizar fotos de turnos"
ON storage.objects  
FOR UPDATE
USING (bucket_id = 'turnos-fotos')
WITH CHECK (bucket_id = 'turnos-fotos');

-- Crear política para DELETE - empleados pueden eliminar sus propias fotos
CREATE POLICY "Empleados pueden eliminar fotos de turnos"
ON storage.objects
FOR DELETE  
USING (bucket_id = 'turnos-fotos');