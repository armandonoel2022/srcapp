import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LocationSelector } from './LocationSelector';

interface UbicacionTrabajo {
  id: string;
  nombre: string;
  direccion: string;
  coordenadas: string;
  radio_tolerancia: number;
  activa: boolean;
  created_at: string;
  empleados_asignados?: number;
}

export const GestionUbicacionesTrabajo = () => {
  const [ubicaciones, setUbicaciones] = useState<UbicacionTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [editingLocation, setEditingLocation] = useState<UbicacionTrabajo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  const cargarUbicaciones = async () => {
    try {
      setLoading(true);
      
      // Cargar ubicaciones con conteo de empleados asignados
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from('ubicaciones_trabajo')
        .select('*')
        .order('nombre');

      if (ubicacionesError) throw ubicacionesError;

      // Obtener conteo de empleados por ubicación
      const ubicacionesConEmpleados = await Promise.all(
        (ubicacionesData || []).map(async (ubicacion) => {
          const { count } = await supabase
            .from('empleados_turnos')
            .select('*', { count: 'exact', head: true })
            .eq('lugar_designado', ubicacion.nombre)
            .eq('active', true);

          return {
            ...ubicacion,
            empleados_asignados: count || 0
          };
        })
      );

      setUbicaciones(ubicacionesConEmpleados);
    } catch (error: any) {
      console.error('Error cargando ubicaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ubicaciones de trabajo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const parseCoordinates = (coordString: string) => {
    // Formato: "(lat,lng)"
    const match = coordString.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    return { lat: 0, lng: 0 };
  };

  const handleLocationSaved = () => {
    cargarUbicaciones();
    setShowLocationSelector(false);
    setEditingLocation(null);
  };

  const handleEdit = (ubicacion: UbicacionTrabajo) => {
    setEditingLocation(ubicacion);
    setShowLocationSelector(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la ubicación "${nombre}"?`)) return;

    try {
      const { error } = await supabase
        .from('ubicaciones_trabajo')
        .update({ activa: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ubicación eliminada",
        description: "La ubicación de trabajo ha sido desactivada",
      });

      cargarUbicaciones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, activa: boolean) => {
    try {
      const { error } = await supabase
        .from('ubicaciones_trabajo')
        .update({ activa: !activa })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: activa ? "Ubicación desactivada" : "Ubicación activada",
        description: `La ubicación ha sido ${activa ? 'desactivada' : 'activada'}`,
      });

      cargarUbicaciones();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Cargando ubicaciones...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicaciones de Trabajo
            </CardTitle>
            <Button onClick={() => setShowLocationSelector(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ubicación
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Gestiona las ubicaciones donde pueden trabajar los empleados. 
            Las coordenadas se usan para validar que estén en el lugar correcto al hacer punch.
          </div>

          {ubicaciones.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay ubicaciones configuradas</h3>
              <p className="text-muted-foreground mb-4">
                Agrega ubicaciones de trabajo para validar la geolocalización de los empleados
              </p>
              <Button onClick={() => setShowLocationSelector(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera ubicación
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ubicaciones.map((ubicacion) => {
                const coords = parseCoordinates(ubicacion.coordenadas);
                return (
                  <Card key={ubicacion.id} className={`${!ubicacion.activa ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{ubicacion.nombre}</h3>
                          <Badge 
                            variant={ubicacion.activa ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {ubicacion.activa ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(ubicacion)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(ubicacion.id, ubicacion.activa)}
                          >
                            {ubicacion.activa ? (
                              <Trash2 className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground break-words">
                          {ubicacion.direccion}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span>Radio: {ubicacion.radio_tolerancia}m</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{ubicacion.empleados_asignados || 0} empleados</span>
                      </div>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`https://maps.google.com/?q=${coords.lat},${coords.lng}`, '_blank')}
                      >
                        Ver en Maps
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selector de ubicación */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => {
          setShowLocationSelector(false);
          setEditingLocation(null);
        }}
        onLocationSaved={handleLocationSaved}
        initialLocation={editingLocation ? {
          nombre: editingLocation.nombre,
          direccion: editingLocation.direccion,
          ...parseCoordinates(editingLocation.coordenadas),
          radio_tolerancia: editingLocation.radio_tolerancia
        } : undefined}
      />
    </div>
  );
};