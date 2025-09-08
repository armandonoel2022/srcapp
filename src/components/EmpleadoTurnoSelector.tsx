import { useState } from 'react';
import { useEmpleadosTurnos } from '@/hooks/useEmpleadosTurnos';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface EmpleadoTurnoSelectorProps {
  onEmpleadoSelect: (empleadoId: string, nombres: string, apellidos: string, funcion: string) => void;
  selectedEmpleadoId?: string;
}

export const EmpleadoTurnoSelector = ({ onEmpleadoSelect, selectedEmpleadoId }: EmpleadoTurnoSelectorProps) => {
  const { empleados, loading, agregarEmpleado } = useEmpleadosTurnos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoNombres, setNuevoNombres] = useState('');
  const [nuevosApellidos, setNuevosApellidos] = useState('');
  const [nuevaFuncion, setNuevaFuncion] = useState('');
  const [nuevaCedula, setNuevaCedula] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmpleadoChange = (empleadoId: string) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (empleado) {
      onEmpleadoSelect(empleado.id, empleado.nombres, empleado.apellidos, empleado.funcion);
    }
  };

  const handleAgregarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoNombres.trim() || !nuevosApellidos.trim() || !nuevaFuncion.trim()) {
      return;
    }

    setSubmitting(true);
    const result = await agregarEmpleado({
      nombres: nuevoNombres.trim(),
      apellidos: nuevosApellidos.trim(),
      funcion: nuevaFuncion.trim(),
      cedula: nuevaCedula.trim() || undefined
    });
    
    if (result.success) {
      // Buscar el empleado recién creado para auto-seleccionarlo
      setTimeout(() => {
        const empleadoCreado = empleados.find(e => 
          e.nombres === nuevoNombres.trim() && 
          e.apellidos === nuevosApellidos.trim()
        );
        if (empleadoCreado) {
          onEmpleadoSelect(empleadoCreado.id, empleadoCreado.nombres, empleadoCreado.apellidos, empleadoCreado.funcion);
        }
      }, 500);

      setNuevoNombres('');
      setNuevosApellidos('');
      setNuevaFuncion('');
      setNuevaCedula('');
      setIsModalOpen(false);
    }
    
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={selectedEmpleadoId} onValueChange={handleEmpleadoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un empleado para turnos" />
            </SelectTrigger>
            <SelectContent>
              {empleados.map((empleado) => (
                <SelectItem key={empleado.id} value={empleado.id}>
                  {empleado.nombres} {empleado.apellidos} - {empleado.funcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Empleado para Turnos</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAgregarEmpleado} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nuevo-nombres">Nombres:</Label>
                  <Input
                    id="nuevo-nombres"
                    value={nuevoNombres}
                    onChange={(e) => setNuevoNombres(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="nuevos-apellidos">Apellidos:</Label>
                  <Input
                    id="nuevos-apellidos"
                    value={nuevosApellidos}
                    onChange={(e) => setNuevosApellidos(e.target.value)}
                    required
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
                  required
                  disabled={submitting}
                  placeholder="Ej: Intendente, Vigilante, etc."
                />
              </div>

              <div>
                <Label htmlFor="nueva-cedula">Cédula (opcional):</Label>
                <Input
                  id="nueva-cedula"
                  value={nuevaCedula}
                  onChange={(e) => setNuevaCedula(e.target.value)}
                  disabled={submitting}
                  placeholder="Número de cédula"
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