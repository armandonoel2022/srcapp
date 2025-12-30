import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation } from 'lucide-react';

interface HistoryPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  deviceTime: string;
  address?: string;
}

interface WaypointsListProps {
  history: HistoryPoint[];
  onWaypointClick?: (point: HistoryPoint, index: number) => void;
}

export const WaypointsList = ({ history, onWaypointClick }: WaypointsListProps) => {
  // Select key waypoints (start, stops, and end)
  const waypoints = useMemo(() => {
    if (history.length < 2) return [];

    const points: { point: HistoryPoint; type: 'start' | 'stop' | 'end'; index: number }[] = [];
    
    // Start point
    points.push({ point: history[0], type: 'start', index: 0 });

    // Find significant stops (speed < 3 km/h for at least 2 consecutive points)
    let stopStart = -1;
    for (let i = 1; i < history.length - 1; i++) {
      if (history[i].speed < 3) {
        if (stopStart === -1) {
          stopStart = i;
        }
      } else {
        if (stopStart !== -1 && i - stopStart >= 2) {
          // This was a significant stop
          const midStop = Math.floor((stopStart + i) / 2);
          points.push({ point: history[midStop], type: 'stop', index: midStop });
        }
        stopStart = -1;
      }
    }

    // End point
    points.push({ point: history[history.length - 1], type: 'end', index: history.length - 1 });

    return points;
  }, [history]);

  if (waypoints.length === 0) return null;

  const getTypeConfig = (type: 'start' | 'stop' | 'end') => {
    switch (type) {
      case 'start':
        return { label: 'Inicio', color: 'bg-green-500', badge: 'bg-green-100 text-green-700' };
      case 'stop':
        return { label: 'Parada', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
      case 'end':
        return { label: 'Fin', color: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
    }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5" />
            Puntos de Llegada
          </h4>
          <Badge variant="outline" className="text-[10px]">
            {waypoints.length} puntos
          </Badge>
        </div>

        <ScrollArea className="h-[160px]">
          <div className="space-y-2 pr-2">
            {waypoints.map((wp, idx) => {
              const config = getTypeConfig(wp.type);
              const time = new Date(wp.point.deviceTime);
              
              return (
                <div
                  key={wp.point.id}
                  onClick={() => onWaypointClick?.(wp.point, wp.index)}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${config.color} ring-2 ring-white shadow-sm`} />
                    {idx < waypoints.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate-200 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] px-1.5 py-0 ${config.badge}`}>
                        {config.label}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time.toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-600 mt-0.5 truncate group-hover:text-slate-800">
                      {wp.point.address || `${wp.point.latitude.toFixed(5)}, ${wp.point.longitude.toFixed(5)}`}
                    </p>
                    
                    {wp.point.speed > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {wp.point.speed} km/h
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
