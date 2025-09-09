import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CumplimientoData {
  empleado_id: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  ubicacion: string;
  cumplimiento_promedio: number;
  turnos_cumplidos: number;
  total_turnos: number;
  retrasos_promedio: number;
}

export const DashboardCumplimiento = () => {
  const [cumplimientoData, setCumplimientoData] = useState<CumplimientoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('todas');
  const [fechaInicio, setFechaInicio] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const { toast } = useToast();

  const cargarUbicaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados_turnos')
        .select('lugar_designado')
        .not('lugar_designado', 'is', null)
        .eq('active', true);

      if (error) throw error;

      const ubicacionesUnicas = [...new Set(data.map(e => e.lugar_designado))].filter(Boolean);
      setUbicaciones(ubicacionesUnicas);
    } catch (error: any) {
      console.error('Error cargando ubicaciones:', error);
    }
  };

  const cargarDatosCumplimiento = async () => {
    setLoading(true);
    try {
      // Consulta base para obtener empleados y sus turnos
      let query = supabase
        .from('turnos_empleados')
        .select(`
          empleado_id,
          fecha,
          hora_entrada,
          hora_salida,
          empleados_turnos!empleado_id (
            nombres,
            apellidos,
            funcion,
            lugar_designado
          )
        `)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (filtroUbicacion !== 'todas') {
        query = query.eq('empleados_turnos.lugar_designado', filtroUbicacion);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Procesar datos para calcular cumplimiento
      const empleadosMap = new Map();

      data?.forEach(turno => {
        const empleado = turno.empleados_turnos;
        const key = turno.empleado_id;

        if (!empleadosMap.has(key)) {
          empleadosMap.set(key, {
            empleado_id: key,
            nombres: empleado.nombres,
            apellidos: empleado.apellidos,
            funcion: empleado.funcion,
            ubicacion: empleado.lugar_designado || 'Sin asignar',
            turnos: [],
            turnos_completos: 0,
            total_turnos: 0
          });
        }

        const emp = empleadosMap.get(key);
        emp.total_turnos++;

        if (turno.hora_entrada && turno.hora_salida) {
          emp.turnos_completos++;
        }

        emp.turnos.push(turno);
      });

      // Convertir a array y calcular métricas
      const resultado: CumplimientoData[] = Array.from(empleadosMap.values()).map(emp => {
        const cumplimiento = emp.total_turnos > 0 ? (emp.turnos_completos / emp.total_turnos) * 100 : 0;
        
        return {
          empleado_id: emp.empleado_id,
          nombres: emp.nombres,
          apellidos: emp.apellidos,
          funcion: emp.funcion,
          ubicacion: emp.ubicacion,
          cumplimiento_promedio: Math.round(cumplimiento),
          turnos_cumplidos: emp.turnos_completos,
          total_turnos: emp.total_turnos,
          retrasos_promedio: 0 // Simplificado por ahora
        };
      });

      setCumplimientoData(resultado.sort((a, b) => b.cumplimiento_promedio - a.cumplimiento_promedio));

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar datos de cumplimiento: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  useEffect(() => {
    cargarDatosCumplimiento();
  }, [fechaInicio, fechaFin, filtroUbicacion]);

  const getCumplimientoBadge = (porcentaje: number) => {
    if (porcentaje >= 90) return <Badge className="bg-green-500">Excelente</Badge>;
    if (porcentaje >= 75) return <Badge className="bg-yellow-500">Bueno</Badge>;
    if (porcentaje >= 60) return <Badge className="bg-orange-500">Regular</Badge>;
    return <Badge variant="destructive">Deficiente</Badge>;
  };

  const promedioGeneral = cumplimientoData.length > 0 
    ? Math.round(cumplimientoData.reduce((acc, emp) => acc + emp.cumplimiento_promedio, 0) / cumplimientoData.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Dashboard de Cumplimiento por Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fecha-fin">Fecha Fin</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ubicacion-filter">Ubicación</Label>
              <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las ubicaciones</SelectItem>
                  {ubicaciones.map(ubicacion => (
                    <SelectItem key={ubicacion} value={ubicacion}>
                      {ubicacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cumplimiento Promedio</p>
                <p className="text-2xl font-bold">{promedioGeneral}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empleados Evaluados</p>
                <p className="text-2xl font-bold">{cumplimientoData.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Con Cumplimiento +90%</p>
                <p className="text-2xl font-bold">
                  {cumplimientoData.filter(emp => emp.cumplimiento_promedio >= 90).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requieren Atención</p>
                <p className="text-2xl font-bold">
                  {cumplimientoData.filter(emp => emp.cumplimiento_promedio < 75).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Detalle por Empleado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Función</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Turnos</TableHead>
                  <TableHead>Cumplimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando datos de cumplimiento...
                    </TableCell>
                  </TableRow>
                ) : cumplimientoData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay datos de cumplimiento para el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  cumplimientoData.map((empleado) => (
                    <TableRow key={empleado.empleado_id}>
                      <TableCell>
                        <div className="font-medium">
                          {empleado.nombres} {empleado.apellidos}
                        </div>
                      </TableCell>
                      <TableCell>{empleado.funcion}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                          {empleado.ubicacion}
                        </div>
                      </TableCell>
                      <TableCell>
                        {empleado.turnos_cumplidos}/{empleado.total_turnos}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{empleado.cumplimiento_promedio}%</span>
                          </div>
                          <Progress value={empleado.cumplimiento_promedio} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCumplimientoBadge(empleado.cumplimiento_promedio)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};