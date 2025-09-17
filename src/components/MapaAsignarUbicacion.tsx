import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Search, Save, Plus, CheckCircle, Loader2 } from 'lucide-react';
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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationRadius, setNewLocationRadius] = useState(100);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState<string>('');
  const [selectedLocationForAssignment, setSelectedLocationForAssignment] = useState<string>('');
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [currentMarker, setCurrentMarker] = useState<any>(null);
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
      // Special styling for OFICINA SRC SEGURIDAD
      const isOficinaSrc = ubicacion.nombre === "OFICINA SRC SEGURIDAD";
      
      const marker = L.marker([ubicacion.coordenadas.lat, ubicacion.coordenadas.lng])
        .addTo(map)
        .bindPopup(`
          <div>
            <h4>${ubicacion.nombre}</h4>
            <p>${ubicacion.direccion || 'Sin dirección'}</p>
            <p>Radio: ${ubicacion.radio_tolerancia}m</p>
            ${isOficinaSrc ? '<p><strong>📍 Base de Operaciones</strong></p>' : ''}
          </div>
        `);

      // Add circle to show tolerance radius with special color for OFICINA SRC
      L.circle([ubicacion.coordenadas.lat, ubicacion.coordenadas.lng], {
        radius: ubicacion.radio_tolerancia,
        fillColor: isOficinaSrc ? '#22c55e' : '#3b82f6',
        fillOpacity: isOficinaSrc ? 0.2 : 0.1,
        color: isOficinaSrc ? '#22c55e' : '#3b82f6',
        weight: isOficinaSrc ? 3 : 2
      }).addTo(map);
    });

    // Add click handler for new locations
    map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Remove previous marker if exists
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }
      
      // Add new marker
      const marker = L.marker([lat, lng]).addTo(map);
      setCurrentMarker(marker);
      
      // Reverse geocoding to get address
      reverseGeocode(lat, lng);
    });

    setMapInstance(map);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=DO`
      );
      
      if (!response.ok) throw new Error('Error en geocodificación');
      
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      setSelectedLocation({ lat, lng, address });
      setShowCreateDialog(true);
    } catch (error) {
      setSelectedLocation({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      setShowCreateDialog(true);
    }
  };

  useEffect(() => {
    if (L && ubicaciones.length >= 0) {
      initializeMap();
    }
  }, [L, ubicaciones]);

  const buscarDireccion = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
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
    } finally {
      setSearchLoading(false);
    }
  };

  const seleccionarResultadoBusqueda = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (mapInstance) {
      mapInstance.setView([lat, lng], 16);
      
      // Remove previous marker if exists
      if (currentMarker) {
        mapInstance.removeLayer(currentMarker);
      }
      
      // Add new marker
      const marker = L.marker([lat, lng]).addTo(mapInstance);
      setCurrentMarker(marker);
      
      // Set location and show dialog
      setSelectedLocation({ lat, lng, address: result.display_name });
      setShowCreateDialog(true);
    }
    
    setSearchResults([]);
    setSearchQuery('');
  };

  const crearNuevaUbicacion = async () => {
    if (!selectedLocation || !newLocationName.trim()) return;

    setCreateLoading(true);
    try {
      const { data: newLocation, error } = await supabase
        .from('ubicaciones_trabajo')
        .insert({
          nombre: newLocationName,
          direccion: selectedLocation.address,
          coordenadas: `(${selectedLocation.lat},${selectedLocation.lng})`,
          radio_tolerancia: newLocationRadius,
          activa: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ubicación creada exitosamente",
      });

      // Reset form and close dialog
      setNewLocationName('');
      setNewLocationRadius(100);
      setSelectedLocation(null);
      setShowCreateDialog(false);
      
      // Remove temporary marker
      if (currentMarker && mapInstance) {
        mapInstance.removeLayer(currentMarker);
        setCurrentMarker(null);
      }

      // Reload data to show new location
      await cargarDatos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear ubicación: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const asignarUbicacionEmpleado = async () => {
    if (!selectedEmployeeForAssignment || !selectedLocationForAssignment) return;

    try {
      // First, assign the main location
      const { error: updateError } = await supabase
        .from('empleados_turnos')
        .update({ lugar_designado: selectedLocationForAssignment })
        .eq('id', selectedEmployeeForAssignment);

      if (updateError) throw updateError;

      // Then, assign default "OFICINA SRC SEGURIDAD" to all employees if not already assigned
      const oficinaSrc = ubicaciones.find(ub => ub.nombre === "OFICINA SRC SEGURIDAD");
      if (oficinaSrc) {
        // Check if employee already has this assignment
        const { data: existingAssignment } = await supabase
          .from('empleados_ubicaciones_asignadas')
          .select('id')
          .eq('empleado_id', selectedEmployeeForAssignment)
          .eq('ubicacion_nombre', "OFICINA SRC SEGURIDAD")
          .single();

        if (!existingAssignment) {
          await supabase
            .from('empleados_ubicaciones_asignadas')
            .insert({
              empleado_id: selectedEmployeeForAssignment,
              ubicacion_nombre: "OFICINA SRC SEGURIDAD",
              activa: true
            });
        }
      }

      toast({
        title: "Éxito",
        description: "Ubicación asignada exitosamente (incluye acceso a OFICINA SRC SEGURIDAD por defecto)",
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

  const cancelarCreacion = () => {
    setShowCreateDialog(false);
    setNewLocationName('');
    setNewLocationRadius(100);
    setSelectedLocation(null);
    
    // Remove temporary marker
    if (currentMarker && mapInstance) {
      mapInstance.removeLayer(currentMarker);
      setCurrentMarker(null);
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
          <div className="space-y-3">
            <Label htmlFor="search">Buscar Dirección</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Escribe una dirección en República Dominicana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarDireccion()}
                className="flex-1"
              />
              <Button 
                onClick={buscarDireccion} 
                disabled={!searchQuery.trim() || searchLoading}
                size="default"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resultados de Búsqueda</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-muted cursor-pointer rounded-md border transition-colors"
                        onClick={() => seleccionarResultadoBusqueda(result)}
                      >
                        <p className="font-medium text-sm">{result.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Lat: {parseFloat(result.lat).toFixed(6)}, Lng: {parseFloat(result.lon).toFixed(6)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Mapa */}
          <div className="space-y-3">
            <Label>Mapa Interactivo</Label>
            <div 
              ref={mapContainer}
              className="w-full h-96 border rounded-lg shadow-sm"
              style={{ minHeight: '400px' }}
            />
            <p className="text-sm text-muted-foreground">
              Haz clic en el mapa para crear una nueva ubicación de trabajo
            </p>
          </div>

          {/* Asignación de empleados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empleado-select">Empleado</Label>
              <select
                id="empleado-select"
                className="w-full mt-1 p-2 border rounded-md bg-background"
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
              <Label htmlFor="ubicacion-select">Ubicación</Label>
              <select
                id="ubicacion-select"
                className="w-full mt-1 p-2 border rounded-md bg-background"
                value={selectedLocationForAssignment}
                onChange={(e) => {
                  setSelectedLocationForAssignment(e.target.value);
                  // Highlight selected location on map
                  if (e.target.value && mapInstance) {
                    const selectedUbicacion = ubicaciones.find(ub => ub.nombre === e.target.value);
                    if (selectedUbicacion) {
                      // Center map on selected location
                      mapInstance.setView([selectedUbicacion.coordenadas.lat, selectedUbicacion.coordenadas.lng], 15);
                      
                      // Add temporary highlight circle
                      const highlightCircle = L.circle([selectedUbicacion.coordenadas.lat, selectedUbicacion.coordenadas.lng], {
                        radius: selectedUbicacion.radio_tolerancia + 50,
                        fillColor: '#f59e0b',
                        fillOpacity: 0.3,
                        color: '#f59e0b',
                        weight: 4,
                        dashArray: '10, 10'
                      }).addTo(mapInstance);
                      
                      // Remove highlight after 3 seconds
                      setTimeout(() => {
                        mapInstance.removeLayer(highlightCircle);
                      }, 3000);
                    }
                  }
                }}
              >
                <option value="">Seleccionar ubicación...</option>
                {ubicaciones.map(ub => (
                  <option key={ub.id} value={ub.nombre}>
                    {ub.nombre} {ub.nombre === "OFICINA SRC SEGURIDAD" ? "🏢 (Base)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <Button 
            onClick={asignarUbicacionEmpleado}
            disabled={!selectedEmployeeForAssignment || !selectedLocationForAssignment}
            className="w-full"
            size="lg"
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
            <CardTitle className="text-red-600 flex items-center gap-2">
              Sin Ubicación Asignada 
              <Badge variant="destructive">{empleadosSinUbicacion.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {empleadosSinUbicacion.map(empleado => (
                <div key={empleado.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{empleado.nombres} {empleado.apellidos}</span>
                  <Badge variant="destructive" className="text-xs">Sin Asignar</Badge>
                </div>
              ))}
              {empleadosSinUbicacion.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Todos los empleados tienen ubicación asignada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              Con Ubicación Asignada 
              <Badge variant="secondary">{empleadosConUbicacion.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {empleadosConUbicacion.map(empleado => (
                <div key={empleado.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{empleado.nombres} {empleado.apellidos}</span>
                  <Badge variant="secondary" className="text-xs">{empleado.lugar_designado}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para crear nueva ubicación */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !open && cancelarCreacion()}>
        <DialogContent 
          className="sm:max-w-md bg-background border shadow-lg" 
          style={{ zIndex: 10000 }}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Ubicación Encontrada</DialogTitle>
          </DialogHeader>
          
          {selectedLocation && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Dirección:</p>
                <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              </div>

              <div>
                <Label htmlFor="location-name">Nombre de la Ubicación *</Label>
                <Input
                  id="location-name"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Ej: Oficina Central, Almacén Norte..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="radius">Radio de Tolerancia (metros)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={newLocationRadius}
                  onChange={(e) => setNewLocationRadius(Number(e.target.value))}
                  placeholder="100"
                  min="10"
                  max="1000"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={cancelarCreacion} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={crearNuevaUbicacion}
                  disabled={!newLocationName.trim() || createLoading}
                  className="flex-1"
                >
                  {createLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Crear Ubicación Aquí
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};