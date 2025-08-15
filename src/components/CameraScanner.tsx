import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, X, Scan, Edit, RefreshCw, Check } from 'lucide-react';
import { useIDScanner } from '@/hooks/useIDScanner';
import { useState } from 'react';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataScanned: (data: { cedula: string; nombre: string; apellido: string }) => void;
}

export const CameraScanner = ({ isOpen, onClose, onDataScanned }: CameraScannerProps) => {
  const {
    isScanning,
    isCameraActive,
    capturedImage,
    previewMode,
    error,
    videoRef,
    canvasRef,
    previewCanvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
    scanCapturedImage
  } = useIDScanner();

  const [manualData, setManualData] = useState({
    cedula: '',
    nombre: '',
    apellido: ''
  });

  const handleClose = () => {
    stopCamera();
    setManualData({ cedula: '', nombre: '', apellido: '' });
    onClose();
  };

  const handleCapture = () => {
    capturePhoto();
  };

  const handleScan = async () => {
    const data = await scanCapturedImage();
    if (data) {
      onDataScanned(data);
      handleClose();
    }
  };

  const handleRetake = () => {
    retakePhoto();
  };

  const handleStartCamera = async () => {
    await startCamera();
  };

  const handleManualSubmit = () => {
    if (manualData.cedula && manualData.nombre && manualData.apellido) {
      onDataScanned(manualData);
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Cédula
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner" className="gap-2">
              <Camera className="h-4 w-4" />
              Escanear
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Edit className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {!isCameraActive ? (
              <div className="text-center py-8">
                <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Active la cámara para tomar una foto clara de la cédula.
                </p>
                <Button onClick={handleStartCamera} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Activar Cámara
                </Button>
              </div>
            ) : previewMode && capturedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <img 
                    src={capturedImage} 
                    alt="Cédula capturada" 
                    className="w-full h-64 object-contain"
                  />
                  <div className="absolute top-2 left-2 right-2 text-center">
                    <span className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                      Vista previa - Verifique que el texto sea legible
                    </span>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    🔍 <strong>Revise la imagen:</strong> ¿Se puede leer claramente la cédula, nombre y apellidos?
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleScan} 
                    disabled={isScanning}
                    className="flex-1 gap-2"
                    style={{ background: "var(--gradient-blue-form)" }}
                  >
                    <Check className="h-4 w-4" />
                    {isScanning ? 'Extrayendo datos...' : 'Extraer Datos'}
                  </Button>
                  <Button variant="outline" onClick={handleRetake} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Tomar otra
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-primary/60 m-8 rounded-lg pointer-events-none">
                    <div className="absolute top-2 left-2 right-2 text-center">
                      <span className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                        Coloque la cédula dentro del marco
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-1/2 border-2 border-primary/80 rounded-lg bg-primary/10"></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Consejos para mejor captura:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Mantenga la cédula plana y centrada</li>
                    <li>• Evite reflejos y sombras</li>
                    <li>• Use buena iluminación natural</li>
                    <li>• Asegúrese de que todo el texto sea visible</li>
                  </ul>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCapture} 
                    className="flex-1 gap-2"
                    style={{ background: "var(--gradient-blue-form)" }}
                  >
                    <Camera className="h-4 w-4" />
                    Capturar Foto
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Si el escaneo no funciona correctamente, puede ingresar los datos manualmente.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-cedula">Cédula</Label>
                <Input
                  id="manual-cedula"
                  value={manualData.cedula}
                  onChange={(e) => setManualData(prev => ({ ...prev, cedula: e.target.value }))}
                  placeholder="Ej: 00112345671"
                  maxLength={11}
                />
              </div>
              
              <div>
                <Label htmlFor="manual-nombre">Nombres</Label>
                <Input
                  id="manual-nombre"
                  value={manualData.nombre}
                  onChange={(e) => setManualData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombres"
                />
              </div>
              
              <div>
                <Label htmlFor="manual-apellido">Apellidos</Label>
                <Input
                  id="manual-apellido"
                  value={manualData.apellido}
                  onChange={(e) => setManualData(prev => ({ ...prev, apellido: e.target.value }))}
                  placeholder="Apellidos"
                />
              </div>
              
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualData.cedula || !manualData.nombre || !manualData.apellido}
                className="w-full gap-2"
                style={{ background: "var(--gradient-blue-form)" }}
              >
                <Edit className="h-4 w-4" />
                Usar Datos Manuales
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};