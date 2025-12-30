import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENROUTE_API_KEY = Deno.env.get('OPENROUTE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coordinates } = await req.json();

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 coordinates are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!OPENROUTE_API_KEY) {
      console.error('OPENROUTE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'OpenRouteService API key not configured',
          adjustedRoute: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Adjusting route with ${coordinates.length} points`);

    // OpenRouteService has a limit of 50 coordinates for match service
    // Split into chunks if needed
    const maxChunkSize = 50;
    const allAdjustedCoords: [number, number][] = [];

    for (let i = 0; i < coordinates.length; i += maxChunkSize - 1) {
      const chunk = coordinates.slice(i, Math.min(i + maxChunkSize, coordinates.length));
      
      if (chunk.length < 2) continue;

      try {
        // Use OpenRouteService Match API to snap coordinates to roads
        const response = await fetch('https://api.openrouteservice.org/v2/match/driving-car', {
          method: 'POST',
          headers: {
            'Authorization': OPENROUTE_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locations: chunk,
            radiuses: chunk.map(() => 50), // 50 meters search radius
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenRouteService error: ${response.status} - ${errorText}`);
          
          // If match fails, try directions API as fallback
          if (chunk.length <= 25) {
            const directionsResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
              method: 'POST',
              headers: {
                'Authorization': OPENROUTE_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                coordinates: chunk,
              }),
            });

            if (directionsResponse.ok) {
              const directionsData = await directionsResponse.json();
              if (directionsData.routes?.[0]?.geometry) {
                const decodedCoords = decodePolyline(directionsData.routes[0].geometry);
                allAdjustedCoords.push(...decodedCoords);
                continue;
              }
            }
          }
          
          continue;
        }

        const data = await response.json();
        
        if (data.geometry) {
          // Decode the polyline geometry
          const decodedCoords = decodePolyline(data.geometry);
          allAdjustedCoords.push(...decodedCoords);
        } else if (data.routes?.[0]?.geometry) {
          const decodedCoords = decodePolyline(data.routes[0].geometry);
          allAdjustedCoords.push(...decodedCoords);
        }
      } catch (chunkError) {
        console.error('Error processing chunk:', chunkError);
        continue;
      }
    }

    console.log(`Adjusted route has ${allAdjustedCoords.length} points`);

    return new Response(
      JSON.stringify({ 
        adjustedRoute: allAdjustedCoords,
        originalPointsCount: coordinates.length,
        adjustedPointsCount: allAdjustedCoords.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in adjust-route function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        adjustedRoute: [] 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Decode Google Polyline encoded geometry
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    // OpenRouteService returns coordinates as [lng, lat]
    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}
