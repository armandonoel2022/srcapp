-- Update the user_role enum to include 'cliente'
ALTER TYPE user_role ADD VALUE 'cliente';

-- Add a new column to user_profiles to allow disabling users
ALTER TABLE public.user_profiles 
ADD COLUMN active boolean NOT NULL DEFAULT true;

-- Update RLS policies to handle cliente role
-- Clientes can only view their own profile
CREATE POLICY "Clientes can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id AND role = 'cliente');

-- Update the get_current_user_role function to handle inactive users
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT role FROM public.user_profiles 
    WHERE user_id = auth.uid() AND active = true;
$function$;