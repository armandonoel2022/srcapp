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

  const registrarTurno = async (data: TurnoData) => {
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

      // Validar ubicación si se proporciona
      if ((data.ubicacion_entrada || data.ubicacion_salida) && empleadoData.lugar_designado) {
        const currentLocation: LocationCoordinates = data.ubicacion_entrada || data.ubicacion_salida!;
        const validationResult = await validateLocationForWork(currentLocation, empleadoData.lugar_designado);
        
        if (!validationResult.isValid) {
          toast({
            title: "Ubicación Inválida",
            description: validationResult.message,
            variant: "destructive"
          });
          return { success: false, message: validationResult.message };
        } else {
          toast({
            title: "Ubicación Verificada",
            description: validationResult.message,
          });
        }
      }

      if (data.tipo_registro === 'entrada') {
        // Verificar si ya existe una entrada para hoy
        const { data: existingTurno } = await supabase
          .from('turnos_empleados')
          .select('*')
          .eq('empleado_id', data.empleado_id)
          .eq('fecha', data.fecha)
          .maybeSingle();

        if (existingTurno) {
          toast({
            title: "Error",
            description: "Ya existe un registro de entrada para este empleado hoy",
            variant: "destructive"
          });
          return { success: false };
        }

        // Crear nuevo registro de entrada
        const { error } = await supabase
          .from('turnos_empleados')
          .insert({
            empleado_id: data.empleado_id,
            fecha: data.fecha,
            hora_entrada: data.hora_entrada,
            ubicacion_entrada: data.ubicacion_entrada ? 
              `(${data.ubicacion_entrada.lat},${data.ubicacion_entrada.lng})` : null,
            tipo_registro: data.tipo_registro
          });

        if (error) throw error;

      } else {
        // Actualizar registro existente con salida
        const { error } = await supabase
          .from('turnos_empleados')
          .update({
            hora_salida: data.hora_salida,
            ubicacion_salida: data.ubicacion_salida ? 
              `(${data.ubicacion_salida.lat},${data.ubicacion_salida.lng})` : null
          })
          .eq('empleado_id', data.empleado_id)
          .eq('fecha', data.fecha);

        if (error) throw error;
      }

      toast({
        title: "Turno registrado",
        description: `${data.tipo_registro === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al registrar turno: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
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
      const { data: turno, error } = await supabase
        .from('turnos_empleados')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha)
        .maybeSingle();

      if (error) throw error;

      if (!turno) {
        return { estado: 'sin_entrada', turno: null };
      }

      if (turno.hora_entrada && turno.hora_salida) {
        return { estado: 'completo', turno };
      }

      if (turno.hora_entrada && !turno.hora_salida) {
        return { estado: 'entrada_registrada', turno };
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

  return {
    registrarTurno,
    obtenerTurnos,
    verificarEstadoTurno,
    loading
  };
};