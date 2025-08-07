import { useState } from 'react';
import { useEmpleados } from '@/hooks/useEmpleados';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface EmpleadoSelectorProps {
  onEmpleadoSelect: (nombre: string, funcion: string) => void;
  selectedEmpleado?: string;
}

export const EmpleadoSelector = ({ onEmpleadoSelect, selectedEmpleado }: EmpleadoSelectorProps) => {
  const { empleados, loading, agregarEmpleado } = useEmpleados();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaFuncion, setNuevaFuncion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmpleadoChange = (nombre: string) => {
    const empleado = empleados.find(e => e.nombre === nombre);
    if (empleado) {
      onEmpleadoSelect(empleado.nombre, empleado.funcion);
    }
  };

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
      // Auto-seleccionar el empleado recién agregado
      onEmpleadoSelect(nuevoNombre.trim(), nuevaFuncion.trim());
    }
    
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={selectedEmpleado} onValueChange={handleEmpleadoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un empleado" />
            </SelectTrigger>
            <SelectContent>
              {empleados.map((empleado) => (
                <SelectItem key={empleado.id} value={empleado.nombre}>
                  {empleado.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="mt-6">
              <Plus className="w-4 h-4" />
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
    </div>
  );
};