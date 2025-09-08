-- Arreglar la última función con search_path

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
  -- Por seguridad, solo permitimos SELECT, INSERT y UPDATE en turnos_empleados  
  IF query ILIKE '%turnos_empleados%' AND   
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
    RAISE EXCEPTION 'Consulta no permitida';  
  END IF;  
END;  
$$;