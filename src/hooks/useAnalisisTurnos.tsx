import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EstadisticasEmpleado {
  empleado_id: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  total_dias: number;
  dias_puntuales: number;
  dias_tardanza: number;
  promedio_tardanza: number;
  ausencias: number;
  dias_justificados: number;
  porcentaje_puntualidad: number;
}

export interface AnalisisTurno {
  id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  minutos_tardanza: number;
  estado_justificacion: string;
  estado_cumplimiento?: string;
  alerta_temprana?: boolean;
  observaciones?: string;
  empleados_turnos?: {
    nombres: string;
    apellidos: string;
    funcion: string;
    hora_entrada_programada?: string;
  };
  hora_programada?: string;
  estado_empleado?: {
    tipo_estado: string;
    motivo?: string;
  };
}

export const useAnalisisTurnos = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const obtenerEstadisticasEmpleado = async (empleadoId: string, fechaInicio?: string, fechaFin?: string): Promise<EstadisticasEmpleado | null> => {
    setLoading(true);
    try {
      // Obtener estadísticas básicas usando la función de base de datos
      const { data: stats, error: statsError } = await supabase
        .rpc('obtener_estadisticas_empleado', {
          p_empleado_id: empleadoId,
          p_fecha_inicio: fechaInicio || null,
          p_fecha_fin: fechaFin || null
        });

      if (statsError) throw statsError;

      // Obtener información del empleado
      const { data: empleado, error: empleadoError } = await supabase
        .from('empleados_turnos')
        .select('nombres, apellidos, funcion')
        .eq('id', empleadoId)
        .single();

      if (empleadoError) throw empleadoError;

      if (stats && stats.length > 0 && empleado) {
        const stat = stats[0];
        const porcentaje_puntualidad = stat.total_dias > 0 
          ? (stat.dias_puntuales / stat.total_dias) * 100 
          : 0;

        return {
          empleado_id: empleadoId,
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          funcion: empleado.funcion,
          total_dias: stat.total_dias,
          dias_puntuales: stat.dias_puntuales,
          dias_tardanza: stat.dias_tardanza,
          promedio_tardanza: parseFloat(stat.promedio_tardanza?.toString() || '0') || 0,
          ausencias: stat.ausencias,
          dias_justificados: stat.dias_justificados,
          porcentaje_puntualidad: Math.round(porcentaje_puntualidad)
        };
      }

      return null;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al obtener estadísticas: ${error.message}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const obtenerAnalisisTurnos = async (fechaInicio?: string, fechaFin?: string, empleadoId?: string): Promise<AnalisisTurno[]> => {
    setLoading(true);
    try {
      let query = supabase
        .from('turnos_empleados')
        .select(`
          *,
          empleados_turnos!turnos_empleados_empleado_id_fkey (
            nombres,
            apellidos,
            funcion,
            hora_entrada_programada
          )
        `)
        .order('fecha', { ascending: false });

      if (fechaInicio) {
        query = query.gte('fecha', fechaInicio);
      }

      if (fechaFin) {
        query = query.lte('fecha', fechaFin);
      }

      if (empleadoId) {
        query = query.eq('empleado_id', empleadoId);
      }

      const { data: turnos, error } = await query;

      if (error) throw error;

      // Retornar datos simplificados
      const turnosFormatted: AnalisisTurno[] = (turnos || []).map((turno: any) => ({
        id: turno.id,
        fecha: turno.fecha,
        hora_entrada: turno.hora_entrada,
        hora_salida: turno.hora_salida,
        minutos_tardanza: turno.minutos_tardanza || 0,
        estado_justificacion: turno.estado_justificacion || 'sin_justificar',
        estado_cumplimiento: turno.estado_cumplimiento || 'a_tiempo',
        alerta_temprana: turno.alerta_temprana || false,
        observaciones: turno.observaciones,
        empleados_turnos: turno.empleados_turnos || { nombres: '', apellidos: '', funcion: '', hora_entrada_programada: '' },
        hora_programada: turno.empleados_turnos?.hora_entrada_programada,
        estado_empleado: undefined
      }));

      return turnosFormatted;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al obtener análisis: ${error.message}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const justificarTardanza = async (turnoId: string, justificacion: 'justificado' | 'injustificado', observaciones?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('turnos_empleados')
        .update({
          estado_justificacion: justificacion,
          observaciones: observaciones
        })
        .eq('id', turnoId);

      if (error) throw error;

      toast({
        title: "Justificación actualizada",
        description: "La justificación de tardanza ha sido actualizada correctamente"
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al justificar tardanza: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const obtenerResumenGeneral = async (fechaInicio?: string, fechaFin?: string) => {
    setLoading(true);
    try {
      // Obtener todos los empleados activos
      const { data: empleados, error: empleadosError } = await supabase
        .from('empleados_turnos')
        .select('id, nombres, apellidos, funcion')
        .eq('active', true);

      if (empleadosError) throw empleadosError;

      // Obtener estadísticas para cada empleado
      const estadisticas = await Promise.all(
        (empleados || []).map(async (empleado) => {
          return await obtenerEstadisticasEmpleado(empleado.id, fechaInicio, fechaFin);
        })
      );

      return estadisticas.filter((stat): stat is EstadisticasEmpleado => stat !== null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al obtener resumen: ${error.message}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    obtenerEstadisticasEmpleado,
    obtenerAnalisisTurnos,
    justificarTardanza,
    obtenerResumenGeneral
  };
};