import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmpleadoAuth {
  id: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  lugar_designado?: string;
  requires_password_change: boolean;
}

export const useEmpleadoAuth = () => {
  const [empleado, setEmpleado] = useState<EmpleadoAuth | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loginEmpleado = async (username: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_empleado_turno', {
        p_username: username,
        p_password: password
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const empleadoData = data[0];
        const empleadoAuth: EmpleadoAuth = {
          id: empleadoData.empleado_id,
          nombres: empleadoData.nombres,
          apellidos: empleadoData.apellidos,
          funcion: empleadoData.funcion,
          lugar_designado: empleadoData.lugar_designado,
          requires_password_change: empleadoData.requires_password_change
        };
        
        setEmpleado(empleadoAuth);
        
        // Store in localStorage for persistence
        localStorage.setItem('empleado_auth', JSON.stringify(empleadoAuth));
        
        toast({
          title: "Bienvenido/a",
          description: `Hola ${empleadoData.nombres}, has iniciado sesión correctamente`
        });
        
        return { success: true, empleado: empleadoAuth };
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, empleado: null };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    console.log('🔧 changePassword - Iniciando función');
    console.log('🔧 empleado actual:', empleado);
    
    if (!empleado) {
      console.log('❌ No hay empleado logueado');
      return { success: false };
    }
    
    console.log('🔧 Empleado ID:', empleado.id);
    console.log('🔧 Setting loading to true');
    setLoading(true);
    
    try {
      console.log('🔧 Llamando supabase.rpc con:', {
        function_name: 'change_empleado_turno_password',
        p_empleado_id: empleado.id,
        p_new_password: newPassword.length + ' caracteres'
      });
      
      const { data, error } = await supabase.rpc('change_empleado_turno_password', {
        p_empleado_id: empleado.id,
        p_new_password: newPassword
      });

      console.log('🔧 Respuesta de supabase:', { data, error });

      if (error) {
        console.log('❌ Error en la respuesta:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Contraseña cambiada, actualizando empleado');
        const updatedEmpleado = { ...empleado, requires_password_change: false };
        setEmpleado(updatedEmpleado);
        localStorage.setItem('empleado_auth', JSON.stringify(updatedEmpleado));
        
        toast({
          title: "Contraseña actualizada",
          description: "Su contraseña ha sido cambiada exitosamente"
        });
        
        return { success: true };
      } else {
        console.log('❌ Data es falsy:', data);
        throw new Error('Error al cambiar la contraseña');
      }
    } catch (error: any) {
      console.log('💥 Error capturado:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      console.log('🔧 Setting loading to false');
      setLoading(false);
    }
  };

  const logout = () => {
    setEmpleado(null);
    localStorage.removeItem('empleado_auth');
    toast({
      title: "Sesión cerrada",
      description: "Ha cerrado sesión correctamente"
    });
  };

  const checkAuth = () => {
    const stored = localStorage.getItem('empleado_auth');
    if (stored) {
      try {
        const empleadoData = JSON.parse(stored);
        setEmpleado(empleadoData);
        return empleadoData;
      } catch {
        localStorage.removeItem('empleado_auth');
      }
    }
    return null;
  };

  return {
    empleado,
    loading,
    loginEmpleado,
    changePassword,
    logout,
    checkAuth
  };
};