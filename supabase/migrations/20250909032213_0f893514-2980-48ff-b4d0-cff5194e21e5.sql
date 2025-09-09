-- Create the authenticate_empleado_turno function
CREATE OR REPLACE FUNCTION authenticate_empleado_turno(p_username TEXT, p_password TEXT)
RETURNS TABLE(
  empleado_id UUID,
  nombres TEXT,
  apellidos TEXT,
  funcion TEXT,
  lugar_designado TEXT,
  requires_password_change BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
      OR et.password_hash = crypt(p_password, et.password_hash)
    );
END;
$$;

-- Create the change_empleado_turno_password function  
CREATE OR REPLACE FUNCTION change_empleado_turno_password(p_empleado_id UUID, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE empleados_turnos 
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    requires_password_change = false,
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$$;

-- Create the set_empleado_turno_password function
CREATE OR REPLACE FUNCTION set_empleado_turno_password(p_empleado_id UUID, p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE empleados_turnos 
  SET 
    username = p_username,
    password_hash = crypt(p_password, gen_salt('bf')),
    requires_password_change = true,
    updated_at = now()
  WHERE id = p_empleado_id;
  
  RETURN FOUND;
END;
$$;