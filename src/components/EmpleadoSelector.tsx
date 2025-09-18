import { useState } from 'react';  
import { useEmpleados } from '@/hooks/useEmpleados';  
import { Button } from '@/components/ui/button';  
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';  
import { Input } from '@/components/ui/input';  
import { Label } from '@/components/ui/label';  
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';  
import { Plus } from 'lucide-react';  
  
interface EmpleadoSelectorProps {  
  onEmpleadoSelect: (nombres: string, apellidos: string, funcion: string) => void;  
  selectedEmpleado?: string;  
}  
  
export const EmpleadoSelector = ({ onEmpleadoSelect, selectedEmpleado }: EmpleadoSelectorProps) => {  
  const { empleados, loading, agregarEmpleado } = useEmpleados();  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [nuevoNombres, setNuevoNombres] = useState('');  
  const [nuevosApellidos, setNuevosApellidos] = useState('');  
  const [nuevaFuncion, setNuevaFuncion] = useState('');  
  const [submitting, setSubmitting] = useState(false);  
  
  const handleEmpleadoChange = (empleadoId: string) => {  
    const empleado = empleados.find(e => e.id === empleadoId);  
    if (empleado) {  
      // Manejar apellidos null o vacíos  
      const apellidosLimpios = empleado.apellidos || '';  
      onEmpleadoSelect(empleado.nombres, apellidosLimpios, empleado.funcion);  
    }  
  };  
  
  const handleAgregarEmpleado = async (e: React.FormEvent) => {  
    e.preventDefault();  
      
    if (!nuevoNombres.trim()) {  
      return;  
    }  
  
    setSubmitting(true);  
    const result = await agregarEmpleado({  
      nombres: nuevoNombres.trim(),  
      apellidos: nuevosApellidos.trim() || 'Sin especificar',  
      funcion: nuevaFuncion.trim() || 'Sin especificar'  
    });  
      
    if (result.success) {  
      const apellidosParaCallback = nuevosApellidos.trim() || 'Sin especificar';  
      setNuevoNombres('');  
      setNuevosApellidos('');  
      setNuevaFuncion('');  
      setIsModalOpen(false);  
      // Auto-seleccionar el empleado recién agregado  
      onEmpleadoSelect(nuevoNombres.trim(), apellidosParaCallback, nuevaFuncion.trim() || 'Sin especificar');  
    }  
      
    setSubmitting(false);  
  };  
  
  // Encontrar el empleado seleccionado por nombre completo para mostrar en el Select  
  const getSelectedValue = () => {  
    if (!selectedEmpleado) return '';  
      
    // Buscar por nombre completo (como viene del RegistroForm)  
    const empleado = empleados.find(e => {  
      const nombreCompleto = `${e.nombres} ${e.apellidos || ''}`.trim();  
      return nombreCompleto === selectedEmpleado || e.nombres === selectedEmpleado;  
    });  
      
    return empleado ? empleado.id : '';  
  };  
  
  return (  
    <div className="space-y-4">  
      <div className="flex gap-2">  
        <div className="flex-1">  
          <Select value={getSelectedValue()} onValueChange={handleEmpleadoChange}>  
            <SelectTrigger>  
              <SelectValue placeholder="Selecciona un empleado" />  
            </SelectTrigger>  
            <SelectContent>  
              {empleados.map((empleado) => {  
                // Manejar apellidos null, undefined o vacíos  
                const apellidosLimpios = empleado.apellidos && empleado.apellidos !== 'null'   
                  ? empleado.apellidos   
                  : '';  
                  
                const nombreCompleto = apellidosLimpios   
                  ? `${empleado.nombres} ${apellidosLimpios}`.trim()  
                  : empleado.nombres;  
                  
                return (  
                  <SelectItem key={empleado.id} value={empleado.id}>  
                    {nombreCompleto}  
                  </SelectItem>  
                );  
              })}  
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
                    disabled={submitting}  
                    placeholder="Opcional"  
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
                  placeholder="Opcional"  
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