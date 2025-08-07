import { useState } from 'react';
import { useEmpleados } from '@/hooks/useEmpleados';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Search } from 'lucide-react';

export const GestionEmpleados = () => {
  const { empleados, loading, agregarEmpleado } = useEmpleados();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFuncion, setNuevaFuncion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filtro, setFiltro] = useState('');

  const handleAgregarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoNombre.trim() || !nuevaFuncion.trim()) {
      return;
    }

    setSubmitting(true);
    const result = await agregarEmpleado(nuevoNombre.trim(), nuevaFuncion.trim());
    
    if (result.success) {
      setNuevoNombre('');
      setNuevaFuncion('');
      setIsModalOpen(false);
    }
    
    setSubmitting(false);
  };

  const empleadosFiltrados = empleados.filter(empleado =>
    empleado.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    empleado.funcion.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Gestión de Empleados
          </div>
          
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
                <div>
                  <Label htmlFor="nuevo-nombre">Nombre:</Label>
                  <Input
                    id="nuevo-nombre"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="Ingresa el nombre completo"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nueva-funcion">Función:</Label>
                  <Input
                    id="nueva-funcion"
                    value={nuevaFuncion}
                    onChange={(e) => setNuevaFuncion(e.target.value)}
                    required
                    disabled={submitting}
                    placeholder="Ej: Administrador, Seguridad, Mantenimiento"
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
        </CardTitle>
      </CardHeader>
      
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
                <TableHead>Nombre</TableHead>
                <TableHead>Función</TableHead>
                <TableHead>Fecha de Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Cargando empleados...
                  </TableCell>
                </TableRow>
              ) : empleadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    {filtro ? 'No se encontraron empleados con ese filtro' : 'No hay empleados registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell className="font-medium">{empleado.nombre}</TableCell>
                    <TableCell>{empleado.funcion}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date().toLocaleDateString('es-ES')}
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