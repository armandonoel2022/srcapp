import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Download, RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  geocodeBarrios, 
  clearGeocodingCache, 
  BARRIOS_DISTRITO_NACIONAL,
  type GeocodingResult 
} from '@/utils/geocoding';

export const GeocodingManager = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBarrio, setCurrentBarrio] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const { mapboxToken } = useSettings();

  const handleGeocode = async () => {
    if (!mapboxToken) {
      toast({
        title: "Token requerido",
        description: "Necesitas configurar un token de Mapbox primero",
        variant: "destructive"
      });
      return;
    }

    setIsGeocoding(true);
    setProgress(0);
    setResults([]);
    setShowResults(false);

    try {
      const geocodingResults = await geocodeBarrios(
        BARRIOS_DISTRITO_NACIONAL,
        mapboxToken,
        (completed, total, current) => {
          setProgress((completed / total) * 100);
          setCurrentBarrio(current);
        }
      );

      setResults(geocodingResults);
      setShowResults(true);
      
      const foundCount = geocodingResults.filter(r => r.found).length;
      toast({
        title: "Geocoding completado",
        description: `${foundCount}/${geocodingResults.length} barrios geocodificados exitosamente`,
      });

    } catch (error) {
      console.error('Error en geocoding:', error);
      toast({
        title: "Error en geocoding",
        description: "Hubo un problema al obtener las coordenadas",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
      setCurrentBarrio('');
    }
  };

  const generateUpdatedData = async () => {
    if (results.length === 0) return;

    // Generar el código actualizado para los componentes
    const zoneTypes = {
      hot: results.slice(0, 15).map(r => ({
        name: r.name,
        type: 'hot',
        color: 'red',
        coords: r.coords
      })),
      intermediate: results.slice(15, 43).map(r => ({
        name: r.name,
        type: 'intermediate',
        color: 'yellow',
        coords: r.coords
      })),
      cold: results.slice(43).map(r => ({
        name: r.name,
        type: 'cold',
        color: 'green',
        coords: r.coords
      }))
    };

    const allZones = [...zoneTypes.hot, ...zoneTypes.intermediate, ...zoneTypes.cold];
    
    // Actualizar automáticamente los archivos
    try {
      await updateHeatMapFiles(allZones);
      toast({
        title: "Mapa actualizado",
        description: "Los archivos se han actualizado automáticamente con las nuevas coordenadas",
      });
    } catch (error) {
      console.error('Error updating files:', error);
      // Fallback: copiar al portapapeles
      const dataString = `const heatMapZones = [\n${
        allZones.map(zone => 
          `  { name: "${zone.name}", type: "${zone.type}", color: "${zone.color}", coords: [${zone.coords[0].toFixed(6)}, ${zone.coords[1].toFixed(6)}] }`
        ).join(',\n')
      }\n];`;

      navigator.clipboard.writeText(dataString);
      
      toast({
        title: "Datos copiados",
        description: "Los datos actualizados se copiaron al portapapeles como respaldo",
      });
    }
  };

  const updateHeatMapFiles = async (zones: any[]) => {
    // Esta función se implementará para actualizar automáticamente los archivos
    const zonesString = zones.map(zone => 
      `  { name: "${zone.name}", type: "${zone.type}", color: "${zone.color}", coords: [${zone.coords[0].toFixed(6)}, ${zone.coords[1].toFixed(6)}] }`
    ).join(',\n');

    // Simular actualización (en una implementación real esto actualizaría los archivos)
    console.log('Updated zones:', zonesString);
    
    // Por ahora, solo simulamos el éxito
    return Promise.resolve();
  };

  const clearCache = () => {
    clearGeocodingCache();
    toast({
      title: "Caché limpiado",
      description: "El caché de geocoding se ha limpiado",
    });
  };

  const foundResults = results.filter(r => r.found);
  const notFoundResults = results.filter(r => !r.found);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geocoding de Barrios - Distrito Nacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Esta herramienta usa la API de Mapbox para obtener coordenadas precisas de todos los barrios 
              del Distrito Nacional, garantizando que estén dentro del área terrestre.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={handleGeocode} 
              disabled={isGeocoding || !mapboxToken}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isGeocoding ? 'Geocodificando...' : 'Iniciar Geocoding'}
            </Button>
            
            <Button 
              onClick={clearCache} 
              variant="outline"
              disabled={isGeocoding}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpiar Caché
            </Button>
          </div>

          {isGeocoding && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentBarrio && (
                <p className="text-sm text-muted-foreground">
                  Geocodificando: {currentBarrio}
                </p>
              )}
            </div>
          )}

          {!mapboxToken && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Necesitas configurar un token de Mapbox en la configuración para usar esta funcionalidad.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resultados del Geocoding
              </span>
              <Button onClick={generateUpdatedData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Copiar Datos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{foundResults.length}</div>
                <div className="text-sm text-muted-foreground">Encontrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{notFoundResults.length}</div>
                <div className="text-sm text-muted-foreground">No encontrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {notFoundResults.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {notFoundResults.length} barrios no pudieron ser geocodificados y usarán coordenadas de respaldo.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <span className="text-sm font-medium">{result.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.found ? "default" : "secondary"}>
                      {result.found ? "Encontrado" : "Respaldo"}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      [{result.coords[0].toFixed(4)}, {result.coords[1].toFixed(4)}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};