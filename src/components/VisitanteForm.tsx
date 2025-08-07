import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VisitanteFormProps {
  nombre: string;
  apellido: string;
  cedula: string;
  matricula: string;
  onNombreChange: (value: string) => void;
  onApellidoChange: (value: string) => void;
  onCedulaChange: (value: string) => void;
  onMatriculaChange: (value: string) => void;
}

export const VisitanteForm = ({
  nombre,
  apellido,
  cedula,
  matricula,
  onNombreChange,
  onApellidoChange,
  onCedulaChange,
  onMatriculaChange
}: VisitanteFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre-visitante">Nombre(s):</Label>
          <Input
            id="nombre-visitante"
            value={nombre}
            onChange={(e) => onNombreChange(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="apellido-visitante">Apellido(s):</Label>
          <Input
            id="apellido-visitante"
            value={apellido}
            onChange={(e) => onApellidoChange(e.target.value)}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cedula-visitante">Cédula:</Label>
          <Input
            id="cedula-visitante"
            value={cedula}
            onChange={(e) => onCedulaChange(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="matricula-visitante">Matrícula:</Label>
          <Input
            id="matricula-visitante"
            value={matricula}
            onChange={(e) => onMatriculaChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};