-- Primero agregar apellidos como nullable
ALTER TABLE public.empleados 
ADD COLUMN apellidos VARCHAR(255);

-- Actualizar empleados existentes con apellidos por defecto
UPDATE public.empleados 
SET apellidos = 'Sin especificar' 
WHERE apellidos IS NULL;

-- Ahora hacer apellidos NOT NULL
ALTER TABLE public.empleados 
ALTER COLUMN apellidos SET NOT NULL;

-- Agregar otros campos
ALTER TABLE public.empleados 
ADD COLUMN foto TEXT,
ADD COLUMN cedula VARCHAR(50),
ADD COLUMN ubicacion_designada VARCHAR(255),
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN requires_password_change BOOLEAN DEFAULT true,
ADD COLUMN active BOOLEAN DEFAULT true,
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Renombrar nombre a nombres
ALTER TABLE public.empleados 
RENAME COLUMN nombre TO nombres;

-- Crear índices
CREATE INDEX idx_empleados_cedula ON public.empleados(cedula);
CREATE INDEX idx_empleados_active ON public.empleados(active);
CREATE INDEX idx_empleados_ubicacion ON public.empleados(ubicacion_designada);

-- Crear tabla de cumplimiento
CREATE TABLE public.cumplimiento_turnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  ubicacion VARCHAR(255) NOT NULL,
  turno_programado_entrada TIME,
  turno_programado_salida TIME,
  entrada_real TIME,
  salida_real TIME,
  minutos_retraso_entrada INTEGER DEFAULT 0,
  minutos_retraso_salida INTEGER DEFAULT 0,
  cumplimiento_porcentaje DECIMAL(5,2) DEFAULT 100.00,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cumplimiento_turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage cumplimiento_turnos" 
ON public.cumplimiento_turnos 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_cumplimiento_turnos_updated_at
BEFORE UPDATE ON public.cumplimiento_turnos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();