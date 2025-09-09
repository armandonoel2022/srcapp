-- Crear bucket para fotos de turnos
INSERT INTO storage.buckets (id, name, public) VALUES ('turnos-fotos', 'turnos-fotos', false);

-- Crear políticas para el bucket de fotos de turnos
CREATE POLICY "Empleados pueden subir sus propias fotos de turno"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'turnos-fotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Empleados pueden ver sus propias fotos de turno"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'turnos-fotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins pueden ver todas las fotos de turno"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'turnos-fotos'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'administrador'
  )
);