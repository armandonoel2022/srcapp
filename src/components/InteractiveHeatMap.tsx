import { useState, useEffect, useRef } from 'react';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { Button } from '@/components/ui/button';  
import { Input } from '@/components/ui/input';  
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Maximize2, Loader2 } from 'lucide-react';  
import { useToast } from '@/hooks/use-toast';  
import { useSettings } from '@/contexts/SettingsContext';  

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

// Función auxiliar para obtener el nombre del tipo de zona
const getZoneTypeName = (type: string) => {
  switch (type) {
    case 'hot': return 'Zona Caliente';
    case 'intermediate': return 'Zona Intermedia';
    case 'cold': return 'Zona Fría';
    default: return 'Tipo desconocido';
  }
};

// Función para convertir coordenadas a posición en el mapa
const coordsToPosition = (lat: number, lng: number) => {
  // Rango aproximado de coordenadas del Distrito Nacional
  const minLat = 18.43;
  const maxLat = 18.52;
  const minLng = -69.95;
  const maxLng = -69.87;
  
  // Convertir a porcentajes para posicionamiento relativo
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = 100 - (((lat - minLat) / (maxLat - minLat)) * 100);
  
  return { x, y };
};

// Componente de marcador para el mapa
const MapMarker = ({ zone, isSelected, onClick }: { 
  zone: any; 
  isSelected: boolean; 
  onClick: () => void; 
}) => {
  const position = coordsToPosition(zone.coords[0], zone.coords[1]);
  
  const getMarkerColor = () => {
    switch (zone.type) {
      case 'hot': return 'bg-red-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'cold': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getMarkerSize = () => {
    return isSelected ? 'w-5 h-5' : 'w-3 h-3';
  };
  
  const getPulseAnimation = () => {
    return isSelected ? 'animate-pulse' : '';
  };
  
  return (
    <div 
      className={`absolute rounded-full border-2 border-white ${getMarkerColor()} ${getMarkerSize()} ${getPulseAnimation()} cursor-pointer shadow-md`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onClick}
      title={zone.name}
    />
  );
};

export const InteractiveHeatMap = () => {  
  const [searchQuery, setSearchQuery] = useState('');  
  const [selectedZone, setSelectedZone] = useState<any>(null);  
  const [filteredZones, setFilteredZones] = useState(heatMapZones);  
  const [isSearching, setIsSearching] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toast } = useToast();  
  const { geolocationEnabled } = useSettings();  
  
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
  
  // Función para buscar coordenadas usando Nominatim (OpenStreetMap)
  const searchWithOpenStreetMap = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Distrito Nacional, República Dominicana')}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const coordinates = [parseFloat(lat), parseFloat(lon)];
        
        toast({
          title: "Ubicación encontrada",
          description: `Coordenadas: ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`,
        });
        
        return coordinates;
      } else {
        toast({
          title: "Ubicación no encontrada",
          description: "No se pudo encontrar la ubicación especificada",
          variant: "destructive"
        });
        return null;
      }
    } catch (error) {
      console.error("Error searching with OpenStreetMap:", error);
      toast({
        title: "Error de búsqueda",
        description: "No se pudo completar la búsqueda",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  };
  
  // Función para manejar la búsqueda
  const handleSearch = async () => {  
    if (!searchQuery.trim()) {  
      toast({  
        title: "Búsqueda vacía",  
        description: "Ingresa el nombre de una zona para buscar",  
        variant: "destructive"  
      });  
      return;  
    }  
  
    // Primero buscar en nuestras zonas predefinidas
    const foundZone = heatMapZones.find(zone =>   
      zone.name.toLowerCase().includes(searchQuery.toLowerCase())  
    );  
  
    if (foundZone) {  
      setSelectedZone(foundZone);  
      toast({  
        title: "Zona encontrada",  
        description: `${foundZone.name} - ${getZoneTypeName(foundZone.type)}`,  
      });  
    } else {
      // Si no se encuentra en nuestras zonas, buscar en OpenStreetMap
      await searchWithOpenStreetMap(searchQuery);
    }  
  };

  // Función para obtener ubicación actual
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalización no soportada",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        toast({
          title: "Ubicación encontrada",
          description: "Se ha obtenido tu ubicación actual",
        });
        setIsSearching(false);
      },
      (error) => {
        toast({
          title: "Error de geolocalización",
          description: "No se pudo obtener tu ubicación",
          variant: "destructive"
        });
        setIsSearching(false);
      }
    );
  };

  // Función para abrir mapa en pantalla completa
  const openFullScreenMap = () => {
    setIsFullScreen(true);
  };

  return (  
    <div className="space-y-4">  
      <Card>  
        <CardHeader>  
          <CardTitle className="flex items-center gap-2">  
            <MapPin className="h-5 w-5" />  
            Mapa de Calor - Distrito Nacional  
          </CardTitle>  
        </CardHeader>  
        <CardContent>  
          <div className="flex flex-col gap-4">  
            {/* Barra de búsqueda */}  
            <div className="flex gap-2">  
              <Input  
                placeholder="Buscar zona o dirección..."  
                value={searchQuery}  
                onChange={(e) => setSearchQuery(e.target.value)}  
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}  
              />  
              <Button onClick={handleSearch} disabled={isSearching}>  
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}  
              </Button>  
              <Button variant="outline" onClick={getCurrentLocation} disabled={!geolocationEnabled || isSearching}>  
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}  
              </Button>  
              <Button variant="outline" onClick={openFullScreenMap}>  
                <Maximize2 className="h-4 w-4" />  
              </Button>  
            </div>  
  
            {/* Leyenda */}  
            <div className="flex flex-wrap gap-4 text-sm">  
              <div className="flex items-center gap-1">  
                <div className="w-3 h-3 rounded-full bg-red-500"></div>  
                <span>Zona Caliente</span>  
              </div>  
              <div className="flex items-center gap-1">  
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>  
                <span>Zona Intermedia</span>  
              </div>  
              <div className="flex items-center gap-1">  
                <div className="w-3 h-3 rounded-full bg-green-500"></div>  
                <span>Zona Fría</span>  
              </div>  
            </div>  
  
            {/* Mapa simplificado */}  
            <div className="h-96 w-full rounded-md border relative bg-blue-50 overflow-hidden">
              {/* Representación visual del mapa con marcadores */}
              {heatMapZones.map(zone => (
                <MapMarker 
                  key={zone.name} 
                  zone={zone} 
                  isSelected={selectedZone?.name === zone.name}
                  onClick={() => setSelectedZone(zone)}
                />
              ))}
              
              {/* Texto indicativo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-4 bg-white/80 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Mapa simplificado de calor. Instala Leaflet para ver el mapa real.
                  </p>
                  <p className="text-xs mt-2">
                    Ejecuta: <code className="bg-gray-100 p-1 rounded">npm install leaflet @types/leaflet</code>
                  </p>
                </div>
              </div>
            </div>  
  
            {/* Zona seleccionada */}  
            {selectedZone && (  
              <div className="p-4 border rounded-md">  
                <h3 className="font-bold flex items-center gap-2">  
                  {selectedZone.type === 'hot' && <AlertTriangle className="h-5 w-5 text-red-500" />}  
                  {selectedZone.type === 'intermediate' && <AlertCircle className="h-5 w-5 text-yellow-500" />}  
                  {selectedZone.type === 'cold' && <CheckCircle className="h-5 w-5 text-green-500" />}  
                  {selectedZone.name}  
                </h3>  
                <p className="text-sm text-gray-600 mt-1">  
                  Tipo: {getZoneTypeName(selectedZone.type)}  
                </p>  
                <p className="text-sm text-gray-600">  
                  Coordenadas: {selectedZone.coords[0].toFixed(4)}, {selectedZone.coords[1].toFixed(4)}  
                </p>  
              </div>  
            )}  
          </div>  
        </CardContent>  
      </Card>  
  
      {/* Modal de mapa en pantalla completa */}  
      {isFullScreen && (  
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Mapa en Pantalla Completa</h2>
            <Button onClick={() => setIsFullScreen(false)}>Cerrar</Button>
          </div>
          <div className="flex-1 w-full relative bg-blue-50">
            {heatMapZones.map(zone => (
              <MapMarker 
                key={zone.name} 
                zone={zone} 
                isSelected={selectedZone?.name === zone.name}
                onClick={() => setSelectedZone(zone)}
              />
            ))}
          </div>
        </div>
      )}  
    </div>  
  );  
};