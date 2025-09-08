-- Arreglar warnings de seguridad estableciendo search_path en las funciones

-- Arreglar la función handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Marcar email como verificado automáticamente
  UPDATE auth.users 
  SET email_confirmed_at = now() 
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$;

-- Arreglar la función authenticate_empleado
CREATE OR REPLACE FUNCTION public.authenticate_empleado(p_cedula text, p_password text)
RETURNS TABLE(empleado_id uuid, nombres character varying, apellidos character varying, funcion character varying, ubicacion_designada character varying, requires_password_change boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Arreglar la función change_empleado_password
CREATE OR REPLACE FUNCTION public.change_empleado_password(p_empleado_id uuid, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Arreglar la función create_empleado_with_password
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
SET search_path = ''
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