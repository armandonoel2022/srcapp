-- Create the main tables for the access control system

-- Administradores table (administrators)
CREATE TABLE public.administradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Usuarios table (users)
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Empleados table (employees)
CREATE TABLE public.empleados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  funcion VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Agente_seguridad table (security agents)
CREATE TABLE public.agente_seguridad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seguridad VARCHAR(255) NOT NULL,
  agente VARCHAR(255),
  servicio TIME NOT NULL,
  fin_servicio TIME NOT NULL,
  fecha DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Registros table (access records)
CREATE TABLE public.registros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  seguridad VARCHAR(255) NOT NULL,
  agente VARCHAR(255) NOT NULL,
  servicio VARCHAR(255) NOT NULL,
  fin_servicio VARCHAR(255) NOT NULL,
  nombre VARCHAR(255),
  apellido VARCHAR(255),
  funcion VARCHAR(255),
  cedula VARCHAR(20),
  matricula VARCHAR(20),
  hora TIME NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  tipo_persona VARCHAR(20) NOT NULL CHECK (tipo_persona IN ('empleado', 'visitante')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_seguridad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;

-- Create policies for administradores
CREATE POLICY "Administradores can view all data" 
ON public.administradores 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage administradores" 
ON public.administradores 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create policies for usuarios
CREATE POLICY "Users can view all usuarios" 
ON public.usuarios 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage usuarios" 
ON public.usuarios 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create policies for empleados
CREATE POLICY "Users can view all empleados" 
ON public.empleados 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage empleados" 
ON public.empleados 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create policies for agente_seguridad
CREATE POLICY "Users can view all agente_seguridad" 
ON public.agente_seguridad 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage agente_seguridad" 
ON public.agente_seguridad 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create policies for registros
CREATE POLICY "Users can view all registros" 
ON public.registros 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can manage registros" 
ON public.registros 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_administradores_updated_at
  BEFORE UPDATE ON public.administradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empleados_updated_at
  BEFORE UPDATE ON public.empleados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agente_seguridad_updated_at
  BEFORE UPDATE ON public.agente_seguridad
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registros_updated_at
  BEFORE UPDATE ON public.registros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();