import { useState, useEffect } from 'react';  
import { useToast } from '@/hooks/use-toast';  
  
export const useBiometricAuth = () => {  
  const [isSupported, setIsSupported] = useState(false);  
  const [isRegistered, setIsRegistered] = useState(false);  
  const { toast } = useToast();  
  
  useEffect(() => {  
    // Verificar si la biometría está habilitada  
    const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';  
    setIsRegistered(biometricEnabled);  
    setIsSupported(true); // Simplificado - siempre soportado  
  }, []);  
  
  const registerBiometric = async (): Promise<{ success: boolean; error?: string }> => {  
    try {  
      localStorage.setItem('biometricEnabled', 'true');  
      setIsRegistered(true);  
        
      toast({  
        title: "Autenticación biométrica activada",  
        description: "Ahora puedes usar tu huella dactilar o Face ID para acceder",  
      });  
        
      return { success: true };  
    } catch (error) {  
      toast({  
        title: "Error",  
        description: "No se pudo activar la autenticación biométrica",  
        variant: "destructive",  
      });  
      return { success: false, error: 'Error al configurar biometría' };  
    }  
  };  
  
  const authenticateWithBiometric = async (): Promise<{ success: boolean; error?: string }> => {  
    if (!isRegistered) {  
      return { success: false, error: 'Biometría no configurada' };  
    }  
  
    try {  
      // Simulación de autenticación biométrica exitosa  
      toast({  
        title: "Autenticación exitosa",  
        description: "Has sido autenticado correctamente",  
      });  
        
      return { success: true };  
    } catch (error) {  
      return { success: false, error: 'Error en autenticación biométrica' };  
    }  
  };  
  
  const capabilities = {
    isFaceIdAvailable: true, // Simulated for web
    isFingerprintAvailable: true, // Simulated for web
    isBiometricAvailable: true
  };

  return {
    isSupported,
    isRegistered,
    registerBiometric,
    authenticateWithBiometric,
    capabilities,
  };
};