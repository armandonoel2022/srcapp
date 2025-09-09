-- Add additional fields to empleados table for the imported data
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS telefono character varying;
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS fecha_ingreso date;

-- Update the create_empleado_with_password function to handle new fields
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
SET search_path TO 'public'
AS $function$
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
    requires_password_change,
    fecha_nacimiento,
    telefono,
    direccion,
    fecha_ingreso
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
    true,
    p_fecha_nacimiento,
    p_telefono,
    p_direccion,
    p_fecha_ingreso
  ) RETURNING id INTO new_empleado_id;
  
  RETURN new_empleado_id;
END;
$function$;