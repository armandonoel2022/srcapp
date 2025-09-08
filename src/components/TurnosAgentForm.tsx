import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Camera, MapPin, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useAuth } from '@/hooks/useAuth';
import { CameraScanner } from '@/components/CameraScanner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';

export const TurnosAgentForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState<'entrada' | 'salida'>('entrada');
  const [estadoTurno, setEstadoTurno] = useState<{
    estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
    turno: any;
  }>({ estado: 'sin_entrada', turno: null });

  const { registrarTurno, verificarEstadoTurno, loading } = useTurnos();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getCurrentPosition } = useGeolocation();

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
      verificarEstadoTurnoAgente(today);
    }
  }, [user]);

  const verificarEstadoTurnoAgente = async (fecha: string) => {
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
        const empleadoId = empleados[0].id;
        const result = await verificarEstadoTurno(empleadoId, fecha);
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

  const handleCameraCapture = async (photo: string) => {
    if (!user?.username) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive"
      });
      return;
    }

    // Obtener ubicación actual
    try {
      // Usar el hook de geolocalización
      const locationData = await getCurrentPosition();
      
      if (!locationData) {
        toast({
          title: "Error de geolocalización",
          description: "No se pudo obtener la ubicación. Verifique los permisos.",
          variant: "destructive"
        });
        return;
      }

      const ubicacion = {
        lat: locationData.latitude,
        lng: locationData.longitude
      };

      // Buscar el empleado por nombre de usuario
      const { data: empleados, error: empleadosError } = await supabase
        .from('empleados_turnos')
        .select('id')
        .or(`nombres.ilike.%${user.username}%,apellidos.ilike.%${user.username}%`)
        .eq('active', true)
        .limit(1);

      if (empleadosError) throw empleadosError;

      if (!empleados || empleados.length === 0) {
        toast({
          title: "Error",
          description: "No se encontró un empleado asociado a este usuario",
          variant: "destructive"
        });
        return;
      }

      const empleadoId = empleados[0].id;
      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0];

      const turnoData = {
        empleado_id: empleadoId,
        fecha,
        tipo_registro: tipoRegistro,
        ubicacion_entrada: tipoRegistro === 'entrada' ? ubicacion : undefined,
        ubicacion_salida: tipoRegistro === 'salida' ? ubicacion : undefined,
        foto_entrada: tipoRegistro === 'entrada' ? photo : undefined,
        foto_salida: tipoRegistro === 'salida' ? photo : undefined,
        hora_entrada: tipoRegistro === 'entrada' ? hora : undefined,
        hora_salida: tipoRegistro === 'salida' ? hora : undefined,
      };

      const result = await registrarTurno(turnoData);
      
      if (result.success) {
        // Actualizar estado del turno
        await verificarEstadoTurnoAgente(fecha);
        
        // Cambiar automáticamente a salida si se registró entrada
        if (tipoRegistro === 'entrada') {
          setTipoRegistro('salida');
        }
      }

    } catch (error: any) {
      toast({
        title: "Error de geolocalización",
        description: "No se pudo obtener la ubicación. Verifique los permisos.",
        variant: "destructive"
      });
    }

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

          {/* Tipo de Registro */}
          {estadoTurno.estado !== 'completo' && (
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
                Ya has registrado tanto la entrada como la salida para hoy.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Scanner Modal */}
      <CameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCapture={handleCameraCapture}
      />
    </div>
  );
};