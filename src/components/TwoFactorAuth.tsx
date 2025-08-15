import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Smartphone, Key } from 'lucide-react';

interface TwoFactorAuthProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

export const TwoFactorAuth = ({ onSetupComplete, onCancel }: TwoFactorAuthProps) => {
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft' | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleProviderSelect = (provider: 'google' | 'microsoft') => {
    setSelectedProvider(provider);
    
    // Show instructions for manual setup
    const qrCode = generateQRCode();
    const secretKey = generateSecretKey();
    
    toast({
      title: "Configuración 2FA",
      description: `Abre tu app ${provider === 'google' ? 'Google Authenticator' : 'Microsoft Authenticator'} y escanea el código QR o ingresa manualmente la clave secreta.`,
      duration: 10000
    });
  };

  const generateQRCode = () => {
    // In a real implementation, this would generate an actual QR code
    // For now, we'll show instructions
    return "otpauth://totp/SRC-App:user@src.com?secret=JBSWY3DPEHPK3PXP&issuer=SRC-App";
  };

  const generateSecretKey = () => {
    // In a real implementation, this would be generated server-side
    return "JBSWY3DPEHPK3PXP";
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Ingresa un código de 6 dígitos",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Simulate verification - in real app, this would verify with server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, accept any 6-digit code
      if (/^\d{6}$/.test(verificationCode)) {
        toast({
          title: "2FA Configurado",
          description: "Autenticación de dos factores configurada exitosamente"
        });
        onSetupComplete();
      } else {
        throw new Error("Código inválido");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Código de verificación incorrecto",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!selectedProvider) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configurar Autenticación de Dos Factores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecciona tu aplicación de autenticación preferida:
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="h-16 flex flex-col gap-2"
              onClick={() => handleProviderSelect('google')}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="font-medium">Google Authenticator</span>
              </div>
              <span className="text-xs text-muted-foreground">Recomendado para Android</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex flex-col gap-2"
              onClick={() => handleProviderSelect('microsoft')}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="font-medium">Microsoft Authenticator</span>
              </div>
              <span className="text-xs text-muted-foreground">Recomendado para iOS/iPhone</span>
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Configurar {selectedProvider === 'google' ? 'Google' : 'Microsoft'} Authenticator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Instrucciones:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Abre la app {selectedProvider === 'google' ? 'Google' : 'Microsoft'} Authenticator</li>
            <li>Toca el botón "+" para agregar una cuenta</li>
            <li>Selecciona "Escanear código QR" o "Introducir código manualmente"</li>
            <li>Usa la clave secreta: <code className="bg-background px-1 rounded">JBSWY3DPEHPK3PXP</code></li>
            <li>Ingresa el código de 6 dígitos que aparece en tu app</li>
          </ol>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="verification-code">Código de verificación</Label>
          <Input
            id="verification-code"
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-lg tracking-widest"
            maxLength={6}
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleVerification}
            disabled={isVerifying || verificationCode.length !== 6}
          >
            {isVerifying ? "Verificando..." : "Verificar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};