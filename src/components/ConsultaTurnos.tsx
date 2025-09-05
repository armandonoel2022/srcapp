import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, MapPin, Camera, Search, Eye, Download } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useToast } from '@/hooks/use-toast';

interface Turno {
  id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  foto_entrada?: string;
  foto_salida?: string;
  ubicacion_entrada?: string;
  ubicacion_salida?: string;
  empleados?: {
    nombre: string;
    funcion: string;
  };
  created_at: string;
}

export const ConsultaTurnos = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchEmpleado, setSearchEmpleado] = useState('');
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageType, setImageType] = useState<'entrada' | 'salida'>('entrada');

  const { obtenerTurnos, loading } = useTurnos();
  const { toast } = useToast();

  useEffect(() => {
    cargarTurnos();
  }, []);

  useEffect(() => {
    let filtered = turnos;

    if (searchDate) {
      filtered = filtered.filter(turno => turno.fecha === searchDate);
    }

    if (searchEmpleado) {
      filtered = filtered.filter(turno => 
        turno.empleados?.nombre.toLowerCase().includes(searchEmpleado.toLowerCase()) ||
        turno.empleados?.funcion.toLowerCase().includes(searchEmpleado.toLowerCase())
      );
    }

    setFilteredTurnos(filtered);
  }, [turnos, searchDate, searchEmpleado]);

  const cargarTurnos = async () => {
    const result = await obtenerTurnos();
    if (result.success) {
      setTurnos(result.data || []);
    }
  };

  const getEstadoBadge = (turno: Turno) => {
    if (turno.hora_entrada && turno.hora_salida) {
      return <Badge variant="secondary">Completo</Badge>;
    } else if (turno.hora_entrada) {
      return <Badge variant="default">Solo entrada</Badge>;
    }
    return <Badge variant="outline">Incompleto</Badge>;
  };

  const calcularHorasTrabajadas = (entrada?: string, salida?: string) => {
    if (!entrada || !salida) return 'N/A';

    const [horaE, minE] = entrada.split(':').map(Number);
    const [horaS, minS] = salida.split(':').map(Number);
    
    const entradaMinutos = horaE * 60 + minE;
    const salidaMinutos = horaS * 60 + minS;
    
    let totalMinutos = salidaMinutos - entradaMinutos;
    if (totalMinutos < 0) {
      totalMinutos += 24 * 60; // Manejo de turno nocturno
    }
    
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    return `${horas}h ${minutos}m`;
  };

  const parseUbicacion = (ubicacionStr?: string) => {
    if (!ubicacionStr) return null;
    const match = ubicacionStr.match(/\(([^,]+),([^)]+)\)/);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
    return null;
  };

  const openGoogleMaps = (ubicacion?: string) => {
    const coords = parseUbicacion(ubicacion);
    if (coords) {
      const url = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Error",
        description: "No se pudo obtener la ubicación",
        variant: "destructive"
      });
    }
  };

  const showImage = (imageData: string, type: 'entrada' | 'salida') => {
    setSelectedImage(imageData);
    setImageType(type);
    setShowImageModal(true);
  };

  const exportarCSV = () => {
    const csvData = filteredTurnos.map(turno => ({
      'Empleado': turno.empleados?.nombre || 'N/A',
      'Función': turno.empleados?.funcion || 'N/A',
      'Fecha': turno.fecha,
      'Hora Entrada': turno.hora_entrada || 'N/A',
      'Hora Salida': turno.hora_salida || 'N/A',
      'Horas Trabajadas': calcularHorasTrabajadas(turno.hora_entrada, turno.hora_salida),
      'Estado': turno.hora_entrada && turno.hora_salida ? 'Completo' : 'Incompleto'
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turnos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consulta de Turnos de Empleados
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder="Filtrar por fecha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Empleado</label>
              <Input
                value={searchEmpleado}
                onChange={(e) => setSearchEmpleado(e.target.value)}
                placeholder="Buscar por nombre o función"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={exportarCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Tabla de turnos */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Función</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Cargando turnos...
                    </TableCell>
                  </TableRow>
                ) : filteredTurnos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No se encontraron turnos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTurnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">
                        {turno.empleados?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>{turno.empleados?.funcion || 'N/A'}</TableCell>
                      <TableCell>{turno.fecha}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {turno.hora_entrada || 'N/A'}
                          {turno.foto_entrada && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => showImage(turno.foto_entrada!, 'entrada')}
                            >
                              <Camera className="h-3 w-3" />
                            </Button>
                          )}
                          {turno.ubicacion_entrada && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openGoogleMaps(turno.ubicacion_entrada)}
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {turno.hora_salida || 'N/A'}
                          {turno.foto_salida && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => showImage(turno.foto_salida!, 'salida')}
                            >
                              <Camera className="h-3 w-3" />
                            </Button>
                          )}
                          {turno.ubicacion_salida && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openGoogleMaps(turno.ubicacion_salida)}
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {calcularHorasTrabajadas(turno.hora_entrada, turno.hora_salida)}
                      </TableCell>
                      <TableCell>{getEstadoBadge(turno)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTurno(turno)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de imagen */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Foto de {imageType === 'entrada' ? 'Entrada' : 'Salida'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage}
              alt={`Foto de ${imageType}`}
              className="max-w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles del turno */}
      {selectedTurno && (
        <Dialog open={!!selectedTurno} onOpenChange={() => setSelectedTurno(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Detalles del Turno - {selectedTurno.empleados?.nombre}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información general */}
              <div className="space-y-4">
                <h3 className="font-medium">Información General</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Empleado:</strong> {selectedTurno.empleados?.nombre}</p>
                  <p><strong>Función:</strong> {selectedTurno.empleados?.funcion}</p>
                  <p><strong>Fecha:</strong> {selectedTurno.fecha}</p>
                  <p><strong>Horas trabajadas:</strong> {calcularHorasTrabajadas(selectedTurno.hora_entrada, selectedTurno.hora_salida)}</p>
                </div>
              </div>

              {/* Detalles de entrada y salida */}
              <div className="space-y-4">
                <h3 className="font-medium">Detalles de Registro</h3>
                <div className="space-y-3">
                  {selectedTurno.hora_entrada && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Entrada</h4>
                      <p className="text-sm">Hora: {selectedTurno.hora_entrada}</p>
                      <div className="flex gap-2 mt-2">
                        {selectedTurno.foto_entrada && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showImage(selectedTurno.foto_entrada!, 'entrada')}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Ver foto
                          </Button>
                        )}
                        {selectedTurno.ubicacion_entrada && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGoogleMaps(selectedTurno.ubicacion_entrada)}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Ver ubicación
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedTurno.hora_salida && (
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Salida</h4>
                      <p className="text-sm">Hora: {selectedTurno.hora_salida}</p>
                      <div className="flex gap-2 mt-2">
                        {selectedTurno.foto_salida && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showImage(selectedTurno.foto_salida!, 'salida')}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Ver foto
                          </Button>
                        )}
                        {selectedTurno.ubicacion_salida && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGoogleMaps(selectedTurno.ubicacion_salida)}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Ver ubicación
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};