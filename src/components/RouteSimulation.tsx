import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export const RouteSimulation = ({ map, history }: RouteSimulationProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);
  const vehicleMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const currentPoint = history[currentIndex];
  const prevPoint = currentIndex > 0 ? history[currentIndex - 1] : null;
  const startPoint = history[0];
  const progress = history.length > 0 ? (currentIndex / (history.length - 1)) * 100 : 0;

  const timeFromPrev = prevPoint && currentPoint 
    ? calculateTimeDiff(prevPoint.deviceTime, currentPoint.deviceTime) 
    : '--';
  const totalElapsed = startPoint && currentPoint 
    ? calculateTimeDiff(startPoint.deviceTime, currentPoint.deviceTime)
    : '--';

  // Create/update vehicle marker - car icon with SRC
  const updateVehicleMarker = useCallback((point: HistoryPoint) => {
    if (!map) return;

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 12px rgba(59, 130, 246, 0.5);
          border: 3px solid white;
        ">
          <svg style="width: 26px; height: 26px; fill: white;" viewBox="0 0 24 24">
            <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m-11 0a1.5 1.5 0 01-1.5-1.5A1.5 1.5 0 017.5 13a1.5 1.5 0 011.5 1.5A1.5 1.5 0 017.5 16M5 11v5a1 1 0 001 1h1a2 2 0 002-2V11H5zm10 0v4a2 2 0 002 2h1a1 1 0 001-1v-5h-4z"/>
          </svg>
        </div>
        <div style="
          background: #1d4ed8;
          color: white;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: -4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">SRC</div>
      </div>
    `;

    vehicleMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([point.longitude, point.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 20 }).setHTML(`
          <div style="padding: 8px; min-width: 160px;">
            <p style="margin: 2px 0; font-size: 12px;"><strong>Hora:</strong> ${new Date(point.deviceTime).toLocaleTimeString()}</p>
            <p style="margin: 2px 0; font-size: 12px;"><strong>Velocidad:</strong> ${point.speed} km/h</p>
            ${point.address ? `<p style="margin: 2px 0; font-size: 11px; color: #666;">${point.address}</p>` : ''}
          </div>
        `)
      )
      .addTo(map);
  }, [map]);

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

    const interval = 1000 / speed;
    animationRef.current = window.setInterval(animate, interval);

    return () => {
      if (animationRef.current) {
        window.clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, speed, history.length]);

  // Update marker when index changes
  useEffect(() => {
    if (!currentPoint) return;
    updateVehicleMarker(currentPoint);
  }, [currentIndex, currentPoint, updateVehicleMarker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
    };
  }, [map]);

  // Reset on history change and auto-start
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    
    if (history.length >= 2) {
      setTimeout(() => {
        setIsPlaying(true);
      }, 1000);
    }
  }, [history]);

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
  };

  const cycleSpeed = () => {
    setSpeed(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  };

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 w-64 border border-gray-200 z-10">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m-11 0a1.5 1.5 0 01-1.5-1.5A1.5 1.5 0 017.5 13a1.5 1.5 0 011.5 1.5A1.5 1.5 0 017.5 16M5 11v5a1 1 0 001 1h1a2 2 0 002-2V11H5zm10 0v4a2 2 0 002 2h1a1 1 0 001-1v-5h-4z"/>
            </svg>
          </div>
          <span className="font-medium text-sm text-gray-700">
            {currentIndex + 1}/{history.length}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {currentPoint && new Date(currentPoint.deviceTime).toLocaleTimeString()}
        </div>
      </div>

      {/* Compact info row */}
      <div className="flex justify-between text-xs mb-2 bg-blue-50 rounded px-2 py-1">
        <span className="text-gray-600">⏱ {totalElapsed}</span>
        <span className="text-blue-600 font-medium">{currentPoint?.speed || 0} km/h</span>
        <span className="text-gray-500">+{timeFromPrev}</span>
      </div>

      {/* Slider */}
      <Slider
        value={[progress]}
        onValueChange={handleSliderChange}
        max={100}
        step={1}
        className="w-full mb-2"
      />

      {/* Compact controls */}
      <div className="flex items-center justify-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 5))}
          disabled={currentIndex === 0}
        >
          <Rewind className="h-3 w-3" />
        </Button>

        <Button
          size="sm"
          className={`h-7 w-7 p-0 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => setCurrentIndex(Math.min(history.length - 1, currentIndex + 5))}
          disabled={currentIndex >= history.length - 1}
        >
          <FastForward className="h-3 w-3" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleReset}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs font-bold"
          onClick={cycleSpeed}
        >
          {speed}x
        </Button>
      </div>
    </div>
  );
};
