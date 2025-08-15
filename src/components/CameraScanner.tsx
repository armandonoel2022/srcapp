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
                    className="w-full h-80 object-contain"
                  />
                  <div className="absolute top-3 left-3 right-3 text-center">
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                      ✓ Documento capturado - Revise la calidad
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-600 dark:text-amber-400 text-lg">🔍</div>
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                        Verificación de calidad:
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        ¿Se puede leer claramente la cédula, nombre completo y apellidos en la imagen?
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleScan} 
                    disabled={isScanning}
                    className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <Check className="h-4 w-4" />
                    {isScanning ? 'Extrayendo datos...' : 'Extraer Información'}
                  </Button>
                  <Button variant="outline" onClick={handleRetake} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Repetir
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
                    className="w-full h-80 object-cover"
                  />
                  {/* Cedula Frame Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Dark overlay with cutout for cedula */}
                    <div className="absolute inset-0 bg-black/60"></div>
                    
                    {/* Cedula-shaped cutout (Dominican ID aspect ratio ~1.58:1) */}
                    <div className="relative">
                      <div 
                        className="border-2 border-primary bg-transparent rounded-lg"
                        style={{
                          width: '280px',
                          height: '177px', // 280/1.58 ≈ 177
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                        }}
                      >
                        {/* Corner guides */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br-lg"></div>
                        
                        {/* Instruction text */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center">
                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            Coloque la cédula dentro del marco
                          </span>
                        </div>
                        
                        {/* Auto-detect indicator */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                          <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
                            📱 Detección automática activada
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400 text-lg">💡</div>
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Consejos para el mejor escaneo:
                      </p>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Coloque la cédula completamente dentro del marco dorado</li>
                        <li>• Mantenga el documento plano y sin doblar</li>
                        <li>• Use buena iluminación, evite sombras y reflejos</li>
                        <li>• Espere a que el texto se vea nítido antes de capturar</li>
                        <li>• La cámara detectará automáticamente cuando esté lista</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCapture} 
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                    Capturar Cédula
                  </Button>
                  <Button variant="outline" onClick={stopCamera} className="gap-2">
                    <X className="h-4 w-4" />
                    Cancelar
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