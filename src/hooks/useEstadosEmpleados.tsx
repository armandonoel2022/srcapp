import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EstadoEmpleado {
  id: string;
  empleado_id: string;
  tipo_estado: string;
  fecha_inicio: string;
  fecha_fin?: string;
  motivo?: string;
  documento_adjunto?: string;
  estado_aprobacion: string;
  aprobado_por?: string;
  comentarios_admin?: string;
  created_at: string;
  updated_at: string;
  empleados_turnos?: {
    nombres: string;
    apellidos: string;
    funcion: string;
  };
}

interface NuevoEstado {
  empleado_id: string;
  tipo_estado: 'vacaciones' | 'licencia_medica' | 'permiso';
  fecha_inicio: string;
  fecha_fin?: string;
  motivo?: string;
  documento_adjunto?: string;
}

export const useEstadosEmpleados = () => {
  const [estados, setEstados] = useState<EstadoEmpleado[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cargarEstados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados_estados')
        .select(`
          *,
          empleados_turnos (
            nombres,
            apellidos,
            funcion
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEstados(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar estados: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const crearEstado = async (estado: NuevoEstado) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('empleados_estados')
        .insert(estado);

      if (error) throw error;

      toast({
        title: "Estado creado",
        description: "El estado del empleado ha sido registrado exitosamente"
      });

      await cargarEstados();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear estado: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const aprobarEstado = async (estadoId: string, aprobado: boolean, comentarios?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('empleados_estados')
        .update({
          estado_aprobacion: aprobado ? 'aprobado' : 'rechazado',
          comentarios_admin: comentarios,
          aprobado_por: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', estadoId);

      if (error) throw error;

      toast({
        title: aprobado ? "Estado aprobado" : "Estado rechazado",
        description: `El estado ha sido ${aprobado ? 'aprobado' : 'rechazado'} exitosamente`
      });

      await cargarEstados();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al procesar estado: ${error.message}`,
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoActual = async (empleadoId: string, fecha: string) => {
    try {
      const { data, error } = await supabase
        .from('empleados_estados')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('estado_aprobacion', 'aprobado')
        .lte('fecha_inicio', fecha)
        .or(`fecha_fin.is.null,fecha_fin.gte.${fecha}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Error al obtener estado actual:', error);
      return null;
    }
  };

  useEffect(() => {
    cargarEstados();
  }, []);

  return {
    estados,
    loading,
    crearEstado,
    aprobarEstado,
    obtenerEstadoActual,
    cargarEstados
  };
};