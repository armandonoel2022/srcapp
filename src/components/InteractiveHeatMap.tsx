import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Info, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { FullScreenMap } from '@/components/FullScreenMap';

// Zonas del Distrito Nacional - Listado completo
const heatMapZones = [
  { name: "24 de Abril", type: "hot", color: "red", coords: [18.497878, -69.883417] },
  { name: "Cristo Rey", type: "hot", color: "red", coords: [18.488505, -69.895349] },
  { name: "Domingo Savio", type: "hot", color: "red", coords: [18.495288, -69.888075] },
  { name: "Ensanche Capotillo", type: "hot", color: "red", coords: [18.507381, -69.901876] },
  { name: "Gualey", type: "hot", color: "red", coords: [18.499763, -69.891837] },
  { name: "La Zurza", type: "hot", color: "red", coords: [18.505435, -69.886834] },
  { name: "Los Jardines", type: "hot", color: "red", coords: [18.490207, -69.889397] },
  { name: "Los Restauradores", type: "hot", color: "red", coords: [18.473739, -69.909137] },
  { name: "Nuevo Arroyo Hondo", type: "hot", color: "red", coords: [18.502733, -69.890475] },
  { name: "Nuestra Señora de la Paz", type: "hot", color: "red", coords: [18.443993, -69.906206] },
  { name: "Palma Real", type: "hot", color: "red", coords: [18.492512, -69.884084] },
  { name: "Simón Bolívar", type: "hot", color: "red", coords: [18.487237, -69.903833] },
  { name: "Villa Consuelo", type: "hot", color: "red", coords: [18.499863, -69.898137] },
  { name: "Villa Francisca", type: "hot", color: "red", coords: [18.501873, -69.899408] },
  { name: "Villa Juana", type: "hot", color: "red", coords: [18.495766, -69.897355] },
  { name: "Altos de Arroyo Hondo", type: "intermediate", color: "yellow", coords: [18.488585, -69.883337] },
  { name: "Buenos Aires", type: "intermediate", color: "yellow", coords: [18.478221, -69.903802] },
  { name: "Ensanche Espaillat", type: "intermediate", color: "yellow", coords: [18.471756, -69.890189] },
  { name: "Ensanche La Fe", type: "intermediate", color: "yellow", coords: [18.453579, -69.883194] },
  { name: "Ensanche Luperón", type: "intermediate", color: "yellow", coords: [18.509765, -69.892776] },
  { name: "Ensanche Quisqueya", type: "intermediate", color: "yellow", coords: [18.499598, -69.898422] },
  { name: "Honduras del Norte", type: "intermediate", color: "yellow", coords: [18.508700, -69.891990] },
  { name: "Honduras del Oeste", type: "intermediate", color: "yellow", coords: [18.493714, -69.902170] },
  { name: "Jardines del Sur", type: "intermediate", color: "yellow", coords: [18.487508, -69.888722] },
  { name: "Julieta Morales", type: "intermediate", color: "yellow", coords: [18.477233, -69.884358] },
  { name: "La Agustina", type: "intermediate", color: "yellow", coords: [18.491606, -69.898417] },
  { name: "La Hondonada", type: "intermediate", color: "yellow", coords: [18.450578, -69.894164] },
  { name: "La Isabela", type: "intermediate", color: "yellow", coords: [18.507069, -69.900611] },
  { name: "La Julia", type: "intermediate", color: "yellow", coords: [18.477881, -69.892533] },
  { name: "Las Praderas", type: "intermediate", color: "yellow", coords: [18.488879, -69.890641] },
  { name: "Los Peralejos", type: "intermediate", color: "yellow", coords: [18.509583, -69.890091] },
  { name: "Los Ríos", type: "intermediate", color: "yellow", coords: [18.488154, -69.885817] },
  { name: "María Auxiliadora", type: "intermediate", color: "yellow", coords: [18.478637, -69.898413] },
  { name: "Mata Hambre", type: "intermediate", color: "yellow", coords: [18.445989, -69.882972] },
  { name: "Mejoramiento Social", type: "intermediate", color: "yellow", coords: [18.462462, -69.891256] },
  { name: "Mirador Norte", type: "intermediate", color: "yellow", coords: [18.451860, -69.897212] },
  { name: "Miraflores", type: "intermediate", color: "yellow", coords: [18.452282, -69.884280] },
  { name: "Miramar", type: "intermediate", color: "yellow", coords: [18.453706, -69.887166] },
  { name: "Paseo de los Indios", type: "intermediate", color: "yellow", coords: [18.449313, -69.905945] },
  { name: "Los Próceres", type: "intermediate", color: "yellow", coords: [18.461390, -69.884935] },
  { name: "Renacimiento", type: "intermediate", color: "yellow", coords: [18.479797, -69.895141] },
  { name: "Viejo Arroyo Hondo", type: "intermediate", color: "yellow", coords: [18.455476, -69.895412] },
  { name: "Villas Agrícolas", type: "intermediate", color: "yellow", coords: [18.470314, -69.903984] },
  { name: "30 de Mayo", type: "cold", color: "green", coords: [18.504925, -69.894532] },
  { name: "Arroyo Manzano", type: "cold", color: "green", coords: [18.504014, -69.902393] },
  { name: "Atala", type: "cold", color: "green", coords: [18.479062, -69.895818] },
  { name: "Bella Vista", type: "cold", color: "green", coords: [18.441362, -69.888175] },
  { name: "El Cacique", type: "cold", color: "green", coords: [18.506927, -69.908688] },
  { name: "Centro de los Héroes", type: "cold", color: "green", coords: [18.471893, -69.896859] },
  { name: "Centro Olímpico", type: "cold", color: "green", coords: [18.487083, -69.906702] },
  { name: "Cerros de Arroyo Hondo", type: "cold", color: "green", coords: [18.470562, -69.902018] },
  { name: "Ciudad Colonial", type: "cold", color: "green", coords: [18.470559, -69.886930] },
  { name: "Ciudad Nueva", type: "cold", color: "green", coords: [18.446137, -69.881238] },
  { name: "Ciudad Universitaria", type: "cold", color: "green", coords: [18.473095, -69.903901] },
  { name: "El Millón", type: "cold", color: "green", coords: [18.474448, -69.885801] },
  { name: "Ensanche Naco", type: "cold", color: "green", coords: [18.495130, -69.884036] },
  { name: "Gascue", type: "cold", color: "green", coords: [18.447708, -69.904161] },
  { name: "General Antonio Duverge", type: "cold", color: "green", coords: [18.476234, -69.896119] },
  { name: "Jardín Botánico", type: "cold", color: "green", coords: [18.442856, -69.902565] },
  { name: "Jardín Zoológico", type: "cold", color: "green", coords: [18.502321, -69.903194] },
  { name: "La Castellana", type: "cold", color: "green", coords: [18.455672, -69.889563] },
  { name: "La Esperilla", type: "cold", color: "green", coords: [18.477404, -69.905623] },
  { name: "Los Cacicazgos", type: "cold", color: "green", coords: [18.464052, -69.880419] },
  { name: "Los Prados", type: "cold", color: "green", coords: [18.497975, -69.883099] },
  { name: "Mirador Sur", type: "cold", color: "green", coords: [18.507991, -69.889138] },
  { name: "Paraíso", type: "cold", color: "green", coords: [18.443605, -69.887395] },
  { name: "Piantini", type: "cold", color: "green", coords: [18.474850, -69.887869] },
  { name: "San Carlos", type: "cold", color: "green", coords: [18.480985, -69.903508] },
  { name: "San Diego", type: "cold", color: "green", coords: [18.479975, -69.890404] },
  { name: "San Geronimo", type: "cold", color: "green", coords: [18.448231, -69.900209] },
  { name: "San Juan Bosco", type: "cold", color: "green", coords: [18.477594, -69.901184] }
];

export const InteractiveHeatMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [filteredZones, setFilteredZones] = useState(heatMapZones);
  const [map, setMap] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { mapboxToken, geolocationEnabled } = useSettings();

  // Separate zones by type
  const hotZones = heatMapZones.filter(zone => zone.type === 'hot');
  const intermediateZones = heatMapZones.filter(zone => zone.type === 'intermediate');
  const coldZones = heatMapZones.filter(zone => zone.type === 'cold');

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
          // Mapa limpio sin marcadores - solo mostrar el territorio del Distrito Nacional
          console.log('Mapa del Distrito Nacional cargado correctamente');
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

    // Mostrar indicador de carga
    toast({
      title: "Obteniendo ubicación...",
      description: "Por favor permite el acceso a tu ubicación",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Centrar mapa en ubicación actual
        if (map) {
          map.flyTo({ 
            center: [longitude, latitude], 
            zoom: 14,
            duration: 1500
          });
          
          // Agregar marcador de ubicación actual (solo este marcador está permitido)
          const mapboxgl = require('mapbox-gl');
          
          // Remover marcadores previos de ubicación
          const existingMarkers = document.querySelectorAll('.user-location-marker');
          existingMarkers.forEach(marker => marker.remove());
          
          // Crear nuevo marcador de ubicación del usuario
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.style.width = '15px';
          el.style.height = '15px';
          el.style.backgroundColor = '#3b82f6';
          el.style.border = '3px solid white';
          el.style.borderRadius = '50%';
          el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
          
          new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 15 })
                .setHTML('<div class="p-2 text-center"><strong>Tu ubicación actual</strong></div>')
            )
            .addTo(map);
        }
        
        toast({
          title: "Ubicación encontrada",
          description: `Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      (error) => {
        let errorMessage = "No se pudo obtener tu ubicación actual";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Actívalo en tu navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado al obtener la ubicación.";
            break;
        }
        
        toast({
          title: "Error de ubicación",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
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
          zoom: 15,
          duration: 1500
        });
      }
      toast({
        title: "Zona encontrada",
        description: `Información de ${foundZone.name}`,
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
            Mapa del Distrito Nacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Mapa interactivo del Distrito Nacional, Santo Domingo, República Dominicana.
          </div>
          
          {/* Controles con búsqueda restaurada */}
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
            <Button onClick={() => setIsFullScreen(true)} variant="outline">
              <Maximize2 className="h-4 w-4 mr-2" />
              Pantalla Completa
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
            <CardTitle className="text-lg">Resultados de búsqueda ({filteredZones.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getZoneIcon(zone.type)}
                      <span className="font-medium">{zone.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground ml-6">
                      {getZoneTypeName(zone.type)}
                    </div>
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

      {/* Zone Lists - Listados completos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zonas de Alto Riesgo ({hotZones.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Extremar precauciones - Basadas en estadísticas oficiales</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {hotZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between p-3 rounded border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedZone(zone);
                  if (map) {
                    map.flyTo({ 
                      center: [zone.coords[1], zone.coords[0]], 
                      zoom: 13 
                    });
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    Coordenadas: {zone.coords[0].toFixed(4)}, {zone.coords[1].toFixed(4)}
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">ALTO</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Intermediate Zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Zonas de Riesgo Moderado ({intermediateZones.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Mantener precaución - Nivel intermedio</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {intermediateZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between p-3 rounded border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedZone(zone);
                  if (map) {
                    map.flyTo({ 
                      center: [zone.coords[1], zone.coords[0]], 
                      zoom: 13 
                    });
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    Coordenadas: {zone.coords[0].toFixed(4)}, {zone.coords[1].toFixed(4)}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">MEDIO</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cold Zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Zonas de Bajo Riesgo ({coldZones.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Relativamente seguras - Precauciones básicas</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {coldZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between p-3 rounded border border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedZone(zone);
                  if (map) {
                    map.flyTo({ 
                      center: [zone.coords[1], zone.coords[0]], 
                      zoom: 13 
                    });
                  }
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    Coordenadas: {zone.coords[0].toFixed(4)}, {zone.coords[1].toFixed(4)}
                  </div>
                </div>
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">BAJO</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadísticas del Distrito Nacional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded bg-destructive/5 border border-destructive/20">
              <div className="text-2xl font-bold text-destructive">{hotZones.length}</div>
              <div className="text-sm text-muted-foreground">Zonas de Alto Riesgo</div>
              <div className="text-xs text-muted-foreground">
                Barrios clasificados como peligrosos
              </div>
            </div>
            <div className="text-center p-4 rounded bg-orange-50 border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{intermediateZones.length}</div>
              <div className="text-sm text-muted-foreground">Zonas de Riesgo Moderado</div>
              <div className="text-xs text-muted-foreground">
                Barrios con precauciones normales
              </div>
            </div>
            <div className="text-center p-4 rounded bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{coldZones.length}</div>
              <div className="text-sm text-muted-foreground">Zonas de Bajo Riesgo</div>
              <div className="text-xs text-muted-foreground">
                Barrios relativamente seguros
              </div>
            </div>
            <div className="text-center p-4 rounded bg-muted/50 border">
              <div className="text-2xl font-bold">{heatMapZones.length}</div>
              <div className="text-sm text-muted-foreground">Total de Sectores</div>
              <div className="text-xs text-muted-foreground">
                Barrios mapeados en el Distrito
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <div className="font-medium text-destructive">Zona de Alto Riesgo</div>
                <div className="text-xs text-muted-foreground">Extremar precauciones según estadísticas oficiales</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-orange-200 bg-orange-50">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-600">Zona de Riesgo Moderado</div>
                <div className="text-xs text-muted-foreground">Mantener precauciones normales</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-600">Zona de Bajo Riesgo</div>
                <div className="text-xs text-muted-foreground">Relativamente segura, precauciones básicas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Screen Map */}
      <FullScreenMap 
        isOpen={isFullScreen} 
        onClose={() => setIsFullScreen(false)} 
      />
    </div>
  );
};