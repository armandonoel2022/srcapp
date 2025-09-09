import { useState } from 'react';
import { useEmpleados } from '@/hooks/useEmpleados';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Edit, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const GestionEmpleados = () => {
  const { empleados, loading, agregarEmpleado, actualizarEmpleado } = useEmpleados();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<any>(null);
  const [nuevoNombres, setNuevoNombres] = useState('');
  const [nuevosApellidos, setNuevosApellidos] = useState('');
  const [nuevaFuncion, setNuevaFuncion] = useState('');
  const [nuevaCedula, setNuevaCedula] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');
  const [nuevaFechaNacimiento, setNuevaFechaNacimiento] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [bulkData, setBulkData] = useState('');

  const handleAgregarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoNombres.trim()) {
      return;
    }

    setSubmitting(true);
    const result = await agregarEmpleado({
      nombres: nuevoNombres.trim(),
      apellidos: nuevosApellidos.trim() || null,
      funcion: nuevaFuncion.trim() || null,
      cedula: nuevaCedula.trim() || null,
      ubicacion_designada: nuevaUbicacion.trim() || null
    });
    
    if (result.success) {
      setNuevoNombres('');
      setNuevosApellidos('');
      setNuevaFuncion('');
      setNuevaCedula('');
      setNuevaUbicacion('');
      setNuevaFechaNacimiento('');
      setIsModalOpen(false);
    }
    
    setSubmitting(false);
  };

  const handleEditarEmpleado = (empleado: any) => {
    setSelectedEmpleado(empleado);
    setNuevoNombres(empleado.nombres);
    setNuevosApellidos(empleado.apellidos || '');
    setNuevaFuncion(empleado.funcion);
    setNuevaCedula(empleado.cedula || '');
    setNuevaUbicacion(empleado.ubicacion_designada || '');
    setNuevaFechaNacimiento(empleado.fecha_nacimiento || '');
    setIsEditModalOpen(true);
  };

  const handleActualizarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoNombres.trim() || !selectedEmpleado) {
      return;
    }

    setSubmitting(true);
    const result = await actualizarEmpleado(selectedEmpleado.id, {
      nombres: nuevoNombres.trim(),
      apellidos: nuevosApellidos.trim() || null,
      funcion: nuevaFuncion.trim() || null,
      cedula: nuevaCedula.trim() || null,
      ubicacion_designada: nuevaUbicacion.trim() || null,
      fecha_nacimiento: nuevaFechaNacimiento || null
    });
    
    if (result.success) {
      setNuevoNombres('');
      setNuevosApellidos('');
      setNuevaFuncion('');
      setNuevaCedula('');
      setNuevaUbicacion('');
      setNuevaFechaNacimiento('');
      setSelectedEmpleado(null);
      setIsEditModalOpen(false);
    }
    
    setSubmitting(false);
  };

  // Utilidad para separar nombres y apellidos
  const separateNameAndSurname = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 2) {
      return {
        nombres: parts[0] || '',
        apellidos: parts[1] || ''
      };
    }
    
    // Para nombres con más de 2 partes, tomar los primeros 2 como nombres y el resto como apellidos
    const nombres = parts.slice(0, 2).join(' ');
    const apellidos = parts.slice(2).join(' ');
    
    return { nombres, apellidos };
  };

  // Utilidad para generar nombre de usuario
  const generateUsername = (nombres: string, apellidos: string) => {
    const firstNameChar = nombres.trim().charAt(0).toLowerCase();
    const firstSurname = apellidos.trim().split(/\s+/)[0] || '';
    return firstNameChar + firstSurname.toLowerCase();
  };

  // Función para parsear fechas del formato del cliente
  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    try {
      // Manejar diferentes formatos de fecha
      const cleanDate = dateStr.trim();
      
      // Formato: "23 de Marzo 2011" o "11de abril de 1977"
      const monthMap: {[key: string]: string} = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
      };
      
      const dateRegex = /(\d{1,2})\s*de\s*(\w+)\s*(?:del?\s*)?(\d{4})/i;
      const match = cleanDate.match(dateRegex);
      
      if (match) {
        const [, day, monthName, year] = match;
        const month = monthMap[monthName.toLowerCase()];
        if (month) {
          return `${year}-${month}-${day.padStart(2, '0')}`;
        }
      }
      
      // Si no coincide, intentar formato ISO
      const isoDate = new Date(cleanDate);
      if (!isNaN(isoDate.getTime())) {
        return isoDate.toISOString().split('T')[0];
      }
      
      return null;
    } catch {
      return null;
    }
  };

  // Función para importar empleados masivamente
  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa los datos de empleados",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    const lines = bulkData.trim().split('\n');
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const [cedula, fullName, puesto, fechaIngreso, fechaNacimiento, direccion, telefonos] = line.split('\t');
      
      if (!cedula || !fullName) {
        errorCount++;
        continue;
      }

      const { nombres, apellidos } = separateNameAndSurname(fullName);
      
      try {
        await agregarEmpleado({
          nombres,
          apellidos,
          funcion: puesto || 'Oficial de Seguridad',
          cedula: cedula.trim(),
          ubicacion_designada: direccion || null,
          fecha_nacimiento: parseDate(fechaNacimiento),
          fecha_ingreso: parseDate(fechaIngreso),
          telefono: telefonos || null,
          direccion: direccion || null
        });
        successCount++;
      } catch (error) {
        errorCount++;
        console.error('Error importing employee:', error);
      }
    }

    setSubmitting(false);
    setBulkData('');
    setIsBulkImportOpen(false);

    toast({
      title: "Importación completada",
      description: `${successCount} empleados importados exitosamente. ${errorCount} errores.`,
      variant: successCount > 0 ? "default" : "destructive"
    });
  };

  const empleadosFiltrados = empleados.filter(empleado =>
    empleado.nombres.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.apellidos.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.funcion.toLowerCase().includes(filtro.toLowerCase()) ||
    (empleado.cedula && empleado.cedula.toLowerCase().includes(filtro.toLowerCase())) ||
    (empleado.ubicacion_designada && empleado.ubicacion_designada.toLowerCase().includes(filtro.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Gestión de Empleados
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Empleados
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Empleado
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAgregarEmpleado} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nuevo-nombres">Nombres*:</Label>
                    <Input
                      id="nuevo-nombres"
                      value={nuevoNombres}
                      onChange={(e) => setNuevoNombres(e.target.value)}
                      required
                      disabled={submitting}
                      placeholder="Nombres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nuevos-apellidos">Apellidos:</Label>
                    <Input
                      id="nuevos-apellidos"
                      value={nuevosApellidos}
                      onChange={(e) => setNuevosApellidos(e.target.value)}
                      disabled={submitting}
                      placeholder="Apellidos (opcional)"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="nueva-cedula">Cédula:</Label>
                    <Input
                      id="nueva-cedula"
                      value={nuevaCedula}
                      onChange={(e) => setNuevaCedula(e.target.value)}
                      disabled={submitting}
                      placeholder="Cédula (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nueva-fecha-nacimiento">Fecha de Nacimiento:</Label>
                    <Input
                      id="nueva-fecha-nacimiento"
                      type="date"
                      value={nuevaFechaNacimiento}
                      onChange={(e) => setNuevaFechaNacimiento(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="nueva-funcion">Función:</Label>
                  <Input
                    id="nueva-funcion"
                    value={nuevaFuncion}
                    onChange={(e) => setNuevaFuncion(e.target.value)}
                    disabled={submitting}
                    placeholder="Ej: Administrador, Seguridad, Mantenimiento"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nueva-ubicacion">Ubicación:</Label>
                  <Input
                    id="nueva-ubicacion"
                    value={nuevaUbicacion}
                    onChange={(e) => setNuevaUbicacion(e.target.value)}
                    disabled={submitting}
                    placeholder="Ubicación designada (opcional)"
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Agregando..." : "Agregar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </CardTitle>
      </CardHeader>

      {/* Modal de Importación Masiva */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importar Empleados Masivamente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Datos de empleados (formato: Cédula, Nombre Completo, Puesto, Fecha Ingreso, Fecha Nacimiento, Dirección, Teléfonos)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Pega los datos separados por tabulaciones (TAB). Un empleado por línea.
              </p>
              <Textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder="005-0030356-5	Nelson Laureano	Gerente General	23 de Marzo 2011	11de abril de 1977	C/Resp.8 no.11 Ens. Espaillat, Santo Dgo.	Cel: 809-280-6704"
                className="h-64 font-mono text-xs"
                disabled={submitting}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsBulkImportOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleBulkImport} 
                disabled={submitting || !bulkData.trim()}
              >
                {submitting ? "Importando..." : "Importar Empleados"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActualizarEmpleado} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-nombres">Nombres*:</Label>
                <Input
                  id="edit-nombres"
                  value={nuevoNombres}
                  onChange={(e) => setNuevoNombres(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="Nombres"
                />
              </div>
              <div>
                <Label htmlFor="edit-apellidos">Apellidos:</Label>
                <Input
                  id="edit-apellidos"
                  value={nuevosApellidos}
                  onChange={(e) => setNuevosApellidos(e.target.value)}
                  disabled={submitting}
                  placeholder="Apellidos (opcional)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-cedula">Cédula:</Label>
                <Input
                  id="edit-cedula"
                  value={nuevaCedula}
                  onChange={(e) => setNuevaCedula(e.target.value)}
                  disabled={submitting}
                  placeholder="Cédula (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="edit-fecha-nacimiento">Fecha de Nacimiento:</Label>
                <Input
                  id="edit-fecha-nacimiento"
                  type="date"
                  value={nuevaFechaNacimiento}
                  onChange={(e) => setNuevaFechaNacimiento(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-funcion">Función:</Label>
              <Input
                id="edit-funcion"
                value={nuevaFuncion}
                onChange={(e) => setNuevaFuncion(e.target.value)}
                disabled={submitting}
                placeholder="Ej: Administrador, Seguridad, Mantenimiento"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-ubicacion">Ubicación:</Label>
              <Input
                id="edit-ubicacion"
                value={nuevaUbicacion}
                onChange={(e) => setNuevaUbicacion(e.target.value)}
                disabled={submitting}
                placeholder="Ubicación designada (opcional)"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <CardContent className="space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar empleado por nombre o función..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{empleados.length}</div>
              <p className="text-xs text-muted-foreground">Total de empleados</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{empleadosFiltrados.length}</div>
              <p className="text-xs text-muted-foreground">Empleados mostrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de empleados */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Función</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Fecha Nacimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando empleados...
                  </TableCell>
                </TableRow>
              ) : empleadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {filtro ? 'No se encontraron empleados con ese filtro' : 'No hay empleados registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell className="font-medium">
                      {empleado.nombres} {empleado.apellidos && empleado.apellidos !== 'Sin especificar' ? empleado.apellidos : ''}
                    </TableCell>
                    <TableCell>{empleado.cedula || '-'}</TableCell>
                    <TableCell>{empleado.funcion || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={empleado.ubicacion_designada}>
                      {empleado.ubicacion_designada || '-'}
                    </TableCell>
                    <TableCell>
                      {empleado.fecha_nacimiento 
                        ? new Date(empleado.fecha_nacimiento).toLocaleDateString() 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        empleado.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {empleado.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarEmpleado(empleado)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
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
  );
};