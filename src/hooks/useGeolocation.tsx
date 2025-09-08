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
        
        // Add timeout for permission check
        const permissionTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Permission request timeout')), 5000);
        });

        try {
          // Check permissions with timeout
          const permissions = await Promise.race([
            Geolocation.checkPermissions(),
            permissionTimeout
          ]);
          
          console.log('📍 Current permissions:', permissions);

          if (permissions.location !== 'granted' && permissions.location !== 'prompt') {
            throw new Error('Permisos de ubicación denegados');
          }

          if (permissions.location === 'prompt') {
            console.log('📍 Requesting location permissions...');
            
            // Request permissions with timeout - but don't fail if timeout occurs
            try {
              const requestTimeout = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Permission request timeout')), 10000);
              });
              
              const requestResult = await Promise.race([
                Geolocation.requestPermissions(),
                requestTimeout
              ]);
              
              console.log('📍 Permission request result:', requestResult);
              
              // Continue regardless of permission result - iOS sometimes grants permission after user interaction
            } catch (permError) {
              console.log('📍 Permission request failed or timed out, trying to get position anyway:', permError);
              // Continue anyway - sometimes iOS grants permission during getCurrentPosition
            }
          }

          console.log('📍 Getting current position...');
          
          // Get position with timeout
          const positionTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Position request timeout')), 8000);
          });
          
          const position = await Promise.race([
            Geolocation.getCurrentPosition({
              enableHighAccuracy: false, // Reduced accuracy for better performance on iOS
              timeout: 7000,
              maximumAge: 300000, // 5 minutes cache
            }),
            positionTimeout
          ]);

          console.log('📍 Position obtained:', position.coords);

          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (capacitorError) {
          console.warn('📍 Capacitor geolocation failed, trying web API...', capacitorError);
          // Fall back to web geolocation if Capacitor fails
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