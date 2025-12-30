import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface HistoryPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  deviceTime: string;
  address?: string;
}

export const useGPSHistory = () => {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [adjustedRoute, setAdjustedRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (
    deviceId: number,
    startDate: string,
    endDate: string,
    frequencySeconds: number = 60
  ) => {
    try {
      setLoading(true);
      setError(null);
      setHistory([]);
      setAdjustedRoute([]);

      // Add one day to end date to include the full day
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

      // Fetch history from traccar_history table
      const { data: historyData, error: historyError } = await supabase
        .from('traccar_history')
        .select('*')
        .eq('device_id', deviceId)
        .gte('device_time', startDate)
        .lt('device_time', endDatePlusOne.toISOString().split('T')[0])
        .order('device_time', { ascending: true });

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron registros para el período seleccionado",
        });
        return;
      }

      // Filter points by frequency
      const filteredPoints: HistoryPoint[] = [];
      let lastTime = 0;

      historyData.forEach(point => {
        const pointTime = new Date(point.device_time).getTime();
        if (pointTime - lastTime >= frequencySeconds * 1000) {
          filteredPoints.push({
            id: point.id,
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed || 0,
            deviceTime: point.device_time,
            address: point.address || undefined,
          });
          lastTime = pointTime;
        }
      });

      // Limit to 100 points max
      const limitedPoints = filteredPoints.slice(0, 100);
      setHistory(limitedPoints);

      toast({
        title: "Historial cargado",
        description: `${limitedPoints.length} puntos encontrados`,
      });

      // Try to get adjusted route from OpenRouteService
      if (limitedPoints.length >= 2) {
        await adjustRouteToStreets(limitedPoints);
      }

    } catch (err: any) {
      console.error('Error fetching GPS history:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustRouteToStreets = async (points: HistoryPoint[]) => {
    try {
      // Prepare coordinates for the edge function
      const coordinates = points.map(p => [p.longitude, p.latitude]);

      // Call edge function to adjust route
      const { data, error } = await supabase.functions.invoke('adjust-route', {
        body: { coordinates },
      });

      if (error) throw error;

      if (data?.adjustedRoute && data.adjustedRoute.length > 0) {
        setAdjustedRoute(data.adjustedRoute);
        toast({
          title: "Ruta ajustada",
          description: "La ruta ha sido ajustada a las calles exitosamente",
        });
      } else {
        console.warn('No adjusted route returned from API');
      }
    } catch (err: any) {
      console.error('Error adjusting route:', err);
      // Don't show error toast - just continue with original route
      console.log('Continuing with original route only');
    }
  };

  return {
    history,
    adjustedRoute,
    loading,
    error,
    fetchHistory,
  };
};
