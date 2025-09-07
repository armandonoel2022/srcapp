import { useState, useEffect } from 'react';
import { useEmpleados } from '@/hooks/useEmpleados';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Edit, Search, Camera, Save, X } from 'lucide-react';

export const EditarEmpleados = () => {
  const { empleados, loading, actualizarEmpleado, cargarEmpleados } = useEmpleados();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);
  const [editData, setEditData] = useState({
    nombres: '',
    apellidos: '',
    funcion: '',
    cedula: '',
    ubicacion_designada: '',
    foto: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const handleEditarEmpleado = (empleado: any) => {
    setSelectedEmpleado(empleado);
    setEditData({
      nombres: empleado.nombres || '',
      apellidos: empleado.apellidos || '',
      funcion: empleado.funcion || '',
      cedula: empleado.cedula || '',
      ubicacion_designada: empleado.ubicacion_designada || '',
      foto: empleado.foto || ''
    });
    setIsModalOpen(true);
  };

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editData.nombres.trim() || !editData.apellidos.trim()) {
      return;
    }

    setSubmitting(true);
    const result = await actualizarEmpleado(selectedEmpleado.id, editData);
    
    if (result.success) {
      setIsModalOpen(false);
      setSelectedEmpleado(null);
    }
    
    setSubmitting(false);
  };

  const empleadosFiltrados = empleados.filter(empleado =>
    empleado.nombres.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.apellidos.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.funcion.toLowerCase().includes(filtro.toLowerCase()) ||
    (empleado.cedula && empleado.cedula.includes(filtro))
  );

  const getInitials = (nombres: string, apellidos: string) => {
    return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Editar Empleados
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar empleado por nombre, apellido, función o cédula..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabla de empleados */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Función</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Cargando empleados...
                  </TableCell>
                </TableRow>
              ) : empleadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {filtro ? 'No se encontraron empleados con ese filtro' : 'No hay empleados registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={empleado.foto} />
                          <AvatarFallback>
                            {getInitials(empleado.nombres, empleado.apellidos)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {empleado.nombres} {empleado.apellidos}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{empleado.funcion}</TableCell>
                    <TableCell>{empleado.cedula || 'Sin registrar'}</TableCell>
                    <TableCell>{empleado.ubicacion_designada || 'Sin asignar'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditarEmpleado(empleado)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal de Edición */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Empleado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGuardarCambios} className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={editData.foto} />
                  <AvatarFallback>
                    {selectedEmpleado ? getInitials(editData.nombres, editData.apellidos) : 'EM'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-nombres">Nombres*</Label>
                  <Input
                    id="edit-nombres"
                    value={editData.nombres}
                    onChange={(e) => setEditData({...editData, nombres: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-apellidos">Apellidos*</Label>
                  <Input
                    id="edit-apellidos"
                    value={editData.apellidos}
                    onChange={(e) => setEditData({...editData, apellidos: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-funcion">Función</Label>
                <Input
                  id="edit-funcion"
                  value={editData.funcion}
                  onChange={(e) => setEditData({...editData, funcion: e.target.value})}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="edit-cedula">Cédula</Label>
                <Input
                  id="edit-cedula"
                  value={editData.cedula}
                  onChange={(e) => setEditData({...editData, cedula: e.target.value})}
                  disabled={submitting}
                  placeholder="Ej: 12345678"
                />
              </div>

              <div>
                <Label htmlFor="edit-ubicacion">Ubicación Designada</Label>
                <Input
                  id="edit-ubicacion"
                  value={editData.ubicacion_designada}
                  onChange={(e) => setEditData({...editData, ubicacion_designada: e.target.value})}
                  disabled={submitting}
                  placeholder="Ej: Torre A, Piso 1"
                />
              </div>

              <div>
                <Label htmlFor="edit-foto">URL de Foto</Label>
                <Input
                  id="edit-foto"
                  value={editData.foto}
                  onChange={(e) => setEditData({...editData, foto: e.target.value})}
                  disabled={submitting}
                  placeholder="https://ejemplo.com/foto.jpg"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Save className="w-4 h-4 mr-1" />
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};