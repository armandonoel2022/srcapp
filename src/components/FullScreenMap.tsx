import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Info, X, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

// Zonas del Distrito Nacional basadas en el mapa oficial
const heatMapZones = [
  // Zonas Rojas (Alto riesgo) - Basadas en las áreas rosadas del mapa oficial
  { name: "Zona Norte", type: "hot", color: "red", coords: [18.505, -69.885], population: 450000, area: "Norte del Distrito" },
  { name: "Zona Este", type: "hot", color: "red", coords: [18.475, -69.860], population: 380000, area: "Este del Distrito" },
  { name: "Zona Noroeste", type: "hot", color: "red", coords: [18.495, -69.910], population: 320000, area: "Noroeste del Distrito" },

  // Zonas Amarillas (Riesgo moderado) - Basadas en las áreas verdes/amarillentas del mapa
  { name: "Zona Central Norte", type: "intermediate", color: "yellow", coords: [18.485, -69.890], population: 250000, area: "Centro Norte" },
  { name: "Zona Central", type: "intermediate", color: "yellow", coords: [18.470, -69.895], population: 180000, area: "Centro del Distrito" },
  { name: "Zona Oeste", type: "intermediate", color: "yellow", coords: [18.460, -69.920], population: 150000, area: "Oeste del Distrito" },

  // Zonas Verdes (Bajo riesgo) - Centro histórico y áreas seguras
  { name: "Ciudad Colonial", type: "cold", color: "green", coords: [18.470, -69.887], population: 25000, area: "Centro Histórico" },
  { name: "Zona Universitaria", type: "cold", color: "green", coords: [18.473, -69.904], population: 35000, area: "Área Universitaria" },
  { name: "Zona Comercial Centro", type: "cold", color: "green", coords: [18.465, -69.892], population: 45000, area: "Centro Comercial" },
  { name: "Zona Residencial Sur", type: "cold", color: "green", coords: [18.450, -69.885], population: 65000, area: "Residencial Sur" },
  { name: "Malecón", type: "cold", color: "green", coords: [18.462, -69.878], population: 15000, area: "Zona Portuaria" }
];

interface FullScreenMapProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullScreenMap = ({ isOpen, onClose }: FullScreenMapProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { mapboxToken, geolocationEnabled } = useSettings();

  // Inicializar mapa cuando hay token y está abierto
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current) return;

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
          // Agregar áreas de zona en lugar de puntos individuales
          heatMapZones.forEach((zone, index) => {
            const markerColor = zone.type === 'hot' ? '#ef4444' : 
                               zone.type === 'intermediate' ? '#f59e0b' : '#22c55e';
            
            const popup = new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-3">
                  <h3 class="font-bold text-sm mb-1">${zone.name}</h3>
                  <p class="text-xs text-gray-600 mb-1">
                    ${zone.type === 'hot' ? 'Zona de Alto Riesgo' :
                      zone.type === 'intermediate' ? 'Zona de Riesgo Moderado' :
                      'Zona de Bajo Riesgo'}
                  </p>
                  <p class="text-xs text-gray-500 mb-1">
                    Área: ${zone.area}
                  </p>
                  <p class="text-xs text-gray-500">
                    Población aprox: ${zone.population?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              `);

            // Crear marcador representativo del área
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.backgroundColor = markerColor;
            el.style.width = zone.type === 'hot' ? '20px' : zone.type === 'intermediate' ? '16px' : '12px';
            el.style.height = zone.type === 'hot' ? '20px' : zone.type === 'intermediate' ? '16px' : '12px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';

            const marker = new mapboxgl.default.Marker(el)
              .setLngLat([zone.coords[1], zone.coords[0]])
              .setPopup(popup)
              .addTo(mapInstance);

            el.addEventListener('click', () => {
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
  }, [isOpen, mapboxToken, toast]);

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

  if (!isOpen) return null;

  if (!mapboxToken) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para usar el mapa en pantalla completa, necesitas configurar un token de Mapbox en la configuración.
            </AlertDescription>
          </Alert>
          <Button onClick={onClose} className="mt-4 w-full">
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center gap-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Mapa de Calor - Pantalla Completa</h1>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar zona..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleSearch} size="sm" variant="default">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button onClick={getCurrentLocation} size="sm" variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Mi Ubicación
            </Button>
            <Button onClick={onClose} size="sm" variant="outline">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 pt-20">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg border p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            {selectedZone.type === 'hot' && <AlertTriangle className="h-4 w-4 text-destructive" />}
            {selectedZone.type === 'intermediate' && <AlertCircle className="h-4 w-4 text-orange-600" />}
            {selectedZone.type === 'cold' && <CheckCircle className="h-4 w-4 text-green-600" />}
            <h3 className="font-semibold">{selectedZone.name}</h3>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span>Riesgo:</span>
              <Badge 
                variant={selectedZone.type === 'hot' ? 'destructive' : 
                        selectedZone.type === 'intermediate' ? 'secondary' : 'default'}
              >
                {selectedZone.type === 'hot' ? 'ALTO' : 
                 selectedZone.type === 'intermediate' ? 'MEDIO' : 'BAJO'}
              </Badge>
            </div>
            <div>
              <span>Área: </span>
              <span className="font-medium">{selectedZone.area}</span>
            </div>
            <div>
              <span>Población: </span>
              <span className="font-medium">{selectedZone.population?.toLocaleString()} hab.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};