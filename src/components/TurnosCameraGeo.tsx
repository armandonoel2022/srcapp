import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Check, X, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';

interface TurnoData {
  photo: string;
  location: { lat: number; lng: number };
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
  const [step, setStep] = useState<'camera' | 'location' | 'summary'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const { getCurrentPosition, isLoading: isGeoLoading } = useGeolocation();

  // Iniciar cámara (usando la misma lógica que funcionaba)
  const startCamera = async () => {
    try {
      // Verificar compatibilidad
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no es compatible con este dispositivo');
      }

      setIsLoadingCamera(true);
      setError('');

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar que los metadatos se carguen antes de reproducir
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setIsCameraActive(true);
          }
        };
      }

      toast({
        title: "Cámara activada",
        description: "Posicione la imagen dentro del marco y capture la foto",
      });

    } catch (error: any) {
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Permiso de cámara denegado. Active los permisos en configuración.'
        : error.message || 'Error al acceder a la cámara';
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error de cámara",
        description: errorMessage,
      });
    } finally {
      setIsLoadingCamera(false);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capturar foto
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
    setStep('location');

    toast({
      title: "Foto capturada",
      description: "Ahora obteniendo su ubicación...",
    });
  };

  // Obtener geolocalización
  const getLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setError('');

      const position = await getCurrentPosition();
      
      if (position) {
        const coords = {
          lat: position.latitude,
          lng: position.longitude
        };

        setLocation(coords);
        setStep('summary');

        toast({
          title: "Ubicación obtenida",
          description: `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`,
        });
      }

    } catch (error: any) {
      setError(error.message || 'Error al obtener la ubicación');
      toast({
        variant: "destructive",
        title: "Error de ubicación",
        description: error.message || 'Error al obtener la ubicación',
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Retomar foto
  const retakePhoto = () => {
    setCapturedImage(null);
    setLocation(null);
    setStep('camera');
    startCamera();
  };

  // Confirmar turno
  const confirmTurno = () => {
    if (!capturedImage || !location) return;

    const turnoData: TurnoData = {
      photo: capturedImage,
      location,
      timestamp: new Date()
    };

    onTurnoConfirmed?.(turnoData);
    handleClose();

    toast({
      title: "Turno registrado",
      description: "El turno se ha registrado exitosamente",
    });
  };

  // Manejar cierre
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setLocation(null);
    setError('');
    setStep('camera');
    setIsOpen(false);
  };

  // Abrir modal
  const handleOpen = () => {
    setIsOpen(true);
    setStep('camera');
    startCamera();
  };

  // Auto-obtener ubicación cuando se captura la foto
  React.useEffect(() => {
    if (step === 'location' && capturedImage) {
      getLocation();
    }
  }, [step, capturedImage]);

  return (
    <>
      <Button 
        onClick={handleOpen}
        className={`gap-2 ${className}`}
        size="lg"
      >
        <Camera className="h-5 w-5" />
        Registrar Turno
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Registro de Turno - {step === 'camera' ? 'Fotografía' : step === 'location' ? 'Ubicación' : 'Confirmar'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {step === 'camera' && (
              <div className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {!isCameraActive ? (
                  <div className="text-center py-8">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Active la cámara para registrar su turno con verificación de ubicación.
                    </p>
                    <Button onClick={startCamera} disabled={isLoadingCamera} className="gap-2">
                      {isLoadingCamera ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {isLoadingCamera ? 'Activando...' : 'Activar Cámara'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-80 object-cover"
                      />
                      
                      {/* Overlay de guía visual */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-black/60"></div>
                        
                        <div className="relative">
                          <div 
                            className="border-2 border-primary bg-transparent rounded-lg"
                            style={{
                              width: '280px',
                              height: '177px',
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                            }}
                          >
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                            
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center">
                              <Badge className="text-xs">
                                Posiciónese dentro del marco
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="text-primary text-lg">💡</div>
                        <div>
                          <p className="text-sm font-medium text-primary mb-2">
                            Consejos para el mejor resultado:
                          </p>
                          <ul className="text-xs text-primary/80 space-y-1">
                            <li>• Colóquese completamente dentro del marco azul</li>
                            <li>• Use buena iluminación, evite sombras</li>
                            <li>• Manténgase quieto durante la captura</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={capturePhoto} className="flex-1 gap-2">
                        <Camera className="h-4 w-4" />
                        Capturar Foto
                      </Button>
                      <Button variant="outline" onClick={handleClose} className="gap-2">
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {step === 'location' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Obteniendo Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {isLoadingLocation || isGeoLoading ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Verificando su ubicación actual...
                      </p>
                    </>
                  ) : error ? (
                    <>
                      <div className="text-destructive text-sm">{error}</div>
                      <Button onClick={getLocation} variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reintentar
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {step === 'summary' && capturedImage && location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Confirmar Registro de Turno</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vista previa de foto */}
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={capturedImage} 
                      alt="Foto del turno" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Información de ubicación */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Ubicación verificada
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded">
                      <div>Latitud: {location.lat.toFixed(6)}</div>
                      <div>Longitud: {location.lng.toFixed(6)}</div>
                      <div>Tiempo: {new Date().toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <Button onClick={retakePhoto} variant="outline" className="flex-1">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retomar
                    </Button>
                    <Button onClick={confirmTurno} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Turno
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