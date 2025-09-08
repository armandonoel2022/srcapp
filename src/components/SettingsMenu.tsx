import { useState } from 'react';  
import { Button } from '@/components/ui/button';  
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';  
import { Label } from '@/components/ui/label';  
import { Switch } from '@/components/ui/switch';  
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';  
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';  
import { Badge } from '@/components/ui/badge';  
import { Settings, Palette, MapPin, Shield, Fingerprint } from 'lucide-react';  
import { useSettings } from '@/contexts/SettingsContext';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useToast } from '@/hooks/use-toast';
  
export const SettingsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {   
    theme,   
    setTheme,   
    geolocationEnabled,   
    setGeolocationEnabled,  
    biometricEnabled,  
    setBiometricEnabled  
  } = useSettings();
  const { registerBiometric, capabilities } = useBiometricAuth();
  const { toast } = useToast();
  
  const handleBiometricToggle = async (enabled: boolean) => {  
    if (enabled) {  
      try {  
        const result = await registerBiometric();  
        if (result.success) {  
          setBiometricEnabled(true);  
        }  
      } catch (error) {  
        toast({  
          title: "Error",  
          description: "No se pudo activar la autenticación biométrica",  
          variant: "destructive",  
        });  
      }  
    } else {  
      setBiometricEnabled(false);  
      localStorage.setItem('biometricEnabled', 'false');  
      toast({  
        title: "Autenticación biométrica desactivada",  
        description: "Se ha desactivado el acceso biométrico",  
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
          <Card className="border-none shadow-xl">  
            <CardHeader className="pb-3">  
              <div className="flex items-center gap-3">  
                <div className="p-2 bg-blue-100 rounded-lg">  
                  <Palette className="h-5 w-5 text-blue-600" />  
                </div>  
                <div>  
                  <CardTitle className="text-lg">Apariencia</CardTitle>  
                  <CardDescription>  
                    Personaliza el tema de la aplicación  
                  </CardDescription>  
                </div>  
              </div>  
            </CardHeader>  
            <CardContent className="pt-0">  
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
              </div>  
            </CardContent>  
          </Card>  
  
          {/* Location Settings */}  
          <Card className="border-none shadow-xl">  
            <CardHeader className="pb-3">  
              <div className="flex items-center gap-3">  
                <div className="p-2 bg-orange-100 rounded-lg">  
                  <MapPin className="h-5 w-5 text-orange-600" />  
                </div>  
                <div>  
                  <CardTitle className="text-lg">Ubicación</CardTitle>  
                  <CardDescription>  
                    Controla el acceso a tu ubicación  
                  </CardDescription>  
                </div>  
              </div>  
            </CardHeader>  
            <CardContent className="pt-0">  
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">  
                <div className="flex items-center gap-3">  
                  <MapPin className="h-5 w-5 text-orange-600" />  
                  <div>  
                    <p className="font-medium text-sm">Geolocalización</p>  
                    <p className="text-xs text-muted-foreground">  
                      Para el mapa de calor  
                    </p>  
                  </div>  
                </div>  
                <Switch   
                  checked={geolocationEnabled}   
                  onCheckedChange={setGeolocationEnabled}  
                />  
              </div>  
            </CardContent>  
          </Card>  
  
          {/* Biometric Authentication */}  
          <Card className="border-none shadow-xl">  
            <CardHeader className="pb-3">  
              <div className="flex items-center gap-3">  
                <div className="p-2 bg-green-100 rounded-lg">  
                  <Fingerprint className="h-5 w-5 text-green-600" />  
                </div>  
                <div>  
                   <CardTitle className="text-lg">
                     {capabilities?.isFaceIdAvailable && capabilities?.isFingerprintAvailable 
                       ? "Autenticación Rostro/Huella" 
                       : capabilities?.isFaceIdAvailable 
                         ? "Autenticación Facial" 
                         : "Autenticación Biométrica"
                     }
                   </CardTitle>
                   <CardDescription>
                     {capabilities?.isFaceIdAvailable && capabilities?.isFingerprintAvailable 
                       ? "Usa tu rostro o huella dactilar para acceder" 
                       : capabilities?.isFaceIdAvailable 
                         ? "Usa tu rostro para acceder" 
                         : "Usa tu huella dactilar para acceder"
                     }
                   </CardDescription>
                </div>  
              </div>  
            </CardHeader>  
            <CardContent className="pt-0">  
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">  
                <div className="flex items-center gap-3">  
                  <Fingerprint className="h-5 w-5 text-green-600" />  
                  <div>  
                     <p className="font-medium text-sm">
                       {capabilities?.isFaceIdAvailable && capabilities?.isFingerprintAvailable 
                         ? "Acceso Rostro/Huella" 
                         : capabilities?.isFaceIdAvailable 
                           ? "Acceso Facial" 
                           : "Acceso Biométrico"
                       }
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {capabilities?.isFaceIdAvailable && capabilities?.isFingerprintAvailable 
                         ? "Desbloquea con rostro o huella" 
                         : capabilities?.isFaceIdAvailable 
                           ? "Desbloquea con tu rostro" 
                           : "Desbloquea con huella dactilar"
                       }
                     </p>
                  </div>  
                </div>  
                <Switch  
                  checked={biometricEnabled}  
                  onCheckedChange={handleBiometricToggle}  
                />  
              </div>  
            </CardContent>  
          </Card>  
   
          {/* About */}  
          <Card className="border-none shadow-xl">  
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
    </Sheet>  
  );  
};