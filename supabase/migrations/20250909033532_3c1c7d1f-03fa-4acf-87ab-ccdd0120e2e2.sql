-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update authenticate_empleado_turno function to handle missing password_hash
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