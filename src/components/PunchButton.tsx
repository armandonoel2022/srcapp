import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Loader2 } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';

interface PunchButtonProps {
  empleadoId: string;
  tipoRegistro: 'entrada' | 'salida';
  onRegistroCompleto: () => void;
}

export const PunchButton = ({ empleadoId, tipoRegistro, onRegistroCompleto }: PunchButtonProps) => {
  const [isPunching, setIsPunching] = useState(false);
  
  const { registrarTurno } = useTurnos();
  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();

  const handlePunch = async () => {
    setIsPunching(true);
    
    try {
      // Obtener geolocalización
      const locationData = await getCurrentPosition();
      
      if (!locationData) {
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener la ubicación. Verifique los permisos.",
          variant: "destructive"
        });
        return;
      }

      const ubicacion = {
        lat: locationData.latitude,
        lng: locationData.longitude
      };

      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0];

      const turnoData = {
        empleado_id: empleadoId,
        fecha,
        tipo_registro: tipoRegistro,
        ubicacion_entrada: tipoRegistro === 'entrada' ? ubicacion : undefined,
        ubicacion_salida: tipoRegistro === 'salida' ? ubicacion : undefined,
        hora_entrada: tipoRegistro === 'entrada' ? hora : undefined,
        hora_salida: tipoRegistro === 'salida' ? hora : undefined,
      };

      const result = await registrarTurno(turnoData);
      
      if (result.success) {
        toast({
          title: "¡PUNCH Registrado!",
          description: `${tipoRegistro === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`,
        });
        onRegistroCompleto();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al registrar el PUNCH",
        variant: "destructive"
      });
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">
          {tipoRegistro === 'entrada' ? 'PUNCH IN' : 'PUNCH OUT'}
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Se registrará tu ubicación actual</span>
        </div>
      </div>

      <Button
        onClick={handlePunch}
        disabled={isPunching}
        size="lg"
        className="h-32 w-32 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        {isPunching ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <div className="flex flex-col items-center">
            <Clock className="h-8 w-8 mb-2" />
            <span>PUNCH</span>
          </div>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Presiona el botón PUNCH para registrar tu {tipoRegistro === 'entrada' ? 'entrada' : 'salida'} con ubicación automática
      </p>
    </div>
  );
};