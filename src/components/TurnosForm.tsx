import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Camera, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEmpleados } from '@/hooks/useEmpleados';
import { useTurnos } from '@/hooks/useTurnos';
import { EmpleadoSelector } from '@/components/EmpleadoSelector';
import { CameraScanner } from '@/components/CameraScanner';
import { useToast } from '@/hooks/use-toast';

export const TurnosForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');
  const [estadoTurno, setEstadoTurno] = useState<{
    estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
    turno: any;
  }>({ estado: 'sin_entrada', turno: null });

  const { empleados } = useEmpleados();
  const { registrarTurno, verificarEstadoTurno, loading } = useTurnos();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedEmpleadoId) {
      const today = new Date().toISOString().split('T')[0];
      verificarEstadoTurno(selectedEmpleadoId, today).then(result => {
        setEstadoTurno(result);
        
        // Determinar el tipo de registro basado en el estado
        setTipoRegistro('entrada'); // Por simplicidad, siempre empezar con entrada
      });
    }
  }, [selectedEmpleadoId, verificarEstadoTurno]);

  const handleEmpleadoSelect = (nombre: string, funcion: string) => {
    setSelectedEmpleado(`${nombre} - ${funcion}`);
    
    // Encontrar el ID del empleado
    const empleado = empleados.find(e => e.nombre === nombre && e.funcion === funcion);
    if (empleado) {
      setSelectedEmpleadoId(empleado.id);
    }
  };

  const handleCameraData = async (data: { cedula: string; nombre: string; apellido: string }) => {
    if (!selectedEmpleadoId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un empleado primero",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Funcionalidad en desarrollo",
      description: "El sistema de captura de fotos para turnos está siendo implementado",
      variant: "default"
    });
    setIsCameraOpen(false);
  };

  const getEstadoBadge = () => {
    switch (estadoTurno.estado) {
      case 'sin_entrada':
        return <Badge variant="secondary">Sin entrada registrada</Badge>;
      case 'entrada_registrada':
        return <Badge variant="default">Entrada registrada</Badge>;
      case 'completo':
        return <Badge variant="secondary">Turno completo</Badge>;
      default:
        return null;
    }
  };

  const getTurnoInfo = () => {
    if (!estadoTurno.turno) return null;

    return (
      <div className="space-y-2 p-4 bg-muted rounded-lg">
        <h4 className="font-medium">Información del Turno Actual</h4>
        {estadoTurno.turno.hora_entrada && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Entrada: {estadoTurno.turno.hora_entrada}</span>
          </div>
        )}
        {estadoTurno.turno.hora_salida && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Salida: {estadoTurno.turno.hora_salida}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Control de Turnos de Empleados
          </CardTitle>
          <div className="text-lg font-mono">
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-2xl font-mono font-bold">
            {currentTime.toLocaleTimeString('es-ES')}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Selector de Empleado */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Seleccionar Empleado
            </label>
            <EmpleadoSelector
              onEmpleadoSelect={handleEmpleadoSelect}
              selectedEmpleado={selectedEmpleado}
            />
          </div>

          {/* Estado del Turno */}
          {selectedEmpleadoId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado del turno:</span>
                {getEstadoBadge()}
              </div>
              
              {getTurnoInfo()}
            </div>
          )}

          {/* Tipo de Registro */}
          {selectedEmpleadoId && estadoTurno.estado !== 'completo' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">
                  Registrar {tipoRegistro === 'entrada' ? 'Entrada' : 'Salida'}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  <span>Se capturará foto y ubicación automáticamente</span>
                </div>
              </div>

              <Button
                onClick={() => setIsCameraOpen(true)}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                <Camera className="mr-2 h-5 w-5" />
                {loading ? 'Registrando...' : `Capturar ${tipoRegistro === 'entrada' ? 'Entrada' : 'Salida'}`}
              </Button>
            </div>
          )}

          {/* Mensaje de turno completo */}
          {estadoTurno.estado === 'completo' && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Turno completo registrado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                El empleado ya tiene registradas tanto la entrada como la salida para hoy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Scanner Modal */}
      <CameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDataScanned={handleCameraData}
      />
    </div>
  );
};