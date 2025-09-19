import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Edit3, Eye, MapPin, Calendar, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Turno {
  id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada?: string | null;
  hora_salida?: string | null;
  foto_entrada?: string | null;
  foto_salida?: string | null;
  ubicacion_entrada?: unknown;
  ubicacion_salida?: unknown;
  observaciones?: string | null;
  minutos_tardanza?: number;
  estado_cumplimiento?: string;
  alerta_temprana?: boolean;
  empleados_turnos: {
    nombres: string;
    apellidos?: string | null;
    funcion: string;
    hora_entrada_programada?: string | null;
    hora_salida_programada?: string | null;
    lugar_designado?: string | null;
  } | null;
}

export const TurnosAdminConsulta = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editObservaciones, setEditObservaciones] = useState('');
  const [editHoraEntrada, setEditHoraEntrada] = useState('');
  const [editHoraSalida, setEditHoraSalida] = useState('');

  const { obtenerTurnos, loading } = useTurnos();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    cargarTurnos();
  }, []);

  useEffect(() => {
    filterTurnos();
  }, [turnos, searchDate, searchEmpleado]);

  const cargarTurnos = async () => {
    const result = await obtenerTurnos();
    if (result.success) {
      setTurnos(result.data as any[]);
    }
  };

  const filterTurnos = () => {
    let filtered = [...turnos];

    if (searchDate) {
      filtered = filtered.filter(turno => turno.fecha === searchDate);
    }

    if (searchEmpleado) {
      filtered = filtered.filter(turno => {
        if (!turno.empleados_turnos) return false;
        const nombreCompleto = `${turno.empleados_turnos.nombres} ${turno.empleados_turnos.apellidos || ''}`.toLowerCase();
        const funcion = turno.empleados_turnos.funcion.toLowerCase();
        const search = searchEmpleado.toLowerCase();
        return nombreCompleto.includes(search) || funcion.includes(search);
      });
    }

    setFilteredTurnos(filtered);
  };

  const calcularHorasTrabajadas = (horaEntrada?: string | null, horaSalida?: string | null) => {
    if (!horaEntrada || !horaSalida) return 0;
    
    const entrada = new Date(`2000-01-01T${horaEntrada}`);
    const salida = new Date(`2000-01-01T${horaSalida}`);
    
    // Si la salida es menor que la entrada, asumimos que es del día siguiente
    if (salida < entrada) {
      salida.setDate(salida.getDate() + 1);
    }
    
    const diffMs = salida.getTime() - entrada.getTime();
    return diffMs / (1000 * 60 * 60); // Convertir a horas
  };

  const getEstadoBadge = (turno: Turno) => {
    if (!turno.hora_entrada) {
      return <Badge variant="destructive">Sin entrada</Badge>;
    }
    
    if (!turno.hora_salida) {
      return <Badge variant="secondary">Solo entrada</Badge>;
    }

    const horasTrabajadas = calcularHorasTrabajadas(turno.hora_entrada, turno.hora_salida);
    
    // Verificar si está dentro del horario programado (considerar horario nocturno)
    const horaEntrada = new Date(`2000-01-01T${turno.hora_entrada}`);
    const horaProgramada = new Date(`2000-01-01T08:00:00`); // Asumiendo 8 AM por defecto
    
    // Si entró más de 30 minutos tarde
    const minutosTarde = (horaEntrada.getTime() - horaProgramada.getTime()) / (1000 * 60);
    
    if (horasTrabajadas < 7) {
      return <Badge variant="destructive">Turno incompleto ({horasTrabajadas.toFixed(1)}h)</Badge>;
    } else if (minutosTarde > 30) {
      return <Badge variant="outline">Tarde pero completo ({horasTrabajadas.toFixed(1)}h)</Badge>;
    } else if (horasTrabajadas >= 8) {
      return <Badge variant="default">Completo ({horasTrabajadas.toFixed(1)}h)</Badge>;
    } else {
      return <Badge variant="secondary">Parcial ({horasTrabajadas.toFixed(1)}h)</Badge>;
    }
  };

  const openEditModal = (turno: Turno) => {
    setSelectedTurno(turno);
    setEditObservaciones(turno.observaciones || '');
    setEditHoraEntrada(turno.hora_entrada || '');
    setEditHoraSalida(turno.hora_salida || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTurno || !user) return;

    try {
      const updateData: any = {
        observaciones: editObservaciones
      };

      // Solo actualizar horas si han cambiado y se proporcionó una justificación
      if (editHoraEntrada !== selectedTurno.hora_entrada) {
        if (!editObservaciones.trim()) {
          toast({
            title: "Error",
            description: "Debe proporcionar una observación cuando modifique horarios",
            variant: "destructive"
          });
          return;
        }
        updateData.hora_entrada = editHoraEntrada || null;
      }

      if (editHoraSalida !== selectedTurno.hora_salida) {
        if (!editObservaciones.trim()) {
          toast({
            title: "Error",
            description: "Debe proporcionar una observación cuando modifique horarios",
            variant: "destructive"
          });
          return;
        }
        updateData.hora_salida = editHoraSalida || null;
      }

      // Agregar información del administrador que hizo la modificación
      if (editObservaciones.trim()) {
        updateData.observaciones = `[Modificado por ${user.username} el ${new Date().toLocaleString('es-ES')}] ${editObservaciones}`;
      }

      const { error } = await supabase
        .from('turnos_empleados')
        .update(updateData)
        .eq('id', selectedTurno.id);

      if (error) throw error;

      toast({
        title: "Turno actualizado",
        description: "Las modificaciones han sido guardadas exitosamente"
      });

      setIsEditModalOpen(false);
      cargarTurnos(); // Recargar datos
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar turno: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const parseUbicacion = (ubicacion: unknown) => {
    if (!ubicacion) return null;
    const ubicacionStr = String(ubicacion);
    const match = ubicacionStr.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  };

  const openGoogleMaps = (ubicacion: unknown) => {
    const coords = parseUbicacion(ubicacion);
    if (coords) {
      const url = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Consulta Administrativa de Turnos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Vista administrativa para consultar turnos y realizar correcciones con justificación
          </p>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="searchDate">Filtrar por fecha</Label>
              <Input
                id="searchDate"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div>
              <Label htmlFor="searchEmpleado">Filtrar por empleado</Label>
              <Input
                id="searchEmpleado"
                value={searchEmpleado}
                onChange={(e) => setSearchEmpleado(e.target.value)}
                placeholder="Buscar por nombre o función"
              />
            </div>
          </div>

          {/* Tabla de turnos */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Empleado</th>
                    <th className="text-left p-3 font-medium">Función</th>
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-left p-3 font-medium">Ubicación</th>
                     <th className="text-left p-3 font-medium">Entrada</th>
                     <th className="text-left p-3 font-medium">Salida</th>
                     <th className="text-left p-3 font-medium">Estado del Turno</th>
                     <th className="text-left p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center p-6">
                        Cargando turnos...
                      </td>
                    </tr>
                  ) : filteredTurnos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-6 text-muted-foreground">
                        No se encontraron turnos con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    filteredTurnos.map((turno) => (
                      <tr key={turno.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {turno.empleados_turnos?.nombres} {turno.empleados_turnos?.apellidos || ''}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">{turno.empleados_turnos?.funcion}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(turno.fecha).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {turno.empleados_turnos?.lugar_designado || 'No asignada'}
                            </span>
                          </div>
                        </td>
                         <td className="p-3">
                           {turno.hora_entrada ? (
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                 {turno.minutos_tardanza && turno.minutos_tardanza > 0 ? (
                                   <AlertTriangle className="h-4 w-4 text-red-600" />
                                 ) : (
                                   <CheckCircle className="h-4 w-4 text-green-600" />
                                 )}
                                 {turno.hora_entrada}
                               </div>
                               {turno.minutos_tardanza && turno.minutos_tardanza > 0 && (
                                 <div className="text-xs text-red-600">
                                   {turno.minutos_tardanza} min tarde
                                 </div>
                               )}
                               {turno.empleados_turnos?.hora_entrada_programada && (
                                 <div className="text-xs text-muted-foreground">
                                   Prog: {turno.empleados_turnos.hora_entrada_programada}
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <AlertTriangle className="h-4 w-4 text-red-600" />
                               Sin registro
                             </div>
                           )}
                         </td>
                         <td className="p-3">
                           {turno.hora_salida ? (
                             <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                 <CheckCircle className="h-4 w-4 text-green-600" />
                                 {turno.hora_salida}
                               </div>
                               {turno.hora_entrada && (
                                 <div className="text-xs text-muted-foreground">
                                   {calcularHorasTrabajadas(turno.hora_entrada, turno.hora_salida).toFixed(1)}h trabajadas
                                 </div>
                               )}
                               {turno.empleados_turnos?.hora_salida_programada && (
                                 <div className="text-xs text-muted-foreground">
                                   Prog: {turno.empleados_turnos.hora_salida_programada}
                                 </div>
                               )}
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <AlertTriangle className="h-4 w-4 text-yellow-600" />
                               Pendiente
                             </div>
                           )}
                         </td>
                        <td className="p-3">{getEstadoBadge(turno)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(turno)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                              {(turno.ubicacion_entrada || turno.ubicacion_salida) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openGoogleMaps(turno.ubicacion_entrada || turno.ubicacion_salida)}
                                  title="Ver ubicación exacta del punch en Google Maps"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
          </DialogHeader>
          
          {selectedTurno && (
            <div className="space-y-4">
              <div>
                <Label>Empleado</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedTurno.empleados_turnos?.nombres} {selectedTurno.empleados_turnos?.apellidos || ''} - {selectedTurno.empleados_turnos?.funcion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editHoraEntrada">Hora de Entrada</Label>
                  <Input
                    id="editHoraEntrada"
                    type="time"
                    value={editHoraEntrada}
                    onChange={(e) => setEditHoraEntrada(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editHoraSalida">Hora de Salida</Label>
                  <Input
                    id="editHoraSalida"
                    type="time"
                    value={editHoraSalida}
                    onChange={(e) => setEditHoraSalida(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editObservaciones">Observaciones / Justificación *</Label>
                <Textarea
                  id="editObservaciones"
                  value={editObservaciones}
                  onChange={(e) => setEditObservaciones(e.target.value)}
                  placeholder="Proporcione una justificación para cualquier modificación..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  * Requerido cuando se modifican horarios
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};