import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Loader2, Shield, Camera, Upload } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PunchButtonProps {
  empleadoId: string;
  tipoRegistro: 'entrada' | 'salida';
  onRegistroCompleto: () => void;
}

export const PunchButton = ({ empleadoId, tipoRegistro, onRegistroCompleto }: PunchButtonProps) => {
  const [isPunching, setIsPunching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { registrarTurno } = useTurnos();
  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();

  const uploadPhoto = async (file: File, turnoId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${empleadoId}/${turnoId}_${tipoRegistro}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('turnos-fotos')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading photo:', error);
        return null;
      }

      return fileName;
    } catch (error) {
      console.error('Error in uploadPhoto:', error);
      return null;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor seleccione un archivo de imagen válido.",
          variant: "destructive"
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      toast({
        title: "Foto seleccionada",
        description: "Ahora presiona PUNCH para registrar con la foto.",
      });
    }
  };

  const handlePunch = async () => {
    if (!selectedFile) {
      toast({
        title: "Foto requerida",
        description: "Debe seleccionar una foto antes de hacer el PUNCH.",
        variant: "destructive"
      });
      return;
    }

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

      // Primero registrar el turno para obtener el ID
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
      
      if (result.success && result.turnoId) {
        // Subir la foto
        setIsUploading(true);
        const photoPath = await uploadPhoto(selectedFile, result.turnoId);
        
        if (photoPath) {
          // Actualizar el registro con la ruta de la foto
          const { error: updateError } = await supabase
            .from('turnos_empleados')
            .update({
              [tipoRegistro === 'entrada' ? 'foto_entrada' : 'foto_salida']: photoPath
            })
            .eq('id', result.turnoId);

          if (updateError) {
            console.error('Error updating photo path:', updateError);
          }
        }

        toast({
          title: "¡PUNCH Registrado!",
          description: `${tipoRegistro === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente con foto`,
        });
        
        // Limpiar el archivo seleccionado
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
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
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">
          {tipoRegistro === 'entrada' ? 'PUNCH IN' : 'PUNCH OUT'}
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Se verificará tu ubicación vs lugar designado</span>
        </div>
      </div>

      {/* Selector de foto */}
      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
          disabled={isPunching || isUploading}
        >
          <Camera className="h-4 w-4" />
          {selectedFile ? 'Cambiar foto' : 'Seleccionar foto'}
        </Button>
        {selectedFile && (
          <p className="text-xs text-green-600 text-center">
            ✓ Foto seleccionada: {selectedFile.name}
          </p>
        )}
      </div>

      <Button
        onClick={handlePunch}
        disabled={isPunching || isUploading || !selectedFile}
        size="lg"
        className="h-32 w-32 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
      >
        {isPunching || isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs">
              {isUploading ? 'Subiendo...' : 'Registrando...'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Clock className="h-8 w-8 mb-2" />
            <span>PUNCH</span>
          </div>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        {!selectedFile 
          ? 'Primero selecciona una foto como evidencia, luego presiona PUNCH para registrar.'
          : `Presiona PUNCH para registrar tu ${tipoRegistro === 'entrada' ? 'entrada' : 'salida'} con foto evidencia.`
        }
      </p>
    </div>
  );
};