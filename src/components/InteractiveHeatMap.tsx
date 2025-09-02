import { useState, useEffect, useRef } from 'react';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { Button } from '@/components/ui/button';  
import { Input } from '@/components/ui/input';  
import { Badge } from '@/components/ui/badge';  
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle, Maximize2 } from 'lucide-react';  
import { useToast } from '@/hooks/use-toast';  
import { useSettings } from '@/contexts/SettingsContext';  
import { FullScreenMap } from '@/components/FullScreenMap';  
import L from 'leaflet';  
import 'leaflet/dist/leaflet.css';  
  
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
  const [map, setMap] = useState<L.Map | null>(null);  
  const [isFullScreen, setIsFullScreen] = useState(false);  
  const [markers, setMarkers] = useState<L.Marker[]>([]);  
  const [highlightedMarker, setHighlightedMarker] = useState<L.Marker | null>(null);  
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
  
        addHeatMapMarkers(mapInstance);  
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
  
  // Función para agregar marcadores de zonas de calor con iluminación  
  const addHeatMapMarkers = (mapInstance: L.Map) => {  
    const newMarkers: L.Marker[] = [];  
  
    heatMapZones.forEach(zone => {  
      const iconColor = zone.type === 'hot' ? '#ef4444' :   
                       zone.type === 'intermediate' ? '#f59e0b' : '#10b981';  
        
      const customIcon = L.divIcon({  
        className: 'custom-heat-marker',  
        html: `<div style="  
          background-color: ${iconColor};  
          width: 14px;  
          height: 14px;  
          border-radius: 50%;  
          border: 2px solid white;  
          box-shadow: 0 0 6px rgba(0,0,0,0.4);  
        "></div>`,  
        iconSize: [18, 18],  
        iconAnchor: [9, 9]  
      });  
  
      const marker = L.marker([zone.coords[0], zone  