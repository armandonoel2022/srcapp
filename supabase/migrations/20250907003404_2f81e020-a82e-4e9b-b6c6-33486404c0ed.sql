-- Actualizar tabla empleados con nuevos campos
ALTER TABLE public.empleados 
ADD COLUMN foto TEXT,
ADD COLUMN apellidos VARCHAR(255),
ADD COLUMN cedula VARCHAR(50),
ADD COLUMN ubicacion_designada VARCHAR(255),
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN requires_password_change BOOLEAN DEFAULT true,
ADD COLUMN active BOOLEAN DEFAULT true,
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Actualizar columna nombre para que solo sea nombres
ALTER TABLE public.empleados 
RENAME COLUMN nombre TO nombres;

-- Hacer apellidos NOT NULL después de agregar la columna
ALTER TABLE public.empleados 
ALTER COLUMN apellidos SET NOT NULL;

-- Crear índices para búsquedas eficientes
CREATE INDEX idx_empleados_cedula ON public.empleados(cedula);
CREATE INDEX idx_empleados_active ON public.empleados(active);
CREATE INDEX idx_empleados_ubicacion ON public.empleados(ubicacion_designada);

-- Crear tabla para tracking de cumplimiento de turnos
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

-- Habilitar RLS en nueva tabla
ALTER TABLE public.cumplimiento_turnos ENABLE ROW LEVEL SECURITY;

-- Política para cumplimiento_turnos
CREATE POLICY "Anyone can manage cumplimiento_turnos" 
ON public.cumplimiento_turnos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_cumplimiento_turnos_updated_at
BEFORE UPDATE ON public.cumplimiento_turnos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear función para autenticación de empleados
CREATE OR REPLACE FUNCTION public.authenticate_empleado(
  p_cedula TEXT,
  p_password TEXT
) RETURNS TABLE(
  empleado_id UUID,
  nombres VARCHAR,
  apellidos VARCHAR,
  funcion VARCHAR,
  ubicacion_designada VARCHAR,
  requires_password_change BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nombres,
    e.apellidos,
    e.funcion,
    e.ubicacion_designada,
    e.requires_password_change
  FROM public.empleados e
  WHERE e.cedula = p_cedula 
    AND e.password_hash = crypt(p_password, e.password_hash)
    AND e.active = true;
END;
$$;

-- Crear función para cambiar contraseña de empleado
CREATE OR REPLACE FUNCTION public.change_empleado_password(
  p_empleado_id UUID,
  p_new_password TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE public.empleados 
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    requires_password_change = false,
    last_login = now(),
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$$;