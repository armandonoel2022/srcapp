import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, MapPin, Shield, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { TwoFactorSetup } from '@/components/TwoFactorSetup';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export const SettingsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMapboxToken, setShowMapboxToken] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const { 
    theme, 
    setTheme, 
    geolocationEnabled, 
    setGeolocationEnabled,
    twoFactorEnabled,
    setTwoFactorEnabled,
    mapboxToken,
    setMapboxToken
  } = useSettings();
  const { toast } = useToast();
  const { capabilities, authenticateWithBiometric, getBiometricDisplayName } = useBiometricAuth();

  const handleMapboxTokenChange = (value: string) => {
    setMapboxToken(value);
    if (value) {
      toast({
        title: "Token guardado",
        description: "El token de Mapbox ha sido guardado correctamente"
      });
    }
  };

  const handleOAuthLogin = (provider: string) => {
    toast({
      title: "Función en desarrollo",
      description: `La autenticación con ${provider} estará disponible próximamente`,
    });
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!capabilities.isBiometricAvailable) {
        toast({
          title: "Función no disponible",
          description: "Tu dispositivo no soporta autenticación biométrica",
          variant: "destructive"
        });
        return;
      }
      
      const success = await authenticateWithBiometric();
      if (success) {
        setBiometricEnabled(true);
        toast({
          title: "Autenticación biométrica activada",
          description: "Podrás usar tu biometría para acceder a la aplicación",
        });
      }
    } else {
      setBiometricEnabled(false);
      toast({
        title: "Autenticación biométrica desactivada",
        description: "Se ha deshabilitado el acceso biométrico",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Settings className="h-5 w-5" />
          Configuración
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-select">Tema</Label>
                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                  <SelectTrigger id="theme-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Elige entre tema claro, oscuro o seguir la configuración del sistema
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir geolocalización</Label>
                  <p className="text-xs text-muted-foreground">
                    Permite que la aplicación acceda a tu ubicación para el mapa de calor
                  </p>
                </div>
                <Switch 
                  checked={geolocationEnabled} 
                  onCheckedChange={setGeolocationEnabled}
                />
              </div>
            </CardContent>
          </Card>


          {/* Security Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Acceso con {getBiometricDisplayName()}</Label>
                  <p className="text-xs text-muted-foreground">
                    {capabilities.isBiometricAvailable 
                      ? `Usa ${getBiometricDisplayName().toLowerCase()} para acceder rápidamente`
                      : 'Función no disponible en este dispositivo'
                    }
                  </p>
                </div>
                <Switch 
                  checked={biometricEnabled && capabilities.isBiometricAvailable} 
                  onCheckedChange={handleBiometricToggle}
                  disabled={!capabilities.isBiometricAvailable}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verificación en dos pasos</Label>
                  <p className="text-xs text-muted-foreground">
                    Añade una capa extra de seguridad a tu cuenta
                  </p>
                </div>
                <Switch 
                  checked={twoFactorEnabled} 
                  onCheckedChange={(enabled) => {
                    if (enabled && !twoFactorEnabled) {
                      setShowTwoFactorSetup(true);
                    } else {
                      setTwoFactorEnabled(enabled);
                    }
                  }}
                />
              </div>
              
              {twoFactorEnabled && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="text-sm font-medium">Proveedores de autenticación</p>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleOAuthLogin('Google')}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Autenticar con Google
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleOAuthLogin('Microsoft')}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                      </svg>
                      Autenticar con Microsoft
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Seguridad Residencial y Comercial S.R.L.
                </p>
                <p className="text-xs text-muted-foreground">
                  Versión 1.0.0
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
      
      <TwoFactorSetup
        isOpen={showTwoFactorSetup}
        onClose={() => setShowTwoFactorSetup(false)}
        onComplete={() => setTwoFactorEnabled(true)}
      />
    </Sheet>
  );
};