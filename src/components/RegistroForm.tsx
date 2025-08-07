import { useState, useEffect } from 'react';
import { useRegistros } from '@/hooks/useRegistros';
import { EmpleadoSelector } from './EmpleadoSelector';
import { VisitanteForm } from './VisitanteForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Shield } from 'lucide-react';

export const RegistroForm = () => {
  const { guardarRegistro, obtenerUltimoAgente, loading } = useRegistros();
  
  // Estados del formulario
  const [seguridad, setSeguridad] = useState('');
  const [agente, setAgente] = useState('');
  const [servicio, setServicio] = useState('');
  const [finServicio, setFinServicio] = useState('');
  const [tipoPersona, setTipoPersona] = useState<'empleado' | 'visitante'>('empleado');
  
  // Estados para empleado
  const [nombreEmpleado, setNombreEmpleado] = useState('');
  const [funcionEmpleado, setFuncionEmpleado] = useState('');
  
  // Estados para visitante
  const [nombreVisitante, setNombreVisitante] = useState('');
  const [apellidoVisitante, setApellidoVisitante] = useState('');
  const [cedulaVisitante, setCedulaVisitante] = useState('');
  const [matriculaVisitante, setMatriculaVisitante] = useState('');
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar último agente al montar el componente
  useEffect(() => {
    const cargarUltimoAgente = async () => {
      const ultimoAgente = await obtenerUltimoAgente();
      if (ultimoAgente) {
        setSeguridad(ultimoAgente.seguridad || '');
        setAgente(ultimoAgente.agente || '');
        setServicio(ultimoAgente.servicio || '');
        setFinServicio(ultimoAgente.fin_servicio || '');
      }
    };
    
    cargarUltimoAgente();
  }, []);

  // Persistir datos en localStorage
  useEffect(() => {
    localStorage.setItem('registro_seguridad', seguridad);
    localStorage.setItem('registro_agente', agente);
    localStorage.setItem('registro_servicio', servicio);
    localStorage.setItem('registro_fin_servicio', finServicio);
  }, [seguridad, agente, servicio, finServicio]);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedSeguridad = localStorage.getItem('registro_seguridad');
    const savedAgente = localStorage.getItem('registro_agente');
    const savedServicio = localStorage.getItem('registro_servicio');
    const savedFinServicio = localStorage.getItem('registro_fin_servicio');
    
    if (savedSeguridad) setSeguridad(savedSeguridad);
    if (savedAgente) setAgente(savedAgente);
    if (savedServicio) setServicio(savedServicio);
    if (savedFinServicio) setFinServicio(savedFinServicio);
  }, []);

  const handleEmpleadoSelect = (nombre: string, funcion: string) => {
    setNombreEmpleado(nombre);
    setFuncionEmpleado(funcion);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      seguridad,
      agente,
      servicio,
      fin_servicio: finServicio,
      tipo_persona: tipoPersona,
      ...(tipoPersona === 'empleado' ? {
        nombre: nombreEmpleado,
        funcion: funcionEmpleado
      } : {
        nombre: nombreVisitante,
        apellido: apellidoVisitante,
        cedula: cedulaVisitante,
        matricula: matriculaVisitante
      })
    };

    const result = await guardarRegistro(data);
    
    if (result.success) {
      // Limpiar solo los campos de persona, mantener datos del agente
      if (tipoPersona === 'empleado') {
        setNombreEmpleado('');
        setFuncionEmpleado('');
      } else {
        setNombreVisitante('');
        setApellidoVisitante('');
        setCedulaVisitante('');
        setMatriculaVisitante('');
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-center justify-center">
          <Clock className="w-6 h-6 mr-2" />
          Control de Acceso Diario - Puesto Residencia de Francia
        </CardTitle>
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">
            {currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-xl font-bold">
            {currentTime.toLocaleTimeString('es-ES')}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del Agente de Seguridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="agente-seguridad" className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Agente de Seguridad:
              </Label>
              <Input
                id="agente-seguridad"
                value={seguridad}
                onChange={(e) => setSeguridad(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="agente-relevante">Agente Relevante:</Label>
              <Input
                id="agente-relevante"
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="puesta-servicio">Puesta de Servicio:</Label>
              <Input
                id="puesta-servicio"
                type="time"
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="fin-servicio">Fin de Servicio:</Label>
              <Input
                id="fin-servicio"
                type="time"
                value={finServicio}
                onChange={(e) => setFinServicio(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tipo de Persona */}
          <div>
            <Label htmlFor="tipo-persona" className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Tipo de Persona:
            </Label>
            <Select value={tipoPersona} onValueChange={(value: 'empleado' | 'visitante') => setTipoPersona(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado">Empleado</SelectItem>
                <SelectItem value="visitante">Visitante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos según tipo de persona */}
          {tipoPersona === 'empleado' ? (
            <div className="space-y-4">
              <EmpleadoSelector 
                onEmpleadoSelect={handleEmpleadoSelect}
                selectedEmpleado={nombreEmpleado}
              />
              
              <div>
                <Label htmlFor="funcion-empleado">Función:</Label>
                <Input
                  id="funcion-empleado"
                  value={funcionEmpleado}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          ) : (
            <VisitanteForm
              nombre={nombreVisitante}
              apellido={apellidoVisitante}
              cedula={cedulaVisitante}
              matricula={matriculaVisitante}
              onNombreChange={setNombreVisitante}
              onApellidoChange={setApellidoVisitante}
              onCedulaChange={setCedulaVisitante}
              onMatriculaChange={setMatriculaVisitante}
            />
          )}

          {/* Botón de registro */}
          <Button 
            type="submit" 
            className="w-full text-lg py-6"
            disabled={loading}
          >
            {loading ? "Registrando..." : "REGISTRAR"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};