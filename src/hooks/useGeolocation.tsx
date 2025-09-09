import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useSettings } from '@/contexts/SettingsContext';

interface GeolocationData {
  latitude: number;
  longitude: number;
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

    // Verificar si la geolocalización está habilitada en configuración
    if (!geolocationEnabled) {
      const errorMessage = 'La geolocalización está deshabilitada en configuración';
      setError({ message: errorMessage });
      setIsLoading(false);
      return null;
    }

    try {
      // Check if running on mobile device with Capacitor
      if (Capacitor.isNativePlatform()) {
        console.log('📍 Using Capacitor Geolocation for mobile...');
        
        try {
          // En iOS, intentar obtener posición directamente primero con timeout corto
          console.log('📍 Attempting to get position directly...');
          
          try {
            // Timeout más corto para el primer intento, especialmente en iOS
            const positionPromise = Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 8000, // Timeout más corto para primer intento
              maximumAge: 30000, // Cache más corto para mejor precisión
            });
            
            // Timeout manual adicional para iOS
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                console.log('📍 First attempt timeout reached');
                reject(new Error('First attempt timeout'));
              }, 8000);
            });

            console.log('📍 Waiting for position or timeout...');
            const position = await Promise.race([positionPromise, timeoutPromise]) as any;
            
            // Verificar que sea una respuesta válida de posición
            if (position && position.coords && position.coords.latitude) {
              console.log('📍 Position obtained directly:', position.coords);

              return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
            } else {
              throw new Error('Invalid position response');
            }
          } catch (directPositionError) {
            console.log('📍 Direct position failed, requesting permissions...', directPositionError);
            
            // Solo si falla obtener posición directamente, solicitar permisos con timeout
            const permissionsPromise = Geolocation.requestPermissions();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Permission request timeout')), 5000);
            });
            
            try {
              const permissions = await Promise.race([permissionsPromise, timeoutPromise]) as any;
              console.log('📍 Permission result:', permissions);
              
              // Verificar si es un resultado válido de permisos (no el timeout)
              if (permissions && typeof permissions === 'object' && 'location' in permissions) {
                if (permissions.location === 'granted' || permissions.location === 'prompt') {
                  console.log('📍 Permissions obtained, getting position...');
                  
                  const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 30000,
                  });

                  console.log('📍 Position obtained after permissions:', position.coords);

                  return {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  };
                } else {
                  throw new Error('Permisos de ubicación denegados');
                }
              } else {
                throw new Error('Permission request timeout');
              }
            } catch (permissionError) {
              console.warn('📍 Permission request failed or timed out:', permissionError);
              throw new Error('No se pudo obtener permisos de ubicación. Por favor, habilita la ubicación en Configuración.');
            }
          }
        } catch (capacitorError) {
          console.error('📍 Capacitor geolocation failed:', capacitorError);
          throw capacitorError;
        }
      } else {
        console.log('📍 Using web geolocation for browser...');
        
        // Check if geolocation is available
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
        };
      }
    } catch (err: any) {
      console.error('Geolocation error:', err);
      
      let errorMessage = 'Error al obtener la ubicación';
      
      if (err.code) {
        switch (err.code) {
          case 1:
            errorMessage = 'Permiso de ubicación denegado';
            break;
          case 2:
            errorMessage = 'Posición no disponible';
            break;
          case 3:
            errorMessage = 'Tiempo de espera agotado';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError({ message: errorMessage, code: err.code });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getCurrentPosition,
    isLoading,
    error,
  };
};