import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  cedula?: string;
  foto?: string;
  ubicacion_designada?: string;
  active: boolean;
  requires_password_change: boolean;
  created_at: string;
  updated_at: string;
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
        .eq('active', true)
        .order('nombres');

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

  const agregarEmpleado = async (empleadoData: {
    nombres: string;
    apellidos: string;
    funcion: string;
    cedula?: string;
    ubicacion_designada?: string;
    password?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_empleado_with_password', {
        p_nombres: empleadoData.nombres,
        p_apellidos: empleadoData.apellidos,
        p_funcion: empleadoData.funcion,
        p_cedula: empleadoData.cedula || null,
        p_ubicacion: empleadoData.ubicacion_designada || null,
        p_password: empleadoData.password || null
      });

      if (error) {
        throw error;
      }

      await cargarEmpleados(); // Recargar lista
      
      toast({
        title: "Empleado agregado",
        description: `${empleadoData.nombres} ${empleadoData.apellidos} ha sido agregado exitosamente`
      });

      return { success: true, empleadoId: data };
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

  const actualizarEmpleado = async (id: string, empleadoData: Partial<Empleado>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('empleados')
        .update({
          ...empleadoData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await cargarEmpleados(); // Recargar lista
      
      toast({
        title: "Empleado actualizado",
        description: "Los datos del empleado han sido actualizados exitosamente"
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar empleado: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const eliminarEmpleado = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('empleados')
        .update({ active: false })
        .eq('id', id);

      if (error) {
        throw error;
      }

      await cargarEmpleados(); // Recargar lista
      
      toast({
        title: "Empleado desactivado",
        description: "El empleado ha sido desactivado exitosamente"
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al desactivar empleado: ${error.message}`,
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

  const authenticateEmpleado = async (cedula: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_empleado', {
        p_cedula: cedula,
        p_password: password
      });

      if (error || !data || data.length === 0) {
        throw new Error('Credenciales inválidas');
      }

      const empleado = data[0];
      
      toast({
        title: "Acceso autorizado",
        description: `Bienvenido ${empleado.nombres} ${empleado.apellidos}`
      });

      return { 
        success: true, 
        empleado: {
          id: empleado.empleado_id,
          nombres: empleado.nombres,
          apellidos: empleado.apellidos,
          funcion: empleado.funcion,
          ubicacion_designada: empleado.ubicacion_designada,
          requires_password_change: empleado.requires_password_change
        }
      };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al autenticar empleado",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const changeEmpleadoPassword = async (empleadoId: string, newPassword: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('change_empleado_password', {
        p_empleado_id: empleadoId,
        p_new_password: newPassword
      });

      if (error || !data) {
        throw new Error('Error al cambiar contraseña');
      }

      toast({
        title: "Contraseña actualizada",
        description: "La contraseña ha sido cambiada exitosamente"
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar contraseña",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    empleados,
    loading,
    agregarEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    authenticateEmpleado,
    changeEmpleadoPassword,
    cargarEmpleados
  };
};