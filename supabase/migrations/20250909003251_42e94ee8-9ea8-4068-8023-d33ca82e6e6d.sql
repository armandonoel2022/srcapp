-- ARREGLAR PROBLEMAS CRÍTICOS DE SEGURIDAD DE RLS

-- Habilitar RLS en todas las tablas que no lo tienen
ALTER TABLE public.turnos_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_seguridad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cumplimiento_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_programados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_cache ENABLE ROW LEVEL SECURITY;

-- Verificar que las políticas existentes funcionen correctamente
-- Las políticas ya existen, solo habilitamos RLS

-- Confirmar que la tabla administradores ya tiene RLS (ya debería tenerlo)
-- La tabla user_profiles ya tiene RLS habilitado
-- La tabla user_2fa ya tiene RLS habilitado
-- La tabla biometric_credentials ya tiene RLS habilitado