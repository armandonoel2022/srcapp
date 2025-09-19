import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, CheckCircle, AlertTriangle, User, Loader2 } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useEmpleadoAuth } from '@/hooks/useEmpleadoAuth';
import { PunchButton } from '@/components/PunchButton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
  
// Función para calcular distancia usando la fórmula de Haversine  
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {  
  const R = 6371; // Radio de la Tierra en km  
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLng = (lng2 - lng1) * Math.PI / 180;  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +  
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *  
            Math.sin(dLng/2) * Math.sin(dLng/2);  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));  
  return R * c;  
};  
  
// Función para validar ubicación del usuario
const validateUserLocation = async (currentLat: number, currentLng: number) => {
  try {
    const { data: ubicaciones, error } = await supabase
      .from('ubicaciones_trabajo')
      .select('*')
      .eq('activa', true);
      
    if (error) throw error;
      
    for (const ubicacion of ubicaciones) {
      // Extraer coordenadas del campo point - coordenadas es un string en formato "(lat,lng)"
      const coordStr = ubicacion.coordenadas as string;
      const matches = coordStr.match(/\(([^,]+),([^)]+)\)/);
      if (!matches) continue;
      
      const lat = parseFloat(matches[1]);
      const lng = parseFloat(matches[2]);
        
      const distance = calculateDistance(currentLat, currentLng, lat, lng);  
        
      if (distance <= (ubicacion.radio_tolerancia / 1000)) { // Convertir metros a km  
        return { valid: true, ubicacion };  
      }  
    }  
      
    return { valid: false, error: 'Fuera del rango de ubicaciones autorizadas' };  
  } catch (error) {  
    console.error('Error validating location:', error);  
    return { valid: false, error: 'Error al obtener ubicaciones asignadas' };  
  }  
};  
  
// Función para validar configuración de geolocalización  
const validateGeolocationSettings = async () => {  
  try {  
    const { data: ubicaciones } = await supabase  
      .from('ubicaciones_trabajo')  
      .select('count')  
      .eq('activa', true);  
        
    if (!ubicaciones || ubicaciones.length === 0) {  
      return { valid: false, error: 'Sin ubicaciones configuradas' };  
    }  
      
    return { valid: true };  
  } catch (error) {  
    return { valid: false, error: 'Error al verificar configuración' };  
  }  
};  
  
export const TurnosAgentForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [estadoTurno, setEstadoTurno] = useState({ estado: 'sin_entrada', entrada: null, salida: null, horasTrabajadas: null });
  const [isValidating, setIsValidating] = useState(false);
  const { empleado, loading: authLoading } = useEmpleadoAuth();
  const { verificarEstadoTurno, loading: turnosLoading } = useTurnos();
  const { toast } = useToast();

  const empleadoId = empleado?.id;
  const isAuthenticated = !!empleado;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cargar estado del turno cuando se carga el empleado
  useEffect(() => {
    const loadEstadoTurno = async () => {
      if (empleadoId) {
        const fecha = new Date().toISOString().split('T')[0];
        const estado = await verificarEstadoTurno(empleadoId, fecha);
        setEstadoTurno({
          estado: estado.estado,
          entrada: estado.turno?.hora_entrada || null,
          salida: estado.turno?.hora_salida || null,
          horasTrabajadas: estado.turno?.hora_entrada && estado.turno?.hora_salida ? 
            calculateHorasTrabajadas(estado.turno.hora_entrada, estado.turno.hora_salida) : null
        });
      }
    };

    loadEstadoTurno();
  }, [empleadoId, verificarEstadoTurno]);

  const calculateHorasTrabajadas = (entrada: string, salida: string) => {
    const entradaTime = new Date(`2000-01-01T${entrada}`);
    const salidaTime = new Date(`2000-01-01T${salida}`);
    const diffMs = salidaTime.getTime() - entradaTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };
  
  const refetch = async () => {
    if (empleadoId) {
      const fecha = new Date().toISOString().split('T')[0];
      const estado = await verificarEstadoTurno(empleadoId, fecha);
      setEstadoTurno({
        estado: estado.estado,
        entrada: estado.turno?.hora_entrada || null,
        salida: estado.turno?.hora_salida || null,
        horasTrabajadas: estado.turno?.hora_entrada && estado.turno?.hora_salida ? 
          calculateHorasTrabajadas(estado.turno.hora_entrada, estado.turno.hora_salida) : null
      });
    }
  };
  
  const getEstadoBadge = () => {
    if (authLoading || turnosLoading) return <Badge variant="outline">Cargando...</Badge>;
      
    switch (estadoTurno.estado) {  
      case 'sin_entrada':  
        return <Badge variant="destructive">Sin entrada</Badge>;  
      case 'entrada_registrada':  
        return <Badge variant="secondary">Entrada registrada</Badge>;  
      case 'completo':  
        return <Badge variant="default">Turno completo</Badge>;  
      default:  
        return <Badge variant="outline">Desconocido</Badge>;  
    }  
  };  
  
  const getTurnoInfo = () => {
    if (authLoading || turnosLoading) return <div className="text-sm text-muted-foreground">Cargando información...</div>;
      
    return (  
      <div className="space-y-2 text-sm">  
        {estadoTurno.entrada && (  
          <div className="flex items-center justify-between">  
            <span>Entrada:</span>  
            <span className="font-mono">{new Date(estadoTurno.entrada).toLocaleTimeString('es-ES')}</span>  
          </div>  
        )}  
        {estadoTurno.salida && (  
          <div className="flex items-center justify-between">  
            <span>Salida:</span>  
            <span className="font-mono">{new Date(estadoTurno.salida).toLocaleTimeString('es-ES')}</span>  
          </div>  
        )}  
        {estadoTurno.horasTrabajadas && (  
          <div className="flex items-center justify-between">  
            <span>Horas trabajadas:</span>  
            <span className="font-mono">{estadoTurno.horasTrabajadas}</span>  
          </div>  
        )}  
      </div>  
    );  
  };  
  
  const tipoRegistro = estadoTurno.estado === 'sin_entrada' ? 'entrada' : 'salida';  
  
  if (!isAuthenticated) {  
    return (  
      <Card>  
        <CardContent className="pt-6">  
          <div className="text-center py-8">  
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />  
            <h3 className="text-lg font-medium mb-2">Acceso requerido</h3>  
            <p className="text-muted-foreground">  
              Debes autenticarte como empleado para acceder al sistema de turnos.  
            </p>  
          </div>  
        </CardContent>  
      </Card>  
    );  
  }  
  
  return (  
    <div className="space-y-6">  
      <Card>  
        <CardHeader className="text-center">  
          <div className="flex items-center justify-center gap-2 mb-2">  
            <Clock className="h-5 w-5" />  
            <CardTitle>Sistema de Turnos</CardTitle>  
          </div>  
          <div className="text-sm text-muted-foreground">  
            Empleado: {empleado?.nombres} {empleado?.apellidos}  
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
                tipoRegistro={estadoTurno.estado === 'sin_entrada' ? 'entrada' : 'salida'}
                onRegistroCompleto={refetch}
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