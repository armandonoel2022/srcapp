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
  console.log('🔍 CameraScanner render - isOpen:', isOpen);
  
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
    console.log('🔍 CameraScanner handleClose called');
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
    console.log('HandleStartCamera clicked!');
    try {
      await startCamera();
      console.log('StartCamera completed successfully');
    } catch (error) {
      console.error('Error in handleStartCamera:', error);
    }
  };

  const handleManualSubmit = () => {
    if (manualData.cedula && manualData.nombre && manualData.apellido) {
      onDataScanned(manualData);
      handleClose();
    }
  };

  // Log cuando el componente se renderiza
  console.log('🔍 CameraScanner - Dialog props:', { 
    open: isOpen, 
    onOpenChange: 'handleClose function' 
  });

  if (!isOpen) {
    console.log('🔍 CameraScanner - Modal not open, returning null');
    return null;
  }

  console.log('🔍 CameraScanner - Rendering modal');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Escanear Cédula</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cerrar
            </Button>
          </div>
          
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {!isCameraActive ? (
                <div className="text-center py-8">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Active la cámara para tomar una foto clara de la cédula.
                  </p>
                  <Button onClick={startCamera} className="gap-2">
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
                      <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        ✓ Documento capturado - Revise la calidad
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="text-amber-600 text-lg">🔍</div>
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          Verificación de calidad:
                        </p>
                        <p className="text-xs text-amber-800">
                          ¿Se puede leer claramente la cédula, nombre completo y apellidos en la imagen?
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={scanCapturedImage} 
                      disabled={isScanning}
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4" />
                      {isScanning ? 'Extrayendo datos...' : 'Extraer Información'}
                    </Button>
                    <Button variant="outline" onClick={retakePhoto} className="gap-2">
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
                      muted
                      className="w-full h-80 object-cover"
                    />
                    {/* Camera Frame Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="absolute inset-0 bg-black/60"></div>
                      
                      <div className="relative">
                        <div 
                          className="border-2 border-blue-500 bg-transparent rounded-lg"
                          style={{
                            width: '280px',
                            height: '177px',
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                          }}
                        >
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
                          
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Coloque la cédula dentro del marco
                            </span>
                          </div>
                          
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                            <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                              📱 Detección automática activada
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 text-lg">💡</div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Consejos para el mejor escaneo:
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Coloque la cédula completamente dentro del marco azul</li>
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
                      onClick={capturePhoto} 
                      className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
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
                  className="w-full gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <Edit className="h-4 w-4" />
                  Usar Datos Manuales
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
