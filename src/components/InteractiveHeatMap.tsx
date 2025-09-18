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

// Zonas del Distrito Nacional - Listado completo actualizado
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
  { name: "Parque Zoológico", type: "cold", color: "green" },  // CAMBIADO: Jardín Zoológico -> Parque Zoológico
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
  const [highlightedZone, setHighlightedZone] = useState<L.Circle | null>(null);
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
                     color === 'yellow' ? '#f59e0b' : 
                     color === 'green' ? '#10b981' : '#3b82f6';
    
    // Corregir los errores de TypeScript usando L.point
    const iconSize = isHighlighted ? L.point(26, 26) : L.point(18, 18);
    const iconAnchor = isHighlighted ? L.point(13, 13) : L.point(9, 9);
    const markerSize = isHighlighted ?

Wiki pages you might want to explore:
- [Data Visualization (armandonoel2022/srcapp)](/wiki/armandonoel2022/srcapp#7)