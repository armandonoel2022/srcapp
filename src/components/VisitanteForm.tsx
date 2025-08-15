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
    console.log('🔍 Searching visitors with query:', cedula);
    console.log('🔍 Query length:', cedula.length);
    
    if (cedula.length >= 1) { // Reduced minimum to 1 character for testing
      console.log('🔍 Starting search...');
      const results = await searchVisitors(cedula);
      console.log('🔍 Search results:', results);
      console.log('🔍 Results length:', results.length);
      setSearchResults(results);
      setShowSearch(true);
      console.log('🔍 showSearch set to true');
      
      if (results.length === 0) {
        console.log('🔍 No visitors found - showing empty state');
        // Show dropdown even if empty to indicate search was performed
      }
    } else {
      console.log('🔍 Query too short, need at least 1 character');
    }
  };

  const selectVisitor = (visitor: any) => {
    console.log('👤 Selecting visitor:', visitor);
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
          
          {showSearch && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto mt-1">
              {searchResults.length > 0 ? (
                searchResults.map((visitor, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => selectVisitor(visitor)}
                  >
                    <div className="font-medium text-gray-900">{visitor.nombre} {visitor.apellido}</div>
                    <div className="text-sm text-gray-600">Cédula: {visitor.cedula}</div>
                    {visitor.matricula && (
                      <div className="text-sm text-gray-500">Matrícula: {visitor.matricula}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500 text-center">
                  <div className="text-sm">No se encontraron visitantes</div>
                  <div className="text-xs mt-1">con "{cedula}"</div>
                </div>
              )}
              <div className="p-2 bg-gray-50 border-t">
                <button 
                  onClick={() => setShowSearch(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 w-full text-center"
                >
                  Cerrar búsqueda
                </button>
              </div>
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