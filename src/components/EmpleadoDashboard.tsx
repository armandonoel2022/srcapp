import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Clock, MapPin, CheckCircle, LogOut, Key } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { PunchButton } from '@/components/PunchButton';
import { EmpleadoPasswordChangeModal } from '@/components/EmpleadoPasswordChangeModal';
import { LocationDisplay } from '@/components/LocationDisplay';
import { useToast } from '@/hooks/use-toast';
import { useEmpleadoAuth, EmpleadoAuth } from '@/hooks/useEmpleadoAuth';

interface EmpleadoDashboardProps {
  empleado: EmpleadoAuth;
}

export const EmpleadoDashboard = ({ empleado }: EmpleadoDashboardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');
  const [estadoTurno, setEstadoTurno] = useState<{
    estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
    turno: any;
  }>({ estado: 'sin_entrada', turno: null });

  const { verificarEstadoTurno, eliminarTurnosPrueba } = useTurnos();
  const { logout, empleado: empleadoUpdated } = useEmpleadoAuth();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    verificarEstadoTurno(empleado.id, today).then(result => {
      setEstadoTurno(result);
      
      if (result.estado === 'sin_entrada') {
        setTipoRegistro('entrada');
      } else if (result.estado === 'entrada_registrada') {
        setTipoRegistro('salida');
      }
    });
  }, [empleado.id, verificarEstadoTurno]);

  useEffect(() => {
    // Usar el empleado actualizado del hook para reflejar cambios inmediatos
    const currentEmpleado = empleadoUpdated || empleado;
    if (currentEmpleado.requires_password_change) {
      setShowPasswordModal(true);
    } else {
      setShowPasswordModal(false);
    }
  }, [empleado.requires_password_change, empleadoUpdated?.requires_password_change]);


  const formatTime12Hour = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRegistroCompleto = async () => {
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const nuevoEstado = await verificarEstadoTurno(empleado.id, today);
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
            <span>Entrada: {new Date(`2000-01-01T${estadoTurno.turno.hora_entrada}`).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
        )}
        {estadoTurno.turno.hora_salida && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Salida: {new Date(`2000-01-01T${estadoTurno.turno.hora_salida}`).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  Bienvenido/a, {empleado.nombres} {empleado.apellidos}
                </CardTitle>
                <p className="text-muted-foreground">{empleado.funcion}</p>
                <LocationDisplay empleadoLugarDesignado={empleado.lugar_designado} />
              </div>
              <div className="flex gap-2">
                {(empleadoUpdated?.requires_password_change || empleado.requires_password_change) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Cambiar Contraseña
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Clock */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              Control de Turnos
            </CardTitle>
            <div className="text-lg">
              {formatDate(currentTime)}
            </div>
            <div className="text-3xl font-mono font-bold">
              {formatTime12Hour(currentTime)}
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

            {/* PUNCH Button - Always visible */}
            <div className="flex justify-center">
              <PunchButton
                empleadoId={empleado.id}
                tipoRegistro={tipoRegistro}
                onRegistroCompleto={handleRegistroCompleto}
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change Modal */}
        <EmpleadoPasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          isRequired={empleadoUpdated?.requires_password_change || empleado.requires_password_change}
        />
      </div>
    </div>
  );
};