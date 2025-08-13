import { useState, useEffect } from 'react';
import { useRegistros } from '@/hooks/useRegistros';
import { EmpleadoSelector } from './EmpleadoSelector';
import { VisitanteForm } from './VisitanteForm';
import { RegistrationTypeSelector } from './RegistrationTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Shield, ArrowLeft } from 'lucide-react';
import srcLogo from '@/assets/src-logo.png';

export const RegistroForm = () => {
  const { guardarRegistro, obtenerUltimoAgente, loading } = useRegistros();
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  
  // Estados del formulario
  const [seguridad, setSeguridad] = useState('');
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
        setServicio(ultimoAgente.servicio || '');
        setFinServicio(ultimoAgente.fin_servicio || '');
      }
    };
    
    cargarUltimoAgente();
  }, []);

  // Persistir datos en localStorage
  useEffect(() => {
    localStorage.setItem('registro_seguridad', seguridad);
    localStorage.setItem('registro_servicio', servicio);
    localStorage.setItem('registro_fin_servicio', finServicio);
  }, [seguridad, servicio, finServicio]);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedSeguridad = localStorage.getItem('registro_seguridad');
    const savedServicio = localStorage.getItem('registro_servicio');
    const savedFinServicio = localStorage.getItem('registro_fin_servicio');
    
    if (savedSeguridad) setSeguridad(savedSeguridad);
    if (savedServicio) setServicio(savedServicio);
    if (savedFinServicio) setFinServicio(savedFinServicio);
  }, []);

  const handleEmpleadoSelect = (nombre: string, funcion: string) => {
    setNombreEmpleado(nombre);
    setFuncionEmpleado(funcion);
  };

  // Establecer Anabel como empleado por defecto
  useEffect(() => {
    if (!nombreEmpleado && tipoPersona === 'empleado') {
      setNombreEmpleado('Anabel');
      setFuncionEmpleado('Intendente');
    }
  }, [tipoPersona, nombreEmpleado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      seguridad,
      agente: seguridad, // Using seguridad as agente since we're using only "Agente de Seguridad"
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

  const handleTypeSelect = (type: 'empleado' | 'visitante') => {
    setTipoPersona(type);
    setShowTypeSelector(false);
  };

  const handleBackToTypeSelector = () => {
    setShowTypeSelector(true);
  };

  if (showTypeSelector) {
    return <RegistrationTypeSelector onTypeSelect={handleTypeSelect} />;
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--gradient-blue-form)" }}>
      <Card className="w-full max-w-2xl mx-auto" style={{ boxShadow: "var(--shadow-form)" }}>
        <CardHeader className="text-center">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToTypeSelector}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar tipo
          </Button>
          <div className="flex-1" />
        </div>
        <div className="flex flex-col items-center mb-4">
          <img 
            src={srcLogo} 
            alt="SRC Logo" 
            className="w-24 h-24 mb-4"
          />
          <CardTitle className="text-xl font-bold font-poppins mb-2" style={{ color: "hsl(var(--title-dark))" }}>
            CONTROL DE ACCESO DIARIO EN PUESTO
          </CardTitle>
          <CardTitle className="text-xl font-bold font-poppins" style={{ color: "hsl(var(--title-dark))" }}>
            RESIDENCIA DE FRANCIA
          </CardTitle>
          <div className="mt-2 px-4 py-2 rounded-lg" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
              {tipoPersona === 'empleado' ? 'REGISTRO DE EMPLEADO' : 'REGISTRO DE VISITANTE'}
            </span>
          </div>
        </div>
        <div className="text-lg font-semibold text-muted-foreground">
          Fecha: {currentTime.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric',
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
        <div className="text-xl font-bold font-poppins" style={{ color: "hsl(var(--title-dark))" }}>
          {currentTime.toLocaleTimeString('es-ES', { 
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seguridad">Agente de Seguridad:</Label>
              <Input
                id="seguridad"
                value={seguridad}
                onChange={(e) => setSeguridad(e.target.value)}
                placeholder="Nombre del agente de seguridad"
                required
              />
            </div>
            
            <div className="space-y-2"></div>
            
            <div className="space-y-2">
              <Label htmlFor="servicio">Puesta de Servicio:</Label>
              <Input
                id="servicio"
                type="time"
                value={servicio}
                onChange={(e) => setServicio(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="finServicio">Fin de Servicio:</Label>
              <Input
                id="finServicio"
                type="time"
                value={finServicio}
                onChange={(e) => setFinServicio(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoPersona">Tipo de Persona:</Label>
              <Select value={tipoPersona} onValueChange={(value: 'empleado' | 'visitante') => setTipoPersona(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empleado">Empleado</SelectItem>
                  <SelectItem value="visitante">Visitante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoPersona === 'empleado' && (
              <div className="space-y-2">
                <Label htmlFor="empleado">Nombre del Empleado:</Label>
                <EmpleadoSelector 
                  onEmpleadoSelect={handleEmpleadoSelect}
                  selectedEmpleado={nombreEmpleado}
                />
                {funcionEmpleado && (
                  <div className="space-y-2">
                    <Label htmlFor="funcion">Función:</Label>
                    <Input
                      id="funcion"
                      value={funcionEmpleado}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>
            )}
            
            {tipoPersona === 'visitante' && (
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
          </div>

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={loading}
            >
              {loading ? "Registrando..." : "REGISTRAR"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
};