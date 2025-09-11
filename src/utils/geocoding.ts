// Utilidad de geocoding para obtener coordenadas precisas usando Mapbox
export interface GeocodingResult {
  name: string;
  coords: [number, number]; // [lat, lng]
  found: boolean;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

// Límites del Distrito Nacional para validación
const DISTRITO_NACIONAL_BOUNDS = {
  minLat: 18.44,
  maxLat: 18.51,
  minLng: -69.91,
  maxLng: -69.88
};

// Cache para evitar llamadas repetidas
const geocodingCache = new Map<string, GeocodingResult>();

/**
 * Valida si las coordenadas están dentro del Distrito Nacional
 */
function isWithinDistritoNacional(lat: number, lng: number): boolean {
  return lat >= DISTRITO_NACIONAL_BOUNDS.minLat && 
         lat <= DISTRITO_NACIONAL_BOUNDS.maxLat &&
         lng >= DISTRITO_NACIONAL_BOUNDS.minLng && 
         lng <= DISTRITO_NACIONAL_BOUNDS.maxLng;
}

/**
 * Geocodifica un barrio específico del Distrito Nacional
 */
export async function geocodeBarrio(
  barrio: string, 
  mapboxToken: string
): Promise<GeocodingResult> {
  const cacheKey = barrio.toLowerCase();
  
  // Verificar caché primero
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    // Construir query específico para el Distrito Nacional
    const queries = [
      `${barrio}, Distrito Nacional, Santo Domingo, República Dominicana`,
      `${barrio}, Santo Domingo, República Dominicana`,
      `Barrio ${barrio}, Santo Domingo, República Dominicana`,
      `Sector ${barrio}, Santo Domingo, República Dominicana`
    ];

    for (const query of queries) {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?` +
        `access_token=${mapboxToken}&` +
        `country=DO&` +
        `proximity=-69.9156,18.4655&` +
        `bbox=${DISTRITO_NACIONAL_BOUNDS.minLng},${DISTRITO_NACIONAL_BOUNDS.minLat},${DISTRITO_NACIONAL_BOUNDS.maxLng},${DISTRITO_NACIONAL_BOUNDS.maxLat}&` +
        `limit=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;

        // Validar que esté dentro del Distrito Nacional
        if (isWithinDistritoNacional(lat, lng)) {
          const result: GeocodingResult = {
            name: barrio,
            coords: [lat, lng],
            found: true,
            bbox: feature.bbox
          };
          
          // Guardar en caché
          geocodingCache.set(cacheKey, result);
          console.log(`✓ Geocoded ${barrio}: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
          return result;
        }
      }
    }

    // Si no se encontró, generar coordenadas seguras dentro del DN
    const fallbackResult: GeocodingResult = {
      name: barrio,
      coords: generateFallbackCoords(),
      found: false
    };
    
    geocodingCache.set(cacheKey, fallbackResult);
    console.warn(`⚠ No geocoded ${barrio}, using fallback coords`);
    return fallbackResult;

  } catch (error) {
    console.error(`Error geocoding ${barrio}:`, error);
    
    const errorResult: GeocodingResult = {
      name: barrio,
      coords: generateFallbackCoords(),
      found: false
    };
    
    geocodingCache.set(cacheKey, errorResult);
    return errorResult;
  }
}

/**
 * Genera coordenadas de respaldo dentro del Distrito Nacional
 */
function generateFallbackCoords(): [number, number] {
  const lat = DISTRITO_NACIONAL_BOUNDS.minLat + 
    Math.random() * (DISTRITO_NACIONAL_BOUNDS.maxLat - DISTRITO_NACIONAL_BOUNDS.minLat);
  const lng = DISTRITO_NACIONAL_BOUNDS.minLng + 
    Math.random() * (DISTRITO_NACIONAL_BOUNDS.maxLng - DISTRITO_NACIONAL_BOUNDS.minLng);
  
  return [lat, lng];
}

/**
 * Geocodifica una lista completa de barrios
 */
export async function geocodeBarrios(
  barrios: string[], 
  mapboxToken: string,
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<GeocodingResult[]> {
  const results: GeocodingResult[] = [];
  
  for (let i = 0; i < barrios.length; i++) {
    const barrio = barrios[i];
    onProgress?.(i, barrios.length, barrio);
    
    const result = await geocodeBarrio(barrio, mapboxToken);
    results.push(result);
    
    // Pequeño delay para no sobrecargar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  onProgress?.(barrios.length, barrios.length, 'Completado');
  return results;
}

/**
 * Lista de barrios del Distrito Nacional para geocodificar
 */
export const BARRIOS_DISTRITO_NACIONAL = [
  // Zonas de alto riesgo
  "24 de Abril", "Cristo Rey", "Domingo Savio", "Ensanche Capotillo", 
  "Gualey", "La Zurza", "Los Jardines", "Los Restauradores", 
  "Nuevo Arroyo Hondo", "Nuestra Señora de la Paz", "Palma Real", 
  "Simón Bolívar", "Villa Consuelo", "Villa Francisca", "Villa Juana",
  
  // Zonas de riesgo moderado
  "Altos de Arroyo Hondo", "Buenos Aires", "Ensanche Espaillat", 
  "Ensanche La Fe", "Ensanche Luperón", "Ensanche Quisqueya", 
  "Honduras del Norte", "Honduras del Oeste", "Jardines del Sur", 
  "Julieta Morales", "La Agustina", "La Hondonada", "La Isabela", 
  "La Julia", "Las Praderas", "Los Peralejos", "Los Ríos", 
  "María Auxiliadora", "Mata Hambre", "Mejoramiento Social", 
  "Mirador Norte", "Miraflores", "Miramar", "Paseo de los Indios", 
  "Los Próceres", "Renacimiento", "Viejo Arroyo Hondo", "Villas Agrícolas",
  
  // Zonas de bajo riesgo
  "30 de Mayo", "Arroyo Manzano", "Atala", "Bella Vista", "El Cacique", 
  "Centro de los Héroes", "Centro Olímpico", "Cerros de Arroyo Hondo", 
  "Ciudad Colonial", "Ciudad Nueva", "Ciudad Universitaria", "El Millón", 
  "Ensanche Naco", "Gascue", "General Antonio Duverge", "Jardín Botánico", 
  "Jardín Zoológico", "La Castellana", "La Esperilla", "Los Cacicazgos", 
  "Los Prados", "Mirador Sur", "Paraíso", "Piantini", "San Carlos", 
  "San Diego", "San Geronimo", "San Juan Bosco"
];

/**
 * Limpia el caché de geocoding
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
  console.log('Caché de geocoding limpiado');
}