import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

// Datos del mapa de calor del Distrito Nacional
const heatMapZones = [
  // Zonas Rojas (Calientes)
  { name: "La Ciénaga", type: "hot", color: "red", coords: [18.4861, -69.9312] },
  { name: "Villa Juana", type: "hot", color: "red", coords: [18.4611, -69.9242] },
  { name: "Cristo Rey", type: "hot", color: "red", coords: [18.4589, -69.9456] },
  { name: "Gualey", type: "hot", color: "red", coords: [18.4789, -69.9123] },
  { name: "Simón Bolívar", type: "hot", color: "red", coords: [18.4678, -69.9234] },
  { name: "24 de Abril", type: "hot", color: "red", coords: [18.4756, -69.9334] },
  { name: "Capotillo", type: "hot", color: "red", coords: [18.4912, -69.9456] },
  { name: "Guachupita", type: "hot", color: "red", coords: [18.4834, -69.9201] },
  { name: "Villa Consuelo", type: "hot", color: "red", coords: [18.4523, -69.9123] },
  { name: "Los Alcarrizos (parte)", type: "hot", color: "red", coords: [18.4445, -69.9567] },
  
  // Zonas Amarillas (Intermedias)
  { name: "Villa Agrippina", type: "intermediate", color: "yellow", coords: [18.4712, -69.9345] },
  { name: "Palma Real", type: "intermediate", color: "yellow", coords: [18.4823, -69.9123] },
  { name: "Los Cacicazgos", type: "intermediate", color: "yellow", coords: [18.4756, -69.9012] },
  { name: "Mirador Norte", type: "intermediate", color: "yellow", coords: [18.4934, -69.9234] },
  { name: "Villa María", type: "intermediate", color: "yellow", coords: [18.4623, -69.9345] },
  { name: "Ensanche Quisqueya", type: "intermediate", color: "yellow", coords: [18.4689, -69.9123] },
  { name: "Los Jardines", type: "intermediate", color: "yellow", coords: [18.4567, -69.9234] },
  { name: "Villa Francisca", type: "intermediate", color: "yellow", coords: [18.4678, -69.9456] },
  
  // Zonas Verdes (Frías)
  { name: "Zona Colonial", type: "cold", color: "green", coords: [18.4539, -69.8826] },
  { name: "Gazcue", type: "cold", color: "green", coords: [18.4656, -69.9012] },
  { name: "Zona Universitaria", type: "cold", color: "green", coords: [18.4623, -69.8934] },
  { name: "Mirador Sur", type: "cold", color: "green", coords: [18.4567, -69.9234] },
  { name: "Bella Vista", type: "cold", color: "green", coords: [18.4712, -69.9123] },
  { name: "Ensanche Naco", type: "cold", color: "green", coords: [18.4789, -69.9012] },
  { name: "Piantini", type: "cold", color: "green", coords: [18.4823, -69.9234] },
  { name: "Ensanche Paraíso", type: "cold", color: "green", coords: [18.4756, -69.9345] },
  { name: "Ensanche Serralles", type: "cold", color: "green", coords: [18.4689, -69.9456] },
  { name: "La Esperilla", type: "cold", color: "green", coords: [18.4634, -69.9123] },
  { name: "Evaristo Morales", type: "cold", color: "green", coords: [18.4767, -69.9234] }
];

export const InteractiveHeatMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [filteredZones, setFilteredZones] = useState(heatMapZones);
  const [map, setMap] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { mapboxToken, geolocationEnabled } = useSettings();

  // Filtrar zonas por búsqueda
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = heatMapZones.filter(zone => 
        zone.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredZones(filtered);
    } else {
      setFilteredZones(heatMapZones);
    }
  }, [searchQuery]);

  // Inicializar mapa cuando hay token
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    const initializeMap = async () => {
      try {
        const mapboxgl = await import('mapbox-gl');
        await import('mapbox-gl/dist/mapbox-gl.css');
        
        mapboxgl.default.accessToken = mapboxToken;

        const mapInstance = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-69.9156, 18.4655], // Centro de Santo Domingo
          zoom: 11,
          projection: 'mercator' as any
        });

        mapInstance.addControl(new mapboxgl.default.NavigationControl(), 'top-right');

        mapInstance.on('load', () => {
          // Agregar marcadores para cada zona
          heatMapZones.forEach(zone => {
            const markerColor = zone.type === 'hot' ? '#ef4444' : 
                               zone.type === 'intermediate' ? '#f59e0b' : '#22c55e';
            
            const popup = new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2">
                  <h3 class="font-bold text-sm">${zone.name}</h3>
                  <p class="text-xs text-gray-600">
                    ${zone.type === 'hot' ? 'Zona Caliente - Alto riesgo' :
                      zone.type === 'intermediate' ? 'Zona Intermedia - Riesgo moderado' :
                      'Zona Fría - Bajo riesgo'}
                  </p>
                </div>
              `);

            const marker = new mapboxgl.default.Marker({ color: markerColor })
              .setLngLat([zone.coords[1], zone.coords[0]])
              .setPopup(popup)
              .addTo(mapInstance);

            marker.getElement().addEventListener('click', () => {
              setSelectedZone(zone);
            });
          });
        });

        setMap(mapInstance);

        return () => {
          mapInstance.remove();
        };
      } catch (error) {
        console.error('Error loading Mapbox:', error);
        toast({
          title: "Error al cargar el mapa",
          description: "Verifica que el token de Mapbox sea válido",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [mapboxToken, toast]);

  const getCurrentLocation = () => {
    if (!geolocationEnabled) {
      toast({
        title: "Geolocalización deshabilitada",
        description: "Activa la geolocalización en la configuración",
        variant: "destructive"
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "La geolocalización no está disponible en este navegador",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Centrar mapa en ubicación actual
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 14 });
          
          // Agregar marcador de ubicación actual
          const mapboxgl = require('mapbox-gl');
          new mapboxgl.Marker({ color: '#3b82f6' })
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setHTML('<div class="p-2"><strong>Tu ubicación</strong></div>'))
            .addTo(map);
        }
        
        // Verificar en qué zona está el usuario
        const nearestZone = findNearestZone(latitude, longitude);
        if (nearestZone) {
          setSelectedZone(nearestZone);
          toast({
            title: "Ubicación detectada",
            description: `Te encuentras cerca de ${nearestZone.name} - ${getZoneTypeName(nearestZone.type)}`,
          });
        }
      },
      (error) => {
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación actual",
          variant: "destructive"
        });
      }
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Búsqueda vacía",
        description: "Ingresa el nombre de una zona para buscar",
        variant: "destructive"
      });
      return;
    }

    const foundZone = heatMapZones.find(zone => 
      zone.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundZone) {
      setSelectedZone(foundZone);
      if (map) {
        map.flyTo({ 
          center: [foundZone.coords[1], foundZone.coords[0]], 
          zoom: 15 
        });
      }
      toast({
        title: "Zona encontrada",
        description: `Mostrando información de ${foundZone.name}`,
      });
    } else {
      toast({
        title: "Zona no encontrada",
        description: "No se encontró ninguna zona con ese nombre",
        variant: "destructive"
      });
    }
  };

  const findNearestZone = (lat: number, lng: number) => {
    let nearestZone = null;
    let minDistance = Infinity;

    heatMapZones.forEach(zone => {
      const distance = calculateDistance(lat, lng, zone.coords[0], zone.coords[1]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });

    return minDistance < 2 ? nearestZone : null; // Solo si está dentro de 2km
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getZoneTypeName = (type: string) => {
    switch (type) {
      case 'hot': return 'Zona Caliente (Alto riesgo)';
      case 'intermediate': return 'Zona Intermedia (Riesgo moderado)';
      case 'cold': return 'Zona Fría (Bajo riesgo)';
      default: return 'Desconocido';
    }
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'hot': return <AlertTriangle className="h-4 w-4" />;
      case 'intermediate': return <AlertCircle className="h-4 w-4" />;
      case 'cold': return <CheckCircle className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getZoneBadgeVariant = (type: string) => {
    switch (type) {
      case 'hot': return 'destructive';
      case 'intermediate': return 'secondary';
      case 'cold': return 'default';
      default: return 'outline';
    }
  };

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Configuración requerida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para usar el mapa interactivo, necesitas configurar un token de Mapbox. 
              Ve a la configuración (ícono de engranaje) para agregarlo.
              <br /><br />
              Puedes obtener un token gratuito en{' '}
              <a 
                href="https://mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Calor Interactivo - Distrito Nacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Haz clic en los marcadores del mapa para ver información detallada de cada zona.
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar zona, barrio o municipio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant="default">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button onClick={getCurrentLocation} variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Mi Ubicación
            </Button>
          </div>

          {/* Map Container */}
          <div className="w-full h-96 rounded-lg border overflow-hidden">
            <div ref={mapContainer} className="w-full h-full" />
          </div>

          {/* Current Location Status */}
          {currentLocation && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm">
                    Ubicación actual: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </span>
                </div>
                {selectedZone && (
                  <div className="mt-2">
                    <Badge variant={getZoneBadgeVariant(selectedZone.type)} className="mr-2">
                      {getZoneIcon(selectedZone.type)}
                      <span className="ml-1">{selectedZone.name}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getZoneTypeName(selectedZone.type)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Selected Zone Details */}
      {selectedZone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getZoneIcon(selectedZone.type)}
              Detalles de {selectedZone.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Nivel de riesgo:</span>
                <Badge variant={getZoneBadgeVariant(selectedZone.type)}>
                  {getZoneTypeName(selectedZone.type)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Coordenadas:</span>
                <span className="font-mono text-sm">
                  {selectedZone.coords[0].toFixed(4)}, {selectedZone.coords[1].toFixed(4)}
                </span>
              </div>
              <div className="mt-4 p-3 rounded bg-muted/50">
                <h4 className="font-medium mb-2">Recomendaciones de seguridad:</h4>
                {selectedZone.type === 'hot' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Evitar transitar solo, especialmente en horas nocturnas</li>
                    <li>• Mantener objetos de valor ocultos</li>
                    <li>• Estar atento al entorno en todo momento</li>
                    <li>• Considerar rutas alternativas si es posible</li>
                  </ul>
                )}
                {selectedZone.type === 'intermediate' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Mantener precauciones normales de seguridad</li>
                    <li>• Evitar mostrar objetos de valor</li>
                    <li>• Preferir horarios diurnos para actividades</li>
                  </ul>
                )}
                {selectedZone.type === 'cold' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Zona relativamente segura</li>
                    <li>• Mantener precauciones básicas</li>
                    <li>• Actividades comerciales y turísticas regulares</li>
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchQuery && filteredZones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados de búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredZones.map((zone) => (
                <div
                  key={zone.name}
                  className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedZone(zone);
                    if (map) {
                      map.flyTo({ 
                        center: [zone.coords[1], zone.coords[0]], 
                        zoom: 15 
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {getZoneIcon(zone.type)}
                    <span className="font-medium">{zone.name}</span>
                  </div>
                  <Badge variant={getZoneBadgeVariant(zone.type)}>
                    {zone.type === 'hot' ? 'ALTO' : zone.type === 'intermediate' ? 'MEDIO' : 'BAJO'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded border border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-destructive">Zona Caliente</div>
                <div className="text-xs text-muted-foreground">Alto riesgo de seguridad</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-orange-200 bg-orange-50">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-600">Zona Intermedia</div>
                <div className="text-xs text-muted-foreground">Riesgo moderado</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-600">Zona Fría</div>
                <div className="text-xs text-muted-foreground">Bajo riesgo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};