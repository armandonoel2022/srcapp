import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useVisitorCache } from '@/hooks/useVisitorCache';
import { useState } from 'react';
import { Search } from 'lucide-react';

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
  const { getVisitorData, searchVisitors } = useVisitorCache();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleCedulaChange = async (value: string) => {
    onCedulaChange(value);
    
    if (value.length >= 3) {
      const data = await getVisitorData(value);
      if (data) {
        onNombreChange(data.nombre);
        onApellidoChange(data.apellido);
        onMatriculaChange(data.matricula || '');
      }
    }
  };

  const handleSearchVisitors = async () => {
    if (cedula.length >= 2) {
      const results = await searchVisitors(cedula);
      setSearchResults(results);
      setShowSearch(true);
    }
  };

  const selectVisitor = (visitor: any) => {
    onCedulaChange(visitor.cedula);
    onNombreChange(visitor.nombre);
    onApellidoChange(visitor.apellido);
    onMatriculaChange(visitor.matricula || '');
    setShowSearch(false);
    setSearchResults([]);
  };

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
        <div className="relative">
          <Label htmlFor="cedula-visitante">Cédula:</Label>
          <div className="flex gap-2">
            <Input
              id="cedula-visitante"
              value={cedula}
              onChange={(e) => handleCedulaChange(e.target.value)}
              required
              placeholder="000-0000000-0"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSearchVisitors}
              className="flex items-center gap-1"
              title="Buscar visitante"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {searchResults.map((visitor, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectVisitor(visitor)}
                >
                  <div className="font-medium">{visitor.nombre} {visitor.apellido}</div>
                  <div className="text-sm text-gray-600">{visitor.cedula}</div>
                </div>
              ))}
            </div>
          )}
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