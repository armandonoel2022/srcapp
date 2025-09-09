-- Arreglar las funciones restantes que no tienen search_path

-- Función create_empleado_with_password
DROP FUNCTION IF EXISTS public.create_empleado_with_password(character varying, character varying, character varying, character varying, character varying, character varying);
CREATE OR REPLACE FUNCTION public.create_empleado_with_password(p_nombres character varying, p_apellidos character varying, p_funcion character varying, p_cedula character varying DEFAULT NULL::character varying, p_ubicacion character varying DEFAULT NULL::character varying, p_password character varying DEFAULT NULL::character varying)
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
$function$;

-- Función setup_user_profile
DROP FUNCTION IF EXISTS public.setup_user_profile(text, text, user_role);
CREATE OR REPLACE FUNCTION public.setup_user_profile(p_email text, p_username text, p_role user_role DEFAULT 'agente_seguridad'::user_role)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from auth.users based on email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = p_email;
  
  IF user_uuid IS NULL THEN
    RETURN 'User not found with email: ' || p_email;
  END IF;
  
  -- Insert or update user profile
  INSERT INTO public.user_profiles (user_id, username, role, requires_password_change)
  VALUES (user_uuid, p_username, p_role, false)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    requires_password_change = false,
    updated_at = now();
    
  RETURN 'Profile created/updated for: ' || p_username || ' with role: ' || p_role;
END;
$function$;

-- Función setup_initial_users
DROP FUNCTION IF EXISTS public.setup_initial_users();
CREATE OR REPLACE FUNCTION public.setup_initial_users()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set up profiles for users once they exist in auth.users
  -- You'll need to create these users first in Supabase Auth dashboard
  
  -- Try to set up admin user (Admin_SRC / Src_Admin@2025)
  PERFORM public.setup_user_profile('admin@src.com', 'Admin_SRC', 'administrador');
  
  -- Try to set up agent user for current user
  PERFORM public.setup_user_profile('agente@src.com', 'Src_Control', 'agente_seguridad');
  
  RETURN 'Initial user setup completed. Please verify the profiles were created correctly.';
END;
$function$;

-- Función set_empleado_turno_password
DROP FUNCTION IF EXISTS public.set_empleado_turno_password(uuid, text, text);
CREATE OR REPLACE FUNCTION public.set_empleado_turno_password(p_empleado_id uuid, p_username text, p_password text DEFAULT 'SRC_Agente2025'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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