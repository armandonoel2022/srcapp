import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateLocationForWork, type LocationCoordinates } from '@/utils/locationValidation';

interface TurnoData {
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  ubicacion_entrada?: { lat: number; lng: number };
  ubicacion_salida?: { lat: number; lng: number };
  tipo_registro: 'entrada' | 'salida';
}

interface EstadoTurno {
  estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
  turno: any;
}

export const useTurnos = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const registrarTurno = async (data: TurnoData): Promise<{ success: boolean; message?: string; turnoId?: string }> => {
    setLoading(true);
    try {
      // Obtener información del empleado para validar ubicación
      const { data: empleadoData, error: empleadoError } = await supabase
        .from('empleados_turnos')
        .select('lugar_designado')
        .eq('id', data.empleado_id)
        .single();

      if (empleadoError) {
        throw new Error('No se pudo obtener la información del empleado');
      }

      // VALIDACIÓN REAL DE UBICACIÓN - MODO PRODUCCIÓN
      if ((data.ubicacion_entrada || data.ubicacion_salida) && empleadoData.lugar_designado) {
        const currentLocation: LocationCoordinates = data.ubicacion_entrada || data.ubicacion_salida!;
        const validationResult = await validateLocationForWork(currentLocation, empleadoData.lugar_designado);
        
        if (!validationResult.isValid) {
          // BLOQUEAR registro si no está en ubicación válida
          throw new Error(`UBICACIÓN INVÁLIDA: ${validationResult.message}`);
        } else {
          toast({
            title: "Ubicación Verificada",
            description: validationResult.message,
          });
        }
        
        console.log(`Validación de ubicación: ${validationResult.message}`);
      } else if (!empleadoData.lugar_designado) {
        // Si el empleado no tiene lugar designado, no puede hacer punch
        throw new Error('No tienes una ubicación designada asignada. Contacta al administrador para configurar tu lugar de trabajo.');
      }

      if (data.tipo_registro === 'entrada') {
        // Siempre permitir nuevos registros de entrada para múltiples punches durante el día
        // Crear nuevo registro de entrada
        const { data: turnoData, error } = await supabase
          .from('turnos_empleados')
          .insert({
            empleado_id: data.empleado_id,
            fecha: data.fecha,
            hora_entrada: data.hora_entrada,
            ubicacion_entrada: data.ubicacion_entrada ? 
              `(${data.ubicacion_entrada.lat},${data.ubicacion_entrada.lng})` : null,
            tipo_registro: data.tipo_registro
          })
          .select()
          .single();

        if (error) throw error;

        return { success: true, turnoId: turnoData.id };

      } else {
        // Buscar el último registro de entrada sin salida para este empleado en esta fecha
        const { data: entradaSinSalida, error: searchError } = await supabase
          .from('turnos_empleados')
          .select('id')
          .eq('empleado_id', data.empleado_id)
          .eq('fecha', data.fecha)
          .is('hora_salida', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (searchError) throw searchError;

        if (!entradaSinSalida) {
          toast({
            title: "Error",
            description: "No hay registro de entrada pendiente para registrar la salida",
            variant: "destructive"
          });
          return { success: false, message: "No hay entrada pendiente" };
        }

        // Actualizar el registro de entrada con la salida
        const { error } = await supabase
          .from('turnos_empleados')
          .update({
            hora_salida: data.hora_salida,
            ubicacion_salida: data.ubicacion_salida ? 
              `(${data.ubicacion_salida.lat},${data.ubicacion_salida.lng})` : null
          })
          .eq('id', entradaSinSalida.id);

        if (error) throw error;

        return { success: true, turnoId: entradaSinSalida.id };
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al registrar turno: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const obtenerTurnos = async (fecha?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('turnos_empleados')
        .select(`
          *,
          empleados_turnos!turnos_empleados_empleado_id_fkey (
            nombres,
            apellidos,
            funcion
          )
        `)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (fecha) {
        query = query.eq('fecha', fecha);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al obtener turnos: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const verificarEstadoTurno = async (empleadoId: string, fecha: string): Promise<EstadoTurno> => {
    try {
      // Obtener todos los registros del empleado para esta fecha
      const { data: turnos, error } = await supabase
        .from('turnos_empleados')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!turnos || turnos.length === 0) {
        return { estado: 'sin_entrada', turno: null };
      }

      // Verificar si hay alguna entrada sin salida
      const entradaSinSalida = turnos.find(turno => turno.hora_entrada && !turno.hora_salida);
      
      if (entradaSinSalida) {
        return { estado: 'entrada_registrada', turno: entradaSinSalida };
      }

      // Si todos los turnos tienen entrada y salida, está completo
      const turnoCompleto = turnos.find(turno => turno.hora_entrada && turno.hora_salida);
      if (turnoCompleto) {
        return { estado: 'completo', turno: turnos }; // Retornamos todos los turnos
      }

      return { estado: 'sin_entrada', turno: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al verificar estado: ${error.message}`,
        variant: "destructive"
      });
      return { estado: 'error', turno: null };
    }
  };

  const eliminarTurnosPrueba = async (empleadoId: string, fecha: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('turnos_empleados')
        .delete()
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha);

      if (error) throw error;

      toast({
        title: "Registros eliminados",
        description: "Los registros de prueba han sido eliminados. Puedes hacer nuevos punches.",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar registros: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    registrarTurno,
    obtenerTurnos,
    verificarEstadoTurno,
    eliminarTurnosPrueba,
    loading
  };
};