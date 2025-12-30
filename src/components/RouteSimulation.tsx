import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

interface HistoryPoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  deviceTime: string;
  address?: string;
}

interface RouteSimulationProps {
  map: mapboxgl.Map | null;
  history: HistoryPoint[];
}

// Calculate time difference between two dates
const calculateTimeDiff = (from: string, to: string): string => {
  const diffMs = new Date(to).getTime() - new Date(from).getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Calculate total elapsed time from start
const calculateTotalElapsed = (start: string, current: string): string => {
  return calculateTimeDiff(start, current);
};

export const RouteSimulation = ({ map, history }: RouteSimulationProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const animationRef = useRef<number | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const trailSourceRef = useRef<boolean>(false);

  const currentPoint = history[currentIndex];
  const prevPoint = currentIndex > 0 ? history[currentIndex - 1] : null;
  const startPoint = history[0];
  const progress = history.length > 0 ? (currentIndex / (history.length - 1)) * 100 : 0;

  // Time calculations
  const timeFromPrev = prevPoint && currentPoint 
    ? calculateTimeDiff(prevPoint.deviceTime, currentPoint.deviceTime) 
    : '--';
  const totalElapsed = startPoint && currentPoint 
    ? calculateTotalElapsed(startPoint.deviceTime, currentPoint.deviceTime)
    : '--';

  // Create/update vehicle marker with SRC badge
  const updateVehicleMarker = useCallback((point: HistoryPoint, bearing?: number) => {
    if (!map) return;

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.6);
        border: 4px solid white;
        transform: rotate(${bearing || 0}deg);
        transition: transform 0.3s ease;
        position: relative;
      ">
        <span style="
          color: white;
          font-weight: bold;
          font-size: 14px;
          letter-spacing: 0.5px;
        ">SRC</span>
      </div>
    `;

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLngLat([point.longitude, point.latitude]);
    } else {
      vehicleMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .addTo(map);
    }

    // Update popup content
    vehicleMarkerRef.current.setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 12px; min-width: 220px;">
          <div style="font-weight: bold; color: #3b82f6; margin-bottom: 8px; font-size: 14px;">
            🚗 Recorrido en Vivo
          </div>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Hora:</strong> ${new Date(point.deviceTime).toLocaleString()}
          </p>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Velocidad:</strong> ${point.speed} km/h
          </p>
          ${point.address ? `<p style="margin: 4px 0; font-size: 12px; color: #666;">${point.address}</p>` : ''}
        </div>
      `)
    );

    // Center map on vehicle
    map.easeTo({
      center: [point.longitude, point.latitude],
      duration: 300,
    });
  }, [map]);

  // Update trail line
  const updateTrail = useCallback((upToIndex: number) => {
    if (!map || upToIndex < 1) return;

    const coordinates = history.slice(0, upToIndex + 1).map(p => [p.longitude, p.latitude]);

    if (trailSourceRef.current) {
      const source = map.getSource('simulation-trail') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        });
      }
    } else {
      if (!map.getSource('simulation-trail')) {
        map.addSource('simulation-trail', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        map.addLayer({
          id: 'simulation-trail',
          type: 'line',
          source: 'simulation-trail',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.9,
          },
        });
      }
      trailSourceRef.current = true;
    }
  }, [map, history]);

  // Calculate bearing between two points
  const calculateBearing = (from: HistoryPoint, to: HistoryPoint): number => {
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;

    return (bearing + 360) % 360;
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !history.length) return;

    const animate = () => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= history.length) {
          setIsPlaying(false);
          return history.length - 1;
        }
        return next;
      });
    };

    // Interval based on speed (base: 1 second per point)
    const interval = 1000 / speed;
    animationRef.current = window.setInterval(animate, interval);

    return () => {
      if (animationRef.current) {
        window.clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, speed, history.length]);

  // Update marker and trail when index changes
  useEffect(() => {
    if (!currentPoint) return;

    const prevPointCalc = history[currentIndex - 1];
    const bearing = prevPointCalc ? calculateBearing(prevPointCalc, currentPoint) : 0;

    updateVehicleMarker(currentPoint, bearing);
    updateTrail(currentIndex);
  }, [currentIndex, currentPoint, history, updateVehicleMarker, updateTrail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
      if (map && trailSourceRef.current) {
        if (map.getLayer('simulation-trail')) map.removeLayer('simulation-trail');
        if (map.getSource('simulation-trail')) map.removeSource('simulation-trail');
        trailSourceRef.current = false;
      }
    };
  }, [map]);

  // Reset and auto-start on history change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    if (map && trailSourceRef.current) {
      if (map.getLayer('simulation-trail')) map.removeLayer('simulation-trail');
      if (map.getSource('simulation-trail')) map.removeSource('simulation-trail');
      trailSourceRef.current = false;
    }
    
    // Auto-start playback when history is loaded
    if (history.length >= 2) {
      setTimeout(() => {
        setIsPlaying(true);
      }, 500);
    }
  }, [history, map]);

  if (history.length < 2) return null;

  const handleSliderChange = (value: number[]) => {
    setCurrentIndex(Math.round((value[0] / 100) * (history.length - 1)));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    if (map && trailSourceRef.current) {
      if (map.getLayer('simulation-trail')) map.removeLayer('simulation-trail');
      if (map.getSource('simulation-trail')) map.removeSource('simulation-trail');
      trailSourceRef.current = false;
    }
  };

  const cycleSpeed = () => {
    setSpeed(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-2xl p-4 w-80 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">SRC</div>
          Recorrido
        </h4>
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
          {speed}x
        </Badge>
      </div>

      {/* Current point info with time elapsed */}
      {currentPoint && (
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-3 mb-3 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Punto:</span>
            <span className="font-medium">{currentIndex + 1} / {history.length}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Hora:</span>
            <span className="font-medium text-xs">
              {new Date(currentPoint.deviceTime).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Velocidad:</span>
            <span className="font-bold text-blue-600">{currentPoint.speed} km/h</span>
          </div>
          <div className="border-t border-blue-200 mt-2 pt-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">⏱ Desde anterior:</span>
              <span className="font-medium text-blue-700">{timeFromPrev}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">⏱ Tiempo total:</span>
              <span className="font-bold text-blue-800">{totalElapsed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress slider */}
      <div className="mb-4">
        <Slider
          value={[progress]}
          onValueChange={handleSliderChange}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{history[0] ? new Date(history[0].deviceTime).toLocaleTimeString() : ''}</span>
          <span>{history[history.length - 1] ? new Date(history[history.length - 1].deviceTime).toLocaleTimeString() : ''}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 5))}
          disabled={currentIndex === 0}
        >
          <Rewind className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={isPlaying ? 'destructive' : 'default'}
          className={!isPlaying ? 'bg-blue-500 hover:bg-blue-600' : ''}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentIndex(Math.min(history.length - 1, currentIndex + 5))}
          disabled={currentIndex >= history.length - 1}
        >
          <FastForward className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={cycleSpeed}
          className="font-bold min-w-12"
        >
          {speed}x
        </Button>
      </div>
    </div>
  );
};
