-- Add authentication fields to empleados_turnos table
ALTER TABLE public.empleados_turnos 
ADD COLUMN IF NOT EXISTS username CHARACTER VARYING UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash CHARACTER VARYING,
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create function to authenticate employee
CREATE OR REPLACE FUNCTION public.authenticate_empleado_turno(
  p_username TEXT,
  p_password TEXT
) RETURNS TABLE(
  empleado_id UUID,
  nombres CHARACTER VARYING,
  apellidos CHARACTER VARYING,
  funcion CHARACTER VARYING,
  lugar_designado CHARACTER VARYING,
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
    e.lugar_designado,
    e.requires_password_change
  FROM public.empleados_turnos e
  WHERE e.username = p_username 
    AND e.password_hash = crypt(p_password, e.password_hash)
    AND e.active = true;
END;
$$;

-- Create function to change employee password
CREATE OR REPLACE FUNCTION public.change_empleado_turno_password(
  p_empleado_id UUID,
  p_new_password TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create function to set employee password (for admin use)
CREATE OR REPLACE FUNCTION public.set_empleado_turno_password(
  p_empleado_id UUID,
  p_username TEXT,
  p_password TEXT DEFAULT 'SRC_Agente2025'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;