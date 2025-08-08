import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Empleado {
  id: string;
  nombre: string;
  funcion: string;
  created_at: string;
}

export const EliminarEmpleados = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmpleados();
  }, []);

  useEffect(() => {
    // Filtrar empleados basado en el término de búsqueda
    const filtered = empleados.filter(empleado =>
      empleado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empleado.funcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmpleados(filtered);
  }, [empleados, searchTerm]);

  const loadEmpleados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEmpleados(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar empleados: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmpleado = async () => {
    if (!selectedEmpleado) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', selectedEmpleado.id);

      if (error) throw error;

      toast({
        title: "Empleado eliminado",
        description: `${selectedEmpleado.nombre} ha sido eliminado exitosamente.`
      });

      // Recargar la lista de empleados
      await loadEmpleados();
      setIsDeleteModalOpen(false);
      setSelectedEmpleado(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar empleado: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <CardTitle>Eliminar Empleados</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona la eliminación de empleados del sistema. Esta acción es permanente.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o función..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Tabla de empleados */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Función</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Cargando empleados...
                    </TableCell>
                  </TableRow>
                ) : filteredEmpleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      {searchTerm ? 'No se encontraron empleados que coincidan con la búsqueda' : 'No hay empleados registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmpleados.map((empleado) => (
                    <TableRow key={empleado.id}>
                      <TableCell className="font-medium">{empleado.nombre}</TableCell>
                      <TableCell>{empleado.funcion}</TableCell>
                      <TableCell>
                        {new Date(empleado.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteModal(empleado)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
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

      {/* Modal de confirmación de eliminación */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmpleado && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">
                  ¿Estás seguro de que deseas eliminar al empleado?
                </p>
                <div className="mt-2 text-sm text-red-700">
                  <p><strong>Nombre:</strong> {selectedEmpleado.nombre}</p>
                  <p><strong>Función:</strong> {selectedEmpleado.funcion}</p>
                </div>
                <p className="mt-2 text-sm text-red-600 font-medium">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteEmpleado}
                  disabled={deleting}
                  className="flex items-center gap-2"
                >
                  {deleting ? (
                    'Eliminando...'
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};