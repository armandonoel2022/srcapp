import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Empleado {
  id: string;
  nombre: string;
  funcion: string;
}

export const useEmpleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cargarEmpleados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('nombre');

      if (error) {
        throw error;
      }

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

  const agregarEmpleado = async (nombre: string, funcion: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados')
        .insert({ nombre, funcion })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setEmpleados(prev => [...prev, data]);
      
      toast({
        title: "Empleado agregado",
        description: `${nombre} ha sido agregado exitosamente`
      });

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