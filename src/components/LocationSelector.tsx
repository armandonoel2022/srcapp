import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Save, Search, Navigation, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationData {
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  radio_tolerancia: number;
}

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSaved: (location: LocationData) => void;
  initialLocation?: LocationData;
}

export const LocationSelector = ({ 
  isOpen, 
  onClose, 
  onLocationSaved, 
  initialLocation 
}: LocationSelectorProps) => {
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [locationData, setLocationData] = useState<LocationData>({
    nombre: initialLocation?.nombre || '',
    direccion: initialLocation?.direccion || '',
    lat: initialLocation?.lat || 0,
    lng: initialLocation?.lng || 0,
    radio_tolerancia: initialLocation?.radio_tolerancia || 100
  });
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Inicializar mapa
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    const initializeMap = () => {
      try {
        // Configurar iconos por defecto de Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
        });

        const mapInstance = L.map(mapContainer.current!).setView(
          initialLocation ? [initialLocation.lat, initialLocation.lng] : [18.4655, -69.9156],
          initialLocation ? 16 : 11
        );

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        // Click event para seleccionar ubicación
        mapInstance.on('click', (e) => {
          const { lat, lng } = e.latlng;
          setSelectedCoords({ lat, lng });
          setLocationData(prev => ({ ...prev, lat, lng }));
          
          // Actualizar marcador
          if (marker) {
            mapInstance.removeLayer(marker);
          }
          
          const newMarker = L.marker([lat, lng]).addTo(mapInstance);
          setMarker(newMarker);
          
          // Geocoding reverso para obtener dirección
          reverseGeocode(lat, lng);
        });

        // Si hay ubicación inicial, agregar marcador
        if (initialLocation) {
          const initialMarker = L.marker([initialLocation.lat, initialLocation.lng]).addTo(mapInstance);
          setMarker(initialMarker);
        }

        setMap(mapInstance);

        return () => {
          mapInstance.remove();
        };
      } catch (error) {
        console.error('Error loading map:', error);
        toast({
          title: "Error al cargar el mapa",
          description: "Error al inicializar el mapa",
          variant: "destructive"
        });
      }
    };

    initializeMap();
  }, [isOpen, toast]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setLocationData(prev => ({ ...prev, direccion: data.display_name }));
      }
    } catch (error) {
      console.error('Error en geocoding reverso:', error);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=do&limit=5&accept-language=es`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Centrar mapa en resultado
        if (map) {
          map.setView([lat, lng], 16);
        }
        
        // Actualizar coordenadas seleccionadas
        setSelectedCoords({ lat, lng });
        setLocationData(prev => ({ 
          ...prev, 
          lat, 
          lng, 
          direccion: result.display_name 
        }));
        
        // Actualizar marcador
        if (marker) {
          map?.removeLayer(marker);
        }
        
        const newMarker = L.marker([lat, lng]).addTo(map!);
        setMarker(newMarker);
        
        toast({
          title: "Ubicación encontrada",
          description: result.display_name,
        });
      } else {
        toast({
          title: "No encontrado",
          description: "No se encontraron resultados para esa búsqueda",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error de búsqueda",
        description: "Error al buscar la ubicación",
        variant: "destructive"
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "La geolocalización no está disponible",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        if (map) {
          map.setView([lat, lng], 16);
        }
        
        setSelectedCoords({ lat, lng });
        setLocationData(prev => ({ ...prev, lat, lng }));
        
        // Actualizar marcador
        if (marker) {
          marker.remove();
        }
        
        const mapboxgl = require('mapbox-gl');
        const newMarker = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .addTo(map);
        
        setMarker(newMarker);
        
        reverseGeocode(lat, lng);
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

  const saveLocation = async () => {
    if (!locationData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la ubicación es requerido",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedCoords) {
      toast({
        title: "Error",
        description: "Selecciona una ubicación en el mapa",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Crear o actualizar ubicación de trabajo
      const { error } = await supabase
        .from('ubicaciones_trabajo')
        .upsert({
          nombre: locationData.nombre,
          direccion: locationData.direccion,
          coordenadas: `(${selectedCoords.lat},${selectedCoords.lng})`,
          radio_tolerancia: locationData.radio_tolerancia,
          activa: true
        });

      if (error) throw error;

      onLocationSaved({
        ...locationData,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng
      });

      toast({
        title: "Ubicación guardada",
        description: "La ubicación de trabajo ha sido configurada exitosamente",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto h-full flex flex-col p-4">
        {/* Header */}
        <Card className="mb-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Seleccionar Ubicación de Trabajo
              </CardTitle>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar dirección..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                />
              </div>
              <Button onClick={searchLocation} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
              <Button onClick={getCurrentLocation} variant="outline">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>

            {/* Información de ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nombre del lugar</label>
                <Input
                  placeholder="Ej: Oficina Principal"
                  value={locationData.nombre}
                  onChange={(e) => setLocationData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Radio de tolerancia (metros)</label>
                <Input
                  type="number"
                  value={locationData.radio_tolerancia}
                  onChange={(e) => setLocationData(prev => ({ ...prev, radio_tolerancia: parseInt(e.target.value) || 100 }))}
                />
              </div>
            </div>

            {locationData.direccion && (
              <div>
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  value={locationData.direccion}
                  onChange={(e) => setLocationData(prev => ({ ...prev, direccion: e.target.value }))}
                  placeholder="Dirección detectada automáticamente"
                />
              </div>
            )}

            {selectedCoords && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Coordenadas: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                </Badge>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={saveLocation} disabled={saving || !selectedCoords} className="flex-1">
                {saving ? "Guardando..." : <><Save className="h-4 w-4 mr-2" /> Guardar Ubicación</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mapa */}
        <Card className="flex-1 min-h-0">
          <CardContent className="p-0 h-full">
            <div ref={mapContainer} className="w-full h-full rounded-lg" />
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Haz clic en el mapa para seleccionar la ubicación de trabajo
        </div>
      </div>
    </div>
  );
};