import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useEmpleadosTurnos, EmpleadoTurno } from '@/hooks/useEmpleadosTurnos';
import { useToast } from '@/hooks/use-toast';
import { Edit, Eye, UserPlus, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const GestionEmpleadosTurnos = () => {
  const { empleados, loading, cargarEmpleados } = useEmpleadosTurnos();
  const { toast } = useToast();
  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoTurno | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<EmpleadoTurno>>({});

  const openEditModal = (empleado: EmpleadoTurno) => {
    setSelectedEmpleado(empleado);
    setEditFormData({
      nombres: empleado.nombres,
      apellidos: empleado.apellidos,
      funcion: empleado.funcion,
      cedula: empleado.cedula,
      sexo: empleado.sexo ? (empleado.sexo.toLowerCase().startsWith('f') ? 'femenino' : 'masculino') : 'masculino',
      fecha_nacimiento: empleado.fecha_nacimiento,
      lugar_designado: empleado.lugar_designado,
      hora_entrada_programada: empleado.hora_entrada_programada,
      hora_salida_programada: empleado.hora_salida_programada,
      username: empleado.username,
      active: empleado.active !== false
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (empleado: EmpleadoTurno) => {
    setSelectedEmpleado(empleado);
    setIsViewModalOpen(true);
  };

  const handleUpdateEmpleado = async () => {
    if (!selectedEmpleado) return;

    try {
      const { error } = await supabase
        .from('empleados_turnos')
        .update({
          nombres: editFormData.nombres,
          apellidos: editFormData.apellidos,
          funcion: editFormData.funcion,
          cedula: editFormData.cedula,
          sexo: editFormData.sexo ? (editFormData.sexo.toLowerCase() === 'femenino' ? 'Femenino' : 'Masculino') : null,
          fecha_nacimiento: editFormData.fecha_nacimiento,
          lugar_designado: editFormData.lugar_designado,
          hora_entrada_programada: editFormData.hora_entrada_programada,
          hora_salida_programada: editFormData.hora_salida_programada,
          username: editFormData.username,
          active: editFormData.active !== false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmpleado.id);

      if (error) throw error;

      toast({
        title: "Empleado actualizado",
        description: "Los datos del empleado han sido actualizados exitosamente"
      });

      setIsEditModalOpen(false);
      await cargarEmpleados();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar empleado: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'No especificada';
    return timeString;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Empleados de Turnos
            <Badge variant="secondary" className="ml-2">
              {empleados.filter(e => e.active !== false).length} activos / {empleados.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando empleados...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>Función</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Lugar Designado</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empleados.map((empleado) => (
                      <TableRow key={empleado.id}>
                        <TableCell className="font-medium">
                          {empleado.nombres} {empleado.apellidos}
                        </TableCell>
                        <TableCell>{empleado.funcion}</TableCell>
                        <TableCell>{empleado.cedula || 'No registrada'}</TableCell>
                        <TableCell>
                          {empleado.username ? (
                            <Badge variant="outline">{empleado.username}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin usuario</span>
                          )}
                        </TableCell>
                        <TableCell>{empleado.lugar_designado || 'No asignado'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Entrada: {formatTime(empleado.hora_entrada_programada)}</div>
                            <div>Salida: {formatTime(empleado.hora_salida_programada)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={empleado.active !== false ? "default" : "destructive"}>
                            {empleado.active !== false ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewModal(empleado)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(empleado)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {empleados.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay empleados de turnos registrados</p>
                  <p className="text-sm">Use la pestaña "Gestión de Empleados" para agregar empleados</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualización */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Empleado</DialogTitle>
          </DialogHeader>
          {selectedEmpleado && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombres</Label>
                <p className="text-sm font-medium">{selectedEmpleado.nombres}</p>
              </div>
              <div>
                <Label>Apellidos</Label>
                <p className="text-sm font-medium">{selectedEmpleado.apellidos}</p>
              </div>
              <div>
                <Label>Función</Label>
                <p className="text-sm font-medium">{selectedEmpleado.funcion}</p>
              </div>
              <div>
                <Label>Cédula</Label>
                <p className="text-sm font-medium">{selectedEmpleado.cedula || 'No registrada'}</p>
              </div>
              <div>
                <Label>Sexo</Label>
                <p className="text-sm font-medium">{selectedEmpleado.sexo || 'No especificado'}</p>
              </div>
              <div>
                <Label>Fecha de Nacimiento</Label>
                <p className="text-sm font-medium">{formatDate(selectedEmpleado.fecha_nacimiento)}</p>
              </div>
              <div>
                <Label>Lugar Designado</Label>
                <p className="text-sm font-medium">{selectedEmpleado.lugar_designado || 'No asignado'}</p>
              </div>
              <div>
                <Label>Usuario</Label>
                <p className="text-sm font-medium">{selectedEmpleado.username || 'Sin usuario'}</p>
              </div>
              <div>
                <Label>Hora de Entrada</Label>
                <p className="text-sm font-medium">{formatTime(selectedEmpleado.hora_entrada_programada)}</p>
              </div>
              <div>
                <Label>Hora de Salida</Label>
                <p className="text-sm font-medium">{formatTime(selectedEmpleado.hora_salida_programada)}</p>
              </div>
              <div className="col-span-2">
                <Label>Fecha de Registro</Label>
                <p className="text-sm font-medium">{formatDate(selectedEmpleado.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado de Turnos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nombres">Nombres</Label>
                <Input
                  id="edit-nombres"
                  value={editFormData.nombres || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, nombres: e.target.value })}
                  placeholder="Nombres del empleado"
                />
              </div>
              <div>
                <Label htmlFor="edit-apellidos">Apellidos</Label>
                <Input
                  id="edit-apellidos"
                  value={editFormData.apellidos || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })}
                  placeholder="Apellidos del empleado"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cedula">Cédula</Label>
                <Input
                  id="edit-cedula"
                  value={editFormData.cedula || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cedula: e.target.value })}
                  placeholder="Número de cédula"
                />
              </div>
              <div>
                <Label htmlFor="edit-funcion">Función/Rol</Label>
                <Input
                  id="edit-funcion"
                  value={editFormData.funcion || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, funcion: e.target.value })}
                  placeholder="Función o rol del empleado"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sexo">Sexo</Label>
                <Select value={editFormData.sexo ?? undefined} onValueChange={(value) => setEditFormData({ ...editFormData, sexo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sexo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="edit-fecha_nacimiento"
                  type="date"
                  value={editFormData.fecha_nacimiento || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, fecha_nacimiento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-lugar_designado">Lugar Designado</Label>
                <Input
                  id="edit-lugar_designado"
                  value={editFormData.lugar_designado || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, lugar_designado: e.target.value })}
                  placeholder="Ubicación o localidad designada"
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Nombre de Usuario</Label>
                <Input
                  id="edit-username"
                  value={editFormData.username || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  placeholder="Usuario para acceso al sistema"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-hora_entrada_programada">Hora de Entrada Programada</Label>
                <Input
                  id="edit-hora_entrada_programada"
                  type="time"
                  value={editFormData.hora_entrada_programada || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, hora_entrada_programada: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-hora_salida_programada">Hora de Salida Programada</Label>
                <Input
                  id="edit-hora_salida_programada"
                  type="time"
                  value={editFormData.hora_salida_programada || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, hora_salida_programada: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="edit-active">Estado del Empleado</Label>
                  <p className="text-sm text-muted-foreground">
                    Controla si el empleado puede acceder a la plataforma
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${editFormData.active !== false ? 'text-green-600' : 'text-red-600'}`}>
                    {editFormData.active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                  <Switch
                    id="edit-active"
                    checked={editFormData.active !== false}
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, active: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateEmpleado}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};