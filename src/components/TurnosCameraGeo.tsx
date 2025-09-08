import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface TurnoData {
  photo: string;
  location: GeolocationData;
  timestamp: Date;
}

interface TurnosCameraGeoProps {
  onTurnoConfirmed?: (data: TurnoData) => void;
  className?: string;
}

export const TurnosCameraGeo: React.FC<TurnosCameraGeoProps> = ({
  onTurnoConfirmed,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'camera' | 'location' | 'summary'>('camera');
  const [isLoading, setIsLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verificar compatibilidad de APIs
  const checkCompatibility = useCallback(() => {
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasGeolocation = !!navigator.geolocation;
    
    if (!hasCamera) {
      toast({
        title: "Cámara no disponible",
        description: "Tu dispositivo no soporta acceso a la cámara",
        variant: "destructive"
      });
      return false;
    }
    
    if (!hasGeolocation) {
      toast({
        title: "Geolocalización no disponible", 
        description: "Tu dispositivo no soporta geolocalización",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, []);

  // Inicializar cámara con configuración específica para iPad
  const startCamera = useCallback(async () => {
    if (!checkCompatibility()) return;

    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Esperar metadata antes de reproducir
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsCameraActive(true);
                setIsLoading(false);
              })
              .catch((err) => {
                console.error('Error al reproducir video:', err);
                setError('Error al iniciar la vista previa de la cámara');
                setIsLoading(false);
              });
          }
        };
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      let errorMessage = 'No se pudo acceder a la cámara';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permisos de cámara denegados. Por favor, habilita el acceso a la cámara.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró una cámara en el dispositivo';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación';
      }
      
      setError(errorMessage);
      setIsLoading(false);
      toast({
        title: "Error de cámara",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [checkCompatibility]);

  // Capturar foto usando canvas
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar frame actual del video
    context.drawImage(video, 0, 0);

    // Convertir a base64
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    
    // Detener cámara después de capturar
    stopCamera();
    
    // Proceder a obtener ubicación
    setCurrentStep('location');
    getCurrentLocation();

    toast({
      title: "Foto capturada",
      description: "Ahora obteniendo tu ubicación...",
    });
  }, []);

  // Obtener geolocalización
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: GeolocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setLocation(locationData);
        setCurrentStep('summary');
        setIsLoading(false);

        toast({
          title: "Ubicación obtenida",
          description: "Datos capturados correctamente",
        });
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        let errorMessage = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permisos de ubicación denegados';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado al obtener ubicación';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        toast({
          title: "Error de ubicación",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Retomar foto
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setLocation(null);
    setCurrentStep('camera');
    startCamera();
  }, [startCamera]);

  // Confirmar turno
  const confirmTurno = useCallback(() => {
    if (!capturedPhoto || !location) return;

    const turnoData: TurnoData = {
      photo: capturedPhoto,
      location,
      timestamp: new Date()
    };

    onTurnoConfirmed?.(turnoData);
    
    // Resetear estado
    setCapturedPhoto(null);
    setLocation(null);
    setCurrentStep('camera');
    setIsOpen(false);

    toast({
      title: "Turno registrado",
      description: "El turno se ha registrado exitosamente",
    });
  }, [capturedPhoto, location, onTurnoConfirmed]);

  // Cancelar proceso
  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedPhoto(null);
    setLocation(null);
    setCurrentStep('camera');
    setError(null);
    setIsOpen(false);
  }, [stopCamera]);

  // Abrir modal e iniciar proceso
  const handleOpenModal = useCallback(() => {
    setIsOpen(true);
    setCurrentStep('camera');
    setError(null);
    startCamera();
  }, [startCamera]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <>
      <Button 
        onClick={handleOpenModal}
        className={`gap-2 ${className}`}
        size="lg"
      >
        <Camera className="h-5 w-5" />
        Registrar Turno
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Registro de Turno
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Paso 1: Cámara */}
            {currentStep === 'camera' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Capturar Fotografía</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error ? (
                    <div className="text-center space-y-4">
                      <div className="text-red-600 text-sm">{error}</div>
                      <Button onClick={startCamera} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Vista previa de cámara */}
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                        />
                        
                        {/* Overlay de guía visual */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                            <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                              Posiciona tu rostro aquí
                            </span>
                          </div>
                        </div>
                        
                        {isLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Canvas oculto para captura */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Botones de acción */}
                      <div className="flex gap-2">
                        <Button
                          onClick={capturePhoto}
                          disabled={!isCameraActive || isLoading}
                          className="flex-1"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capturar
                        </Button>
                        <Button onClick={handleCancel} variant="outline">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Paso 2: Geolocalización */}
            {currentStep === 'location' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Obteniendo Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Obteniendo tu ubicación...
                      </p>
                    </>
                  ) : error ? (
                    <>
                      <div className="text-red-600 text-sm">{error}</div>
                      <Button onClick={getCurrentLocation} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* Paso 3: Resumen */}
            {currentStep === 'summary' && capturedPhoto && location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Confirmar Registro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vista previa de foto */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={capturedPhoto} 
                      alt="Foto capturada" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Información de ubicación */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary">Ubicación verificada</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Lat: {location.latitude.toFixed(6)}</div>
                      <div>Lng: {location.longitude.toFixed(6)}</div>
                      {location.accuracy && (
                        <div>Precisión: {Math.round(location.accuracy)}m</div>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button onClick={retakePhoto} variant="outline" className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retomar
                    </Button>
                    <Button onClick={confirmTurno} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};