import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AsignarMultiplesUbicaciones } from './AsignarMultiplesUbicaciones';

interface Empleado {
  id: string;
  nombres: string;
  apellidos: string;
  lugar_designado?: string;
  ubicaciones_count?: number;
}

interface UbicacionTrabajo {
  id: string;
  nombre: string;
  direccion?: string;
}

export const AsignarUbicacionesEmpleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMultipleAssignment, setShowMultipleAssignment] = useState(false);
  const { toast } = useToast();

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar empleados con conteo de ubicaciones asignadas
      const { data: empleadosData, error: empleadosError } = await supabase
        .from('empleados_turnos')
        .select('id, nombres, apellidos, lugar_designado')
        .eq('active', true)
        .order('nombres');

      if (empleadosError) throw empleadosError;

      // Para cada empleado, obtener cuántas ubicaciones tiene asignadas
      const empleadosConUbicaciones = await Promise.all(
        (empleadosData || []).map(async (emp) => {
          const { count } = await supabase
            .from('empleados_ubicaciones_asignadas')
            .select('*', { count: 'exact', head: true })
            .eq('empleado_id', emp.id)
            .eq('activa', true);

          return {
            ...emp,
            ubicaciones_count: count || 0
          };
        })
      );

      // Cargar ubicaciones
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from('ubicaciones_trabajo')
        .select('id, nombre, direccion')
        .eq('activa', true)
        .order('nombre');

      if (ubicacionesError) throw ubicacionesError;

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

  if (showMultipleAssignment) {
    return <AsignarMultiplesUbicaciones />;
  }

  const empleadosConUbicacionesMultiples = empleados.filter(emp => emp.ubicaciones_count > 1);
  const empleadosConUnaUbicacion = empleados.filter(emp => emp.ubicaciones_count === 1);
  const empleadosSinUbicacion = empleados.filter(emp => emp.ubicaciones_count === 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Gestión de Ubicaciones de Empleados
            </CardTitle>
            <Button onClick={() => setShowMultipleAssignment(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Asignación Múltiple
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Los empleados ahora pueden tener múltiples ubicaciones asignadas para mayor flexibilidad
          </p>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8">
              <p>Cargando empleados y ubicaciones...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* Empleados sin ubicación asignada */}
              {empleadosSinUbicacion.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-600">
                    Empleados sin ubicación asignada ({empleadosSinUbicacion.length})
                  </h3>
                  <div className="grid gap-4">
                    {empleadosSinUbicacion.map((empleado) => (
                      <Card key={empleado.id} className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {empleado.nombres} {empleado.apellidos}
                              </h4>
                              <Badge variant="destructive" className="mt-1">
                                Sin ubicaciones
                              </Badge>
                            </div>
                            <Button
                              onClick={() => setShowMultipleAssignment(true)}
                              variant="outline"
                            >
                              Asignar Ubicaciones
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empleados con una ubicación */}
              {empleadosConUnaUbicacion.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-yellow-600">
                    Empleados con una ubicación ({empleadosConUnaUbicacion.length})
                  </h3>
                  <div className="grid gap-4">
                    {empleadosConUnaUbicacion.map((empleado) => (
                      <Card key={empleado.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {empleado.nombres} {empleado.apellidos}
                              </h4>
                              <Badge variant="secondary" className="mt-1">
                                1 ubicación asignada
                              </Badge>
                            </div>
                            <Button
                              onClick={() => setShowMultipleAssignment(true)}
                              variant="outline"
                            >
                              Gestionar Ubicaciones
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empleados con múltiples ubicaciones */}
              {empleadosConUbicacionesMultiples.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-600">
                    Empleados con múltiples ubicaciones ({empleadosConUbicacionesMultiples.length})
                  </h3>
                  <div className="grid gap-4">
                    {empleadosConUbicacionesMultiples.map((empleado) => (
                      <Card key={empleado.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {empleado.nombres} {empleado.apellidos}
                              </h4>
                              <Badge variant="default" className="mt-1">
                                {empleado.ubicaciones_count} ubicaciones
                              </Badge>
                            </div>
                            <Button
                              onClick={() => setShowMultipleAssignment(true)}
                              variant="outline"
                            >
                              Gestionar Ubicaciones
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Resumen del Sistema de Ubicaciones Múltiples</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">
                        Múltiples ubicaciones: {empleadosConUbicacionesMultiples.length}
                      </span>
                      <span className="text-yellow-600">
                        Una ubicación: {empleadosConUnaUbicacion.length}
                      </span>
                      <span className="text-red-600">
                        Sin ubicaciones: {empleadosSinUbicacion.length}
                      </span>
                      <span className="text-muted-foreground">
                        Total: {empleados.length}
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