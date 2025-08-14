-- Fix critical security issues by restricting access to sensitive tables

-- Restrict administradores table access
DROP POLICY IF EXISTS "Allow public read access" ON public.administradores;
CREATE POLICY "Allow authenticated admin access" 
ON public.administradores 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.administradores 
  WHERE username = auth.jwt()->>'email' OR username = (auth.jwt()->>'user_metadata'->>'username')
));

-- Restrict usuarios table access  
DROP POLICY IF EXISTS "Allow public read access" ON public.usuarios;
CREATE POLICY "Allow authenticated user access" 
ON public.usuarios 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Restrict empleados table access
DROP POLICY IF EXISTS "Allow public read access" ON public.empleados;
CREATE POLICY "Allow authenticated access to empleados" 
ON public.empleados 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Restrict agente_seguridad table access
DROP POLICY IF EXISTS "Allow public read access" ON public.agente_seguridad;
CREATE POLICY "Allow authenticated access to agente_seguridad" 
ON public.agente_seguridad 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to agente_seguridad" 
ON public.agente_seguridad 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Restrict registros table access
DROP POLICY IF EXISTS "Allow public read access" ON public.registros;
CREATE POLICY "Allow authenticated access to registros" 
ON public.registros 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated insert to registros" 
ON public.registros 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);