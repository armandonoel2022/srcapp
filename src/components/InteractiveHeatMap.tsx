import { useState, useEffect, useRef } from 'react';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { Button } from '@/components/ui/button';  
import { Input } from '@/components/ui/input';  
import { Badge } from '@/components/ui/badge';  
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Maximize2, Loader2 } from 'lucide-react';  
import { useToast } from '@/hooks/use-toast';  
import { useSettings } from '@/contexts/SettingsContext';  
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';  

// Fix for default markers in Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Zonas del Distrito Nacional - Listado completo (sin coordenadas fijas)
const heatMapZones = [  
  { name: "24 de Abril", type: "hot", color: "red" },  
  { name: "Cristo Rey", type: "hot", color: "red" },  
  { name: "Domingo Savio", type: "hot", color: "red" },  
  { name: "Ensanche Capotillo", type: "hot", color: "red" },  
  { name: "Gualey", type: "hot", color: "red" },  
  { name: "La Zurza", type: "hot", color: "red" },  
  { name: "Los Jardines", type: "hot", color: "red" },  
  { name: "Los Restauradores", type: "hot", color: "red" },  
  { name: "Nuevo Arroyo Hondo", type: "hot", color: "red" },  
  { name: "Nuestra Señora de la Paz", type: "hot", color: "red" },  
  { name: "Palma Real", type: "hot", color: "red" },  
  { name: "Simón Bolívar", type: "hot", color: "red" },  
  { name: "Villa Consuelo", type: "hot", color: "red" },  
  { name: "Villa Francisca", type: "hot", color: "red" },  
  { name: "Villa Juana", type: "hot", color: "red" },  
  { name: "Altos de Arroyo Hondo", type: "intermediate", color: "yellow" },  
  { name: "Buenos Aires", type: "intermediate", color: "yellow" },  
  { name: "Ensanche Espaillat", type: "intermediate", color: "yellow" },  
  { name: "Ensanche La Fe", type: "intermediate", color: "yellow" },  
  { name: "Ensanche Luperón", type: "intermediate", color: "yellow" },  
  { name: "Ensanche Quisqueya", type: "intermediate", color: "yellow" },  
  { name: "Honduras del Norte", type: "intermediate", color: "yellow" },  
  { name: "Honduras del Oeste", type: "intermediate", color: "yellow" },  
  { name: "Jardines del Sur", type: "intermediate", color: "yellow" },  
  { name: "Julieta Morales", type: "intermediate", color: "yellow" },  
  { name: "La Agustina", type: "intermediate", color: "yellow" },  
  { name: "La Hondonada", type: "intermediate", color: "yellow" },  
  { name: "La Isabela", type: "intermediate", color: "yellow" },  
  { name: "La Julia", type: "intermediate", color: "yellow" },  
  { name: "Las Praderas", type: "intermediate", color: "yellow" },  
  { name: "Los Peralejos", type: "intermediate", color: "yellow" },  
  { name: "Los Ríos", type: "intermediate", color: "yellow" },  
  { name: "María Auxiliadora", type: "intermediate", color: "yellow" },  
  { name: "Mata Hambre", type: "intermediate", color: "yellow" },  
  { name: "Mejoramiento Social", type: "intermediate", color: "yellow" },  
  { name: "Mirador Norte", type: "intermediate", color: "yellow" },  
  { name: "Miraflores", type: "intermediate", color: "yellow" },  
  { name: "Miramar", type: "intermediate", color: "yellow" },  
  { name: "Paseo de los Indios", type: "intermediate", color: "yellow" },  
  { name: "Los Próceres", type: "intermediate", color: "yellow" },  
  { name: "Renacimiento", type: "intermediate", color: "yellow" },  
  { name: "Viejo Arroyo Hondo", type: "intermediate", color: "yellow" },  
  { name: "Villas Agrícolas", type: "intermediate", color: "yellow" },  
  { name: "30 de Mayo", type: "cold", color: "green" },  
  { name: "Arroyo Manzano", type: "cold", color: "green" },  
  { name: "Atala", type: "cold", color: "green" },  
  { name: "Bella Vista", type: "cold", color: "green" },  
  { name: "El Cacique", type: "cold", color: "green" },  
  { name: "Centro de los Héroes", type: "cold", color: "green" },  
  { name: "Centro Olímpico", type: "cold", color: "green" },  
  { name: "Cerros de Arroyo Hondo", type: "cold", color: "green" },  
  { name: "Ciudad Colonial", type: "cold", color: "green" },  
  { name: "Ciudad Nueva", type: "cold", color: "green" },  
  { name: "Ciudad Universitaria", type: "cold", color: "green" },  
  { name: "El Millón", type: "cold", color: "green" },  
  { name: "Ensanche Naco", type: "cold", color: "green" },  
  { name: "Gascue", type: "cold", color: "green" },  
  { name: "General Antonio Duverge", type: "cold", color: "green" },  
  { name: "Jardín Botánico", type: "cold", color: "green" },  
  { name: "Jardín Zoológico", type: "cold", color: "green" },  
  { name: "La Castellana", type: "cold", color: "green" },  
  { name: "La Esperilla", type: "cold", color: "green" },  
  { name: "Los Cacicazgos", type: "cold", color: "green" },  
  { name: "Los Prados", type: "cold", color: "green" },  
  { name: "Mirador Sur", type: "cold", color: "green" },  
  { name: "Paraíso", type: "cold", color: "green" },  
  { name: "Piantini", type: "cold", color: "green" },  
  { name: "San Carlos", type: "cold", color: "green" },  
  { name: "San Diego", type: "cold", color: "green" },  
  { name: "San Geronimo", type: "cold", color: "green" },  
  { name: "San Juan Bosco", type: "cold", color: "green" }  
];

// Almacén para cache de coordenadas
const coordinatesCache: Record<string, [number, number]> = {};

// Función auxiliar para obtener el nombre del tipo de zona
const getZoneTypeName = (type: string) => {
  switch (type) {
    case 'hot': return 'Zona Caliente';
    case 'intermediate': return 'Zona Intermedia';
    case 'cold': return 'Zona Fría';
    default: return 'Tipo desconocido';
  }
};

// Función para obtener el icono según el tipo de zona
const getZoneIcon = (type: string) => {
  switch (type) {
    case 'hot': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'intermediate': return <AlertCircle className="h-4 w-4 text-orange-600" />;
    case 'cold': return <CheckCircle className="h-4 w-4 text-green-600" />;
    default: return <MapPin className="h-4 w-4 text-blue-500" />;
  }
};

// Función para obtener la variante del badge según el tipo de zona
const getZoneBadgeVariant = (type: string) => {
  switch (type) {
    case 'hot': return "destructive";
    case 'intermediate': return "secondary";
    case 'cold': return "default";
    default: return "outline";
  }
};

// Función para buscar coordenadas usando Nominatim (OpenStreetMap)
const searchWithOpenStreetMap = async (query: string): Promise<[number, number] | null> => {
  // Verificar si ya tenemos las coordenadas en cache
  if (coordinatesCache[query]) {
    return coordinatesCache[query];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Distrito Nacional, República Dominicana')}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const coordinates: [number, number] = [parseFloat(lat), parseFloat(lon)];
      
      // Guardar en cache para futuras búsquedas
      coordinatesCache[query] = coordinates;
      
      return coordinates;
    }
  } catch (error) {
    console.error("Error searching with OpenStreetMap:", error);
  }
  
  return null;
};

export const InteractiveHeatMap = () => {  
  const [searchQuery, setSearchQuery] = useState('');  
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);  
  const [selectedZone, setSelectedZone] = useState<any>(null);  
  const [filteredZones, setFilteredZones] = useState(heatMapZones);  
  const [map, setMap] = useState<L.Map | null>(null);  
  const [isFullScreen, setIsFullScreen] = useState(false);  
  const [markers, setMarkers] = useState<L.Marker[]>([]);  
  const [isSearching, setIsSearching] = useState(false);
  const [customLocation, setCustomLocation] = useState<any>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);  
  const { toast } = useToast();  
  const { geolocationEnabled } = useSettings();  
  
  // Separar zonas por tipo  
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
  
  // Inicializar mapa con Leaflet  
  useEffect(() => {  
    if (!mapContainer.current) return;  
  
    const initializeMap = () => {  
      try {  
        const mapInstance = L.map(mapContainer.current!, {  
          center: [18.4655, -69.9156],  
          zoom: 11,  
          zoomControl: true  
        });  
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  
          attribution: '© OpenStreetMap contributors',  
          maxZoom: 19  
        }).addTo(mapInstance);  
  
        setMap(mapInstance);  
        console.log('Mapa de OpenStreetMap cargado correctamente');  
      } catch (error) {  
        console.error('Error loading OpenStreetMap:', error);  
        toast({  
          title: "Error al cargar el mapa",  
          description: "Error al inicializar OpenStreetMap",  
          variant: "destructive"  
        });  
      }  
    };  
  
    initializeMap();  
  
    return () => {  
      if (map) {  
        map.remove();  
      }  
    };  
  }, []);  
  
  // Función para agregar marcador al mapa
  const addMarkerToMap = (coordinates: [number, number], title: string, color: string, isHighlighted = false, zone: any = null) => {
    if (!map) return null;

    const iconColor = color === 'red' ? '#ef4444' : 
                     color === 'yellow' ? '#f59e0b' : '#10b981';
    
    // Corregir los errores de TypeScript usando L.point
    const iconSize = isHighlighted ? L.point(26, 26) : L.point(18, 18);
    const iconAnchor = isHighlighted ? L.point(13, 13) : L.point(9, 9);
    const markerSize = isHighlighted ? '20px' : '14px';
    const borderSize = isHighlighted ? '3px' : '2px';
    
    const customIcon = L.divIcon({  
      className: isHighlighted ? 'custom-heat-marker-highlight' : 'custom-heat-marker',  
      html: `<div style="  
        background-color: ${iconColor};  
        width: ${markerSize};  
        height: ${markerSize};  
        border-radius: 50%;  
        border: ${borderSize} solid white;  
        box-shadow: 0 0 6px rgba(0,0,0,0.4);  
      "></div>`,  
      iconSize: iconSize,  
      iconAnchor: iconAnchor  
    });  

    const marker = L.marker(coordinates, {  
      icon: customIcon  
    }).addTo(map);  

    // Determinar el tipo de zona si está disponible
    const zoneType = zone ? getZoneTypeName(zone.type) : 'Ubicación específica';
    
    marker.bindPopup(`  
      <div class="p-2">  
        <h3 class="font-bold text-sm">${title}</h3>  
        <p class="text-xs text-gray-600">${zoneType}</p>  
        <p class="text-xs mt-1">Coordenadas: ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}</p>  
      </div>  
    `);  

    return marker;
  };
  
  // Función para buscar y centrar en una ubicación
  const searchAndCenterLocation = async (query: string) => {
    setIsSearching(true);
    
    try {
      // Primero buscar si es una zona predefinida
      const foundZone = heatMapZones.find(zone =>   
        zone.name.toLowerCase().includes(query.toLowerCase())  
      );
      
      const coordinates = await searchWithOpenStreetMap(query);
      
      if (coordinates && map) {
        // Limpiar marcadores anteriores
        markers.forEach(marker => map.removeLayer(marker));
        if (customLocation) {
          map.removeLayer(customLocation);
        }
        
        // Centrar el mapa
        map.setView(coordinates, 15);
        
        // Determinar el color basado en la zona encontrada o usar azul por defecto
        const markerColor = foundZone ? foundZone.color : '#3b82f6';
        
        // Agregar nuevo marcador
        const newMarker = addMarkerToMap(
          coordinates, 
          foundZone ? foundZone.name : query,
          markerColor,
          true,
          foundZone
        );
        
        if (newMarker) {
          setMarkers([newMarker]);
          newMarker.openPopup();
          
          // Guardar el resultado de la búsqueda para mostrar debajo del mapa
          setSearchResult({
            name: foundZone ? foundZone.name : query,
            type: foundZone ? foundZone.type : 'location',
            coordinates: coordinates,
            displayName: foundZone ? foundZone.name : query
          });
          
          // Si es una zona, establecerla como seleccionada
          if (foundZone) {
            setSelectedZone(foundZone);
          }
        }
        
        toast({
          title: foundZone ? "Zona encontrada" : "Ubicación encontrada",
          description: foundZone ? 
            `${foundZone.name} - ${getZoneTypeName(foundZone.type)}` : 
            `Coordenadas: ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}`,
        });
        
        return true;
      } else {
        toast({
          title: "Ubicación no encontrada",
          description: "No se pudo encontrar la ubicación especificada",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error in search:", error);
      toast({
        title: "Error de búsqueda",
        description: "No se pudo completar la búsqueda",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSearching(false);
    }
  };
  
  // Función para manejar la búsqueda
  const handleSearch = async () => {  
    if (!searchQuery.trim()) {  
      toast({  
        title: "Búsqueda vacía",  
        description: "Ingresa el nombre de una zona o dirección para buscar",  
        variant: "destructive"  
      });  
      return;  
    }  
  
    // Buscar la ubicación
    await searchAndCenterLocation(searchQuery);
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
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        if (map) {
          const coordinates: [number, number] = [latitude, longitude];
          
          // Limpiar marcadores anteriores
          markers.forEach(marker => map.removeLayer(marker));
          if (customLocation) {
            map.removeLayer(customLocation);
          }
          
          // Centrar el mapa
          map.setView(coordinates, 15);
          
          // Agregar marcador de ubicación actual
          const newCustomLocation = addMarkerToMap(
            coordinates,
            'Tu ubicación actual',
            '#3b82f6',
            true
          );
          
          if (newCustomLocation) {
            setCustomLocation(newCustomLocation);
            setSearchResult({
              name: 'Tu ubicación actual',
              type: 'location',
              coordinates: coordinates,
              displayName: 'Ubicación actual'
            });
            newCustomLocation.bindPopup('Tu ubicación actual').openPopup();
          }
        }
        
        toast({
          title: "Ubicación encontrada",
          description: "Se ha centrado el mapa en tu ubicación actual",
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
              <div className="flex items-center gap-1">  
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>  
                <span>Ubicación encontrada</span>  
              </div>  
            </div>  
  
            {/* Mapa */}  
            <div ref={mapContainer} className="h-96 w-full rounded-md border" />  
  
            {/* Información de la zona/ubicación seleccionada */}  
            {searchResult && (  
              <div className="p-4 border rounded-md">  
                <h3 className="font-bold flex items-center gap-2">  
                  {searchResult.type === 'hot' && <AlertTriangle className="h-5 w-5 text-red-500" />}  
                  {searchResult.type === 'intermediate' && <AlertCircle className="h-5 w-5 text-yellow-500" />}  
                  {searchResult.type === 'cold' && <CheckCircle className="h-5 w-5 text-green-500" />}  
                  {searchResult.type === 'location' && <MapPin className="h-5 w-5 text-blue-500" />}  
                  {searchResult.name}  
                </h3>  
                <p className="text-sm text-gray-600 mt-1">  
                  {searchResult.type !== 'location' ? `Tipo: ${getZoneTypeName(searchResult.type)}` : 'Ubicación específica'}  
                </p>  
                <p className="text-sm text-gray-600">  
                  Coordenadas: {searchResult.coordinates[0].toFixed(6)}, {searchResult.coordinates[1].toFixed(6)}  
                </p>  
              </div>  
            )}  
          </div>  
        </CardContent>  
      </Card>  

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
                  onClick={() => searchAndCenterLocation(zone.name)}
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
                onClick={() => searchAndCenterLocation(zone.name)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {getZoneTypeName(zone.type)}
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
                onClick={() => searchAndCenterLocation(zone.name)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {getZoneTypeName(zone.type)}
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
                onClick={() => searchAndCenterLocation(zone.name)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{zone.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {getZoneTypeName(zone.type)}
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

      {/* Estilos para la animación de pulso */}
      <style>{`  
        .custom-heat-marker-highlight div {  
          animation: pulse 2s infinite;  
        }
        
        @keyframes pulse {  
          0% {  
            transform: scale(1);  
            opacity: 1;  
          }  
          50% {  
            transform: scale(1.1);  
            opacity: 0.7;  
          }  
          100% {  
            transform: scale(1);  
            opacity: 1;  
          }  
        }  
      `}</style>
    </div>  
  );  
};