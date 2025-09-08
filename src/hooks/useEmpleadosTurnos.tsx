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
        .eq('active', true)
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
      const { error } = await supabase
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
          hora_salida_programada: empleado.hora_salida_programada || null
        });

      if (error) throw error;

      toast({
        title: "Empleado agregado",
        description: "El empleado ha sido agregado exitosamente"
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