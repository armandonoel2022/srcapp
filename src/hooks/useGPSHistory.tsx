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

      // Convert dates to ISO format like the PHP code does
      const startIso = `${startDate}T00:00:00+00:00`;
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endIso = `${endDate}T23:59:59+00:00`;

      console.log(`Fetching history for device ${deviceId} from ${startIso} to ${endIso}`);

      // Fetch history from traccar_positions table
      // First, get the count to determine if we need to sample
      const { count, error: countError } = await supabase
        .from('traccar_positions')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', deviceId)
        .gte('device_time', startIso)
        .lte('device_time', endIso);

      if (countError) throw countError;

      const totalPoints = count || 0;
      console.log(`Total points in range: ${totalPoints}`);

      // Fetch all points but we'll sample them client-side
      const { data: positionsData, error: positionsError } = await supabase
        .from('traccar_positions')
        .select('id, latitude, longitude, speed, address, device_time')
        .eq('device_id', deviceId)
        .gte('device_time', startIso)
        .lte('device_time', endIso)
        .order('device_time', { ascending: true })
        .limit(2000); // Get more points to ensure we capture the full journey

      if (positionsError) {
        console.error('Error fetching positions:', positionsError);
        throw positionsError;
      }

      console.log(`Found ${positionsData?.length || 0} positions`);

      if (!positionsData || positionsData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron registros para el período seleccionado",
        });
        return;
      }

      // Filter points by frequency (like the PHP code)
      const filteredPoints: HistoryPoint[] = [];
      let lastTime = 0;

      positionsData.forEach(point => {
        if (!point.latitude || !point.longitude) return;
        
        const pointTime = new Date(point.device_time).getTime();
        if (pointTime - lastTime >= frequencySeconds * 1000) {
          // Convert speed from knots to km/h (like PHP: speed_knots * 1.852)
          const speedKnots = Number(point.speed) || 0;
          const speedKmh = Math.round(speedKnots * 1.852 * 10) / 10;
          
          filteredPoints.push({
            id: String(point.id),
            latitude: Number(point.latitude),
            longitude: Number(point.longitude),
            speed: speedKmh,
            deviceTime: point.device_time,
            address: point.address || undefined,
          });
          lastTime = pointTime;
        }
      });

      // Smart sampling: keep first, last, and evenly distributed points
      // This ensures start and end points are always included
      let sampledPoints = filteredPoints;
      const maxPoints = 150; // Increased for better route visualization
      
      if (filteredPoints.length > maxPoints) {
        sampledPoints = [];
        const step = (filteredPoints.length - 1) / (maxPoints - 1);
        
        for (let i = 0; i < maxPoints; i++) {
          const index = Math.round(i * step);
          sampledPoints.push(filteredPoints[index]);
        }
        
        // Ensure last point is always the actual last point
        sampledPoints[sampledPoints.length - 1] = filteredPoints[filteredPoints.length - 1];
      }
      
      setHistory(sampledPoints);

      console.log(`Sampled to ${sampledPoints.length} points (from ${filteredPoints.length} filtered, ${totalPoints} total)`);

      toast({
        title: "Historial cargado",
        description: `${sampledPoints.length} puntos (de ${totalPoints} totales)`,
      });

      // Try to get adjusted route from OpenRouteService
      if (sampledPoints.length >= 2) {
        await adjustRouteToStreets(sampledPoints);
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
      // Take key points (max 10 for better performance, like PHP)
      let keyPoints = points;
      if (points.length > 10) {
        const step = Math.floor(points.length / 10);
        keyPoints = [];
        for (let i = 0; i < points.length; i += step) {
          keyPoints.push(points[i]);
          if (keyPoints.length >= 10) break;
        }
        // Ensure first and last points are included
        keyPoints[0] = points[0];
        keyPoints[keyPoints.length - 1] = points[points.length - 1];
      }

      // Prepare coordinates for the edge function
      const coordinates = keyPoints.map(p => [p.longitude, p.latitude]);

      console.log(`Adjusting route with ${coordinates.length} key points`);

      // Call edge function to adjust route
      const { data, error } = await supabase.functions.invoke('adjust-route', {
        body: { coordinates },
      });

      if (error) {
        console.error('Edge function error:', error);
        return;
      }

      if (data?.adjustedRoute && data.adjustedRoute.length > 0) {
        setAdjustedRoute(data.adjustedRoute);
        console.log(`Route adjusted: ${data.adjustedRoute.length} points`);
        toast({
          title: "Ruta ajustada",
          description: `Ruta ajustada a las calles (${data.adjustedRoute.length} puntos)`,
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
