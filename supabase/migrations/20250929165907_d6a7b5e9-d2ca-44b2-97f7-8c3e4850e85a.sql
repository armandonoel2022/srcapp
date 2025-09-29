-- Ensure pgcrypto lives in the extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1) Authenticate empleado (uses crypt)
CREATE OR REPLACE FUNCTION public.authenticate_empleado(
  p_cedula text,
  p_password text
)
RETURNS TABLE(
  empleado_id uuid,
  nombres character varying,
  apellidos character varying,
  funcion character varying,
  ubicacion_designada character varying,
  requires_password_change boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
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
    AND e.password_hash = extensions.crypt(p_password, e.password_hash)
    AND e.active = true;
END;
$$;

-- 2) Change empleado password (uses gen_salt + crypt)
CREATE OR REPLACE FUNCTION public.change_empleado_password(
  p_empleado_id uuid,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  UPDATE public.empleados 
  SET 
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    requires_password_change = false,
    last_login = now(),
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$$;

-- 3) Change empleado_turno password
CREATE OR REPLACE FUNCTION public.change_empleado_turno_password(
  p_empleado_id uuid,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  UPDATE public.empleados_turnos 
  SET 
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    requires_password_change = false,
    last_login = now(),
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$$;

-- 4) Set empleado_turno password with username
CREATE OR REPLACE FUNCTION public.set_empleado_turno_password(
  p_empleado_id uuid,
  p_username text,
  p_password text DEFAULT 'SRC_Agente2025'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  UPDATE public.empleados_turnos 
  SET 
    username = p_username,
    password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
    requires_password_change = true,
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$$;

-- 5) Create empleado with password (short signature)
CREATE OR REPLACE FUNCTION public.create_empleado_with_password(
  p_nombres character varying,
  p_apellidos character varying,
  p_funcion character varying,
  p_cedula character varying DEFAULT NULL::character varying,
  p_ubicacion character varying DEFAULT NULL::character varying,
  p_password character varying DEFAULT NULL::character varying
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  new_empleado_id UUID;
  default_password VARCHAR := 'SRC123';
BEGIN
  INSERT INTO public.empleados (
    nombres, apellidos, funcion, cedula, ubicacion_designada,
    password_hash, requires_password_change
  ) VALUES (
    p_nombres,
    p_apellidos,
    p_funcion,
    p_cedula,
    p_ubicacion,
    CASE 
      WHEN p_password IS NOT NULL THEN extensions.crypt(p_password, extensions.gen_salt('bf'))
      ELSE extensions.crypt(default_password, extensions.gen_salt('bf'))
    END,
    true
  ) RETURNING id INTO new_empleado_id;
  
  RETURN new_empleado_id;
END;
$$;

-- 6) Create empleado with password (extended signature)
CREATE OR REPLACE FUNCTION public.create_empleado_with_password(
  p_nombres character varying,
  p_apellidos character varying,
  p_funcion character varying,
  p_cedula character varying DEFAULT NULL::character varying,
  p_ubicacion character varying DEFAULT NULL::character varying,
  p_password character varying DEFAULT NULL::character varying,
  p_fecha_nacimiento date DEFAULT NULL::date,
  p_telefono character varying DEFAULT NULL::character varying,
  p_direccion text DEFAULT NULL::text,
  p_fecha_ingreso date DEFAULT NULL::date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  new_empleado_id UUID;
  default_password VARCHAR := 'SRC123';
BEGIN
  INSERT INTO public.empleados (
    nombres, apellidos, funcion, cedula, ubicacion_designada,
    password_hash, requires_password_change,
    fecha_nacimiento, telefono, direccion, fecha_ingreso
  ) VALUES (
    p_nombres,
    p_apellidos,
    p_funcion,
    p_cedula,
    p_ubicacion,
    CASE 
      WHEN p_password IS NOT NULL THEN extensions.crypt(p_password, extensions.gen_salt('bf'))
      ELSE extensions.crypt(default_password, extensions.gen_salt('bf'))
    END,
    true,
    p_fecha_nacimiento,
    p_telefono,
    p_direccion,
    p_fecha_ingreso
  ) RETURNING id INTO new_empleado_id;
  
  RETURN new_empleado_id;
END;
$$;

-- 7) Authenticate empleado_turno (uses crypt)
CREATE OR REPLACE FUNCTION public.authenticate_empleado_turno(
  p_username text,
  p_password text
)
RETURNS TABLE(
  empleado_id uuid,
  nombres character varying,
  apellidos character varying,
  funcion character varying,
  lugar_designado character varying,
  requires_password_change boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id,
    et.nombres,
    et.apellidos,
    et.funcion,
    et.lugar_designado,
    et.requires_password_change
  FROM empleados_turnos et
  WHERE et.username = p_username 
    AND et.active = true
    AND (
      et.password_hash IS NULL 
      OR et.password_hash = '' 
      OR et.password_hash = extensions.crypt(p_password, et.password_hash)
    );
END;
$$;