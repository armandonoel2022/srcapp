import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Camera
} from 'lucide-react';
import { useAnalisisTurnos, EstadisticasEmpleado, AnalisisTurno } from '@/hooks/useAnalisisTurnos';
import { useEmpleadosTurnos } from '@/hooks/useEmpleadosTurnos';
import { useEstadosEmpleados } from '@/hooks/useEstadosEmpleados';
import { useToast } from '@/hooks/use-toast';

export const DashboardAnalisisTurnos = () => {
  const [selectedTab, setSelectedTab] = useState('resumen');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [resumenGeneral, setResumenGeneral] = useState<EstadisticasEmpleado[]>([]);
  const [analisisDetallado, setAnalisisDetallado] = useState<AnalisisTurno[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<AnalisisTurno | null>(null);
  const [justificacionModal, setJustificacionModal] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  const { loading, obtenerResumenGeneral, obtenerAnalisisTurnos, justificarTardanza } = useAnalisisTurnos();
  const { empleados } = useEmpleadosTurnos();
  const { estados } = useEstadosEmpleados();
  const { toast } = useToast();

  useEffect(() => {
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin, selectedEmpleado]);

  const cargarDatos = async () => {
    if (selectedTab === 'resumen') {
      const resumen = await obtenerResumenGeneral(fechaInicio, fechaFin);
      setResumenGeneral(resumen);
    } else if (selectedTab === 'detallado') {
      const analisis = await obtenerAnalisisTurnos(fechaInicio, fechaFin, selectedEmpleado === 'todos' ? undefined : selectedEmpleado || undefined);
      setAnalisisDetallado(analisis);
    }
  };

  const handleJustificarTardanza = async (tipo: 'justificado' | 'injustificado') => {
    if (!selectedTurno) return;

    const result = await justificarTardanza(selectedTurno.id, tipo, observaciones);
    if (result.success) {
      setJustificacionModal(false);
      setSelectedTurno(null);
      setObservaciones('');
      cargarDatos();
    }
  };

  const getEstadoBadge = (turno: AnalisisTurno) => {
    if (turno.estado_empleado) {
      const tipo = turno.estado_empleado.tipo_estado;
      const colors = {
        'vacaciones': 'bg-blue-100 text-blue-800',
        'licencia_medica': 'bg-red-100 text-red-800',
        'permiso': 'bg-yellow-100 text-yellow-800',
        'disponible': 'bg-green-100 text-green-800'
      };
      return <Badge className={colors[tipo] || 'bg-gray-100 text-gray-800'}>{tipo.replace('_', ' ')}</Badge>;
    }

    if (!turno.hora_entrada) {
      return <Badge variant="destructive">Ausente</Badge>;
    }

    // Traffic light system based on compliance status
    const estado = turno.estado_cumplimiento || 'a_tiempo';
    const complianceColors = {
      'a_tiempo': 'bg-green-100 text-green-800',
      'alerta_temprana': 'bg-orange-100 text-orange-800', 
      'amarillo': 'bg-yellow-100 text-yellow-800',
      'rojo': 'bg-red-100 text-red-800'
    };

    const complianceLabels = {
      'a_tiempo': 'A Tiempo',
      'alerta_temprana': `Alerta (${turno.minutos_tardanza}min)`,
      'amarillo': `Tarde (${turno.minutos_tardanza}min)`,
      'rojo': `Muy Tarde (${turno.minutos_tardanza}min)`
    };

    return (
      <div className="flex flex-col gap-1">
        <Badge className={complianceColors[estado] || 'bg-gray-100 text-gray-800'}>
          {complianceLabels[estado] || estado}
        </Badge>
        {turno.alerta_temprana && (
          <Badge variant="outline" className="text-xs">
            ⚠️ Alerta
          </Badge>
        )}
      </div>
    );
  };

  const calcularPromedios = () => {
    if (resumenGeneral.length === 0) return { puntualidad: 0, tardanza: 0, ausencias: 0 };

    const totalEmpleados = resumenGeneral.length;
    const puntualidadPromedio = resumenGeneral.reduce((acc, emp) => acc + emp.porcentaje_puntualidad, 0) / totalEmpleados;
    const tardanzaPromedio = resumenGeneral.reduce((acc, emp) => acc + emp.promedio_tardanza, 0) / totalEmpleados;
    const ausenciasPromedio = resumenGeneral.reduce((acc, emp) => acc + emp.ausencias, 0) / totalEmpleados;

    return {
      puntualidad: Math.round(puntualidadPromedio),
      tardanza: Math.round(tardanzaPromedio),
      ausencias: Math.round(ausenciasPromedio)
    };
  };

  const promedios = calcularPromedios();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard de Análisis de Turnos
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Empleado</label>
              <Select value={selectedEmpleado} onValueChange={setSelectedEmpleado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los empleados</SelectItem>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id}>
                      {empleado.nombres} {empleado.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumen">Resumen General</TabsTrigger>
              <TabsTrigger value="detallado">Análisis Detallado</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-4">
              {/* Métricas generales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Puntualidad Promedio</p>
                        <p className="text-2xl font-bold text-green-600">{promedios.puntualidad}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tardanza Promedio</p>
                        <p className="text-2xl font-bold text-orange-600">{promedios.tardanza} min</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ausencias Promedio</p>
                        <p className="text-2xl font-bold text-red-600">{promedios.ausencias}</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de empleados */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas por Empleado</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Función</TableHead>
                        <TableHead>Total Días</TableHead>
                        <TableHead>Puntualidad</TableHead>
                        <TableHead>Tardanzas</TableHead>
                        <TableHead>Promedio Tardanza</TableHead>
                        <TableHead>Ausencias</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Cargando...</TableCell>
                        </TableRow>
                      ) : resumenGeneral.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">No hay datos disponibles</TableCell>
                        </TableRow>
                      ) : (
                        resumenGeneral.map((empleado) => (
                          <TableRow key={empleado.empleado_id}>
                            <TableCell className="font-medium">
                              {empleado.nombres} {empleado.apellidos}
                            </TableCell>
                            <TableCell>{empleado.funcion}</TableCell>
                            <TableCell>{empleado.total_dias}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={empleado.porcentaje_puntualidad} className="flex-1" />
                                <span className="text-sm">{empleado.porcentaje_puntualidad}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{empleado.dias_tardanza}</TableCell>
                            <TableCell>{Math.round(empleado.promedio_tardanza)} min</TableCell>
                            <TableCell>{empleado.ausencias}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detallado" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Detallado de Turnos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Observaciones</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Cargando...</TableCell>
                        </TableRow>
                      ) : analisisDetallado.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">No hay datos disponibles</TableCell>
                        </TableRow>
                      ) : (
                        analisisDetallado.map((turno) => (
                          <TableRow key={turno.id}>
                            <TableCell className="font-medium">
                              {turno.empleados_turnos?.nombres} {turno.empleados_turnos?.apellidos}
                            </TableCell>
                            <TableCell>{turno.fecha}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {turno.hora_entrada ? 
                  new Date(`2000-01-01T${turno.hora_entrada}`).toLocaleTimeString('es-ES', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  }) : 'N/A'
                }
                {turno.hora_programada && turno.hora_entrada && (
                  <span className="text-xs text-muted-foreground">
                    (Prog: {new Date(`2000-01-01T${turno.hora_programada}`).toLocaleTimeString('es-ES', { 
                      hour: 'numeric', 
                      minute: '2-digit', 
                      hour12: true 
                    })})
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              {turno.hora_salida ? 
                new Date(`2000-01-01T${turno.hora_salida}`).toLocaleTimeString('es-ES', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                }) : 'N/A'
              }
            </TableCell>
                            <TableCell>{getEstadoBadge(turno)}</TableCell>
                            <TableCell>
                              <div className="max-w-32 truncate text-sm text-muted-foreground">
                                {turno.observaciones || turno.estado_empleado?.motivo || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {turno.minutos_tardanza > 0 && turno.estado_justificacion === 'sin_justificar' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTurno(turno);
                                    setJustificacionModal(true);
                                  }}
                                >
                                  Justificar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de justificación */}
      <Dialog open={justificacionModal} onOpenChange={setJustificacionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificar Tardanza</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTurno && (
              <div className="p-4 bg-muted rounded-lg">
                <p><strong>Empleado:</strong> {selectedTurno.empleados_turnos?.nombres} {selectedTurno.empleados_turnos?.apellidos}</p>
                <p><strong>Fecha:</strong> {selectedTurno.fecha}</p>
                <p><strong>Tardanza:</strong> {selectedTurno.minutos_tardanza} minutos</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Observaciones</label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Escriba la justificación o observaciones..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleJustificarTardanza('justificado')}
                disabled={loading}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Justificar
              </Button>
              <Button
                onClick={() => handleJustificarTardanza('injustificado')}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Marcar Injustificado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};