import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Route, Gauge, MapPin, StopCircle } from 'lucide-react';

interface HistoryPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  deviceTime: string;
  address?: string;
}

interface TripStatisticsProps {
  history: HistoryPoint[];
}

export const TripStatistics = ({ history }: TripStatisticsProps) => {
  const stats = useMemo(() => {
    if (history.length < 2) {
      return null;
    }

    const startTime = new Date(history[0].deviceTime);
    const endTime = new Date(history[history.length - 1].deviceTime);
    const durationMs = endTime.getTime() - startTime.getTime();
    
    // Duration formatting
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationFormatted = hours > 0 
      ? `${hours}h ${minutes}min` 
      : `${minutes} min`;

    // Calculate distance using Haversine formula
    let totalDistance = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      totalDistance += haversineDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }

    // Average and max speed
    const speeds = history.map(p => p.speed).filter(s => s > 0);
    const avgSpeed = speeds.length > 0 
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length 
      : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    // Detect stops (speed < 5 km/h for extended period)
    let stopCount = 0;
    let inStop = false;
    for (let i = 0; i < history.length; i++) {
      if (history[i].speed < 5) {
        if (!inStop) {
          stopCount++;
          inStop = true;
        }
      } else {
        inStop = false;
      }
    }

    return {
      startTime,
      endTime,
      durationFormatted,
      durationMs,
      totalDistance: totalDistance.toFixed(2),
      avgSpeed: avgSpeed.toFixed(1),
      maxSpeed: maxSpeed.toFixed(1),
      stopCount,
      pointCount: history.length,
    };
  }, [history]);

  if (!stats) return null;

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-700 text-sm">Resumen del Viaje</h4>
          <Badge variant="outline" className="text-xs bg-white">
            {stats.pointCount} puntos
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Duration */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Duración</p>
              <p className="text-sm font-semibold text-slate-800">{stats.durationFormatted}</p>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <div className="p-1.5 bg-green-100 rounded-md">
              <Route className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Distancia</p>
              <p className="text-sm font-semibold text-slate-800">{stats.totalDistance} km</p>
            </div>
          </div>

          {/* Avg Speed */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <div className="p-1.5 bg-orange-100 rounded-md">
              <Gauge className="h-3.5 w-3.5 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Vel. Prom.</p>
              <p className="text-sm font-semibold text-slate-800">{stats.avgSpeed} km/h</p>
            </div>
          </div>

          {/* Stops */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <div className="p-1.5 bg-red-100 rounded-md">
              <StopCircle className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Paradas</p>
              <p className="text-sm font-semibold text-slate-800">{stats.stopCount}</p>
            </div>
          </div>
        </div>

        {/* Time range */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-slate-600">
                Inicio: <span className="font-medium text-slate-800">{stats.startTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-slate-600">
                Fin: <span className="font-medium text-slate-800">{stats.endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Max speed */}
        <div className="mt-2 text-xs text-center text-slate-500">
          Velocidad máxima: <span className="font-semibold text-slate-700">{stats.maxSpeed} km/h</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
