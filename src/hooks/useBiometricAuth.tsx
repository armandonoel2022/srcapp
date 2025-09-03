import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simple device detection without Capacitor for now
interface DeviceInfo {
  platform: string;
  isNative: boolean;
}

interface BiometricCapabilities {
  isBiometricAvailable: boolean;
  supportedTypes: string[];
  deviceInfo: DeviceInfo | null;
}

export const useBiometricAuth = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isBiometricAvailable: false,
    supportedTypes: [],
    deviceInfo: null
  });
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const checkBiometricCapabilities = async () => {
    setIsChecking(true);
    try {
      // Simple device detection
      const deviceInfo: DeviceInfo = {
        platform: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 
                 /Android/.test(navigator.userAgent) ? 'android' : 'web',
        isNative: false // For now, assume web
      };
      
      // Detectar capacidades biométricas basadas en el dispositivo
      let supportedTypes: string[] = [];
      let isBiometricAvailable = false;

      if (deviceInfo.platform === 'ios') {
        // iOS generalmente soporta Face ID y Touch ID
        supportedTypes = ['Face ID', 'Touch ID'];
        isBiometricAvailable = true;
      } else if (deviceInfo.platform === 'android') {
        // Android soporta huella digital y reconocimiento facial
        supportedTypes = ['Huella Digital', 'Reconocimiento Facial'];
        isBiometricAvailable = true;
      } else if (deviceInfo.platform === 'web') {
        // En web, verificar WebAuthn API
        if (window.PublicKeyCredential && 
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
          supportedTypes = ['Autenticación Web', 'Biométrica del Dispositivo'];
          isBiometricAvailable = true;
        } else {
          // Mostrar la opción aunque no esté disponible para demostración
          supportedTypes = ['Rostro/Huella'];
          isBiometricAvailable = true;
        }
      }

      setCapabilities({
        isBiometricAvailable,
        supportedTypes,
        deviceInfo
      });

    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setCapabilities({
        isBiometricAvailable: false,
        supportedTypes: [],
        deviceInfo: null
      });
    } finally {
      setIsChecking(false);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    if (!capabilities.isBiometricAvailable) {
      toast({
        title: "Autenticación biométrica no disponible",
        description: "Tu dispositivo no soporta autenticación biométrica",
        variant: "destructive"
      });
      return false;
    }

    try {
      if (capabilities.deviceInfo?.platform === 'web') {
        // Implementar WebAuthn para web
        return await authenticateWithWebAuthn();
      } else {
        // Para dispositivos móviles, mostrar mensaje de funcionalidad
        toast({
          title: "Funcionalidad en desarrollo",
          description: "La autenticación biométrica estará disponible en la próxima actualización",
        });
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      toast({
        title: "Error de autenticación",
        description: "No se pudo completar la autenticación biométrica",
        variant: "destructive"
      });
      return false;
    }
  };

  const authenticateWithWebAuthn = async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn no soportado');
      }

      // Crear una credencial básica para demostración
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32),
        allowCredentials: [],
        userVerification: 'preferred',
        timeout: 60000,
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (credential) {
        toast({
          title: "Autenticación exitosa",
          description: "Has sido autenticado correctamente",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('WebAuthn error:', error);
      throw error;
    }
  };

  const getBiometricDisplayName = (): string => {
    if (!capabilities.isBiometricAvailable) return 'No disponible';
    
    if (capabilities.supportedTypes.length === 0) return 'Biométrica';
    
    // Mostrar el primer tipo disponible o combinar si hay múltiples
    if (capabilities.supportedTypes.length === 1) {
      return capabilities.supportedTypes[0];
    }
    
    // Si hay Face ID y Touch ID, mostrar "Rostro/Huella"
    if (capabilities.supportedTypes.includes('Face ID') && capabilities.supportedTypes.includes('Touch ID')) {
      return 'Rostro/Huella';
    }
    
    // Si hay reconocimiento facial y huella digital
    if (capabilities.supportedTypes.includes('Reconocimiento Facial') && capabilities.supportedTypes.includes('Huella Digital')) {
      return 'Rostro/Huella';
    }
    
    return 'Rostro/Huella';
  };

  return {
    capabilities,
    isChecking,
    authenticateWithBiometric,
    getBiometricDisplayName,
    refreshCapabilities: checkBiometricCapabilities
  };
};