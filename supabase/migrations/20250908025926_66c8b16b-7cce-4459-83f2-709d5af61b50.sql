-- Corregir la función exec_sql para permitir consultas a empleados_turnos
CREATE OR REPLACE FUNCTION public.exec_sql(query text, params text[] DEFAULT '{}'::text[])
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$  
DECLARE  
  param_count int;  
  executed_query text;  
BEGIN  
  -- Por seguridad, solo permitimos SELECT, INSERT y UPDATE en empleados_turnos  
  IF query ILIKE '%empleados_turnos%' AND   
     (query ILIKE 'SELECT%' OR query ILIKE 'INSERT%' OR query ILIKE 'UPDATE%') THEN  
      
    param_count := array_length(params, 1);  
      
    IF param_count IS NULL OR param_count = 0 THEN  
      -- Sin parámetros  
      RETURN QUERY EXECUTE query;  
    ELSE  
      -- Con parámetros - construir la consulta manualmente  
      executed_query := format(query, VARIADIC params);  
      RETURN QUERY EXECUTE executed_query;  
    END IF;  
  ELSE  
    RAISE EXCEPTION 'Consulta no permitida: %', query;  
  END IF;  
END;  
$$;