import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Info, X, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

// Datos completos del mapa de calor del Distrito Nacional
const heatMapZones = [
  // Zonas Rojas (Calientes) - Alto riesgo
  { name: "24 de Abril", type: "hot", color: "red", coords: [18.497878, -69.883417], population: 53870 },
  { name: "Cristo Rey", type: "hot", color: "red", coords: [18.488505, -69.895349], population: 257038 },
  { name: "Domingo Savio", type: "hot", color: "red", coords: [18.495288, -69.888075], population: 184863 },
  { name: "Ensanche Capotillo", type: "hot", color: "red", coords: [18.507381, -69.901876], population: 134708 },
  { name: "Gualey", type: "hot", color: "red", coords: [18.499763, -69.891837], population: 91147 },
  { name: "La Zurza", type: "hot", color: "red", coords: [18.505435, -69.886834], population: 42896 },
  { name: "Los Jardines", type: "hot", color: "red", coords: [18.490207, -69.889397], population: 97568 },
  { name: "Los Restauradores", type: "hot", color: "red", coords: [18.473739, -69.909137], population: 78945 },
  { name: "Nuevo Arroyo Hondo", type: "hot", color: "red", coords: [18.502733, -69.890475], population: 123501 },
  { name: "Nuestra Señora de la Paz", type: "hot", color: "red", coords: [18.443993, -69.906206], population: 98961 },
  { name: "Palma Real", type: "hot", color: "red", coords: [18.492512, -69.884084], population: 101543 },
  { name: "Simón Bolívar", type: "hot", color: "red", coords: [18.487237, -69.903833], population: 88463 },
  { name: "Villa Consuelo", type: "hot", color: "red", coords: [18.499863, -69.898137], population: 40621 },
  { name: "Villa Francisca", type: "hot", color: "red", coords: [18.501873, -69.899408], population: 50185 },
  { name: "Villa Juana", type: "hot", color: "red", coords: [18.495766, -69.897355], population: 60323 },

  // Zonas Amarillas (Intermedias) - Riesgo moderado  
  { name: "Altos de Arroyo Hondo", type: "intermediate", color: "yellow", coords: [18.488585, -69.883337], population: 19617 },
  { name: "Buenos Aires", type: "intermediate", color: "yellow", coords: [18.478221, -69.903802], population: 25770 },
  { name: "Ensanche Espaillat", type: "intermediate", color: "yellow", coords: [18.471756, -69.890189], population: 16803 },
  { name: "Ensanche La Fe", type: "intermediate", color: "yellow", coords: [18.453579, -69.883194], population: 19094 },
  { name: "Ensanche Luperón", type: "intermediate", color: "yellow", coords: [18.509765, -69.892776], population: 23710 },
  { name: "Ensanche Quisqueya", type: "intermediate", color: "yellow", coords: [18.499598, -69.898422], population: 24850 },
  { name: "Honduras del Norte", type: "intermediate", color: "yellow", coords: [18.508700, -69.891990], population: 9771 },
  { name: "Honduras del Oeste", type: "intermediate", color: "yellow", coords: [18.493714, -69.902170], population: 8884 },
  { name: "Jardines del Sur", type: "intermediate", color: "yellow", coords: [18.487508, -69.888722], population: 8777 },
  { name: "Julieta Morales", type: "intermediate", color: "yellow", coords: [18.477233, -69.884358], population: 14843 },
  { name: "La Agustina", type: "intermediate", color: "yellow", coords: [18.491606, -69.898417], population: 20308 },
  { name: "La Hondonada", type: "intermediate", color: "yellow", coords: [18.450578, -69.894164], population: 14575 },
  { name: "La Isabela", type: "intermediate", color: "yellow", coords: [18.507069, -69.900611], population: 6865 },
  { name: "La Julia", type: "intermediate", color: "yellow", coords: [18.477881, -69.892533], population: 12575 },
  { name: "Las Praderas", type: "intermediate", color: "yellow", coords: [18.488879, -69.890641], population: 29765 },
  { name: "Los Peralejos", type: "intermediate", color: "yellow", coords: [18.509583, -69.890091], population: 35684 },
  { name: "Los Ríos", type: "intermediate", color: "yellow", coords: [18.488154, -69.885817], population: 27563 },
  { name: "María Auxiliadora", type: "intermediate", color: "yellow", coords: [18.478637, -69.898413], population: 20456 },
  { name: "Mata Hambre", type: "intermediate", color: "yellow", coords: [18.445989, -69.882972], population: 20456 },
  { name: "Mejoramiento Social", type: "intermediate", color: "yellow", coords: [18.462462, -69.891256], population: 19753 },
  { name: "Mirador Norte", type: "intermediate", color: "yellow", coords: [18.451860, -69.897212], population: 20465 },
  { name: "Miraflores", type: "intermediate", color: "yellow", coords: [18.452282, -69.884280], population: 76862 },
  { name: "Miramar", type: "intermediate", color: "yellow", coords: [18.453706, -69.887166], population: 59876 },
  { name: "Paseo de los Indios", type: "intermediate", color: "yellow", coords: [18.449313, -69.905945], population: 28951 },
  { name: "Los Próceres", type: "intermediate", color: "yellow", coords: [18.461390, -69.884935], population: 56513 },
  { name: "Renacimiento", type: "intermediate", color: "yellow", coords: [18.479797, -69.895141], population: 20145 },
  { name: "Viejo Arroyo Hondo", type: "intermediate", color: "yellow", coords: [18.455476, -69.895412], population: 38964 },
  { name: "Villas Agrícolas", type: "intermediate", color: "yellow", coords: [18.470314, -69.903984], population: 48621 },

  // Zonas Verdes (Frías) - Bajo riesgo
  { name: "30 de Mayo", type: "cold", color: "green", coords: [18.504925, -69.894532], population: 5904 },
  { name: "Arroyo Manzano", type: "cold", color: "green", coords: [18.504014, -69.902393], population: 5894 },
  { name: "Atala", type: "cold", color: "green", coords: [18.479062, -69.895818], population: 3711 },
  { name: "Bella Vista", type: "cold", color: "green", coords: [18.441362, -69.888175], population: 15593 },
  { name: "El Cacique", type: "cold", color: "green", coords: [18.506927, -69.908688], population: 7671 },
  { name: "Centro de los Héroes", type: "cold", color: "green", coords: [18.471893, -69.896859], population: 62 },
  { name: "Centro Olímpico", type: "cold", color: "green", coords: [18.487083, -69.906702], population: 99 },
  { name: "Cerros de Arroyo Hondo", type: "cold", color: "green", coords: [18.470562, -69.902018], population: 3258 },
  { name: "Ciudad Colonial", type: "cold", color: "green", coords: [18.470559, -69.886930], population: 8472 },
  { name: "Ciudad Nueva", type: "cold", color: "green", coords: [18.446137, -69.881238], population: 12540 },
  { name: "Ciudad Universitaria", type: "cold", color: "green", coords: [18.473095, -69.903901], population: 8016 },
  { name: "El Millón", type: "cold", color: "green", coords: [18.474448, -69.885801], population: 9137 },
  { name: "Ensanche Naco", type: "cold", color: "green", coords: [18.495130, -69.884036], population: 11102 },
  { name: "Gascue", type: "cold", color: "green", coords: [18.447708, -69.904161], population: 12562 },
  { name: "General Antonio Duverge", type: "cold", color: "green", coords: [18.476234, -69.896119], population: 4382 },
  { name: "Jardín Botánico", type: "cold", color: "green", coords: [18.442856, -69.902565], population: 271 },
  { name: "Jardín Zoológico", type: "cold", color: "green", coords: [18.502321, -69.903194], population: 19 },
  { name: "La Castellana", type: "cold", color: "green", coords: [18.455672, -69.889563], population: 10421 },
  { name: "La Esperilla", type: "cold", color: "green", coords: [18.477404, -69.905623], population: 6807 },
  { name: "Los Cacicazgos", type: "cold", color: "green", coords: [18.464052, -69.880419], population: 15725 },
  { name: "Los Prados", type: "cold", color: "green", coords: [18.497975, -69.883099], population: 20457 },
  { name: "Mirador Sur", type: "cold", color: "green", coords: [18.507991, -69.889138], population: 20211 },
  { name: "Paraíso", type: "cold", color: "green", coords: [18.443605, -69.887395], population: 75862 },
  { name: "Piantini", type: "cold", color: "green", coords: [18.474850, -69.887869], population: 59753 },
  { name: "San Carlos", type: "cold", color: "green", coords: [18.480985, -69.903508], population: 13456 },
  { name: "San Diego", type: "cold", color: "green", coords: [18.479975, -69.890404], population: 9864 },
  { name: "San Geronimo", type: "cold", color: "green", coords: [18.448231, -69.900209], population: 8634 },
  { name: "San Juan Bosco", type: "cold", color: "green", coords: [18.477594, -69.901184], population: 14352 }
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
          // Agregar marcadores para cada zona
          heatMapZones.forEach(zone => {
            const markerColor = zone.type === 'hot' ? '#ef4444' : 
                               zone.type === 'intermediate' ? '#f59e0b' : '#22c55e';
            
            const popup = new mapboxgl.default.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-3">
                  <h3 class="font-bold text-sm mb-1">${zone.name}</h3>
                  <p class="text-xs text-gray-600 mb-1">
                    ${zone.type === 'hot' ? 'Zona Caliente - Alto riesgo' :
                      zone.type === 'intermediate' ? 'Zona Intermedia - Riesgo moderado' :
                      'Zona Fría - Bajo riesgo'}
                  </p>
                  <p class="text-xs text-gray-500">
                    Población: ${zone.population?.toLocaleString() || 'N/A'}
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
              <span>Población: </span>
              <span className="font-medium">{selectedZone.population?.toLocaleString()} hab.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};