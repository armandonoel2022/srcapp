import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

export const AsignarUbicacionesEmpleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionTrabajo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

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

      // Cargar ubicaciones
      const { data: ubicacionesData, error: ubicacionesError } = await supabase
        .from('ubicaciones_trabajo')
        .select('id, nombre, direccion')
        .eq('activa', true)
        .order('nombre');

      if (ubicacionesError) throw ubicacionesError;

      setEmpleados(empleadosData || []);
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

  const asignarUbicacion = async (empleadoId: string, ubicacionNombre: string | null) => {
    setSaving(empleadoId);
    try {
      const { error } = await supabase
        .from('empleados_turnos')
        .update({ lugar_designado: ubicacionNombre })
        .eq('id', empleadoId);

      if (error) throw error;

      // Actualizar estado local
      setEmpleados(empleados.map(emp => 
        emp.id === empleadoId 
          ? { ...emp, lugar_designado: ubicacionNombre || undefined }
          : emp
      ));

      toast({
        title: "Ubicación asignada",
        description: `Ubicación ${ubicacionNombre ? 'asignada' : 'eliminada'} correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al asignar ubicación: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const empleadosSinUbicacion = empleados.filter(emp => !emp.lugar_designado);
  const empleadosConUbicacion = empleados.filter(emp => emp.lugar_designado);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Asignar Ubicaciones a Empleados
          </CardTitle>
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
                                Sin ubicación
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                onValueChange={(value) => asignarUbicacion(empleado.id, value === 'null' ? null : value)}
                                disabled={saving === empleado.id}
                              >
                                <SelectTrigger className="w-64">
                                  <SelectValue placeholder="Seleccionar ubicación" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ubicaciones.map((ubicacion) => (
                                    <SelectItem key={ubicacion.id} value={ubicacion.nombre}>
                                      {ubicacion.nombre}
                                      {ubicacion.direccion && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({ubicacion.direccion})
                                        </span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {saving === empleado.id && (
                                <div className="text-sm text-muted-foreground">
                                  Guardando...
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empleados con ubicación asignada */}
              {empleadosConUbicacion.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-600">
                    Empleados con ubicación asignada ({empleadosConUbicacion.length})
                  </h3>
                  <div className="grid gap-4">
                    {empleadosConUbicacion.map((empleado) => (
                      <Card key={empleado.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {empleado.nombres} {empleado.apellidos}
                              </h4>
                              <Badge variant="default" className="mt-1">
                                {empleado.lugar_designado}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                defaultValue={empleado.lugar_designado}
                                onValueChange={(value) => asignarUbicacion(empleado.id, value === 'null' ? null : value)}
                                disabled={saving === empleado.id}
                              >
                                <SelectTrigger className="w-64">
                                  <SelectValue placeholder="Cambiar ubicación" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="null">
                                    <span className="text-red-600">Quitar ubicación</span>
                                  </SelectItem>
                                  {ubicaciones.map((ubicacion) => (
                                    <SelectItem key={ubicacion.id} value={ubicacion.nombre}>
                                      {ubicacion.nombre}
                                      {ubicacion.direccion && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({ubicacion.direccion})
                                        </span>
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {saving === empleado.id && (
                                <div className="text-sm text-muted-foreground">
                                  Guardando...
                                </div>
                              )}
                            </div>
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
                      <span className="font-medium">Resumen</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">
                        Con ubicación: {empleadosConUbicacion.length}
                      </span>
                      <span className="text-red-600">
                        Sin ubicación: {empleadosSinUbicacion.length}
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