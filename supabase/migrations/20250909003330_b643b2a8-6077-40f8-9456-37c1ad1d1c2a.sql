-- Habilitar RLS en user_profiles que faltaba
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Arreglar las funciones que no tienen search_path configurado
-- Esto está relacionado con las funciones que aparecen en el linter

-- Función authenticate_empleado
DROP FUNCTION IF EXISTS public.authenticate_empleado(text, text);
CREATE OR REPLACE FUNCTION public.authenticate_empleado(p_cedula text, p_password text)
 RETURNS TABLE(empleado_id uuid, nombres character varying, apellidos character varying, funcion character varying, ubicacion_designada character varying, requires_password_change boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Función change_empleado_password
DROP FUNCTION IF EXISTS public.change_empleado_password(uuid, text);
CREATE OR REPLACE FUNCTION public.change_empleado_password(p_empleado_id uuid, p_new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Función authenticate_empleado_turno
DROP FUNCTION IF EXISTS public.authenticate_empleado_turno(text, text);
CREATE OR REPLACE FUNCTION public.authenticate_empleado_turno(p_username text, p_password text)
 RETURNS TABLE(empleado_id uuid, nombres character varying, apellidos character varying, funcion character varying, lugar_designado character varying, requires_password_change boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Función change_empleado_turno_password
DROP FUNCTION IF EXISTS public.change_empleado_turno_password(uuid, text);
CREATE OR REPLACE FUNCTION public.change_empleado_turno_password(p_empleado_id uuid, p_new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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