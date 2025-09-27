import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';

interface LocationDisplayProps {
  empleadoLugarDesignado?: string;
}

export const LocationDisplay = ({ empleadoLugarDesignado }: LocationDisplayProps) => {
  const [ubicacionActual, setUbicacionActual] = useState<string>('Obteniendo ubicación...');
  const { getCurrentPosition } = useGeolocation();

  useEffect(() => {
    obtenerUbicacionActual();
  }, []);

  const obtenerUbicacionActual = async () => {
    try {
      const position = await getCurrentPosition();
      if (position) {
        const nombre = await obtenerNombreUbicacion(position.latitude, position.longitude);
        setUbicacionActual(nombre);
      } else {
        setUbicacionActual('No se pudo obtener ubicación');
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setUbicacionActual('Error al obtener ubicación');
    }
  };

  const obtenerNombreUbicacion = async (lat: number, lng: number): Promise<string> => {
    try {
      // Obtener ubicaciones de trabajo activas
      const { data: ubicaciones } = await supabase
        .from('ubicaciones_trabajo')
        .select('nombre, coordenadas, radio_tolerancia')
        .eq('activa', true);

      if (!ubicaciones) return 'Ubicación no identificada';

      // Calcular distancias a todas las ubicaciones y encontrar la más cercana
      let closestLocation = null;
      let shortestDistance = Infinity;

      for (const ubicacion of ubicaciones) {
        const ubicacionCoordinates = ubicacion.coordenadas as string;
        const matches = ubicacionCoordinates.match(/\(([^,]+),([^)]+)\)/);
        
        if (matches) {
          const ubicacionObj = {
            lat: parseFloat(matches[1]),
            lng: parseFloat(matches[2])
          };

          // Calcular distancia usando la función de Haversine
          const R = 6371; // Radio de la Tierra en kilómetros
          const dLat = (lat - ubicacionObj.lat) * Math.PI / 180;
          const dLng = (lng - ubicacionObj.lng) * Math.PI / 180;
          
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(ubicacionObj.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c * 1000; // Convertir a metros

          // Verificar si está dentro de la tolerancia normal
          const tolerancia = ubicacion.radio_tolerancia || 100;
          if (distance <= tolerancia) {
            return ubicacion.nombre;
          }

          // Guardar la ubicación más cercana para mostrar con distancia
          if (distance < shortestDistance) {
            shortestDistance = distance;
            closestLocation = ubicacion;
          }
        }
      }

      // Si no está dentro de ninguna tolerancia, mostrar la ubicación más cercana con distancia
      if (closestLocation && shortestDistance <= 1000) { // Máximo 1km para considerar "cercana"
        return `${closestLocation.nombre} (${Math.round(shortestDistance)}m)`;
      }

      return 'Ubicación no identificada';
    } catch (error) {
      console.error('Error obteniendo nombre de ubicación:', error);
      return 'Error al identificar ubicación';
    }
  };

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      {empleadoLugarDesignado && (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>Designado en: {empleadoLugarDesignado}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        <span>Registro en: {ubicacionActual}</span>
      </div>
    </div>
  );
};