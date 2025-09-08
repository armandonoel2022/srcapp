-- Fix the authentication functions to use proper search path
DROP FUNCTION IF EXISTS public.authenticate_empleado_turno(text, text);
DROP FUNCTION IF EXISTS public.change_empleado_turno_password(uuid, text);
DROP FUNCTION IF EXISTS public.set_empleado_turno_password(uuid, text, text);

-- Recreate authenticate_empleado_turno function with proper search path
CREATE OR REPLACE FUNCTION public.authenticate_empleado_turno(p_username text, p_password text)
RETURNS TABLE(empleado_id uuid, nombres character varying, apellidos character varying, funcion character varying, lugar_designado character varying, requires_password_change boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nombres,
    e.apellidos,
    e.funcion,
    e.lugar_designado,
    e.requires_password_change
  FROM public.empleados_turnos e
  WHERE e.username = p_username 
    AND e.password_hash = crypt(p_password, e.password_hash)
    AND e.active = true;
END;
$function$;

-- Recreate change_empleado_turno_password function with proper search path
CREATE OR REPLACE FUNCTION public.change_empleado_turno_password(p_empleado_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  UPDATE public.empleados_turnos 
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    requires_password_change = false,
    last_login = now(),
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$function$;

-- Recreate set_empleado_turno_password function with proper search path
CREATE OR REPLACE FUNCTION public.set_empleado_turno_password(p_empleado_id uuid, p_username text, p_password text DEFAULT 'SRC_Agente2025')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  UPDATE public.empleados_turnos 
  SET 
    username = p_username,
    password_hash = crypt(p_password, gen_salt('bf')),
    requires_password_change = true,
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$function$;