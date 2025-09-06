-- Crear función para ejecutar consultas SQL dinámicas
CREATE OR REPLACE FUNCTION exec_sql(query text, params text[] DEFAULT '{}')
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Por seguridad, solo permitimos SELECT, INSERT y UPDATE en turnos_empleados
  IF query ILIKE '%turnos_empleados%' AND 
     (query ILIKE 'SELECT%' OR query ILIKE 'INSERT%' OR query ILIKE 'UPDATE%') THEN
    RETURN QUERY EXECUTE query USING VARIADIC params;
  ELSE
    RAISE EXCEPTION 'Consulta no permitida';
  END IF;
END;
$$;