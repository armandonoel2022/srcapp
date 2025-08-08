-- Create the migration in a transaction to handle enum properly
BEGIN;

-- Add the new enum value
ALTER TYPE user_role ADD VALUE 'cliente';

-- Commit the enum change first
COMMIT;

-- Now add the active column and policies
ALTER TABLE public.user_profiles 
ADD COLUMN active boolean NOT NULL DEFAULT true;

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

-- Create policy for cliente role
CREATE POLICY "Clientes can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id AND role = 'cliente');