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
          // Solicitar permisos primero
          console.log('📍 Requesting location permissions...');
          const permissions = await Geolocation.requestPermissions();
          console.log('📍 Permission result:', permissions);
          
          if (permissions.location === 'granted') {
            console.log('📍 Permissions granted, getting position...');
            
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000, // 1 minuto cache
            });

            console.log('📍 Position obtained:', position.coords);

            return {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
          } else if (permissions.location === 'prompt') {
            console.log('📍 Permission prompt, trying to get position anyway...');
            
            // En iOS, a veces el permiso se otorga durante getCurrentPosition
            try {
              const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
              });

              console.log('📍 Position obtained after prompt:', position.coords);

              return {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
            } catch (positionError) {
              console.error('📍 Position error after prompt:', positionError);
              throw new Error('Permiso de ubicación requerido');
            }
          } else {
            throw new Error('Permisos de ubicación denegados');
          }
        } catch (capacitorError) {
          console.warn('📍 Capacitor geolocation failed:', capacitorError);
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