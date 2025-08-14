-- Fix critical security vulnerability: Remove public access to administradores table
-- The "Administradores can view all data" policy with "true" expression allows anyone to read admin credentials

-- Drop the dangerous policy that allows anyone to view administrator data
DROP POLICY IF EXISTS "Administradores can view all data" ON public.administradores;

-- The existing "Admin full access" policy already provides appropriate access for authenticated admins
-- This ensures only users with admin role can access the administradores table data
-- No additional policy needed as the "Admin full access" policy handles all operations for admins