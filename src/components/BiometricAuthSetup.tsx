import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useBiometricAuthCapacitor } from '@/hooks/useBiometricAuthCapacitor';

export const BiometricAuthSetup = () => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const { 
    isSupported, 
    isRegistered, 
    registerBiometric, 
    authenticateWithBiometric,
    capabilities 
  } = useBiometricAuthCapacitor();

  const handleRegister = async () => {
    setIsSettingUp(true);
    try {
      await registerBiometric();
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleTest = async () => {
    await authenticateWithBiometric();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticación Biométrica
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Estado actual */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado:</span>
            {isRegistered ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Configurada
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                No configurada
              </Badge>
            )}
          </div>

          {/* Capacidades disponibles */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Métodos disponibles:</h4>
            <div className="space-y-1 text-sm">
              {capabilities.isFingerprintAvailable && (
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-green-600" />
                  <span>Huella dactilar</span>
                </div>
              )}
              {capabilities.isFaceIdAvailable && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Face ID / Reconocimiento facial</span>
                </div>
              )}
            </div>
          </div>

          {/* Información */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {isRegistered 
                ? "La autenticación biométrica está activa. Puedes usarla para acceder rápidamente al sistema."
                : "Configura la autenticación biométrica para acceder más rápido y de forma segura al sistema."
              }
            </AlertDescription>
          </Alert>

          {/* Acciones */}
          <div className="space-y-2">
            {!isRegistered ? (
              <Button 
                onClick={handleRegister}
                disabled={!isSupported || isSettingUp}
                className="w-full"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                {isSettingUp ? 'Configurando...' : 'Configurar Autenticación Biométrica'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={handleTest}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Probar Autenticación
                </Button>
                
                <Button 
                  onClick={handleRegister}
                  variant="secondary"
                  className="w-full"
                  disabled={isSettingUp}
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {isSettingUp ? 'Reconfigurando...' : 'Reconfigurar'}
                </Button>
              </div>
            )}
          </div>

          {!isSupported && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                La autenticación biométrica no está disponible en este dispositivo o navegador.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};