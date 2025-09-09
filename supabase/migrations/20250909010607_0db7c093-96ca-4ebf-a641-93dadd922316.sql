-- Crear tabla de ubicaciones de trabajo
CREATE TABLE public.ubicaciones_trabajo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  direccion TEXT,
  coordenadas POINT NOT NULL,
  radio_tolerancia INTEGER NOT NULL DEFAULT 100,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ubicaciones_trabajo ENABLE ROW LEVEL SECURITY;

-- Políticas para administradores
CREATE POLICY "Admins can manage ubicaciones_trabajo" 
ON public.ubicaciones_trabajo 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() AND role = 'administrador'::user_role
  )
);

-- Política para empleados (solo lectura)
CREATE POLICY "Empleados can view ubicaciones_trabajo" 
ON public.ubicaciones_trabajo 
FOR SELECT 
USING (activa = true);

-- Trigger para updated_at
CREATE TRIGGER update_ubicaciones_trabajo_updated_at
BEFORE UPDATE ON public.ubicaciones_trabajo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar ubicaciones iniciales
INSERT INTO public.ubicaciones_trabajo (nombre, direccion, coordenadas, radio_tolerancia) VALUES
('Oficina Principal', 'F4RX+MG9, C. Club de Leones, Santo Domingo 11504', POINT(18.49170, -69.90167), 100),
('Sucursal Norte', 'Zona Norte, Santo Domingo', POINT(18.50000, -69.90000), 100),
('Sucursal Este', 'Zona Este, Santo Domingo', POINT(18.48000, -69.88000), 100);