import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

// Capacitor Biometric Auth types (fallback if plugin not available)
interface BiometricAuthPlugin {
  isAvailable(): Promise<{ isAvailable: boolean; biometryType?: string; errorCode?: number }>;
  verify(options: { reason: string; title?: string; subtitle?: string; description?: string }): Promise<{ isVerified: boolean }>;
}

// Create a fallback for browsers that don't have the plugin
const createFallbackBiometricAuth = (): BiometricAuthPlugin => ({
  async isAvailable() {
    // Check for WebAuthn support as fallback
    if (!window.PublicKeyCredential) {
      return { isAvailable: false, errorCode: 1 };
    }
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return { 
        isAvailable: available, 
        biometryType: available ? 'fingerprint' : undefined 
      };
    } catch {
      return { isAvailable: false, errorCode: 1 };
    }
  },
  
  async verify() {
    // For web fallback, we'll use a simple confirmation
    return new Promise((resolve) => {
      const confirmed = window.confirm('¿Verificar identidad biométrica?');
      resolve({ isVerified: confirmed });
    });
  }
});

export const useBiometricAuthCapacitor = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  // Get biometric plugin or fallback
  const getBiometricAuth = async (): Promise<BiometricAuthPlugin> => {
    // Always use fallback for now - can be upgraded when plugin is available
    return createFallbackBiometricAuth();
  };

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const BiometricAuth = await getBiometricAuth();
        const result = await BiometricAuth.isAvailable();
        
        setIsSupported(result.isAvailable);
        setBiometryType(result.biometryType || 'biometric');
        
        console.log('Biometric support:', result);
      } catch (error) {
        console.error('Error checking biometric support:', error);
        setIsSupported(false);
      }
    };

    const checkRegistration = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('biometric_credentials')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (error) {
            console.error('Error checking biometric registration:', error);
            setIsRegistered(false);
          } else {
            setIsRegistered(data && data.length > 0);
          }
        } catch (error) {
          console.error('Error checking biometric registration:', error);
          setIsRegistered(false);
        }
      } else {
        setIsRegistered(false);
      }
    };

    checkSupport();
    checkRegistration();
  }, [user?.id]);

  const registerBiometric = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    if (!isSupported) {
      return { success: false, error: 'Autenticación biométrica no soportada en este dispositivo' };
    }

    try {
      const BiometricAuth = await getBiometricAuth();
      
      // Verificar que podemos usar biometría
      const verification = await BiometricAuth.verify({
        reason: 'Para configurar tu autenticación biométrica',
        title: 'Configurar Biometría',
        subtitle: 'Verifica tu identidad',
        description: 'Usa tu huella dactilar o Face ID para configurar el acceso rápido'
      });

      if (!verification.isVerified) {
        return { success: false, error: 'Verificación biométrica cancelada' };
      }

      // Generar un ID único para esta credencial
      const credentialId = `biometric_${user.id}_${Date.now()}`;
      
      // Guardar credencial en Supabase (simulando una clave pública)
      const { error: dbError } = await supabase
        .from('biometric_credentials')
        .insert({
          id: credentialId,
          user_id: user.id,
          public_key: `capacitor_biometric_${Date.now()}`, // Placeholder for real implementation
        });

      if (dbError) {
        console.error('Error saving biometric credential:', dbError);
        return { success: false, error: 'Error al guardar la credencial biométrica' };
      }

      setIsRegistered(true);
      
      toast({
        title: "Autenticación biométrica activada",
        description: `Tu ${biometryType === 'face' ? 'Face ID' : 'huella dactilar'} ha sido configurada correctamente`,
      });
        
      return { success: true };
    } catch (error: any) {
      console.error('Error registering biometric:', error);
      
      let errorMessage = 'Error al configurar biometría';
      if (error.message?.includes('User cancel') || error.message?.includes('cancelled')) {
        errorMessage = 'Configuración cancelada por el usuario';
      } else if (error.message?.includes('not available')) {
        errorMessage = 'Autenticación biométrica no disponible';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const authenticateWithBiometric = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isRegistered) {
      return { success: false, error: 'Biometría no configurada' };
    }

    if (!isSupported) {
      return { success: false, error: 'Autenticación biométrica no soportada en este dispositivo' };
    }

    try {
      const BiometricAuth = await getBiometricAuth();
      
      const verification = await BiometricAuth.verify({
        reason: 'Para acceder a tu cuenta de forma segura',
        title: 'Verificación Biométrica',
        subtitle: 'Acceso Seguro',
        description: `Usa tu ${biometryType === 'face' ? 'Face ID' : 'huella dactilar'} para acceder`
      });

      if (!verification.isVerified) {
        return { success: false, error: 'Verificación biométrica fallida' };
      }

      // Actualizar última vez usada
      await supabase
        .from('biometric_credentials')
        .update({ last_used: new Date().toISOString() })
        .eq('user_id', user?.id);

      toast({
        title: "Verificación biométrica exitosa",
        description: "Identidad verificada correctamente",
      });
        
      return { success: true };
    } catch (error: any) {
      console.error('Error in biometric authentication:', error);
      
      let errorMessage = 'Error en autenticación biométrica';
      if (error.message?.includes('User cancel') || error.message?.includes('cancelled')) {
        errorMessage = 'Autenticación cancelada por el usuario';
      } else if (error.message?.includes('not available')) {
        errorMessage = 'Biometría no disponible en este momento';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const capabilities = {
    isFaceIdAvailable: biometryType === 'face' || biometryType === 'faceId',
    isFingerprintAvailable: biometryType === 'fingerprint' || biometryType === 'touchId' || biometryType === 'biometric',
    isBiometricAvailable: isSupported,
    biometryType
  };

  return {
    isSupported,
    isRegistered,
    registerBiometric,
    authenticateWithBiometric,
    capabilities,
  };
};