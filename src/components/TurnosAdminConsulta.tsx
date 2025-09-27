import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Edit3, Eye, MapPin, Calendar, User, AlertTriangle, CheckCircle, Camera, X } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatMinutesToHours } from '@/utils/timeUtils';
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
  ubicacion_real_entrada?: string | null;
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
  const [eliminarTardanza, setEliminarTardanza] = useState(false);
  const [ubicacionesTrabajo, setUbicacionesTrabajo] = useState<any[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedTurnoForPhotos, setSelectedTurnoForPhotos] = useState<Turno | null>(null);
  const [fotosUrls, setFotosUrls] = useState<Record<string, string>>({});

  const { obtenerTurnos, loading } = useTurnos();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    cargarUbicaciones();
    cargarTurnos();
  }, []);

  useEffect(() => {
    filterTurnos();
  }, [turnos, searchDate, searchEmpleado]);

  const cargarUbicaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('ubicaciones_trabajo')
        .select('nombre, coordenadas, radio_tolerancia')
        .eq('activa', true);
      
      if (!error && data) {
        setUbicacionesTrabajo(data);
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
    }
  };

  const cargarTurnos = async () => {
    const result = await obtenerTurnos();
    if (result.success) {
      const turnosConUbicacion = (result.data as any[]).map(turno => ({
        ...turno,
        ubicacion_real_entrada: determinarUbicacionReal(turno.ubicacion_entrada)
      }));
      setTurnos(turnosConUbicacion);
    }
  };

  const determinarUbicacionReal = (ubicacionPunch: unknown) => {
    if (!ubicacionPunch || ubicacionesTrabajo.length === 0) return 'Ubicación no identificada';
    
    const ubicacionStr = String(ubicacionPunch);
    const match = ubicacionStr.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/);
    
    if (!match) return 'Ubicación no identificada';
    
    const punchCoords = {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2])
    };
    
    let ubicacionMasCercana = null;
    let menorDistancia = Infinity;
    
    for (const ubicacion of ubicacionesTrabajo) {
      const coordenadas = ubicacion.coordenadas as string;
      const coordMatch = coordenadas.match(/\(([^,]+),([^)]+)\)/);
      
      if (!coordMatch) continue;
      
      const ubicCoords = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      };
      
      const distancia = calcularDistancia(punchCoords, ubicCoords);
      const tolerancia = ubicacion.radio_tolerancia || 100;
      
      // Si está dentro de la tolerancia, devolver inmediatamente
      if (distancia <= tolerancia) {
        return ubicacion.nombre;
      }
      
      // Guardar la ubicación más cercana
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        ubicacionMasCercana = ubicacion;
      }
    }
    
    // Si no hay ubicación dentro de tolerancia, mostrar la más cercana con distancia
    if (ubicacionMasCercana && menorDistancia <= 1000) { // Máximo 1km para considerar "cercana"
      return `${ubicacionMasCercana.nombre} (${Math.round(menorDistancia)}m)`;
    }
    
    return 'Ubicación no identificada';
  };

   const calcularDistancia = (coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}) => {
     const R = 6371000; // Radio de la Tierra en metros
     const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
     const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
       Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
       Math.sin(dLng/2) * Math.sin(dLng/2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     return R * c;
   };
 
   // Formatear fecha YYYY-MM-DD sin afectar por zona horaria
   const formatFechaES = (fechaYMD: string) => {
     if (!fechaYMD || !fechaYMD.includes('-')) return fechaYMD;
     const [y, m, d] = fechaYMD.split('-');
     return `${Number(d)}/${Number(m)}/${y}`;
   };
 
   // Total de horas trabajadas en el día (consolidado) para un empleado
   const getTotalHorasDia = (empleadoId: string, fecha: string) => {
     const registros = filteredTurnos.filter(t => t.empleado_id === empleadoId && t.fecha === fecha);
     return registros.reduce((acc, t) => {
       const h = calcularHorasTrabajadas(t.hora_entrada || undefined, t.hora_salida || undefined);
       const match = /([0-9]+\.?[0-9]*)h/.exec(String(h));
       const horas = match ? parseFloat(match[1]) : (typeof h === 'number' ? h : 0);
       // Si calcularHorasTrabajadas devuelve string "Xh Ym" en otros componentes, aquí usamos la otra función local:
       if (typeof h === 'number') return acc + h;
       return acc + (isNaN(horas) ? 0 : horas);
     }, 0);
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
    setEliminarTardanza(false);
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

      // Manejar eliminación de tardanza
      if (eliminarTardanza) {
        updateData.minutos_tardanza = 0;
        updateData.estado_cumplimiento = 'a_tiempo';
        updateData.alerta_temprana = false;
        
        // Agregar mensaje automático sobre eliminación de tardanza
        const mensajeTardanza = 'Tardanza eliminada por corrección administrativa.';
        if (editObservaciones.trim()) {
          updateData.observaciones = `[Modificado por ${user.username} el ${new Date().toLocaleString('es-ES')}] ${editObservaciones} - ${mensajeTardanza}`;
        } else {
          updateData.observaciones = `[Modificado por ${user.username} el ${new Date().toLocaleString('es-ES')}] ${mensajeTardanza}`;
        }
      } else {
        // Agregar información del administrador que hizo la modificación
        if (editObservaciones.trim()) {
          updateData.observaciones = `[Modificado por ${user.username} el ${new Date().toLocaleString('es-ES')}] ${editObservaciones}`;
        }
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

  const obtenerUrlFoto = async (photoPath: string) => {
    if (!photoPath) return null;
    
    try {
      const { data, error } = await supabase.storage
        .from('turnos-fotos')
        .createSignedUrl(photoPath, 60 * 60 * 24); // 24 horas
      
      if (error) {
        console.error('Error obteniendo URL firmada:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error creando URL firmada:', error);
      return null;
    }
  };

  const showTurnoPhotos = async (turno: Turno) => {
    setSelectedTurnoForPhotos(turno);
    
    // Cargar URLs de fotos
    const urls: Record<string, string> = {};
    if (turno.foto_entrada) {
      const url = await obtenerUrlFoto(turno.foto_entrada);
      if (url) urls[`entrada_${turno.id}`] = url;
    }
    if (turno.foto_salida) {
      const url = await obtenerUrlFoto(turno.foto_salida);
      if (url) urls[`salida_${turno.id}`] = url;
    }
    
    setFotosUrls(urls);
    setShowPhotoModal(true);
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
                             {formatFechaES(turno.fecha)}
                           </div>
                         </td>
                         <td className="p-3">
                           <div className="flex items-center gap-2">
                             <MapPin className="h-4 w-4 text-muted-foreground" />
                             <div className="flex flex-col">
                               <button
                                 onClick={() => openGoogleMaps(turno.ubicacion_entrada || turno.ubicacion_salida)}
                                 className="text-sm font-medium hover:text-primary hover:underline text-left cursor-pointer"
                                 disabled={!turno.ubicacion_entrada && !turno.ubicacion_salida}
                                 title={turno.ubicacion_entrada || turno.ubicacion_salida ? 
                                   "Click para ver ubicación en el mapa" : 
                                   "No hay coordenadas de ubicación disponibles"}
                               >
                                 {turno.ubicacion_real_entrada || 'Ubicación no identificada'}
                               </button>
                               {turno.empleados_turnos?.lugar_designado && (
                                 <span className="text-xs text-muted-foreground">
                                   Designada: {turno.empleados_turnos.lugar_designado}
                                 </span>
                               )}
                             </div>
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
                                 {turno.minutos_tardanza && turno.minutos_tardanza > 0 ? (
                                   <div className="text-xs text-red-600">
                                     {formatMinutesToHours(turno.minutos_tardanza)}
                                   </div>
                                 ) : (
                                   <div className="inline-block">
                                     <Badge 
                                       className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-1"
                                     >
                                       A tiempo
                                     </Badge>
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
                                 {/* Total acumulado del día si hay varios registros */}
                                 {filteredTurnos.filter(t => t.empleado_id === turno.empleado_id && t.fecha === turno.fecha && t.hora_entrada && t.hora_salida).length > 1 && (
                                   <div className="text-xs font-medium text-emerald-700 bg-emerald-100 inline-block px-2 py-0.5 rounded">
                                     Total día: {getTotalHorasDia(turno.empleado_id, turno.fecha).toFixed(1)}h
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
                              {(turno.foto_entrada || turno.foto_salida) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => showTurnoPhotos(turno)}
                                  title="Ver fotos del turno"
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

              {/* Checkbox para eliminar tardanza */}
              {selectedTurno?.minutos_tardanza && selectedTurno.minutos_tardanza > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Checkbox
                    id="eliminarTardanza"
                    checked={eliminarTardanza}
                    onCheckedChange={(checked) => setEliminarTardanza(checked as boolean)}
                  />
                  <Label htmlFor="eliminarTardanza" className="text-sm">
                    Eliminar tardanza ({formatMinutesToHours(selectedTurno.minutos_tardanza)})
                  </Label>
                  <div className="text-xs text-muted-foreground ml-2">
                    Se registrará automáticamente en observaciones
                  </div>
                </div>
              )}

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

      {/* Modal de fotos del turno */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative">
            <DialogTitle>
              Fotos del Turno - {selectedTurnoForPhotos?.empleados_turnos ? `${selectedTurnoForPhotos.empleados_turnos.nombres} ${selectedTurnoForPhotos.empleados_turnos.apellidos || ''}` : 'N/A'}
            </DialogTitle>
            {/* Botón de cerrar para móviles */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPhotoModal(false)}
              className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          {selectedTurnoForPhotos && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                <p><strong>Fecha:</strong> {selectedTurnoForPhotos.fecha}</p>
                <p><strong>Empleado:</strong> {selectedTurnoForPhotos.empleados_turnos ? `${selectedTurnoForPhotos.empleados_turnos.nombres} ${selectedTurnoForPhotos.empleados_turnos.apellidos || ''}` : 'N/A'}</p>
                <p><strong>Función:</strong> {selectedTurnoForPhotos.empleados_turnos?.funcion || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Foto de entrada */}
                {selectedTurnoForPhotos.foto_entrada && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-center">Foto de Entrada</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={fotosUrls[`entrada_${selectedTurnoForPhotos.id}`] || ''}
                        alt="Foto de entrada"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      <p><strong>Hora:</strong> {selectedTurnoForPhotos.hora_entrada || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Foto de salida */}
                {selectedTurnoForPhotos.foto_salida && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-center">Foto de Salida</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={fotosUrls[`salida_${selectedTurnoForPhotos.id}`] || ''}
                        alt="Foto de salida"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      <p><strong>Hora:</strong> {selectedTurnoForPhotos.hora_salida || 'N/A'}</p>
                    </div>
                  </div>
                )}

                 {/* Mensaje si no hay fotos */}
                 {!selectedTurnoForPhotos.foto_entrada && !selectedTurnoForPhotos.foto_salida && (
                   <div className="col-span-2 text-center py-8 text-muted-foreground">
                     No hay fotos disponibles para este turno
                   </div>
                 )}
               </div>

               {/* Botón de cerrar al final para móviles */}
               <div className="flex justify-center pt-4 md:hidden">
                 <Button
                   onClick={() => setShowPhotoModal(false)}
                   className="w-full max-w-xs"
                 >
                   Cerrar
                 </Button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};