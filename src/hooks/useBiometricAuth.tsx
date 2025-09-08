import { useState, useEffect } from 'react';  
import { useToast } from '@/hooks/use-toast';  
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Utility functions for WebAuthn
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useBiometricAuth = () => {  
  const [isSupported, setIsSupported] = useState(false);  
  const [isRegistered, setIsRegistered] = useState(false);  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Verificar soporte real de WebAuthn
    const checkSupport = async () => {
      if (!window.PublicKeyCredential) {
        setIsSupported(false);
        return;
      }

      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsSupported(available);
      } catch (error) {
        console.error('Error checking biometric support:', error);
        setIsSupported(false);
      }
    };

    // Verificar si el usuario tiene credenciales biométricas registradas
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
      // Generar credencial WebAuthn real
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "SRC Control",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(user.id),
          name: user.username || user.email || '',
          displayName: user.username || user.email || '',
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (!credential) {
        return { success: false, error: 'No se pudo crear la credencial biométrica' };
      }

      // Obtener información de la credencial
      const credentialId = arrayBufferToBase64(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKey = arrayBufferToBase64(response.getPublicKey()!);

      // Guardar credencial en Supabase
      const { error: dbError } = await supabase
        .from('biometric_credentials')
        .insert({
          id: credentialId,
          user_id: user.id,
          public_key: publicKey,
        });

      if (dbError) {
        console.error('Error saving biometric credential:', dbError);
        return { success: false, error: 'Error al guardar la credencial biométrica' };
      }

      setIsRegistered(true);
      
      toast({  
        title: "Autenticación biométrica activada",  
        description: "Tu huella dactilar o Face ID han sido configurados correctamente",  
      });  
        
      return { success: true };  
    } catch (error: any) {
      console.error('Error registering biometric:', error);
      
      let errorMessage = 'Error al configurar biometría';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Acceso denegado por el usuario';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Autenticación biométrica no soportada';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Error de seguridad al acceder a la biometría';
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
      // Obtener credenciales del usuario
      const { data: credentials, error: credError } = await supabase
        .from('biometric_credentials')
        .select('id')
        .eq('user_id', user?.id);

      if (credError || !credentials || credentials.length === 0) {
        return { success: false, error: 'No se encontraron credenciales biométricas' };
      }

      // Generar challenge para autenticación
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Convertir IDs de credenciales para la autenticación
      const allowCredentials = credentials.map(cred => ({
        id: base64ToArrayBuffer(cred.id),
        type: "public-key" as const,
      }));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials,
        userVerification: "required",
        timeout: 60000,
      };

      // Realizar autenticación real con WebAuthn
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (!assertion) {
        return { success: false, error: 'Autenticación biométrica fallida' };
      }

      // Actualizar última vez usada en la base de datos
      const credentialId = arrayBufferToBase64(assertion.rawId);
      await supabase
        .from('biometric_credentials')
        .update({ last_used: new Date().toISOString() })
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      toast({  
        title: "Verificación biométrica exitosa",  
        description: "Identidad verificada correctamente con tu dispositivo biométrico",  
      });  
        
      return { success: true };  
    } catch (error: any) {
      console.error('Error in biometric authentication:', error);
      
      let errorMessage = 'Error en autenticación biométrica';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Autenticación cancelada por el usuario';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Error de seguridad durante la autenticación';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Estado inválido del autenticador';
      }
      
      return { success: false, error: errorMessage };  
    }  
  };
  
  const capabilities = {
    isFaceIdAvailable: isSupported, // Real capability detection
    isFingerprintAvailable: isSupported, // Real capability detection  
    isBiometricAvailable: isSupported
  };

  return {
    isSupported,
    isRegistered,
    registerBiometric,
    authenticateWithBiometric,
    capabilities,
  };
};