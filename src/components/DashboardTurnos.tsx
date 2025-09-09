import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Clock, 
  Users, 
  MapPin,
  TrendingUp,
  TrendingDown,
  Calendar,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useEmpleadosTurnos } from '@/hooks/useEmpleadosTurnos';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EstadisticasGenerales {
  totalEmpleados: number;
  empleadosActivos: number;
  puntualidadPromedio: number;
  ausenciasHoy: number;
}

interface EstadisticasPorUbicacion {
  ubicacion: string;
  totalEmpleados: number;
  puntualidadPromedio: number;
  empleadosPresentes: number;
}

interface EstadisticasPorEdad {
  rangoEdad: string;
  cantidad: number;
  puntualidadPromedio: number;
}

interface EstadisticasPorSexo {
  sexo: string;
  cantidad: number;
  puntualidadPromedio: number;
}

export const DashboardTurnos = () => {
  const [fechaConsulta, setFechaConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales>({
    totalEmpleados: 0,
    empleadosActivos: 0,
    puntualidadPromedio: 0,
    ausenciasHoy: 0
  });
  const [estadisticasPorUbicacion, setEstadisticasPorUbicacion] = useState<EstadisticasPorUbicacion[]>([]);
  const [estadisticasPorEdad, setEstadisticasPorEdad] = useState<EstadisticasPorEdad[]>([]);
  const [estadisticasPorSexo, setEstadisticasPorSexo] = useState<EstadisticasPorSexo[]>([]);
  const [loading, setLoading] = useState(true);

  const { empleados } = useEmpleadosTurnos();
  const { toast } = useToast();

  useEffect(() => {
    cargarEstadisticas();
  }, [fechaConsulta, empleados]);

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
    
    if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };

  const getRangoEdad = (edad: number): string => {
    if (edad < 25) return '18-24';
    if (edad < 35) return '25-34';
    if (edad < 45) return '35-44';
    if (edad < 55) return '45-54';
    return '55+';
  };

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Estadísticas generales
      const empleadosActivos = empleados.length; // Todos los empleados cargados están activos por defecto
      
      // Obtener turnos del día seleccionado
      const { data: turnosHoy, error: turnosError } = await supabase
        .from('turnos_empleados')
        .select(`
          *,
          empleados_turnos!inner(*)
        `)
        .eq('fecha', fechaConsulta);

      if (turnosError) throw turnosError;

      // Calcular puntualidad promedio
      const turnosConEntrada = turnosHoy?.filter(t => t.hora_entrada) || [];
      const puntualidadPromedio = turnosConEntrada.length > 0 
        ? Math.round((turnosConEntrada.filter(t => t.minutos_tardanza === 0).length / turnosConEntrada.length) * 100)
        : 0;

      const ausenciasHoy = empleadosActivos - turnosConEntrada.length;

      setEstadisticasGenerales({
        totalEmpleados: empleados.length,
        empleadosActivos: empleadosActivos,
        puntualidadPromedio,
        ausenciasHoy
      });

      // Estadísticas por ubicación
      const ubicacionesStats = empleados.reduce((acc, emp) => {
        const ubicacion = emp.lugar_designado || 'Sin asignar';
        if (!acc[ubicacion]) {
          acc[ubicacion] = {
            ubicacion,
            totalEmpleados: 0,
            empleadosPresentes: 0,
            tardanzaTotal: 0,
            empleadosPuntuales: 0
          };
        }
        
        acc[ubicacion].totalEmpleados++;
        
        const turnoEmpleado = turnosHoy?.find(t => t.empleado_id === emp.id);
        if (turnoEmpleado?.hora_entrada) {
          acc[ubicacion].empleadosPresentes++;
          if (turnoEmpleado.minutos_tardanza === 0) {
            acc[ubicacion].empleadosPuntuales++;
          }
        }
        
        return acc;
      }, {} as Record<string, any>);

      const ubicacionesArray = Object.values(ubicacionesStats).map((ub: any) => ({
        ubicacion: ub.ubicacion,
        totalEmpleados: ub.totalEmpleados,
        empleadosPresentes: ub.empleadosPresentes,
        puntualidadPromedio: ub.empleadosPresentes > 0 
          ? Math.round((ub.empleadosPuntuales / ub.empleadosPresentes) * 100)
          : 0
      }));

      setEstadisticasPorUbicacion(ubicacionesArray as EstadisticasPorUbicacion[]);

      // Estadísticas por edad
      const edadStats = empleados.reduce((acc, emp) => {
        if (!emp.fecha_nacimiento) return acc;
        
        const edad = calcularEdad(emp.fecha_nacimiento);
        const rangoEdad = getRangoEdad(edad);
        
        if (!acc[rangoEdad]) {
          acc[rangoEdad] = {
            rangoEdad,
            cantidad: 0,
            empleadosPuntuales: 0,
            empleadosPresentes: 0
          };
        }
        
        acc[rangoEdad].cantidad++;
        
        const turnoEmpleado = turnosHoy?.find(t => t.empleado_id === emp.id);
        if (turnoEmpleado?.hora_entrada) {
          acc[rangoEdad].empleadosPresentes++;
          if (turnoEmpleado.minutos_tardanza === 0) {
            acc[rangoEdad].empleadosPuntuales++;
          }
        }
        
        return acc;
      }, {} as Record<string, any>);

      const edadArray = Object.values(edadStats).map((edad: any) => ({
        rangoEdad: edad.rangoEdad,
        cantidad: edad.cantidad,
        puntualidadPromedio: edad.empleadosPresentes > 0 
          ? Math.round((edad.empleadosPuntuales / edad.empleadosPresentes) * 100)
          : 0
      }));

      setEstadisticasPorEdad(edadArray as EstadisticasPorEdad[]);

      // Estadísticas por sexo
      const sexoStats = empleados.reduce((acc, emp) => {
        const sexo = emp.sexo || 'No especificado';
        
        if (!acc[sexo]) {
          acc[sexo] = {
            sexo,
            cantidad: 0,
            empleadosPuntuales: 0,
            empleadosPresentes: 0
          };
        }
        
        acc[sexo].cantidad++;
        
        const turnoEmpleado = turnosHoy?.find(t => t.empleado_id === emp.id);
        if (turnoEmpleado?.hora_entrada) {
          acc[sexo].empleadosPresentes++;
          if (turnoEmpleado.minutos_tardanza === 0) {
            acc[sexo].empleadosPuntuales++;
          }
        }
        
        return acc;
      }, {} as Record<string, any>);

      const sexoArray = Object.values(sexoStats).map((sexo: any) => ({
        sexo: sexo.sexo,
        cantidad: sexo.cantidad,
        puntualidadPromedio: sexo.empleadosPresentes > 0 
          ? Math.round((sexo.empleadosPuntuales / sexo.empleadosPresentes) * 100)
          : 0
      }));

      setEstadisticasPorSexo(sexoArray as EstadisticasPorSexo[]);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar estadísticas: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando dashboard de turnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha de Consulta</label>
              <Input
                type="date"
                value={fechaConsulta}
                onChange={(e) => setFechaConsulta(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={cargarEstadisticas} disabled={loading}>
                <Calendar className="mr-2 h-4 w-4" />
                Actualizar Datos
              </Button>
            </div>
          </div>

          {/* Métricas Generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Empleados</p>
                    <p className="text-2xl font-bold">{estadisticasGenerales.totalEmpleados}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Empleados Activos</p>
                    <p className="text-2xl font-bold text-green-600">{estadisticasGenerales.empleadosActivos}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Puntualidad Promedio</p>
                    <p className="text-2xl font-bold text-green-600">{estadisticasGenerales.puntualidadPromedio}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ausencias Hoy</p>
                    <p className="text-2xl font-bold text-red-600">{estadisticasGenerales.ausenciasHoy}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ubicacion" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ubicacion">Por Ubicación</TabsTrigger>
              <TabsTrigger value="demografia">Demografía</TabsTrigger>
              <TabsTrigger value="puntualidad">Análisis Puntualidad</TabsTrigger>
            </TabsList>

            <TabsContent value="ubicacion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Estadísticas por Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {estadisticasPorUbicacion.map((ubicacion, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{ubicacion.ubicacion}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ubicacion.empleadosPresentes}/{ubicacion.totalEmpleados} empleados presentes
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{ubicacion.puntualidadPromedio}%</p>
                            <p className="text-xs text-muted-foreground">Puntualidad</p>
                          </div>
                          <Progress value={ubicacion.puntualidadPromedio} className="w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="demografia" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Por Edad */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Edad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estadisticasPorEdad.map((edad, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{edad.rangoEdad} años</Badge>
                            <span className="text-sm">{edad.cantidad} empleados</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{edad.puntualidadPromedio}%</span>
                            <Progress value={edad.puntualidadPromedio} className="w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Por Sexo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por Sexo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estadisticasPorSexo.map((sexo, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{sexo.sexo}</Badge>
                            <span className="text-sm">{sexo.cantidad} empleados</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{sexo.puntualidadPromedio}%</span>
                            <Progress value={sexo.puntualidadPromedio} className="w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="puntualidad" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Análisis de Puntualidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {estadisticasGenerales.puntualidadPromedio}%
                      </div>
                      <p className="text-sm text-muted-foreground">Puntualidad General</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {estadisticasGenerales.empleadosActivos - estadisticasGenerales.ausenciasHoy}
                      </div>
                      <p className="text-sm text-muted-foreground">Empleados Presentes</p>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        {estadisticasGenerales.ausenciasHoy}
                      </div>
                      <p className="text-sm text-muted-foreground">Ausencias del Día</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};