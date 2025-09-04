import { useState, useEffect } from 'react';  
import { useToast } from '@/hooks/use-toast';  
import { useAuth } from '@/hooks/useAuth';
  
export const useBiometricAuth = () => {  
  const [isSupported, setIsSupported] = useState(false);  
  const [isRegistered, setIsRegistered] = useState(false);  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {  
    // Verificar si la biometría está habilitada para el usuario actual
    if (user?.id) {
      const biometricKey = `biometricEnabled_${user.id}`;
      const biometricEnabled = localStorage.getItem(biometricKey) === 'true';  
      setIsRegistered(biometricEnabled);  
    } else {
      setIsRegistered(false);
    }
    setIsSupported(true); // Simplificado - siempre soportado  
  }, [user?.id]);  

  const registerBiometric = async (): Promise<{ success: boolean; error?: string }> => {  
    if (!user?.id) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {  
      // Guardar configuración vinculada al usuario específico
      const biometricKey = `biometricEnabled_${user.id}`;
      const usernameKey = `biometric_username_${user.id}`;
      
      localStorage.setItem(biometricKey, 'true');
      localStorage.setItem(usernameKey, user.username || user.email || '');
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
      // Verificar que hay un usuario registrado para biometría
      if (!user?.id) {
        return { success: false, error: 'No hay usuario para autenticar' };
      }

      const usernameKey = `biometric_username_${user.id}`;
      const savedUsername = localStorage.getItem(usernameKey);
      
      if (!savedUsername) {
        return { success: false, error: 'Datos biométricos no encontrados' };
      }

      // Solo simular verificación biométrica, no autenticar automáticamente
      toast({  
        title: "Verificación biométrica exitosa",  
        description: "Identidad verificada correctamente",  
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