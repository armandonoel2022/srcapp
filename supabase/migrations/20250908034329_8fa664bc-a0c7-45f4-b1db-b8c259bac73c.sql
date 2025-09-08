-- Enhance empleados_turnos table with new required fields
ALTER TABLE public.empleados_turnos 
ADD COLUMN IF NOT EXISTS sexo CHARACTER VARYING,
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS lugar_designado CHARACTER VARYING,
ADD COLUMN IF NOT EXISTS hora_entrada_programada TIME,
ADD COLUMN IF NOT EXISTS hora_salida_programada TIME;

-- Enhance turnos_empleados with compliance status
ALTER TABLE public.turnos_empleados 
ADD COLUMN IF NOT EXISTS estado_cumplimiento CHARACTER VARYING DEFAULT 'a_tiempo',
ADD COLUMN IF NOT EXISTS alerta_temprana BOOLEAN DEFAULT false;

-- Create function to calculate compliance status
CREATE OR REPLACE FUNCTION public.calcular_estado_cumplimiento(
  hora_entrada TIME,
  hora_programada TIME
) RETURNS TABLE(
  estado CHARACTER VARYING,
  minutos_diferencia INTEGER,
  alerta_temprana BOOLEAN
) AS $$
DECLARE
  diferencia_minutos INTEGER;
BEGIN
  -- Calculate difference in minutes
  diferencia_minutos := EXTRACT(EPOCH FROM (hora_entrada - hora_programada)) / 60;
  
  -- Determine compliance status
  IF diferencia_minutos <= 0 THEN
    -- On time or early
    RETURN QUERY SELECT 'a_tiempo'::CHARACTER VARYING, diferencia_minutos, false;
  ELSIF diferencia_minutos <= 5 THEN
    -- Up to 5 minutes late - warning
    RETURN QUERY SELECT 'alerta_temprana'::CHARACTER VARYING, diferencia_minutos, true;
  ELSIF diferencia_minutos <= 15 THEN
    -- 5-15 minutes late - yellow
    RETURN QUERY SELECT 'amarillo'::CHARACTER VARYING, diferencia_minutos, false;
  ELSE
    -- More than 15 minutes late - red
    RETURN QUERY SELECT 'rojo'::CHARACTER VARYING, diferencia_minutos, false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to include compliance calculation
CREATE OR REPLACE FUNCTION public.calcular_tardanza_turno()
RETURNS TRIGGER AS $$
DECLARE
  hora_programada TIME;
  compliance_result RECORD;
BEGIN
  -- Only calculate if it's an entry record
  IF NEW.hora_entrada IS NOT NULL AND OLD.hora_entrada IS NULL THEN
    -- Get programmed schedule for this employee
    SELECT et.hora_entrada_programada INTO hora_programada
    FROM public.empleados_turnos et 
    WHERE et.id = NEW.empleado_id;
    
    -- If we found programmed time, calculate tardiness and compliance
    IF hora_programada IS NOT NULL THEN
      NEW.minutos_tardanza := GREATEST(0, 
        EXTRACT(EPOCH FROM (NEW.hora_entrada::TIME - hora_programada)) / 60
      );
      
      -- Calculate compliance status
      SELECT * INTO compliance_result 
      FROM public.calcular_estado_cumplimiento(NEW.hora_entrada::TIME, hora_programada);
      
      NEW.estado_cumplimiento := compliance_result.estado;
      NEW.alerta_temprana := compliance_result.alerta_temprana;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;