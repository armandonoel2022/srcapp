import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Car, 
  MapPin,
  History,
  RefreshCw,
  Play,
  AlertTriangle
} from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { useGPSHistory } from '@/hooks/useGPSHistory';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import { RouteSimulation } from '@/components/RouteSimulation';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GPSSession {
  type: string;
  user: string;
  name?: string;
  timestamp: number;
}

export const GPSMapa = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { devices, refetch: refetchDevices } = useGPSDevices();
  const { mapboxToken } = useSettings();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // URL params
  const deviceIdParam = searchParams.get('device');
  const modeParam = searchParams.get('mode');
  
  // State
  const [gpsSession, setGpsSession] = useState<GPSSession | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(
    deviceIdParam ? parseInt(deviceIdParam) : null
  );
  const [mode, setMode] = useState<'live' | 'history'>(
    modeParam === 'history' ? 'history' : 'live'
  );
  const [showOriginalRoute, setShowOriginalRoute] = useState(true);
  const [showAdjustedRoute, setShowAdjustedRoute] = useState(true);
  const [autoCenter, setAutoCenter] = useState(true);
  
  // History filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [frequency, setFrequency] = useState('60'); // seconds
  
  const { 
    history, 
    adjustedRoute, 
    loading: historyLoading, 
    error: historyError,
    fetchHistory 
  } = useGPSHistory();

  // Check for GPS session
  useEffect(() => {
    const sessionData = localStorage.getItem('gps_session');
    if (!sessionData) {
      navigate('/gps-login', { replace: true });
      return;
    }
    
    try {
      const session = JSON.parse(sessionData) as GPSSession;
      if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('gps_session');
        navigate('/gps-login', { replace: true });
        return;
      }
      setGpsSession(session);
    } catch {
      navigate('/gps-login', { replace: true });
    }
  }, [navigate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !gpsSession) return;
    
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-69.9312, 18.4861], // Santo Domingo
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, gpsSession]);

  // Update markers for live mode
  useEffect(() => {
    if (!map.current || mode !== 'live') return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each device
    devices.forEach((device) => {
      if (!device.latitude || !device.longitude) return;

      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position: relative;">
          <div style="
            width: 40px;
            height: 40px;
            background: ${device.status === 'online' ? '#10b981' : '#ef4444'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
          ">
            <svg style="width: 24px; height: 24px; fill: white;" viewBox="0 0 24 24">
              <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m-11 0a1.5 1.5 0 01-1.5-1.5A1.5 1.5 0 017.5 13a1.5 1.5 0 011.5 1.5A1.5 1.5 0 017.5 16M5 11v5a1 1 0 001 1h1a2 2 0 002-2V11H5zm10 0v4a2 2 0 002 2h1a1 1 0 001-1v-5h-4z"/>
            </svg>
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          ">${device.name}</div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([device.longitude, device.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">${device.name}</h3>
              <p style="margin: 4px 0;"><strong>Estado:</strong> ${device.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea'}</p>
              <p style="margin: 4px 0;"><strong>Velocidad:</strong> ${Math.round(device.speed || 0)} km/h</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${device.address || 'Sin dirección'}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current.push(marker);

      // Center on selected device
      if (selectedDevice === device.id && autoCenter) {
        map.current?.flyTo({
          center: [device.longitude, device.latitude],
          zoom: 15,
        });
      }
    });

    // If no device selected and we have devices, fit bounds
    if (!selectedDevice && devices.length > 0) {
      const validDevices = devices.filter(d => d.latitude && d.longitude);
      if (validDevices.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validDevices.forEach(d => bounds.extend([d.longitude!, d.latitude!]));
        map.current?.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [devices, mode, selectedDevice, autoCenter]);

  // Handle history mode
  const handleLoadHistory = async () => {
    if (!selectedDevice) {
      toast({
        title: "Selecciona un vehículo",
        description: "Debes seleccionar un vehículo para ver su historial",
        variant: "destructive",
      });
      return;
    }

    await fetchHistory(selectedDevice, startDate, endDate, parseInt(frequency));
  };

  // Draw history routes on map
  // Draw history routes on map
  useEffect(() => {
    if (!map.current || mode !== 'history') return;

    // Wait for map to be fully loaded before drawing
    const drawRoutes = () => {
      if (!map.current) return;
      
      // Remove existing route layers
      ['original-route', 'adjusted-route'].forEach(id => {
        if (map.current?.getLayer(id)) map.current.removeLayer(id);
        if (map.current?.getSource(id)) map.current.removeSource(id);
      });

      // Clear markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      if (history.length === 0) return;

      // Draw original route (dashed purple line) - connects all GPS points
      if (showOriginalRoute && history.length > 1) {
        const coordinates = history.map(p => [p.longitude, p.latitude]);
        
        try {
          map.current.addSource('original-route', {
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

          map.current.addLayer({
            id: 'original-route',
            type: 'line',
            source: 'original-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#8b5cf6',
              'line-width': 5,
              'line-opacity': 0.8,
              'line-dasharray': [2, 1],
            },
          });
          console.log('Original route drawn with', coordinates.length, 'points');
        } catch (err) {
          console.error('Error drawing original route:', err);
        }
      }

      // Draw adjusted route (solid blue line)
      if (showAdjustedRoute && adjustedRoute.length > 1) {
        try {
          map.current.addSource('adjusted-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: adjustedRoute,
              },
            },
          });

          map.current.addLayer({
            id: 'adjusted-route',
            type: 'line',
            source: 'adjusted-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 6,
              'line-opacity': 0.8,
            },
          });
          console.log('Adjusted route drawn with', adjustedRoute.length, 'points');
        } catch (err) {
          console.error('Error drawing adjusted route:', err);
        }
      }

      // Add start and end markers
      if (history.length > 0) {
        const start = history[0];
        const end = history[history.length - 1];

        // Start marker (green)
        const startEl = document.createElement('div');
        startEl.innerHTML = `
          <div style="
            width: 28px;
            height: 28px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">A</div>
        `;
        const startMarker = new mapboxgl.Marker({ element: startEl })
          .setLngLat([start.longitude, start.latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 8px;">
              <p style="font-weight: bold; color: #10b981;">INICIO</p>
              <p style="font-size: 12px;">Hora: ${new Date(start.deviceTime).toLocaleString()}</p>
              <p style="font-size: 12px;">Velocidad: ${start.speed} km/h</p>
            </div>
          `))
          .addTo(map.current);
        markersRef.current.push(startMarker);

        // End marker (red)
        const endEl = document.createElement('div');
        endEl.innerHTML = `
          <div style="
            width: 28px;
            height: 28px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">B</div>
        `;
        const endMarker = new mapboxgl.Marker({ element: endEl })
          .setLngLat([end.longitude, end.latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 8px;">
              <p style="font-weight: bold; color: #ef4444;">FIN</p>
              <p style="font-size: 12px;">Hora: ${new Date(end.deviceTime).toLocaleString()}</p>
              <p style="font-size: 12px;">Velocidad: ${end.speed} km/h</p>
            </div>
          `))
          .addTo(map.current);
        markersRef.current.push(endMarker);

        // Fit bounds to route with good padding and max zoom to see streets
        const bounds = new mapboxgl.LngLatBounds();
        history.forEach(p => bounds.extend([p.longitude, p.latitude]));
        map.current.fitBounds(bounds, { 
          padding: { top: 80, bottom: 80, left: 80, right: 280 },
          maxZoom: 16
        });
      }
    };

    // Check if map style is loaded
    if (map.current.isStyleLoaded()) {
      drawRoutes();
    } else {
      map.current.once('load', drawRoutes);
    }
  }, [history, adjustedRoute, mode, showOriginalRoute, showAdjustedRoute]);

  // Auto refresh for live mode
  useEffect(() => {
    if (mode !== 'live') return;
    const interval = setInterval(refetchDevices, 30000);
    return () => clearInterval(interval);
  }, [mode, refetchDevices]);

  if (!gpsSession) return null;

  if (!mapboxToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Token de Mapbox Requerido</h2>
            <p className="text-gray-600">
              Configura tu token de Mapbox en la configuración de la aplicación.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-800"
              onClick={() => navigate('/gps-panel')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Panel
            </Button>
            <h1 className="text-lg font-semibold hidden sm:block">
              {mode === 'live' ? 'Mapa en Tiempo Real' : 'Historial de Rutas'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={mode === 'live' ? 'default' : 'ghost'}
              size="sm"
              className={mode === 'live' ? 'bg-green-600 hover:bg-green-700' : 'text-white hover:bg-blue-800'}
              onClick={() => setMode('live')}
            >
              <MapPin className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Tiempo Real</span>
            </Button>
            <Button
              variant={mode === 'history' ? 'default' : 'ghost'}
              size="sm"
              className={mode === 'history' ? 'bg-purple-600 hover:bg-purple-700' : 'text-white hover:bg-blue-800'}
              onClick={() => setMode('history')}
            >
              <History className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Historial</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Control Panel */}
        <aside className="w-80 bg-white shadow-lg overflow-y-auto hidden md:block">
          <div className="p-4 space-y-4">
            {/* Vehicle selector */}
            <div>
              <Label>Vehículo</Label>
              <Select 
                value={selectedDevice ? selectedDevice.toString() : 'all'}
                onValueChange={(v) => setSelectedDevice(v === 'all' ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">Todos los vehículos</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        {device.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === 'live' && (
              <>
                {/* Live mode controls */}
                <div className="flex items-center justify-between">
                  <Label>Auto-centrar mapa</Label>
                  <Switch checked={autoCenter} onCheckedChange={setAutoCenter} />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => refetchDevices()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar Ahora
                </Button>

                {/* Device info */}
                {selectedDevice && devices.find(d => d.id === selectedDevice) && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      {(() => {
                        const device = devices.find(d => d.id === selectedDevice)!;
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Estado</span>
                              <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                                {device.status === 'online' ? 'En línea' : 'Fuera de línea'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Velocidad</span>
                              <span className="font-medium">{Math.round(device.speed || 0)} km/h</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Ubicación:</span>
                              <p className="text-gray-800">{device.address || 'No disponible'}</p>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {mode === 'history' && (
              <>
                {/* History mode controls */}
                <div>
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Frecuencia de Puntos</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Cada 10 segundos</SelectItem>
                      <SelectItem value="30">Cada 30 segundos</SelectItem>
                      <SelectItem value="60">Cada 1 minuto</SelectItem>
                      <SelectItem value="300">Cada 5 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleLoadHistory}
                  disabled={historyLoading || !selectedDevice}
                >
                  {historyLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ver Historial
                    </>
                  )}
                </Button>

                {history.length > 0 && (
                  <>
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-medium text-gray-700">Opciones de Visualización</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-purple-500" style={{ borderStyle: 'dashed' }} />
                          <span className="text-sm">Ruta Original (GPS)</span>
                        </div>
                        <Switch 
                          checked={showOriginalRoute} 
                          onCheckedChange={setShowOriginalRoute}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-blue-500" />
                          <span className="text-sm">Ruta Ajustada</span>
                        </div>
                        <Switch 
                          checked={showAdjustedRoute} 
                          onCheckedChange={setShowAdjustedRoute}
                        />
                      </div>
                    </div>

                    <Card className="bg-purple-50">
                      <CardContent className="p-3 text-sm">
                        <p><strong>Puntos históricos:</strong> {history.length}</p>
                        {adjustedRoute.length > 0 ? (
                          <p className="text-green-600 mt-1">
                            ✓ Ruta ajustada: {adjustedRoute.length} puntos
                          </p>
                        ) : (
                          <p className="text-yellow-600 mt-1">
                            ⚠ No se pudo ajustar la ruta
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3 text-sm text-blue-800">
                        <p className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-500 rounded-full inline-flex items-center justify-center text-white text-xs font-bold">SRC</span>
                          Recorrido automático - usa los controles en el mapa
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}

                {historyError && (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-3 text-sm text-red-600">
                      {historyError}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Route Simulation Controls - auto-shows when history is loaded */}
          {mode === 'history' && history.length >= 2 && (
            <RouteSimulation
              map={map.current}
              history={history}
            />
          )}
          
          {/* Compact map legend */}
          {mode === 'history' && history.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">A</div>
                  <span>Inicio</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">B</div>
                  <span>Fin</span>
                </div>
                {showOriginalRoute && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 border-t-2 border-dashed border-purple-500" />
                    <span>GPS</span>
                  </div>
                )}
                {showAdjustedRoute && adjustedRoute.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-1 bg-blue-500 rounded" />
                    <span>Ruta</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
