-- Crear tabla para gestión de estados de empleados (vacaciones, licencias, permisos)
CREATE TABLE IF NOT EXISTS public.empleados_estados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados_turnos(id) ON DELETE CASCADE,
  tipo_estado VARCHAR NOT NULL CHECK (tipo_estado IN ('vacaciones', 'licencia_medica', 'permiso', 'disponible')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  motivo TEXT,
  documento_adjunto TEXT, -- URL o base64 de documento/foto
  estado_aprobacion VARCHAR NOT NULL DEFAULT 'pendiente' CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por UUID REFERENCES auth.users(id),
  comentarios_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para programación de turnos (horarios esperados)
CREATE TABLE IF NOT EXISTS public.turnos_programados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES public.empleados_turnos(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  hora_entrada_programada TIME NOT NULL,
  hora_salida_programada TIME NOT NULL,
  ubicacion_designada VARCHAR,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empleado_id, dia_semana)
);

-- Ampliar tabla turnos_empleados para mejor análisis
ALTER TABLE public.turnos_empleados 
ADD COLUMN IF NOT EXISTS minutos_tardanza INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS estado_justificacion VARCHAR DEFAULT 'sin_justificar' CHECK (estado_justificacion IN ('sin_justificar', 'justificado', 'injustificado'));

-- Agregar nueva columna para diferenciar tipos de registro
ALTER TABLE public.turnos_empleados 
ADD COLUMN IF NOT EXISTS registro_automatico BOOLEAN DEFAULT true;

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.empleados_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_programados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empleados_estados
CREATE POLICY "Anyone can manage empleados_estados" 
ON public.empleados_estados 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Políticas RLS para turnos_programados
CREATE POLICY "Anyone can manage turnos_programados" 
ON public.turnos_programados 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Función para calcular tardanza automáticamente
CREATE OR REPLACE FUNCTION public.calcular_tardanza_turno()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si es un registro de entrada
  IF NEW.hora_entrada IS NOT NULL AND OLD.hora_entrada IS NULL THEN
    -- Buscar el horario programado para este empleado y día
    DECLARE
      hora_programada TIME;
      dia_actual INTEGER;
    BEGIN
      -- Obtener el día de la semana (0=Domingo, 6=Sábado)
      dia_actual := EXTRACT(DOW FROM NEW.fecha::DATE);
      
      -- Buscar hora programada
      SELECT hora_entrada_programada INTO hora_programada
      FROM public.turnos_programados 
      WHERE empleado_id = NEW.empleado_id 
        AND dia_semana = dia_actual 
        AND activo = true;
      
      -- Si encontramos horario programado, calcular tardanza
      IF hora_programada IS NOT NULL THEN
        NEW.minutos_tardanza := GREATEST(0, 
          EXTRACT(EPOCH FROM (NEW.hora_entrada::TIME - hora_programada)) / 60
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular tardanza automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_tardanza ON public.turnos_empleados;
CREATE TRIGGER trigger_calcular_tardanza
BEFORE INSERT OR UPDATE ON public.turnos_empleados
FOR EACH ROW EXECUTE FUNCTION public.calcular_tardanza_turno();

-- Función para obtener estadísticas de puntualidad
CREATE OR REPLACE FUNCTION public.obtener_estadisticas_empleado(
  p_empleado_id UUID,
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE(
  total_dias INTEGER,
  dias_puntuales INTEGER,
  dias_tardanza INTEGER,
  promedio_tardanza NUMERIC,
  ausencias INTEGER,
  dias_justificados INTEGER
) AS $$
BEGIN
  -- Establecer fechas por defecto si no se proporcionan
  IF p_fecha_inicio IS NULL THEN
    p_fecha_inicio := CURRENT_DATE - INTERVAL '30 days';
  END IF;
  
  IF p_fecha_fin IS NULL THEN
    p_fecha_fin := CURRENT_DATE;
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_dias,
    COUNT(CASE WHEN t.minutos_tardanza = 0 THEN 1 END)::INTEGER as dias_puntuales,
    COUNT(CASE WHEN t.minutos_tardanza > 0 THEN 1 END)::INTEGER as dias_tardanza,
    COALESCE(AVG(CASE WHEN t.minutos_tardanza > 0 THEN t.minutos_tardanza END), 0)::NUMERIC as promedio_tardanza,
    COUNT(CASE WHEN t.hora_entrada IS NULL THEN 1 END)::INTEGER as ausencias,
    COUNT(CASE WHEN t.estado_justificacion = 'justificado' THEN 1 END)::INTEGER as dias_justificados
  FROM public.turnos_empleados t
  WHERE t.empleado_id = p_empleado_id
    AND t.fecha BETWEEN p_fecha_inicio AND p_fecha_fin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_empleados_estados_updated_at ON public.empleados_estados;
CREATE TRIGGER update_empleados_estados_updated_at
BEFORE UPDATE ON public.empleados_estados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_turnos_programados_updated_at ON public.turnos_programados;
CREATE TRIGGER update_turnos_programados_updated_at
BEFORE UPDATE ON public.turnos_programados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();