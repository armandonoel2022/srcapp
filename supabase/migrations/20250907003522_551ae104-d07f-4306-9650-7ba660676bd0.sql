-- Agregar funciones para autenticación de empleados
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

-- Función para cambiar contraseña de empleado
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

-- Función para crear empleado con contraseña
CREATE OR REPLACE FUNCTION public.create_empleado_with_password(
  p_nombres VARCHAR,
  p_apellidos VARCHAR,
  p_funcion VARCHAR,
  p_cedula VARCHAR DEFAULT NULL,
  p_ubicacion VARCHAR DEFAULT NULL,
  p_password VARCHAR DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_empleado_id UUID;
  default_password VARCHAR := 'SRC123';
BEGIN
  INSERT INTO public.empleados (
    nombres, 
    apellidos, 
    funcion, 
    cedula, 
    ubicacion_designada,
    password_hash,
    requires_password_change
  ) VALUES (
    p_nombres,
    p_apellidos,
    p_funcion,
    p_cedula,
    p_ubicacion,
    CASE 
      WHEN p_password IS NOT NULL THEN crypt(p_password, gen_salt('bf'))
      ELSE crypt(default_password, gen_salt('bf'))
    END,
    true
  ) RETURNING id INTO new_empleado_id;
  
  RETURN new_empleado_id;
END;
$$;