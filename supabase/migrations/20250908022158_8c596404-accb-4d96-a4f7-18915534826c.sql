-- Create empleados_turnos table for shift management
CREATE TABLE public.empleados_turnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombres VARCHAR NOT NULL,
  apellidos VARCHAR NOT NULL,
  funcion VARCHAR NOT NULL,
  cedula VARCHAR,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.empleados_turnos ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (since this is an internal system)
CREATE POLICY "Anyone can manage empleados_turnos" 
ON public.empleados_turnos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_empleados_turnos_updated_at
BEFORE UPDATE ON public.empleados_turnos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();