import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Clock, Camera, CheckCircle, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TurnoConFoto {
  id: string;
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  foto_entrada?: string;
  foto_salida?: string;
  ubicacion_entrada?: unknown;
  ubicacion_salida?: unknown;
  tipo_registro?: string;
  empleados_turnos?: {
    nombres: string;
    apellidos: string;
    lugar_designado?: string;
  };
}

export const AdminTurnosFotos = () => {
  const [turnos, setTurnos] = useState<TurnoConFoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fotosUrls, setFotosUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const cargarTurnos = async () => {
    setLoading(true);
    try {
      // First get turnos with photos
      let query = supabase
        .from('turnos_empleados')
        .select('*')
        .or('foto_entrada.not.is.null,foto_salida.not.is.null');
        
      // Apply date filter if provided
      if (fechaFiltro) {
        query = query.eq('fecha', fechaFiltro);
      }
      
      const { data: turnosData, error: turnosError } = await query
        .order('created_at', { ascending: false });

      if (turnosError) throw turnosError;

      // Then get empleados data for each turno
      if (turnosData && turnosData.length > 0) {
        const empleadoIds = turnosData.map(turno => turno.empleado_id).filter(Boolean);
        
        const { data: empleadosData, error: empleadosError } = await supabase
          .from('empleados_turnos')
          .select('id, nombres, apellidos, lugar_designado')
          .in('id', empleadoIds);

        if (empleadosError) throw empleadosError;

        // Combine data
        const turnosWithEmpleados = turnosData.map(turno => ({
          ...turno,
          empleados_turnos: empleadosData?.find(emp => emp.id === turno.empleado_id)
        }));

        setTurnos(turnosWithEmpleados);
        
        // Cargar URLs de fotos
        await cargarUrlsFotos(turnosWithEmpleados);
      } else {
        setTurnos([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar turnos: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarUrlsFotos = async (turnosData: TurnoConFoto[]) => {
    const urls: Record<string, string> = {};
    
    for (const turno of turnosData) {
      if (turno.foto_entrada) {
        const url = await obtenerUrlFoto(turno.foto_entrada);
        if (url) urls[`entrada_${turno.id}`] = url;
      }
      if (turno.foto_salida) {
        const url = await obtenerUrlFoto(turno.foto_salida);
        if (url) urls[`salida_${turno.id}`] = url;
      }
    }
    
    setFotosUrls(urls);
  };

  useEffect(() => {
    cargarTurnos();
  }, [fechaFiltro]);

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

  const formatearHora = (hora?: string) => {
    if (!hora) return 'N/A';
    return new Date(`2000-01-01T${hora}`).toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const obtenerCoordenadas = (ubicacion?: unknown) => {
    if (!ubicacion || typeof ubicacion !== 'string') return null;
    const matches = ubicacion.match(/\(([^,]+),([^)]+)\)/);
    if (!matches) return null;
    return {
      lat: parseFloat(matches[1]),
      lng: parseFloat(matches[2])
    };
  };

  const abrirMaps = (coordenadas: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps?q=${coordenadas.lat},${coordenadas.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Revisión de Fotos de Turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <label htmlFor="fecha" className="text-sm font-medium">Fecha:</label>
            </div>
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button onClick={cargarTurnos} disabled={loading}>
              {loading ? 'Cargando...' : 'Filtrar'}
            </Button>
          </div>

          {turnos.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No hay turnos con fotos para la fecha seleccionada
            </div>
          )}

          <div className="grid gap-4">
            {turnos.map((turno) => (
              <Card key={turno.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {turno.empleados_turnos?.nombres} {turno.empleados_turnos?.apellidos}
                        </h3>
                        <Badge variant="outline">
                          {turno.empleados_turnos?.lugar_designado || 'Sin ubicación asignada'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {turno.hora_entrada && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Entrada: {formatearHora(turno.hora_entrada)}</span>
                          </div>
                        )}
                        {turno.hora_salida && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Salida: {formatearHora(turno.hora_salida)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Foto de entrada */}
                      {turno.foto_entrada && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Foto
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Foto de Entrada - {turno.empleados_turnos?.nombres} {turno.empleados_turnos?.apellidos}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <img
                                  src={fotosUrls[`entrada_${turno.id}`] || ''}
                                  alt="Foto de entrada"
                                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <p><strong>Hora:</strong> {formatearHora(turno.hora_entrada)}</p>
                                    <p><strong>Fecha:</strong> {new Date(turno.fecha).toLocaleDateString('es-ES')}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {/* Foto de salida */}
                      {turno.foto_salida && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Salida</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Foto
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Foto de Salida - {turno.empleados_turnos?.nombres} {turno.empleados_turnos?.apellidos}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <img
                                  src={fotosUrls[`salida_${turno.id}`] || ''}
                                  alt="Foto de salida"
                                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <p><strong>Hora:</strong> {formatearHora(turno.hora_salida)}</p>
                                    <p><strong>Fecha:</strong> {new Date(turno.fecha).toLocaleDateString('es-ES')}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};