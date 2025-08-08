import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, QrCode, Key, CheckCircle } from 'lucide-react';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const TwoFactorSetup = ({ isOpen, onClose, onComplete }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const mockQRCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  const secretKey = "ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567";

  const handleSetupComplete = () => {
    setStep('verify');
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Por favor ingresa un código de 6 dígitos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate verification (in real app, verify with backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock backup codes
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
    setStep('complete');
    setLoading(false);

    toast({
      title: "2FA configurado exitosamente",
      description: "La verificación en dos pasos ha sido activada en tu cuenta"
    });
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    setStep('setup');
    setVerificationCode('');
    setBackupCodes([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado al portapapeles"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurar Verificación en Dos Pasos
          </DialogTitle>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Paso 1: Escanear código QR
                </CardTitle>
                <CardDescription>
                  Usa una app como Google Authenticator o Authy para escanear este código QR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={mockQRCode} 
                    alt="QR Code" 
                    className="w-32 h-32 border border-border rounded-lg bg-muted"
                  />
                </div>
                
                <div>
                  <Label htmlFor="secret-key">O ingresa la clave manualmente:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      id="secret-key"
                      value={secretKey}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(secretKey)}
                      className="px-3"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSetupComplete} className="w-full">
              Continuar a Verificación
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Paso 2: Verificar configuración
                </CardTitle>
                <CardDescription>
                  Ingresa el código de 6 dígitos que aparece en tu app de autenticación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="verification-code">Código de verificación:</Label>
                  <Input
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="123456"
                    className="text-center text-lg font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
                Atrás
              </Button>
              <Button 
                onClick={handleVerification} 
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  ¡Configuración completada!
                </CardTitle>
                <CardDescription>
                  Guarda estos códigos de respaldo en un lugar seguro. Puedes usarlos si pierdes acceso a tu dispositivo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-xs text-center py-1">
                      {code}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full"
                >
                  Copiar Códigos de Respaldo
                </Button>
              </CardContent>
            </Card>

            <Button onClick={handleComplete} className="w-full">
              Finalizar Configuración
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};