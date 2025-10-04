-- Función para resetear contraseña de empleado usando username y cédula
CREATE OR REPLACE FUNCTION public.reset_empleado_turno_password(
  p_username TEXT,
  p_cedula TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  empleado_exists BOOLEAN;
BEGIN
  -- Verificar que existe un empleado con ese username y cédula
  SELECT EXISTS(
    SELECT 1 FROM public.empleados_turnos 
    WHERE username = p_username 
    AND cedula = p_cedula
    AND active = true
  ) INTO empleado_exists;
  
  IF NOT empleado_exists THEN
    RETURN false;
  END IF;
  
  -- Resetear la contraseña a la temporal por defecto
  UPDATE public.empleados_turnos 
  SET 
    password_hash = extensions.crypt('SRC_Agente2025', extensions.gen_salt('bf')),
    requires_password_change = true,
    updated_at = now()
  WHERE username = p_username 
  AND cedula = p_cedula
  AND active = true;
  
  RETURN true;
END;
$function$;