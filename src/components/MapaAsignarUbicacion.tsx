import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Search, Save, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// @ts-ignore - Leaflet types
import 'leaflet/dist/leaflet.css';

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  lugar_designado?: string;
}

interface UbicacionTrabajo {
  id: string;
  nombre: string;
  direccion?: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  radio_tolerancia: number;
  activa: boolean;
}

export const MapaAsignarUbicacion = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showNewLocationDialog, setShowNewLocationDialog] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationRadius, setNewLocationRadius] = useState(100);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState<string>('');
  const [selectedLocationForAssignment, setSelectedLocationForAssignment] = useState<string>('');
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMapLibrary();
    cargarDatos();
  }, []);

  const loadMapLibrary = async () => {
    try {
      const leaflet = await import('leaflet');
      
      // Fix default marker icon issue with Leaflet
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      
      setL(leaflet);
    } catch (error) {
      console.error('Error loading Leaflet:', error);
      toast({
        title: "Error",
        description: "Error al cargar el mapa",
        variant: "destructive"
      });
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar empleados
      const { data: empleadosData, error: empleadosError } = await supabase
        .from('empleados_turnos')
        .select('id, nombres, apellidos, lugar_designado')
        .eq('active', true)
        .order('nombres');

      if (empleadosError) throw empleadosError;

      // Cargar ubicaciones de trabajo
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from('ubicaciones_trabajo')
        .select('*')
        .eq('activa', true)
        .order('nombre');

      if (ubicacionesError) throw ubicacionesError;

      setEmpleados(empleadosData || []);
      
      // Procesar coordenadas de ubicaciones
      const ubicacionesProcesadas = (ubicacionesData || []).map(ub => ({
        ...ub,
        coordenadas: parseCoordinates(ub.coordenadas)
      }));
      
      setUbicaciones(ubicacionesProcesadas);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar datos: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const parseCoordinates = (coordsStr: any) => {
    if (typeof coordsStr === 'string') {
      const match = coordsStr.match(/\(([^,]+),([^)]+)\)/);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
    }
    return { lat: 18.4861, lng: -69.9312 }; // Default to Santo Domingo
  };

  const initializeMap = () => {
    if (!L || !mapContainer.current || mapInstance) return;

    const map = L.map(mapContainer.current).setView([18.4861, -69.9312], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add existing locations to map
    ubicaciones.forEach(ubicacion => {
      const marker = L.marker([ubicacion.coordenadas.lat, ubicacion.coordenadas.lng])
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>${ubicacion.nombre}</h4>
            <p>${ubicacion.direccion || 'Sin dirección'}</p>
            <p>Radio: ${ubicacion.radio_tolerancia}m</p>
          </div>
        `);

      // Add circle to show tolerance radius
      L.circle([ubicacion.coordenadas.lat, ubicacion.coordenadas.lng], {
        radius: ubicacion.radio_tolerancia,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        color: '#3b82f6',
        weight: 2
      }).addTo(map);
    });

    // Add click handler for new locations
    map.on('click', (e: any) => {
      setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowNewLocationDialog(true);
    });

    setMapInstance(map);
  };

  useEffect(() => {
    if (L && ubicaciones.length >= 0) {
      initializeMap();
    }
  }, [L, ubicaciones]);

  const buscarDireccion = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=DO&limit=5`
      );
      
      if (!response.ok) throw new Error('Error en la búsqueda');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al buscar dirección: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const seleccionarResultadoBusqueda = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (mapInstance) {
      mapInstance.setView([lat, lng], 16);
      
      // Remove previous search marker if exists
      if (mapInstance.searchMarker) {
        mapInstance.removeLayer(mapInstance.searchMarker);
      }
      
      // Add new search marker
      mapInstance.searchMarker = L.marker([lat, lng]).addTo(mapInstance)
        .bindPopup(`
          <div>
            <h4>Ubicación Encontrada</h4>
            <p>${result.display_name}</p>
            <button onclick="window.selectSearchLocation(${lat}, ${lng})" class="bg-blue-500 text-white px-3 py-1 rounded mt-2">
              Crear Ubicación Aquí
            </button>
          </div>
        `)
        .openPopup();
    }
    
    // Add global function for popup button
    (window as any).selectSearchLocation = (lat: number, lng: number) => {
      setSelectedLocation({ lat, lng });
      setNewLocationAddress(result.display_name);
      setShowNewLocationDialog(true);
    };
    
    setSearchResults([]);
  };

  const crearNuevaUbicacion = async () => {
    if (!selectedLocation || !newLocationName.trim()) return;

    try {
      const { error } = await supabase
        .from('ubicaciones_trabajo')
        .insert({
          nombre: newLocationName,
          direccion: newLocationAddress,
          coordenadas: `(${selectedLocation.lat},${selectedLocation.lng})`,
          radio_tolerancia: newLocationRadius,
          activa: true
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ubicación creada exitosamente",
      });

      // Reset form and close dialog
      setNewLocationName('');
      setNewLocationAddress('');
      setNewLocationRadius(100);
      setSelectedLocation(null);
      setShowNewLocationDialog(false);

      // Reload data
      cargarDatos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear ubicación: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const asignarUbicacionEmpleado = async () => {
    if (!selectedEmployeeForAssignment || !selectedLocationForAssignment) return;

    try {
      const { error } = await supabase
        .from('empleados_turnos')
        .update({ lugar_designado: selectedLocationForAssignment })
        .eq('id', selectedEmployeeForAssignment);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ubicación asignada exitosamente",
      });

      // Reset selections and reload data
      setSelectedEmployeeForAssignment('');
      setSelectedLocationForAssignment('');
      cargarDatos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al asignar ubicación: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const empleadosSinUbicacion = empleados.filter(emp => !emp.lugar_designado);
  const empleadosConUbicacion = empleados.filter(emp => emp.lugar_designado);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando mapa de ubicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Gestión de Ubicaciones de Trabajo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Búsqueda de direcciones */}
          <div className="space-y-2">
            <Label>Buscar Dirección</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Escribe una dirección en República Dominicana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarDireccion()}
              />
              <Button onClick={buscarDireccion} disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="border rounded-md p-2 bg-background max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-muted cursor-pointer rounded"
                    onClick={() => seleccionarResultadoBusqueda(result)}
                  >
                    <p className="font-medium text-sm">{result.display_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mapa */}
          <div className="space-y-2">
            <Label>Mapa Interactivo</Label>
            <div 
              ref={mapContainer}
              className="w-full h-96 border rounded-lg"
              style={{ minHeight: '400px' }}
            />
            <p className="text-sm text-muted-foreground">
              Haz clic en el mapa para crear una nueva ubicación de trabajo
            </p>
          </div>

          {/* Asignación de empleados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Empleado</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={selectedEmployeeForAssignment}
                onChange={(e) => setSelectedEmployeeForAssignment(e.target.value)}
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombres} {emp.apellidos} 
                    {emp.lugar_designado && ` (${emp.lugar_designado})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Ubicación</Label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={selectedLocationForAssignment}
                onChange={(e) => setSelectedLocationForAssignment(e.target.value)}
              >
                <option value="">Seleccionar ubicación...</option>
                {ubicaciones.map(ub => (
                  <option key={ub.id} value={ub.nombre}>
                    {ub.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            onClick={asignarUbicacionEmpleado}
            disabled={!selectedEmployeeForAssignment || !selectedLocationForAssignment}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Asignar Ubicación
          </Button>
        </CardContent>
      </Card>

      {/* Resumen de asignaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Sin Ubicación Asignada ({empleadosSinUbicacion.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {empleadosSinUbicacion.map(empleado => (
                <div key={empleado.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{empleado.nombres} {empleado.apellidos}</span>
                  <Badge variant="destructive">Sin Asignar</Badge>
                </div>
              ))}
              {empleadosSinUbicacion.length === 0 && (
                <p className="text-muted-foreground text-sm">Todos los empleados tienen ubicación asignada</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Con Ubicación Asignada ({empleadosConUbicacion.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {empleadosConUbicacion.map(empleado => (
                <div key={empleado.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{empleado.nombres} {empleado.apellidos}</span>
                  <Badge variant="secondary">{empleado.lugar_designado}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para crear nueva ubicación */}
      <Dialog open={showNewLocationDialog} onOpenChange={setShowNewLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Ubicación de Trabajo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la Ubicación *</Label>
              <Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Ej: Oficina Central, Almacén Norte..."
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
                placeholder="Dirección completa..."
              />
            </div>
            <div>
              <Label>Radio de Tolerancia (metros)</Label>
              <Input
                type="number"
                value={newLocationRadius}
                onChange={(e) => setNewLocationRadius(Number(e.target.value))}
                placeholder="100"
                min="10"
                max="1000"
              />
            </div>
            {selectedLocation && (
              <div className="text-sm text-muted-foreground">
                Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewLocationDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={crearNuevaUbicacion}
                disabled={!newLocationName.trim() || !selectedLocation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Ubicación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};