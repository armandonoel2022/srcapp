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
  isVisible: boolean;
}

export const RouteSimulation = ({ map, history, isVisible }: RouteSimulationProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const animationRef = useRef<number | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const trailSourceRef = useRef<boolean>(false);
  const hasAutoStarted = useRef(false);

  const currentPoint = history[currentIndex];
  const progress = history.length > 0 ? (currentIndex / (history.length - 1)) * 100 : 0;

  // Auto-start simulation when visible and history is loaded
  useEffect(() => {
    if (isVisible && history.length >= 2 && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      // Small delay to let the map render first
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, history.length]);

  // Create/update vehicle marker
  const updateVehicleMarker = useCallback((point: HistoryPoint, bearing?: number) => {
    if (!map) return;

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #f97316, #ea580c);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.5);
        border: 4px solid white;
        transform: rotate(${bearing || 0}deg);
        transition: transform 0.3s ease;
      ">
        <svg style="width: 28px; height: 28px; fill: white;" viewBox="0 0 24 24">
          <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m-11 0a1.5 1.5 0 01-1.5-1.5A1.5 1.5 0 017.5 13a1.5 1.5 0 011.5 1.5A1.5 1.5 0 017.5 16M5 11v5a1 1 0 001 1h1a2 2 0 002-2V11H5zm10 0v4a2 2 0 002 2h1a1 1 0 001-1v-5h-4z"/>
        </svg>
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
          <div style="font-weight: bold; color: #f97316; margin-bottom: 8px; font-size: 14px;">
            🚗 Simulación en Vivo
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
            'line-color': '#f97316',
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

    const prevPoint = history[currentIndex - 1];
    const bearing = prevPoint ? calculateBearing(prevPoint, currentPoint) : 0;

    updateVehicleMarker(currentPoint, bearing);
    updateTrail(currentIndex);
  }, [currentIndex, currentPoint, history, updateVehicleMarker, updateTrail]);

  // Cleanup on unmount or when not visible
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

  // Reset on history change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    hasAutoStarted.current = false; // Reset auto-start flag for new history
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    if (map && trailSourceRef.current) {
      if (map.getLayer('simulation-trail')) map.removeLayer('simulation-trail');
      if (map.getSource('simulation-trail')) map.removeSource('simulation-trail');
      trailSourceRef.current = false;
    }
  }, [history, map]);

  if (!isVisible || history.length < 2) return null;

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
    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 w-72 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          {isPlaying ? (
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          ) : (
            <span className="w-2 h-2 bg-gray-400 rounded-full" />
          )}
          Recorrido
        </h4>
        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs">
          {speed}x
        </Badge>
      </div>

      {/* Current point info */}
      {currentPoint && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 mb-3 text-sm">
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
          <div className="flex justify-between">
            <span className="text-gray-600">Velocidad:</span>
            <span className="font-bold text-orange-600">{currentPoint.speed} km/h</span>
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
          className={!isPlaying ? 'bg-orange-500 hover:bg-orange-600' : ''}
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
