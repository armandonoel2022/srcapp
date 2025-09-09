import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useSettings } from '@/contexts/SettingsContext';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface GeolocationError {
  message: string;
  code?: number;
}

export const useGeolocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const { geolocationEnabled } = useSettings();

  const getCurrentPosition = async (): Promise<GeolocationData | null> => {
    setIsLoading(true);
    setError(null);

    if (!geolocationEnabled) {
      setError({ message: 'La geolocalización está deshabilitada en configuración' });
      setIsLoading(false);
      return null;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        console.log('📍 Using Capacitor Geolocation for mobile...');

        // 1. Primero verificar permisos
        let permissions;
        try {
          permissions = await Geolocation.checkPermissions();
          console.log('📍 Permission status:', permissions.location);
        } catch (error) {
          console.warn('📍 Error checking permissions:', error);
        }

        // 2. Si no tenemos permisos granted, solicitarlos
        if (!permissions || permissions.location !== 'granted') {
          console.log('📍 Requesting location permissions...');
          try {
            permissions = await Geolocation.requestPermissions();
            console.log('📍 Permission request result:', permissions.location);
            
            // Pequeña pausa después de solicitar permisos
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (requestError) {
            console.warn('📍 Permission request failed:', requestError);
            // Continuar a pesar del error, puede que los permisos ya estén granted
          }
        }

        // 3. Verificar permisos finales
        const finalPermissions = await Geolocation.checkPermissions();
        console.log('📍 Final permission status:', finalPermissions.location);

        if (finalPermissions.location !== 'granted') {
          if (finalPermissions.location === 'denied') {
            throw new Error('PERMISSION_DENIED');
          } else {
            throw new Error('INSUFFICIENT_PERMISSIONS');
          }
        }

        // 4. Intentar obtener ubicación con timeout
        console.log('📍 Attempting to get position...');
        
        const position = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Geolocation timeout'));
          }, 20000);

          Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          })
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout));
        });

        console.log('📍 Position obtained successfully');
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

      } else {
        // Web geolocation
        console.log('📍 Using web geolocation for browser...');
        
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      }
    } catch (err: any) {
      console.error('Geolocation error:', err);
      
      let errorMessage = 'Error al obtener la ubicación';
      
      if (err.message === 'PERMISSION_DENIED') {
        errorMessage = 'Permisos de ubicación denegados. Active la ubicación en Configuración > Privacidad > Ubicación > SRC App y seleccione "While Using".';
      } else if (err.message === 'INSUFFICIENT_PERMISSIONS') {
        errorMessage = 'Permisos de ubicación insuficientes. La app necesita acceso "While Using" para funcionar correctamente.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Tiempo de espera agotado. Verifique que el GPS esté activado.';
      } else if (err.code === 1) {
        errorMessage = 'Permiso de ubicación denegado. Active la ubicación en Configuración.';
      } else if (err.code === 2) {
        errorMessage = 'Posición no disponible. Verifique su conexión y GPS.';
      } else if (err.code === 3) {
        errorMessage = 'Tiempo de espera agotado. Intente nuevamente.';
      }

      setError({ message: errorMessage, code: err.code });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationSettingsInstructions = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      return "Vaya a Configuración > Privacidad > Ubicación > SRC App y seleccione 'While Using'.";
    }
    return "Active los permisos de ubicación en su navegador.";
  }, []);

  return {
    getCurrentPosition,
    isLoading,
    error,
    getLocationSettingsInstructions
  };
};