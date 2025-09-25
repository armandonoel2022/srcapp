import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmpleadoTurno {
  id: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  cedula?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  lugar_designado?: string;
  hora_entrada_programada?: string;
  hora_salida_programada?: string;
  username?: string;
  tolerancia_ubicacion?: number;
  requires_password_change?: boolean;
  last_login?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

interface NuevoEmpleadoTurno {
  nombres: string;
  apellidos: string;
  funcion: string;
  cedula?: string;
  sexo?: string;
  fecha_nacimiento?: string;
  lugar_designado?: string;
  hora_entrada_programada?: string;
  hora_salida_programada?: string;
  username?: string;
}

export const useEmpleadosTurnos = () => {
  const [empleados, setEmpleados] = useState<EmpleadoTurno[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados_turnos')
        .select('*')
        .order('nombres');

      if (error) throw error;
      
      setEmpleados(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar empleados: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const agregarEmpleado = async (empleado: NuevoEmpleadoTurno) => {
    setLoading(true);
    try {
      const { data: insertedEmpleado, error } = await supabase
        .from('empleados_turnos')
        .insert({
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          funcion: empleado.funcion,
          cedula: empleado.cedula || null,
          sexo: empleado.sexo || null,
          fecha_nacimiento: empleado.fecha_nacimiento || null,
          lugar_designado: empleado.lugar_designado || null,
          hora_entrada_programada: empleado.hora_entrada_programada || null,
          hora_salida_programada: empleado.hora_salida_programada || null,
          username: empleado.username || null
        })
        .select()
        .single();

      if (error) throw error;

      // Set default password if username provided
      if (empleado.username && insertedEmpleado) {
        const { error: passwordError } = await supabase.rpc('set_empleado_turno_password', {
          p_empleado_id: insertedEmpleado.id,
          p_username: empleado.username,
          p_password: 'SRC_Agente2025'
        });

        if (passwordError) {
          console.warn('Error setting password:', passwordError);
        }
      }

      toast({
        title: "Empleado agregado",
        description: empleado.username 
          ? `El empleado ha sido agregado con usuario: ${empleado.username} y contraseña temporal: SRC_Agente2025`
          : "El empleado ha sido agregado exitosamente"
      });

      await cargarEmpleados();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al agregar empleado: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  return {
    empleados,
    loading,
    agregarEmpleado,
    cargarEmpleados
  };
};