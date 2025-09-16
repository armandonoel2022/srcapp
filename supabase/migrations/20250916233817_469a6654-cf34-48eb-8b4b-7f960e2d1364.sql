-- Limpiar ubicaciones existentes
DELETE FROM ubicaciones_trabajo;

-- Insertar nuevas ubicaciones de trabajo
INSERT INTO ubicaciones_trabajo (nombre, direccion, coordenadas, radio_tolerancia, activa) VALUES
('OFICINA SRC SEGURIDAD', 'C/ LUIS F THOMEN 255, EVARISTO MORALES, D.N.', POINT(18.4700, -69.9400), 100, true),
('CHARLIE 1', 'C/CESAR NICOLAS PENSON 85-A, GAZCUE DN', POINT(18.4645, -69.9312), 100, true),
('CHARLIE 2', 'C/CESAR NICOLAS PENSON 85-A, GAZCUE DN', POINT(18.4645, -69.9312), 100, true),
('CHARLIE 3', 'C/ LAS NINFAS 51, BELLA VISTA , DN', POINT(18.4693, -69.9250), 100, true),
('BRAVO 1', 'C/ CESAR NICOLAS PENSON 72, GAZCUE DN', POINT(18.4643, -69.9310), 100, true),
('BRAVO 2', 'C/ CESAR NICOLAS PENSON 72, GAZCUE DN', POINT(18.4643, -69.9310), 100, true),
('BRAVO 3', 'C/ CESAR NICOLAS PENSON 72, GAZCUE DN', POINT(18.4643, -69.9310), 100, true),
('BRAVO 4', 'C/ CESAR NICOLAS PENSON 72, GAZCUE DN', POINT(18.4643, -69.9310), 100, true),
('LIMA 1', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('LIMA 2', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('LIMA 3', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('LIMA 4', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('LIMA 5', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('LIMA 6', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('LIMA 7', 'C/ CASANDRA DAMIRON ESQ. JIMENEZ MOYA, DN', POINT(18.4730, -69.9180), 100, true),
('FOXTROT-1', 'C/FILOMENA GOMEZ DE COVA, EDIF. CORPORATIVO 2015, PIANTINI', POINT(18.4820, -69.9450), 100, true),
('FOXTROT-2', 'C/ HECTOR GARCIA GODOY 32, ARROYO HONDO , DN', POINT(18.4950, -69.9350), 100, true),
('FOXTROT-3', 'C/FILOMENA GOMEZ DE COVA, EDIF. CORPORATIVO 2015, PIANTINI', POINT(18.4820, -69.9450), 100, true),
('FOXTROT-4', 'C/FILOMENA GOMEZ DE COVA, EDIF. CORPORATIVO 2015, PIANTINI', POINT(18.4820, -69.9450), 100, true),
('FOXTROT-5', 'C/ HORACIO VICIOSO 103, CENTRO DE LOS HEROES, DN', POINT(18.4775, -69.9250), 100, true),
('VICTOR 1', 'C/ ERICK LEONARD EKMAN 32 , ARROYO HONDO DN', POINT(18.4950, -69.9350), 100, true),
('VICTOR 2', 'C/ ERICK LEONARD EKMAN 32 , ARROYO HONDO DN', POINT(18.4950, -69.9350), 100, true),
('VICTOR 3', 'AV. MAXIMO GOMEZ 2 ESQ AV. INDEPENDENCIA', POINT(18.4620, -69.9290), 100, true),
('VICTOR 4', 'AV. MAXIMO GOMEZ 2 ESQ AV. INDEPENDENCIA', POINT(18.4620, -69.9290), 100, true),
('DELTA 1', 'AV NUÑEZ DE CACERES 11 EDIF EQUINOX, BELLA VISTA DN', POINT(18.4710, -69.9320), 100, true);

-- Crear tabla para asignaciones múltiples de empleados a ubicaciones
CREATE TABLE IF NOT EXISTS empleados_ubicaciones_asignadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empleado_id UUID NOT NULL,
    ubicacion_nombre VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    activa BOOLEAN DEFAULT true,
    UNIQUE(empleado_id, ubicacion_nombre)
);

-- Habilitar RLS para la nueva tabla
ALTER TABLE empleados_ubicaciones_asignadas ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones
CREATE POLICY "Permitir todas las operaciones en empleados_ubicaciones_asignadas" 
ON empleados_ubicaciones_asignadas 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Migrar asignaciones existentes a la nueva tabla
INSERT INTO empleados_ubicaciones_asignadas (empleado_id, ubicacion_nombre, activa)
SELECT id, lugar_designado, true 
FROM empleados_turnos 
WHERE lugar_designado IS NOT NULL AND lugar_designado != '';

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_empleados_ubicaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp automáticamente
CREATE TRIGGER update_empleados_ubicaciones_updated_at
    BEFORE UPDATE ON empleados_ubicaciones_asignadas
    FOR EACH ROW
    EXECUTE FUNCTION update_empleados_ubicaciones_updated_at();