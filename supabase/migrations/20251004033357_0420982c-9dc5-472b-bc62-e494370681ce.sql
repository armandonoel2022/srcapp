-- Add consent fields to empleados_turnos table
ALTER TABLE public.empleados_turnos 
ADD COLUMN consent_accepted boolean DEFAULT false,
ADD COLUMN consent_date timestamp with time zone,
ADD COLUMN consent_version varchar(10) DEFAULT '1.0';

-- Add comment to document the purpose
COMMENT ON COLUMN public.empleados_turnos.consent_accepted IS 'Indica si el empleado aceptó los términos y condiciones';
COMMENT ON COLUMN public.empleados_turnos.consent_date IS 'Fecha y hora de aceptación de los términos';
COMMENT ON COLUMN public.empleados_turnos.consent_version IS 'Versión de los términos aceptados';