-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('administrador', 'agente_seguridad');

-- Create user_profiles table to store additional user information
CREATE TABLE public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'agente_seguridad',
    requires_password_change BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.user_profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'administrador');

CREATE POLICY "Admins can update user profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'administrador');

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for visitor data persistence
CREATE TABLE public.visitor_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cedula VARCHAR NOT NULL UNIQUE,
    nombre VARCHAR NOT NULL,
    apellido VARCHAR NOT NULL,
    matricula VARCHAR,
    last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on visitor_cache
ALTER TABLE public.visitor_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies for visitor_cache
CREATE POLICY "Anyone can manage visitor_cache" 
ON public.visitor_cache 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for visitor_cache updated_at
CREATE TRIGGER update_visitor_cache_updated_at
BEFORE UPDATE ON public.visitor_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();