import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useAuth } from '@/hooks/useAuth';
import { PunchButton } from '@/components/PunchButton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TurnosAgentForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');
  const [estadoTurno, setEstadoTurno] = useState<{
    estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
    turno: any;
  }>({ estado: 'sin_entrada', turno: null });
  const [empleadoId, setEmpleadoId] = useState<string>('');

  const { verificarEstadoTurno } = useTurnos();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      // Verificar el estado del turno para el usuario autenticado
      const today = new Date().toISOString().split('T')[0];
      buscarEmpleadoYVerificarEstado(today);
    }
  }, [user]);

  const buscarEmpleadoYVerificarEstado = async (fecha: string) => {
    if (!user?.username) return;
    
    try {
      // Buscar el empleado por nombre de usuario
      const { data: empleados, error } = await supabase
        .from('empleados_turnos')
        .select('id')
        .or(`nombres.ilike.%${user.username}%,apellidos.ilike.%${user.username}%`)
        .eq('active', true)
        .limit(1);

      if (error) throw error;

      if (empleados && empleados.length > 0) {
        const foundEmpleadoId = empleados[0].id;
        setEmpleadoId(foundEmpleadoId);
        
        const result = await verificarEstadoTurno(foundEmpleadoId, fecha);
        setEstadoTurno(result);
        
        // Determinar el tipo de registro basado en el estado
        if (result.estado === 'sin_entrada') {
          setTipoRegistro('entrada');
        } else if (result.estado === 'entrada_registrada') {
          setTipoRegistro('salida');
        }
      } else {
        toast({
          title: "Error",
          description: "No se encontró un empleado asociado a este usuario",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al verificar estado: ${error.message}`,
        variant: "destructive"
      });
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

  if (!user || user.role !== 'agente_seguridad') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Acceso Restringido</h3>
            <p className="text-muted-foreground">
              Esta sección solo está disponible para agentes de seguridad autenticados.
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
            <span>Conectado como: {user.username}</span>
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