import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TurnoData {
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  foto_entrada?: string;
  foto_salida?: string;
  ubicacion_entrada?: { lat: number; lng: number };
  ubicacion_salida?: { lat: number; lng: number };
  tipo_registro: 'entrada' | 'salida';
}

export const useTurnos = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const registrarTurno = async (data: TurnoData) => {
    setLoading(true);
    try {
      // Verificar si existe un registro para el empleado en la fecha actual
      const { data: existingTurno, error: checkError } = await supabase
        .from('turnos_empleados')
        .select('*')
        .eq('empleado_id', data.empleado_id)
        .eq('fecha', data.fecha)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      let result;

      if (existingTurno) {
        // Actualizar el registro existente con salida
        if (data.tipo_registro === 'salida') {
          result = await supabase
            .from('turnos_empleados')
            .update({
              hora_salida: data.hora_salida,
              foto_salida: data.foto_salida,
              ubicacion_salida: data.ubicacion_salida ? `(${data.ubicacion_salida.lat},${data.ubicacion_salida.lng})` : null
            })
            .eq('id', existingTurno.id)
            .select()
            .single();
        } else {
          toast({
            title: "Error",
            description: "Ya existe un registro de entrada para este empleado hoy",
            variant: "destructive"
          });
          return { success: false };
        }
      } else {
        // Crear nuevo registro para entrada
        if (data.tipo_registro === 'entrada') {
          result = await supabase
            .from('turnos_empleados')
            .insert({
              empleado_id: data.empleado_id,
              fecha: data.fecha,
              hora_entrada: data.hora_entrada,
              foto_entrada: data.foto_entrada,
              ubicacion_entrada: data.ubicacion_entrada ? `(${data.ubicacion_entrada.lat},${data.ubicacion_entrada.lng})` : null,
              tipo_registro: data.tipo_registro
            })
            .select()
            .single();
        } else {
          toast({
            title: "Error",
            description: "No existe un registro de entrada para registrar la salida",
            variant: "destructive"
          });
          return { success: false };
        }
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Turno registrado",
        description: `${data.tipo_registro === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`
      });

      return { success: true, data: result.data };
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
          empleados:empleado_id (
            nombre,
            funcion
          )
        `)
        .order('created_at', { ascending: false });

      if (fecha) {
        query = query.eq('fecha', fecha);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data };
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

  const verificarEstadoTurno = async (empleadoId: string, fecha: string) => {
    try {
      const { data, error } = await supabase
        .from('turnos_empleados')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return { estado: 'sin_entrada', turno: null };
      }

      if (data.hora_entrada && !data.hora_salida) {
        return { estado: 'entrada_registrada', turno: data };
      }

      if (data.hora_entrada && data.hora_salida) {
        return { estado: 'completo', turno: data };
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