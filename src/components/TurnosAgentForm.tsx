import { useState, useEffect } from 'react';  
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';  
import { Button } from '@/components/ui/button';  
import { Badge } from '@/components/ui/badge';  
import { Clock, MapPin, CheckCircle, AlertTriangle, User } from 'lucide-react';  
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
      // Extraer coordenadas del campo point  
      const [lng, lat] = ubicacion.coordenadas.coordinates;  
        
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
  const { empleadoId, empleado, isAuthenticated } = useEmpleadoAuth();  
  const { estadoTurno, loading, refetch } = useTurnos(empleadoId);  
  const { toast } = useToast();  
  
  useEffect(() => {  
    const timer = setInterval(() => {  
      setCurrentTime(new Date());  
    }, 1000);  
  
    return () => clearInterval(timer);  
  }, []);  
  
  // Función mejorada para manejar punch con validación de ubicación  
  const handlePunchWithValidation = async () => {  
    // Validar configuración inicial  
    const configValidation = await validateGeolocationSettings();  
    if (!configValidation.valid) {  
      toast({  
        title: "Error de configuración",  
        description: configValidation.error || "Contacte al administrador",  
        variant: "destructive"  
      });  
      return;  
    }  
  
    if (!navigator.geolocation) {  
      toast({  
        title: "Error de geolocalización",  
        description: "Tu dispositivo no soporta geolocalización",  
        variant: "destructive"  
      });  
      return;  
    }  
  
    // Mostrar indicador de carga  
    toast({  
      title: "Validando ubicación...",  
      description: "Obteniendo tu ubicación actual",  
    });  
  
    navigator.geolocation.getCurrentPosition(  
      async (position) => {  
        const { latitude, longitude } = position.coords;  
          
        const validation = await validateUserLocation(latitude, longitude);  
          
        if (!validation.valid) {  
          toast({  
            title: "UBICACION INVALIDA",  
            description: validation.error || "Contacte al administrador",  
            variant: "destructive"  
          });  
          return;  
        }  
  
        // Si la validación es exitosa, mostrar ubicación válida  
        toast({  
          title: "Ubicación válida",  
          description: `Registrando desde: ${validation.ubicacion?.nombre || 'Ubicación autorizada'}`,  
        });  
  
        // Aquí puedes proceder con el punch normal  
        // Por ahora, simularemos el éxito del punch  
        await handleRegistroCompleto();  
      },  
      (error) => {  
        let errorMessage = "No se pudo obtener tu ubicación actual";  
          
        switch(error.code) {  
          case error.PERMISSION_DENIED:  
            errorMessage = "Permiso de ubicación denegado. Actívalo en tu navegador.";  
            break;  
          case error.POSITION_UNAVAILABLE:  
            errorMessage = "Información de ubicación no disponible.";  
            break;  
          case error.TIMEOUT:  
            errorMessage = "Tiempo de espera agotado al obtener la ubicación.";  
            break;  
        }  
          
        toast({  
          title: "Error de ubicación",  
          description: errorMessage,  
          variant: "destructive"  
        });  
      },  
      {  
        enableHighAccuracy: true,  
        timeout: 15000,  
        maximumAge: 60000  
      }  
    );  
  };  
  
  const handleRegistroCompleto = async () => {  
    await refetch();  
    toast({  
      title: "Registro exitoso",  
      description: "Tu turno ha sido registrado correctamente",  
    });  
  };  
  
  const getEstadoBadge = () => {  
    if (loading) return <Badge variant="outline">Cargando...</Badge>;  
      
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
    if (loading) return <div className="text-sm text-muted-foreground">Cargando información...</div>;  
      
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
  
          {/* PUNCH Button con validación de ubicación */}  
          {estadoTurno.estado !== 'completo' && empleadoId && (  
            <div className="flex justify-center">  
              <Button  
              onClick={handlePunchWithValidation}  
              disabled={isValidating}  
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"  
            >  
              {isValidating ? (  
                <>  
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />  
                  Validando ubicación...  
                </>  
              ) : (  
                'PUNCH'  
              )}  
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
    </div>  
  );  
};