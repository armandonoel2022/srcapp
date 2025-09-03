import { useState, useEffect } from 'react';  
import { useToast } from '@/hooks/use-toast';  
import { supabase } from '@/integrations/supabase/client';  

declare global {  
  interface AuthenticatorAttestationResponse extends AuthenticatorResponse {  
    publicKey: ArrayBuffer;  
  }  
}
  
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
  
interface BiometricCredential {  
  id: string;  
  publicKey: string;  
  userId: string;  
  created_at: string;  
}  
  
export const useBiometricAuth = () => {  
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({  
    isBiometricAvailable: false,  
    supportedTypes: [],  
    deviceInfo: null  
  });  
  const [isChecking, setIsChecking] = useState(false);  
  const [isRegistered, setIsRegistered] = useState(false);  
  const { toast } = useToast();  
  
  useEffect(() => {  
    checkBiometricCapabilities();  
  }, []);  
  
  const checkBiometricCapabilities = async () => {  
    setIsChecking(true);  
    console.log('Checking biometric capabilities...');  
    try {  
      // Simple device detection  
      const deviceInfo: DeviceInfo = {  
        platform: /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' :   
                 /Android/.test(navigator.userAgent) ? 'android' : 'web',  
        isNative: false // For now, assume web  
      };  
      console.log('Device info:', deviceInfo);  
        
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
        
      console.log('Biometric capabilities set:', { isBiometricAvailable, supportedTypes, deviceInfo });  
  
      // Verificar si ya hay credenciales registradas  
      await checkExistingCredentials();  
  
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
  
  const checkExistingCredentials = async () => {  
    try {  
      const { data: { user } } = await supabase.auth.getUser();  
      if (!user) return;  
  
      // Primero verificar en localStorage (para desarrollo/demo)
      const hasLocalStorageCredential = localStorage.getItem('biometric_registered') === 'true';
      
      if (hasLocalStorageCredential) {
        setIsRegistered(true);
        return;
      }
  
      // Luego verificar en la base de datos
      const { data } = await supabase  
        .from('biometric_credentials')  
        .select('id')  
        .eq('user_id', user.id)  
        .maybeSingle();  
        
      setIsRegistered(!!data);  
    } catch (error) {  
      console.error('Error checking existing credentials:', error);  
    }  
  };  
  
  const registerBiometric = async (): Promise<{ success: boolean; error?: string }> => {  
    if (!capabilities.isBiometricAvailable) {  
      return { success: false, error: 'Biometría no soportada' };  
    }  
  
    try {  
      const { data: { user } } = await supabase.auth.getUser();  
      if (!user) {  
        return { success: false, error: 'Usuario no autenticado' };  
      }  
  
      const challenge = crypto.getRandomValues(new Uint8Array(32));  
        
      const credential = await navigator.credentials.create({  
        publicKey: {  
          challenge,  
          rp: {   
            name: "SRC App",  
            id: window.location.hostname   
          },  
          user: {   
            id: new TextEncoder().encode(user.id),  
            name: user.email || '',  
            displayName: user.email || ''  
          },  
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],  
          authenticatorSelection: {   
            authenticatorAttachment: "platform",  
            userVerification: "required"  
          },  
          timeout: 60000,  
          attestation: "direct"  
        }  
      }) as PublicKeyCredential;  
  
      if (!credential) throw new Error('No se pudo crear la credencial');  
  
      // Cast correcto al tipo específico  
      const response = credential.response as AuthenticatorAttestationResponse;  
        
      if (!response.publicKey) {  
        throw new Error('No se pudo obtener la clave pública');  
      }  
  
      // Ahora puedes acceder a publicKey sin errores  
      const publicKeyArray = new Uint8Array(response.publicKey);  
      const publicKeyString = btoa(String.fromCharCode(...publicKeyArray));  
  
      // Guardar credencial en la base de datos (comentado hasta que se cree la tabla)  
      /*  
      const { error } = await supabase  
        .from('biometric_credentials')  
        .insert({  
          id: credential.id,  
          user_id: user.id,  
          public_key: publicKeyString,  
          created_at: new Date().toISOString()  
        });  
  
      if (error) throw error;  
      */  
  
      // Usar localStorage temporalmente  
      localStorage.setItem('biometric_registered', 'true');  
      localStorage.setItem('biometric_credential_id', credential.id);  
      localStorage.setItem('biometric_public_key', publicKeyString);  
  
      setIsRegistered(true);  
      toast({  
        title: "Biometría configurada",  
        description: "Autenticación biométrica configurada exitosamente"  
      });  
        
      return { success: true };  
    } catch (error: any) {  
      console.error('Error registering biometric:', error);  
      toast({  
        title: "Error",  
        description: `Error al configurar biometría: ${error.message}`,  
        variant: "destructive"  
      });  
      return { success: false, error: error.message };  
    }  
  };  
  
  const authenticateWithBiometric = async (): Promise<{ success: boolean; credentialId?: string; error?: string }> => {  
    if (!capabilities.isBiometricAvailable) {  
      toast({  
        title: "Autenticación biométrica no disponible",  
        description: "Tu dispositivo no soporta autenticación biométrica",  
        variant: "destructive"  
      });  
      return { success: false, error: 'No disponible' };  
    }  
  
    if (!isRegistered) {  
      toast({  
        title: "Biometría no configurada",  
        description: "Primero debes configurar la autenticación biométrica",  
        variant: "destructive"  
      });  
      return { success: false, error: 'No configurada' };  
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
        return { success: false, error: 'En desarrollo' };  
      }  
    } catch (error: any) {  
      console.error('Biometric authentication error:', error);  
      toast({  
        title: "Error de autenticación",  
        description: "No se pudo completar la autenticación biométrica",  
        variant: "destructive"  
      });  
      return { success: false, error: error.message };  
    }  
  };  
  
  const authenticateWithWebAuthn = async (): Promise<{ success: boolean; credentialId?: string; error?: string }> => {  
    try {  
      if (!window.PublicKeyCredential) {  
        throw new Error('WebAuthn no soportado');  
      }  
  
      // Obtener credenciales existentes del usuario actual  
      const { data: { user } } = await supabase.auth.getUser();  
      if (!user) throw new Error('Usuario no autenticado');  
  
      // Primero verificar en localStorage (para desarrollo/demo)
      const credentialId = localStorage.getItem('biometric_credential_id');
      const publicKey = localStorage.getItem('biometric_public_key');
      
      if (credentialId && publicKey) {
        // Usar credencial de localStorage para autenticación
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [{
              id: new TextEncoder().encode(credentialId),
              type: "public-key" as const
            }],
            userVerification: "required",
            timeout: 60000
          }
        }) as PublicKeyCredential;
  
        if (!assertion) {
          throw new Error('Autenticación fallida');
        }
  
        toast({  
          title: "Autenticación exitosa",  
          description: "Has sido autenticado correctamente",  
        });  
          
        return { success: true, credentialId: assertion.id };
      }
  
      // Si no hay en localStorage, verificar en base de datos
      const { data: credentials } = await supabase  
        .from('biometric_credentials')  
        .select('id, public_key')  
        .eq('user_id', user.id);  
  
      if (!credentials?.length) {  
        throw new Error('No hay credenciales registradas');  
      }  
  
      const challenge = crypto.getRandomValues(new Uint8Array(32));  
        
      const assertion = await navigator.credentials.get({  
        publicKey: {  
          challenge,  
          allowCredentials: credentials.map(cred => ({  
            id: new TextEncoder().encode(cred.id),  
            type: "public-key" as const  
          })),  
          userVerification: "required",  
          timeout: 60000  
        }  
      }) as PublicKeyCredential;  
  
      if (!assertion) {  
        throw new Error('Autenticación fallida');  
      }  
  
      // Actualizar última vez usado  
      await supabase  
        .from('biometric_credentials')  
        .update({ last_used: new Date().toISOString() })  
        .eq('id', assertion.id);  
  
      toast({  
        title: "Autenticación exitosa",  
        description: "Has sido autenticado correctamente",  
      });  
        
      return { success: true, credentialId: assertion.id };  
    } catch (error: any) {  
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
    isRegistered,  
    authenticateWithBiometric,  
    registerBiometric,  
    getBiometricDisplayName,  
    refreshCapabilities: checkBiometricCapabilities,  
    checkExistingCredentials  
  };  
};