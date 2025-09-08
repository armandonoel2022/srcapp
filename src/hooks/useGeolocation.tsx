import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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

  const getCurrentPosition = async (): Promise<GeolocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if running on mobile device with Capacitor
      if (Capacitor.isNativePlatform()) {
        console.log('📍 Using Capacitor Geolocation for mobile...');
        
        // Check permissions first
        const permissions = await Geolocation.checkPermissions();
        
        if (permissions.location !== 'granted') {
          const requestResult = await Geolocation.requestPermissions();
          if (requestResult.location !== 'granted') {
            throw new Error('Location permission denied');
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
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