-- Fix security warning by setting search_path on function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
    SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$;