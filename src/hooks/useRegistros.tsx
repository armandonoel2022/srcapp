import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisitorCache } from './useVisitorCache';

interface RegistroData {
  seguridad: string;
  agente: string;
  servicio: string;
  fin_servicio: string;
  tipo_persona: 'empleado' | 'visitante';
  nombre?: string;
  apellido?: string;
  funcion?: string;
  cedula?: string;
  matricula?: string;
}

export const useRegistros = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { saveVisitorData } = useVisitorCache();

  const guardarRegistro = async (data: RegistroData) => {
    setLoading(true);
    
    try {
      const fecha = new Date().toISOString().split('T')[0];
      const hora = new Date().toTimeString().split(' ')[0];

      // 1. Guardar en agente_seguridad
      const { error: agenteError } = await supabase
        .from('agente_seguridad')
        .insert({
          seguridad: data.seguridad,
          agente: data.agente,
          servicio: data.servicio,
          fin_servicio: data.fin_servicio,
          fecha
        });

      if (agenteError) {
        throw new Error(`Error al guardar agente de seguridad: ${agenteError.message}`);
      }

      // 2. Determinar tipo (entrada o salida)
      let tipo = 'entrada';
      
      const identificador = data.cedula || data.nombre;
      const columna = data.cedula ? 'cedula' : 'nombre';
      
      if (identificador) {
        const { data: ultimoRegistro } = await supabase
          .from('registros')
          .select('tipo')
          .eq(columna, identificador)
          .eq('fecha', fecha)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ultimoRegistro?.tipo === 'entrada') {
          tipo = 'salida';
        }
      }

      // 3. Guardar en registros
      const { error: registroError } = await supabase
        .from('registros')
        .insert({
          fecha,
          hora,
          seguridad: data.seguridad,
          agente: data.agente,
          servicio: data.servicio,
          fin_servicio: data.fin_servicio,
          nombre: data.nombre,
          apellido: data.apellido,
          funcion: data.funcion,
          cedula: data.cedula,
          matricula: data.matricula,
          tipo,
          tipo_persona: data.tipo_persona
        });

      if (registroError) {
        throw new Error(`Error al guardar registro: ${registroError.message}`);
      }

      // Save visitor data to cache if it's a visitor
      if (data.tipo_persona === 'visitante' && data.cedula && data.nombre && data.apellido) {
        await saveVisitorData({
          cedula: data.cedula,
          nombre: data.nombre,
          apellido: data.apellido,
          matricula: data.matricula
        });
      }

      toast({
        title: "Registro guardado",
        description: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada exitosamente`
      });

      return { success: true, tipo };

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const obtenerUltimoAgente = async () => {
    const { data, error } = await supabase
      .from('agente_seguridad')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener último agente:', error);
      return null;
    }

    return data;
  };

  return {
    guardarRegistro,
    obtenerUltimoAgente,
    loading
  };
};