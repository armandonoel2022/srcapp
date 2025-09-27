import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, Shield, Camera } from 'lucide-react';
import { useTurnos } from '@/hooks/useTurnos';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PatternAlert } from '@/components/PatternAlert';

interface PunchButtonProps {
  empleadoId: string;
  tipoRegistro: 'entrada' | 'salida';
  onRegistroCompleto: () => void;
}

interface RegistrarTurnoResult {
  success: boolean;
  message?: string;
  turnoId?: string;
  error?: string;
}

export const PunchButton = ({ empleadoId, tipoRegistro, onRegistroCompleto }: PunchButtonProps) => {
  const [isPunching, setIsPunching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [showPatternAlert, setShowPatternAlert] = useState(false);
  const [patternMessage, setPatternMessage] = useState('');
  const [pendingTurnoData, setPendingTurnoData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { registrarTurno } = useTurnos();
  const { getCurrentPosition, isLoading: isGeolocationLoading, error: geolocationErrorObj, getLocationSettingsInstructions } = useGeolocation();
  const { toast } = useToast();

  // Función para verificar patrones de registro
  const verificarPatronRegistros = async (empleadoId: string, fecha: string, tipoRegistro: 'entrada' | 'salida'): Promise<{
    necesitaAlerta: boolean;
    mensaje?: string;
  }> => {
    if (tipoRegistro === 'entrada') return { necesitaAlerta: false }; // Solo alertar en salidas

    try {
      // Obtener fecha anterior
      const fechaAnterior = new Date(fecha);
      fechaAnterior.setDate(fechaAnterior.getDate() - 1);
      const fechaAnteriorStr = fechaAnterior.toISOString().split('T')[0];

      // Verificar registros del día anterior
      const { data: registrosAyer } = await supabase
        .from('turnos_empleados')
        .select('hora_entrada, hora_salida')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fechaAnteriorStr);

      // Verificar registros de hoy
      const { data: registrosHoy } = await supabase
        .from('turnos_empleados')
        .select('hora_entrada, hora_salida')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha);

      if (registrosAyer && registrosAyer.length > 0) {
        const entradasSinSalida = registrosAyer.filter(r => r.hora_entrada && !r.hora_salida);
        
        if (entradasSinSalida.length > 0 && (!registrosHoy || registrosHoy.length === 0)) {
          return {
            necesitaAlerta: true,
            mensaje: `⚠️ DETECTADO: Tienes ${entradasSinSalida.length} entrada(s) del día anterior sin registrar salida. Si estás llegando HOY, esto debería ser una ENTRADA del nuevo día.`
          };
        }
      }

      return { necesitaAlerta: false };
    } catch (error) {
      console.error('Error verificando patrón:', error);
      return { necesitaAlerta: false };
    }
  };

  const uploadPhoto = async (file: File, turnoId: string): Promise<string | null> => {
    try {
      setIsUploading(true);
      
      // Validar que el archivo exista
      if (!file) {
        console.error('No file provided for upload');
        return null;
      }

      // Crear nombre único para el archivo
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${empleadoId}/${turnoId}_${tipoRegistro}_${timestamp}.${fileExt}`;

      console.log('📤 Subiendo foto:', fileName);

      // Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('turnos-fotos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading photo to Supabase:', error);
        throw new Error(`Error al subir la foto: ${error.message}`);
      }

      console.log('✅ Foto subida exitosamente:', data);
      return fileName;

    } catch (error: any) {
      console.error('Error in uploadPhoto:', error);
      
      // Mostrar error específico al usuario
      if (error.message.includes('bucket') || error.message.includes('storage')) {
        toast({
          title: "Error de almacenamiento",
          description: "No se pudo acceder al almacenamiento de fotos. Contacte al administrador.",
          variant: "destructive"
        });
      } else if (error.message.includes('size') || error.message.includes('tamaño')) {
        toast({
          title: "Archivo muy grande",
          description: "La imagen es demasiado grande. Intente con una imagen más pequeña.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error al subir foto",
          description: error.message || "No se pudo subir la foto de evidencia.",
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor seleccione un archivo de imagen válido (JPEG, PNG, etc.).",
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
        description: `Foto "${file.name}" lista para registrar ${tipoRegistro === 'entrada' ? 'entrada' : 'salida'}.`,
      });
    }
  };

  const procesarRegistro = async (turnoData: any) => {
    try {
      console.log('📝 Registrando turno en base de datos...');

      const result = await registrarTurno(turnoData) as RegistrarTurnoResult;
      
      if (result.success && result.turnoId) {
        console.log('✅ Turno registrado con ID:', result.turnoId);
        
        // Subir la foto
        console.log('📤 Iniciando upload de foto...');
        const photoPath = await uploadPhoto(selectedFile!, result.turnoId);
        
        if (photoPath) {
          console.log('🖼️ Foto subida, actualizando registro con path:', photoPath);
          
          // Actualizar el registro con la ruta de la foto
          const updateData: any = {
            [tipoRegistro === 'entrada' ? 'foto_entrada' : 'foto_salida']: photoPath
          };

          const { error: updateError } = await supabase
            .from('turnos_empleados')
            .update(updateData)
            .eq('id', result.turnoId);

          if (updateError) {
            console.error('❌ Error updating photo path:', updateError);
            toast({
              title: "Advertencia",
              description: "Turno registrado pero no se pudo guardar la referencia de la foto.",
              variant: "default"
            });
          } else {
            console.log('✅ Ruta de foto actualizada en BD');
          }
        } else {
          console.warn('⚠️ Foto no se pudo subir, pero el turno fue registrado');
          toast({
            title: "Advertencia",
            description: "Turno registrado pero no se pudo subir la foto.",
            variant: "default"
          });
        }

        toast({
          title: "¡PUNCH Registrado!",
          description: `${tipoRegistro === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`,
        });
        
        // Limpiar el archivo seleccionado
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        onRegistroCompleto();
      } else {
        const errorMessage = result.error || result.message || 'Error al registrar el turno en la base de datos';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error en procesarRegistro:', error);
      toast({
        title: "Error",
        description: error.message || "Error al registrar el PUNCH. Intente nuevamente.",
        variant: "destructive"
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
    setGeolocationError(null);
    
    try {
      // Obtener geolocalización
      console.log('📍 Solicitando ubicación...');
      const locationData = await getCurrentPosition();
      
      if (!locationData) {
        let errorMessage = 'No se pudo obtener la ubicación';
        let errorType = '';
        
        if (geolocationErrorObj) {
          errorMessage = geolocationErrorObj.message;
          if (errorMessage.includes('When I Share') || errorMessage.includes('insuficientes')) {
            errorType = 'WHEN_IN_USE_PERMISSION';
          }
        }
        
        setGeolocationError(errorMessage);
        
        if (errorType === 'WHEN_IN_USE_PERMISSION') {
          toast({
            title: "Configuración de ubicación requerida",
            description: errorMessage,
            variant: "destructive",
            duration: 10000
          });
        } else if (errorMessage.includes('Configuración') || errorMessage.includes('permiso')) {
          toast({
            title: "Permisos de ubicación requeridos",
            description: `${errorMessage} ${getLocationSettingsInstructions()}`,
            variant: "destructive",
            duration: 8000
          });
        } else {
          toast({
            title: "Error de ubicación",
            description: errorMessage,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('📍 Ubicación obtenida:', locationData);

      const ubicacion = {
        lat: locationData.latitude,
        lng: locationData.longitude,
        accuracy: locationData.accuracy
      };

      const now = new Date();
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const fecha = localDate.toISOString().split('T')[0];
      const hora = String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');

      const turnoData = {
        empleado_id: empleadoId,
        fecha,
        tipo_registro: tipoRegistro,
        ubicacion_entrada: tipoRegistro === 'entrada' ? ubicacion : undefined,
        ubicacion_salida: tipoRegistro === 'salida' ? ubicacion : undefined,
        hora_entrada: tipoRegistro === 'entrada' ? hora : undefined,
        hora_salida: tipoRegistro === 'salida' ? hora : undefined,
      };

      // Verificar patrones solo para salidas
      if (tipoRegistro === 'salida') {
        const patron = await verificarPatronRegistros(empleadoId, fecha, tipoRegistro);
        if (patron.necesitaAlerta) {
          // Mostrar alerta y guardar datos para procesamiento posterior
          setPatternMessage(patron.mensaje || '');
          setPendingTurnoData(turnoData);
          setShowPatternAlert(true);
          return; // No procesar hasta que el usuario confirme
        }
      }

      // Procesar directamente si no hay alerta
      await procesarRegistro(turnoData);

    } catch (error: any) {
      console.error('❌ Error en handlePunch:', error);
      toast({
        title: "Error",
        description: error.message || "Error al registrar el PUNCH. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handlePatternConfirm = async () => {
    setShowPatternAlert(false);
    setIsPunching(true);
    try {
      await procesarRegistro(pendingTurnoData);
    } finally {
      setIsPunching(false);
      setPendingTurnoData(null);
    }
  };

  const handlePatternCancel = () => {
    setShowPatternAlert(false);
    setPendingTurnoData(null);
    setIsPunching(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
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
          capture="environment"
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
          <div className="text-center">
            <p className="text-xs text-green-600">
              ✓ Foto seleccionada
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)}KB)
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handlePunch}
        disabled={isPunching || isUploading || !selectedFile || isGeolocationLoading}
        size="lg"
        className="h-32 w-32 rounded-full bg-red-600 hover:bg-red-700 text-white text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeolocationLoading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs">Obteniendo ubicación...</span>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs">Subiendo foto...</span>
          </div>
        ) : isPunching ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs">Registrando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Clock className="h-8 w-8 mb-2" />
            <span>PUNCH</span>
          </div>
        )}
      </Button>

      {/* Mostrar error de geolocalización específico */}
      {geolocationError && (
        <p className="text-xs text-red-600 text-center max-w-xs">
          ⚠️ {geolocationError}
        </p>
      )}

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        {!selectedFile 
          ? 'Primero selecciona una foto como evidencia, luego presiona PUNCH para registrar.'
          : `Presiona PUNCH para registrar tu ${tipoRegistro === 'entrada' ? 'entrada' : 'salida'} con foto evidencia.`
        }
      </p>

      {/* Alerta de patrón irregular */}
      <PatternAlert
        show={showPatternAlert}
        mensaje={patternMessage}
        onConfirm={handlePatternConfirm}
        onCancel={handlePatternCancel}
      />
    </div>
  );
};