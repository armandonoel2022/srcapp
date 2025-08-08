import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Registro {
  id: string;
  fecha: string;
  hora: string;
  seguridad: string;
  agente: string;
  servicio: string;
  fin_servicio: string;
  nombre: string | null;
  apellido: string | null;
  funcion: string | null;
  cedula: string | null;
  matricula: string | null;
  tipo: string;
  tipo_persona: string;
  created_at: string;
}

export const EditarRegistros = () => {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<Registro | null>(null);
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [filtroNombre, setFiltroNombre] = useState('');
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    fecha: '',
    hora: '',
    seguridad: '',
    agente: '',
    servicio: '',
    fin_servicio: '',
    nombre: '',
    apellido: '',
    funcion: '',
    cedula: '',
    matricula: '',
    tipo: 'entrada'
  });

  const { toast } = useToast();

  const cargarRegistros = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registros')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (filtroFecha) {
        query = query.eq('fecha', filtroFecha);
      }

      if (filtroNombre) {
        query = query.or(`nombre.ilike.%${filtroNombre}%,apellido.ilike.%${filtroNombre}%,cedula.ilike.%${filtroNombre}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistros(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar registros: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicion = (registro: Registro) => {
    setSelectedRegistro(registro);
    setEditForm({
      fecha: registro.fecha,
      hora: registro.hora,
      seguridad: registro.seguridad,
      agente: registro.agente,
      servicio: registro.servicio,
      fin_servicio: registro.fin_servicio,
      nombre: registro.nombre || '',
      apellido: registro.apellido || '',
      funcion: registro.funcion || '',
      cedula: registro.cedula || '',
      matricula: registro.matricula || '',
      tipo: registro.tipo
    });
    setEditModalOpen(true);
  };

  const guardarCambios = async () => {
    if (!selectedRegistro) return;

    try {
      const { error } = await supabase
        .from('registros')
        .update({
          fecha: editForm.fecha,
          hora: editForm.hora,
          seguridad: editForm.seguridad,
          agente: editForm.agente,
          servicio: editForm.servicio,
          fin_servicio: editForm.fin_servicio,
          nombre: editForm.nombre || null,
          apellido: editForm.apellido || null,
          funcion: editForm.funcion || null,
          cedula: editForm.cedula || null,
          matricula: editForm.matricula || null,
          tipo: editForm.tipo
        })
        .eq('id', selectedRegistro.id);

      if (error) throw error;

      toast({
        title: "Registro actualizado",
        description: "Los cambios han sido guardados exitosamente"
      });

      setEditModalOpen(false);
      cargarRegistros();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar registro: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const eliminarRegistro = async (registroId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return;

    try {
      const { error } = await supabase
        .from('registros')
        .delete()
        .eq('id', registroId);

      if (error) throw error;

      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado exitosamente"
      });

      cargarRegistros();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar registro: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, [filtroFecha, filtroNombre]);

  const registrosFiltrados = registros;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit className="w-6 h-6" />
            <CardTitle>Editar Entradas y Salidas</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filtro-fecha">Fecha:</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <Input
                  id="filtro-fecha"
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="filtro-nombre">Buscar por nombre/cédula:</Label>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  id="filtro-nombre"
                  value={filtroNombre}
                  onChange={(e) => setFiltroNombre(e.target.value)}
                  placeholder="Nombre, apellido o cédula..."
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button onClick={cargarRegistros} disabled={loading}>
                {loading ? 'Cargando...' : 'Buscar'}
              </Button>
            </div>
          </div>

          {/* Tabla de registros */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entrada/Salida</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Cargando registros...
                    </TableCell>
                  </TableRow>
                ) : registrosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  registrosFiltrados.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>{registro.fecha}</TableCell>
                      <TableCell>{registro.hora}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {registro.nombre} {registro.apellido}
                          </div>
                          {registro.cedula && (
                            <div className="text-sm text-gray-500">
                              Cédula: {registro.cedula}
                            </div>
                          )}
                          {registro.funcion && (
                            <div className="text-sm text-gray-500">
                              {registro.funcion}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={registro.tipo_persona === 'empleado' ? 'default' : 'secondary'}>
                          {registro.tipo_persona === 'empleado' ? 'Empleado' : 'Visitante'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={registro.tipo === 'entrada' ? 'outline' : 'destructive'}>
                          {registro.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{registro.agente}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEdicion(registro)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarRegistro(registro.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-fecha">Fecha:</Label>
              <Input
                id="edit-fecha"
                type="date"
                value={editForm.fecha}
                onChange={(e) => setEditForm({...editForm, fecha: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-hora">Hora:</Label>
              <Input
                id="edit-hora"
                type="time"
                value={editForm.hora}
                onChange={(e) => setEditForm({...editForm, hora: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-seguridad">Seguridad:</Label>
              <Input
                id="edit-seguridad"
                value={editForm.seguridad}
                onChange={(e) => setEditForm({...editForm, seguridad: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-agente">Agente:</Label>
              <Input
                id="edit-agente"
                value={editForm.agente}
                onChange={(e) => setEditForm({...editForm, agente: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-servicio">Inicio Servicio:</Label>
              <Input
                id="edit-servicio"
                type="time"
                value={editForm.servicio}
                onChange={(e) => setEditForm({...editForm, servicio: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-fin-servicio">Fin Servicio:</Label>
              <Input
                id="edit-fin-servicio"
                type="time"
                value={editForm.fin_servicio}
                onChange={(e) => setEditForm({...editForm, fin_servicio: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-nombre">Nombre:</Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-apellido">Apellido:</Label>
              <Input
                id="edit-apellido"
                value={editForm.apellido}
                onChange={(e) => setEditForm({...editForm, apellido: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-funcion">Función:</Label>
              <Input
                id="edit-funcion"
                value={editForm.funcion}
                onChange={(e) => setEditForm({...editForm, funcion: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-cedula">Cédula:</Label>
              <Input
                id="edit-cedula"
                value={editForm.cedula}
                onChange={(e) => setEditForm({...editForm, cedula: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-matricula">Matrícula:</Label>
              <Input
                id="edit-matricula"
                value={editForm.matricula}
                onChange={(e) => setEditForm({...editForm, matricula: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-tipo">Entrada/Salida:</Label>
              <select
                id="edit-tipo"
                value={editForm.tipo}
                onChange={(e) => setEditForm({...editForm, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarCambios}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};