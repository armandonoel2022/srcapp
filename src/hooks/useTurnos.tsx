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
      // Verificar si existe un registro para el empleado en la fecha actual usando SQL directo
      const { data: existingTurno, error: checkError } = await supabase
        .rpc('exec_sql', {
          query: `SELECT * FROM turnos_empleados WHERE empleado_id = $1 AND fecha = $2`,
          params: [data.empleado_id, data.fecha]
        });

      if (checkError) {
        throw checkError;
      }

      const existingRecord = existingTurno && existingTurno.length > 0 ? existingTurno[0] : null;

      if (existingRecord) {
        // Actualizar el registro existente con salida
        if (data.tipo_registro === 'salida') {
          const { error: updateError } = await supabase
            .rpc('exec_sql', {
              query: `UPDATE turnos_empleados SET 
                        hora_salida = $1, 
                        foto_salida = $2, 
                        ubicacion_salida = $3 
                      WHERE id = $4`,
              params: [
                data.hora_salida,
                data.foto_salida,
                data.ubicacion_salida ? `(${data.ubicacion_salida.lat},${data.ubicacion_salida.lng})` : null,
                existingRecord.id
              ]
            });

          if (updateError) {
            throw updateError;
          }
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
          const { error: insertError } = await supabase
            .rpc('exec_sql', {
              query: `INSERT INTO turnos_empleados 
                        (empleado_id, fecha, hora_entrada, foto_entrada, ubicacion_entrada, tipo_registro) 
                      VALUES ($1, $2, $3, $4, $5, $6)`,
              params: [
                data.empleado_id,
                data.fecha,
                data.hora_entrada,
                data.foto_entrada,
                data.ubicacion_entrada ? `(${data.ubicacion_entrada.lat},${data.ubicacion_entrada.lng})` : null,
                data.tipo_registro
              ]
            });

          if (insertError) {
            throw insertError;
          }
        } else {
          toast({
            title: "Error",
            description: "No existe un registro de entrada para registrar la salida",
            variant: "destructive"
          });
          return { success: false };
        }
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
      let sqlQuery = `
        SELECT t.*, e.nombre, e.funcion 
        FROM turnos_empleados t 
        LEFT JOIN empleados e ON t.empleado_id = e.id 
        ORDER BY t.created_at DESC
      `;
      let params: any[] = [];

      if (fecha) {
        sqlQuery = `
          SELECT t.*, e.nombre, e.funcion 
          FROM turnos_empleados t 
          LEFT JOIN empleados e ON t.empleado_id = e.id 
          WHERE t.fecha = $1
          ORDER BY t.created_at DESC
        `;
        params = [fecha];
      }

      const { data, error } = await supabase.rpc('exec_sql', {
        query: sqlQuery,
        params
      });

      if (error) {
        throw error;
      }

      // Transformar los datos para que coincidan con la interfaz esperada
      const transformedData = data?.map((turno: any) => ({
        ...turno,
        empleados: {
          nombre: turno.nombre,
          funcion: turno.funcion
        }
      })) || [];

      return { success: true, data: transformedData };
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
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT * FROM turnos_empleados WHERE empleado_id = $1 AND fecha = $2`,
        params: [empleadoId, fecha]
      });

      if (error) {
        throw error;
      }

      const turno = data && data.length > 0 ? data[0] : null;

      if (!turno) {
        return { estado: 'sin_entrada' as const, turno: null };
      }

      if (turno.hora_entrada && !turno.hora_salida) {
        return { estado: 'entrada_registrada' as const, turno: turno };
      }

      if (turno.hora_entrada && turno.hora_salida) {
        return { estado: 'completo' as const, turno: turno };
      }

      return { estado: 'sin_entrada' as const, turno: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al verificar estado: ${error.message}`,
        variant: "destructive"
      });
      return { estado: 'error' as const, turno: null };
    }
  };

  return {
    registrarTurno,
    obtenerTurnos,
    verificarEstadoTurno,
    loading
  };
};