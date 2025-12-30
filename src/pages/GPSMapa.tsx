import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Car, 
  Clock, 
  MapPin,
  History,
  RefreshCw,
  Eye,
  EyeOff,
  Play,
  Gauge,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { useGPSHistory } from '@/hooks/useGPSHistory';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export const GPSMapa = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { devices, refetch: refetchDevices } = useGPSDevices();
  const { mapboxToken } = useSettings();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});
  
  // URL params
  const deviceIdParam = searchParams.get('device');
  const modeParam = searchParams.get('mode');
  
  // State
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
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
  }, [mapboxToken]);

  // Update markers for live mode
  useEffect(() => {
    if (!map.current || mode !== 'live') return;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add markers for each device
    devices.forEach((device) => {
      if (!device.latitude || !device.longitude) return;

      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${device.status === 'online' ? 'animate-pulse' : 'opacity-60'}">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 01-1.5-1.5 1.5 1.5 0 011.5-1.5 1.5 1.5 0 011.5 1.5 1.5 1.5 0 01-1.5 1.5m-11 0a1.5 1.5 0 01-1.5-1.5A1.5 1.5 0 017.5 13a1.5 1.5 0 011.5 1.5A1.5 1.5 0 017.5 16M5 11v5a1 1 0 001 1h1a2 2 0 002-2V11H5zm10 0v4a2 2 0 002 2h1a1 1 0 001-1v-5h-4z"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white px-1 rounded text-xs font-medium shadow truncate max-w-20">
            ${device.name}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([device.longitude, device.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold">${device.name}</h3>
              <p class="text-sm text-gray-600">${device.address || 'Sin dirección'}</p>
              <p class="text-sm">Velocidad: ${Math.round(device.speed || 0)} km/h</p>
              <p class="text-sm">Estado: ${device.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea'}</p>
            </div>
          `)
        )
        .addTo(map.current!);

      markersRef.current[device.id] = marker;

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
  useEffect(() => {
    if (!map.current || mode !== 'history') return;

    // Remove existing route layers
    ['original-route', 'adjusted-route', 'history-points'].forEach(id => {
      if (map.current?.getLayer(id)) map.current.removeLayer(id);
      if (map.current?.getSource(id)) map.current.removeSource(id);
    });

    // Clear markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (history.length === 0) return;

    // Draw original route
    if (showOriginalRoute && history.length > 1) {
      const coordinates = history.map(p => [p.longitude, p.latitude]);
      
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
          'line-color': '#ef4444',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });
    }

    // Draw adjusted route
    if (showAdjustedRoute && adjustedRoute.length > 1) {
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
          'line-color': '#22c55e',
          'line-width': 4,
        },
      });
    }

    // Add start and end markers
    if (history.length > 0) {
      const start = history[0];
      const end = history[history.length - 1];

      // Start marker
      const startEl = document.createElement('div');
      startEl.innerHTML = `
        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
          A
        </div>
      `;
      new mapboxgl.Marker({ element: startEl })
        .setLngLat([start.longitude, start.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <p class="font-bold">Inicio</p>
            <p class="text-sm">${new Date(start.deviceTime).toLocaleString()}</p>
          </div>
        `))
        .addTo(map.current);

      // End marker
      const endEl = document.createElement('div');
      endEl.innerHTML = `
        <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
          B
        </div>
      `;
      new mapboxgl.Marker({ element: endEl })
        .setLngLat([end.longitude, end.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <p class="font-bold">Fin</p>
            <p class="text-sm">${new Date(end.deviceTime).toLocaleString()}</p>
          </div>
        `))
        .addTo(map.current);

      // Fit bounds to route
      const bounds = new mapboxgl.LngLatBounds();
      history.forEach(p => bounds.extend([p.longitude, p.latitude]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [history, adjustedRoute, mode, showOriginalRoute, showAdjustedRoute]);

  // Auto refresh for live mode
  useEffect(() => {
    if (mode !== 'live') return;
    const interval = setInterval(refetchDevices, 30000);
    return () => clearInterval(interval);
  }, [mode, refetchDevices]);

  if (!user) {
    navigate('/gps-login');
    return null;
  }

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
              className={mode === 'history' ? 'bg-orange-600 hover:bg-orange-700' : 'text-white hover:bg-blue-800'}
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
                value={selectedDevice?.toString() || ''} 
                onValueChange={(v) => setSelectedDevice(v ? parseInt(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los vehículos</SelectItem>
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
                      <SelectItem value="30">Cada 30 segundos</SelectItem>
                      <SelectItem value="60">Cada 1 minuto</SelectItem>
                      <SelectItem value="300">Cada 5 minutos</SelectItem>
                      <SelectItem value="600">Cada 10 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
                      Cargar Historial
                    </>
                  )}
                </Button>

                {history.length > 0 && (
                  <>
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="font-medium text-gray-700">Opciones de Visualización</h4>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-red-500" style={{ borderStyle: 'dashed' }} />
                          <span className="text-sm">Ruta Original (GPS)</span>
                        </div>
                        <Switch 
                          checked={showOriginalRoute} 
                          onCheckedChange={setShowOriginalRoute}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 bg-green-500" />
                          <span className="text-sm">Ruta Ajustada</span>
                        </div>
                        <Switch 
                          checked={showAdjustedRoute} 
                          onCheckedChange={setShowAdjustedRoute}
                        />
                      </div>
                    </div>

                    <Card className="bg-blue-50">
                      <CardContent className="p-3 text-sm">
                        <p><strong>Puntos:</strong> {history.length}</p>
                        {adjustedRoute.length > 0 && (
                          <p className="text-green-600 mt-1">
                            ✓ Ruta ajustada a calles exitosamente
                          </p>
                        )}
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
          
          {/* Map legend */}
          {mode === 'history' && history.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
              <h4 className="font-medium mb-2">Leyenda</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                  <span>Inicio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>
                  <span>Fin</span>
                </div>
                {showOriginalRoute && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 border-t-2 border-dashed border-red-500" />
                    <span>Ruta GPS</span>
                  </div>
                )}
                {showAdjustedRoute && adjustedRoute.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-1 bg-green-500" />
                    <span>Ruta Ajustada</span>
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
