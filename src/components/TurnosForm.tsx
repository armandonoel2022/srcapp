import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { EmpleadoTurnoSelector } from '@/components/EmpleadoTurnoSelector';
import { EmpleadoTurnoForm } from '@/components/EmpleadoTurnoForm';
import { PunchButton } from '@/components/PunchButton';
import { useToast } from '@/hooks/use-toast';

export const TurnosForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState('');
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');
  const [estadoTurno, setEstadoTurno] = useState<{
    estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
    turno: any;
  }>({ estado: 'sin_entrada', turno: null });

  const { verificarEstadoTurno } = useTurnos();
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
        if (result.estado === 'sin_entrada') {
          setTipoRegistro('entrada');
        } else if (result.estado === 'entrada_registrada') {
          setTipoRegistro('salida');
        }
      });
    }
  }, [selectedEmpleadoId, verificarEstadoTurno]);

  const handleEmpleadoSelect = (empleadoId: string, nombres: string, apellidos: string, funcion: string) => {
    const displayName = apellidos === 'Sin especificar' 
      ? `${nombres} - ${funcion}`
      : `${nombres} ${apellidos} - ${funcion}`;
    setSelectedEmpleado(displayName);
    setSelectedEmpleadoId(empleadoId);
  };

  const handleRegistroCompleto = async () => {
    const today = new Date().toISOString().split('T')[0];
    const nuevoEstado = await verificarEstadoTurno(selectedEmpleadoId, today);
    setEstadoTurno(nuevoEstado);
    
    if (tipoRegistro === 'entrada') {
      setTipoRegistro('salida');
    }
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
            <EmpleadoTurnoSelector
              onEmpleadoSelect={handleEmpleadoSelect}
              selectedEmpleadoId={selectedEmpleadoId}
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

          {/* PUNCH Button */}
          {selectedEmpleadoId && estadoTurno.estado !== 'completo' && (
            <div className="flex justify-center">
              <PunchButton
                empleadoId={selectedEmpleadoId}
                tipoRegistro={tipoRegistro}
                onRegistroCompleto={handleRegistroCompleto}
              />
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
    </div>
  );
};