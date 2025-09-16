import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Users, Save, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  ubicaciones_asignadas: string[];
}

interface UbicacionTrabajo {
  id: string;
  nombre: string;
  direccion?: string;
}

export const AsignarMultiplesUbicaciones = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedEmpleado, setSelectedEmpleado] = useState<string | null>(null);
  const [selectedUbicaciones, setSelectedUbicaciones] = useState<string[]>([]);
  const { toast } = useToast();

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar empleados
      const { data: empleadosData, error: empleadosError } = await supabase
        .from('empleados_turnos')
        .select('id, nombres, apellidos')
        .eq('active', true)
        .order('nombres');

      if (empleadosError) throw empleadosError;

      // Cargar ubicaciones
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from('ubicaciones_trabajo')
        .select('id, nombre, direccion')
        .eq('activa', true)
        .order('nombre');

      if (ubicacionesError) throw ubicacionesError;

      // Cargar asignaciones existentes para cada empleado
      const empleadosConUbicaciones = await Promise.all(
        (empleadosData || []).map(async (emp) => {
          const { data: asignaciones } = await supabase
            .from('empleados_ubicaciones_asignadas')
            .select('ubicacion_nombre')
            .eq('empleado_id', emp.id)
            .eq('activa', true);

          return {
            ...emp,
            ubicaciones_asignadas: asignaciones?.map(a => a.ubicacion_nombre) || []
          };
        })
      );

      setEmpleados(empleadosConUbicaciones);
      setUbicaciones(ubicacionesData || []);
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

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleEmpleadoSelect = (empleadoId: string) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    setSelectedEmpleado(empleadoId);
    setSelectedUbicaciones(empleado?.ubicaciones_asignadas || []);
  };

  const handleUbicacionToggle = (ubicacionNombre: string) => {
    setSelectedUbicaciones(prev => {
      if (prev.includes(ubicacionNombre)) {
        return prev.filter(u => u !== ubicacionNombre);
      } else {
        return [...prev, ubicacionNombre];
      }
    });
  };

  const guardarAsignaciones = async () => {
    if (!selectedEmpleado) return;

    setSaving(selectedEmpleado);
    try {
      // Desactivar todas las asignaciones existentes
      await supabase
        .from('empleados_ubicaciones_asignadas')
        .update({ activa: false })
        .eq('empleado_id', selectedEmpleado);

      // Crear nuevas asignaciones
      if (selectedUbicaciones.length > 0) {
        const nuevasAsignaciones = selectedUbicaciones.map(ubicacion => ({
          empleado_id: selectedEmpleado,
          ubicacion_nombre: ubicacion,
          activa: true
        }));

        const { error } = await supabase
          .from('empleados_ubicaciones_asignadas')
          .upsert(nuevasAsignaciones, {
            onConflict: 'empleado_id,ubicacion_nombre'
          });

        if (error) throw error;
      }

      // Actualizar estado local
      setEmpleados(empleados.map(emp => 
        emp.id === selectedEmpleado 
          ? { ...emp, ubicaciones_asignadas: selectedUbicaciones }
          : emp
      ));

      toast({
        title: "Éxito",
        description: `Ubicaciones asignadas correctamente (${selectedUbicaciones.length} ubicaciones)`,
      });

      setSelectedEmpleado(null);
      setSelectedUbicaciones([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al asignar ubicaciones: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const cancelarEdicion = () => {
    setSelectedEmpleado(null);
    setSelectedUbicaciones([]);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Cargando empleados y ubicaciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Asignar Múltiples Ubicaciones a Empleados
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Los empleados pueden tener múltiples ubicaciones asignadas para cubrir diferentes puestos
          </p>
        </CardHeader>
        <CardContent>
          {selectedEmpleado ? (
            // Modo edición
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Editar ubicaciones para: {empleados.find(e => e.id === selectedEmpleado)?.nombres} {empleados.find(e => e.id === selectedEmpleado)?.apellidos}
                </h3>
                <Button variant="outline" onClick={cancelarEdicion}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ubicaciones.map((ubicacion) => (
                  <Card key={ubicacion.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`ubicacion-${ubicacion.id}`}
                        checked={selectedUbicaciones.includes(ubicacion.nombre)}
                        onCheckedChange={() => handleUbicacionToggle(ubicacion.nombre)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`ubicacion-${ubicacion.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {ubicacion.nombre}
                        </label>
                        {ubicacion.direccion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {ubicacion.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Badge variant="outline">
                  {selectedUbicaciones.length} ubicaciones seleccionadas
                </Badge>
                <Button 
                  onClick={guardarAsignaciones}
                  disabled={saving === selectedEmpleado}
                  size="lg"
                >
                  {saving === selectedEmpleado ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Asignaciones
                </Button>
              </div>
            </div>
          ) : (
            // Lista de empleados
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Selecciona un empleado para asignar o modificar sus ubicaciones de trabajo
              </div>

              <div className="grid gap-4">
                {empleados.map((empleado) => (
                  <Card key={empleado.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {empleado.nombres} {empleado.apellidos}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {empleado.ubicaciones_asignadas.length > 0 ? (
                            empleado.ubicaciones_asignadas.map((ubicacion, idx) => (
                              <Badge key={idx} variant="default" className="text-xs">
                                {ubicacion}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Sin ubicaciones asignadas
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleEmpleadoSelect(empleado.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Resumen */}
              <Card className="bg-muted mt-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Resumen</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">
                        Con ubicaciones: {empleados.filter(e => e.ubicaciones_asignadas.length > 0).length}
                      </span>
                      <span className="text-red-600">
                        Sin ubicaciones: {empleados.filter(e => e.ubicaciones_asignadas.length === 0).length}
                      </span>
                      <span className="text-muted-foreground">
                        Total empleados: {empleados.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};