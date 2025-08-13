import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Scan } from 'lucide-react';
import { useIDScanner } from '@/hooks/useIDScanner';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataScanned: (data: { cedula: string; nombre: string; apellido: string }) => void;
}

export const CameraScanner = ({ isOpen, onClose, onDataScanned }: CameraScannerProps) => {
  const {
    isScanning,
    isCameraActive,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureAndScan
  } = useIDScanner();

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleScan = async () => {
    const data = await captureAndScan();
    if (data) {
      onDataScanned(data);
      handleClose();
    }
  };

  const handleStartCamera = async () => {
    await startCamera();
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
        
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {!isCameraActive ? (
            <div className="text-center py-8">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Para escanear la cédula, active la cámara y tome una foto clara del documento.
              </p>
              <Button onClick={handleStartCamera} className="gap-2">
                <Camera className="h-4 w-4" />
                Activar Cámara
              </Button>
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
                <div className="absolute inset-0 border-2 border-dashed border-white/50 m-8 rounded-lg pointer-events-none">
                  <div className="absolute top-2 left-2 right-2 text-center">
                    <span className="bg-black/50 text-white px-2 py-1 rounded text-sm">
                      Coloque la cédula dentro del marco
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning}
                  className="flex-1 gap-2"
                  style={{ background: "var(--gradient-blue-form)" }}
                >
                  <Scan className="h-4 w-4" />
                  {isScanning ? 'Procesando...' : 'Escanear Cédula'}
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
};