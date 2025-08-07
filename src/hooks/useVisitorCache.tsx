import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VisitorData {
  cedula: string;
  nombre: string;
  apellido: string;
  matricula?: string;
}

export const useVisitorCache = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveVisitorData = async (visitorData: VisitorData) => {
    try {
      const { error } = await supabase
        .from('visitor_cache')
        .upsert({
          cedula: visitorData.cedula,
          nombre: visitorData.nombre,
          apellido: visitorData.apellido,
          matricula: visitorData.matricula,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'cedula'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving visitor data:', error);
    }
  };

  const getVisitorData = async (cedula: string): Promise<VisitorData | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitor_cache')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Update last_used timestamp
        await supabase
          .from('visitor_cache')
          .update({ last_used: new Date().toISOString() })
          .eq('cedula', cedula);
      }

      return data ? {
        cedula: data.cedula,
        nombre: data.nombre,
        apellido: data.apellido,
        matricula: data.matricula
      } : null;
    } catch (error: any) {
      console.error('Error getting visitor data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchVisitors = async (query: string): Promise<VisitorData[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitor_cache')
        .select('*')
        .or(`cedula.ilike.%${query}%,nombre.ilike.%${query}%,apellido.ilike.%${query}%`)
        .order('last_used', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map(item => ({
        cedula: item.cedula,
        nombre: item.nombre,
        apellido: item.apellido,
        matricula: item.matricula
      }));
    } catch (error: any) {
      console.error('Error searching visitors:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveVisitorData,
    getVisitorData,
    searchVisitors
  };
};