import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useEmpleadoAuth } from '@/hooks/useEmpleadoAuth';
import { PunchButton } from '@/components/PunchButton';
import { useToast } from '@/hooks/use-toast';

export const TurnosAgentForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');
  const [estadoTurno, setEstadoTurno] = useState<{
    estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
    turno: any;
  }>({ estado: 'sin_entrada', turno: null });
  const [empleadoId, setEmpleadoId] = useState<string>('');

  const { verificarEstadoTurno } = useTurnos();
  const { empleado } = useEmpleadoAuth();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (empleado) {
      console.log('📋 Empleado cargado:', empleado);
      // Verificar el estado del turno para el empleado autenticado
      const today = new Date().toISOString().split('T')[0];
      setEmpleadoId(empleado.id);
      buscarEmpleadoYVerificarEstado(today);
    }
  }, [empleado]);

  const buscarEmpleadoYVerificarEstado = async (fecha: string) => {
    if (!empleado?.id) return;
    
    try {
      console.log('🔍 Verificando estado del turno para empleado:', empleado.id);
      
      // Usar directamente el ID del empleado autenticado
      const estado = await verificarEstadoTurno(empleado.id, fecha);
      
      if (estado.estado === 'sin_entrada') {
        setTipoRegistro('entrada');
        setEstadoTurno({ estado: 'sin_entrada', turno: null });
      } else if (estado.estado === 'entrada_registrada') {
        setTipoRegistro('salida');
        setEstadoTurno({ estado: 'entrada_registrada', turno: estado.turno });
      } else if (estado.estado === 'completo') {
        setEstadoTurno({ estado: 'completo', turno: estado.turno });
      }
      
      setEmpleadoId(empleado.id);
      
    } catch (error) {
      console.error('Error al verificar estado del turno:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del turno",
        variant: "destructive"
      });
      setEstadoTurno({ estado: 'error', turno: null });
    }
  };

  const handleRegistroCompleto = async () => {
    const today = new Date().toISOString().split('T')[0];
    await buscarEmpleadoYVerificarEstado(today);
    
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

  if (!empleado) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Acceso Restringido</h3>
            <p className="text-muted-foreground">
              Debe iniciar sesión como empleado para acceder a esta sección.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Control de Turnos - Agente
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Conectado como: {empleado.nombres} {empleado.apellidos}</span>
          </div>
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
          {/* Estado del Turno */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado del turno:</span>
              {getEstadoBadge()}
            </div>
            
            {getTurnoInfo()}
          </div>

          {/* PUNCH Button */}
          {estadoTurno.estado !== 'completo' && empleadoId && (
            <div className="flex justify-center">
              <PunchButton
                empleadoId={empleadoId}
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
                Ya has registrado tanto la entrada como la salida para hoy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};