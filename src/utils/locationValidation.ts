export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface LocationValidationResult {
  isValid: boolean;
  distance: number;
  message: string;
}

// Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
export const calculateDistance = (
  point1: LocationCoordinates,
  point2: LocationCoordinates
): number => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Convertir a metros
  
  return Math.round(distance);
};

// Definir ubicaciones de trabajo válidas
export const UBICACIONES_TRABAJO = {
  'Oficina Principal': {
    lat: 18.49170,
    lng: -69.90167,
    nombre: 'Oficina Principal',
    direccion: 'F4RX+MG9, C. Club de Leones, Santo Domingo 11504'
  },
  'Sucursal Norte': {
    lat: 18.50000,
    lng: -69.90000,
    nombre: 'Sucursal Norte',
    direccion: 'Dirección de ejemplo Norte'
  },
  'Sucursal Este': {
    lat: 18.48000,
    lng: -69.88000,
    nombre: 'Sucursal Este',
    direccion: 'Dirección de ejemplo Este'
  }
};

// Radio de tolerancia en metros (100 metros de tolerancia)
export const TOLERANCIA_UBICACION = 100;

// Validar si la ubicación actual está dentro del rango de alguna ubicación asignada al empleado
export const validateLocationForWork = async (
  currentLocation: LocationCoordinates,
  empleadoId: string
): Promise<LocationValidationResult> => {
  try {
    // Usar Supabase para obtener las ubicaciones asignadas al empleado
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Permitir punch en cualquier ubicación activa, no solo asignadas
    const { data: ubicacionesTrabajo, error: errorUbicaciones } = await supabase
      .from('ubicaciones_trabajo')
      .select('nombre, coordenadas, radio_tolerancia, direccion')
      .eq('activa', true);

    if (errorUbicaciones || !ubicacionesTrabajo || ubicacionesTrabajo.length === 0) {
      return {
        isValid: false,
        distance: -1,
        message: 'No hay ubicaciones activas configuradas. Contacte al administrador.'
      };
    }

    // Validar la ubicación actual contra todas las ubicaciones asignadas
    let mejorCoincidencia: LocationValidationResult | null = null;
    let menorDistancia = Infinity;

    for (const ubicacion of ubicacionesTrabajo) {
      // Extraer coordenadas del formato Point de PostgreSQL
      const coordenadas = ubicacion.coordenadas as string;
      const matches = coordenadas.match(/\(([^,]+),([^)]+)\)/);
      
      if (!matches) {
        continue;
      }

      const ubicacionObj = {
        lat: parseFloat(matches[1]),
        lng: parseFloat(matches[2])
      };

      const distance = calculateDistance(currentLocation, ubicacionObj);
      const tolerancia = ubicacion.radio_tolerancia || TOLERANCIA_UBICACION;

      // Si está dentro del rango de tolerancia, es válido
      if (distance <= tolerancia) {
        return {
          isValid: true,
          distance,
          message: `Ubicación validada en ${ubicacion.nombre}. Distancia: ${distance}m`
        };
      }

      // Mantener registro de la ubicación más cercana
      if (distance < menorDistancia) {
        menorDistancia = distance;
        mejorCoincidencia = {
          isValid: false,
          distance,
          message: `Ubicación más cercana: ${ubicacion.nombre} (${distance}m). Debe estar dentro de ${tolerancia}m.`
        };
      }
    }

    // Si no está dentro del rango de ninguna ubicación, devolver la más cercana
    return mejorCoincidencia || {
      isValid: false,
      distance: -1,
      message: 'No se pudo validar la ubicación. Contacte al administrador.'
    };

  } catch (error) {
    console.error('Error validando ubicación:', error);
    return {
      isValid: false,
      distance: -1,
      message: 'Error al validar ubicación. Contacte al administrador.'
    };
  }
};

// Obtener información de una ubicación de trabajo
export const getWorkLocationInfo = (lugarDesignado: string) => {
  return Object.values(UBICACIONES_TRABAJO).find(
    ubicacion => ubicacion.nombre.toLowerCase().includes(lugarDesignado.toLowerCase()) ||
                lugarDesignado.toLowerCase().includes(ubicacion.nombre.toLowerCase())
  );
};