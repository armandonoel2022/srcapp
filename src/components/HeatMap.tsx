import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Datos del mapa de calor del Distrito Nacional
const heatMapZones = [
  // Zonas Rojas (Calientes) - Basado en el mapa del Distrito Nacional
  { name: "La Ciénaga", type: "hot", color: "red", coords: [18.4861, -69.9312] },
  { name: "Villa Juana", type: "hot", color: "red", coords: [18.4611, -69.9242] },
  { name: "Cristo Rey", type: "hot", color: "red", coords: [18.4589, -69.9456] },
  { name: "Gualey", type: "hot", color: "red", coords: [18.4789, -69.9123] },
  { name: "Simón Bolívar", type: "hot", color: "red", coords: [18.4678, -69.9234] },
  { name: "24 de Abril", type: "hot", color: "red", coords: [18.4756, -69.9334] },
  { name: "Capotillo", type: "hot", color: "red", coords: [18.4912, -69.9456] },
  { name: "Guachupita", type: "hot", color: "red", coords: [18.4834, -69.9201] },
  { name: "Villa Consuelo", type: "hot", color: "red", coords: [18.4523, -69.9123] },
  { name: "Los Alcarrizos (parte)", type: "hot", color: "red", coords: [18.4445, -69.9567] },
  
  // Zonas Amarillas (Intermedias) - Basado en las zonas verdes del mapa
  { name: "Villa Agrippina", type: "intermediate", color: "yellow", coords: [18.4712, -69.9345] },
  { name: "Palma Real", type: "intermediate", color: "yellow", coords: [18.4823, -69.9123] },
  { name: "Los Cacicazgos", type: "intermediate", color: "yellow", coords: [18.4756, -69.9012] },
  { name: "Mirador Norte", type: "intermediate", color: "yellow", coords: [18.4934, -69.9234] },
  { name: "Villa María", type: "intermediate", color: "yellow", coords: [18.4623, -69.9345] },
  { name: "Ensanche Quisqueya", type: "intermediate", color: "yellow", coords: [18.4689, -69.9123] },
  { name: "Los Jardines", type: "intermediate", color: "yellow", coords: [18.4567, -69.9234] },
  { name: "Villa Francisca", type: "intermediate", color: "yellow", coords: [18.4678, -69.9456] },
  
  // Zonas Verdes (Frías) - Basado en las zonas blancas del mapa
  { name: "Zona Colonial", type: "cold", color: "green", coords: [18.4539, -69.8826] },
  { name: "Gazcue", type: "cold", color: "green", coords: [18.4656, -69.9012] },
  { name: "Zona Universitaria", type: "cold", color: "green", coords: [18.4623, -69.8934] },
  { name: "Mirador Sur", type: "cold", color: "green", coords: [18.4567, -69.9234] },
  { name: "Bella Vista", type: "cold", color: "green", coords: [18.4712, -69.9123] },
  { name: "Ensanche Naco", type: "cold", color: "green", coords: [18.4789, -69.9012] },
  { name: "Piantini", type: "cold", color: "green", coords: [18.4823, -69.9234] },
  { name: "Ensanche Paraíso", type: "cold", color: "green", coords: [18.4756, -69.9345] },
  { name: "Ensanche Serralles", type: "cold", color: "green", coords: [18.4689, -69.9456] },
  { name: "La Esperilla", type: "cold", color: "green", coords: [18.4634, -69.9123] },
  { name: "Evaristo Morales", type: "cold", color: "green", coords: [18.4767, -69.9234] }
];

export const HeatMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filteredZones, setFilteredZones] = useState(heatMapZones);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery) {
      const filtered = heatMapZones.filter(zone => 
        zone.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredZones(filtered);
    } else {
      setFilteredZones(heatMapZones);
    }
  }, [searchQuery]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "La geolocalización no está disponible en este navegador",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Verificar en qué zona está el usuario
        const nearestZone = findNearestZone(latitude, longitude);
        if (nearestZone) {
          setSelectedZone(nearestZone);
          toast({
            title: "Ubicación detectada",
            description: `Te encuentras cerca de ${nearestZone.name} - Zona ${getZoneTypeName(nearestZone.type)}`,
          });
        }
      },
      (error) => {
        toast({
          title: "Error de ubicación",
          description: "No se pudo obtener tu ubicación actual",
          variant: "destructive"
        });
      }
    );
  };

  const findNearestZone = (lat: number, lng: number) => {
    let nearestZone = null;
    let minDistance = Infinity;

    heatMapZones.forEach(zone => {
      const distance = calculateDistance(lat, lng, zone.coords[0], zone.coords[1]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    });

    return minDistance < 2 ? nearestZone : null; // Solo si está dentro de 2km
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getZoneTypeName = (type: string) => {
    switch (type) {
      case 'hot': return 'Caliente (Alto riesgo)';
      case 'intermediate': return 'Intermedia (Riesgo moderado)';
      case 'cold': return 'Fría (Bajo riesgo)';
      default: return 'Desconocido';
    }
  };

  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'hot': return <AlertTriangle className="h-4 w-4" />;
      case 'intermediate': return <AlertCircle className="h-4 w-4" />;
      case 'cold': return <CheckCircle className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getZoneBadgeVariant = (type: string) => {
    switch (type) {
      case 'hot': return 'destructive';
      case 'intermediate': return 'secondary';
      case 'cold': return 'default';
      default: return 'outline';
    }
  };

  const hotZones = heatMapZones.filter(zone => zone.type === 'hot');
  const intermediateZones = heatMapZones.filter(zone => zone.type === 'intermediate');
  const coldZones = heatMapZones.filter(zone => zone.type === 'cold');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Calor - Distrito Nacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Consulta las zonas de seguridad del Distrito Nacional en Santo Domingo, República Dominicana.
            Sistema de clasificación tipo semáforo.
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar zona, barrio o municipio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={getCurrentLocation} variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Mi Ubicación
            </Button>
          </div>

          {/* Current Location Status */}
          {currentLocation && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm">
                    Ubicación actual: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </span>
                </div>
                {selectedZone && (
                  <div className="mt-2">
                    <Badge variant={getZoneBadgeVariant(selectedZone.type)} className="mr-2">
                      {getZoneIcon(selectedZone.type)}
                      <span className="ml-1">{selectedZone.name}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getZoneTypeName(selectedZone.type)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Zone Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Zonas Calientes
            </CardTitle>
            <p className="text-sm text-muted-foreground">Alto riesgo - Extremar precauciones</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {hotZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between p-2 rounded border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer"
                onClick={() => setSelectedZone(zone)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">{zone.name}</span>
                </div>
                <Badge variant="destructive" className="text-xs">ALTO</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Intermediate Zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Zonas Intermedias
            </CardTitle>
            <p className="text-sm text-muted-foreground">Riesgo moderado - Mantener precaución</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {intermediateZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between p-2 rounded border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer"
                onClick={() => setSelectedZone(zone)}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">{zone.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">MEDIO</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cold Zones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Zonas Frías
            </CardTitle>
            <p className="text-sm text-muted-foreground">Bajo riesgo - Relativamente seguras</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {coldZones.map((zone) => (
              <div
                key={zone.name}
                className="flex items-center justify-between p-2 rounded border border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                onClick={() => setSelectedZone(zone)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{zone.name}</span>
                </div>
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">BAJO</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Selected Zone Details */}
      {selectedZone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getZoneIcon(selectedZone.type)}
              Detalles de {selectedZone.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Nivel de riesgo:</span>
                <Badge variant={getZoneBadgeVariant(selectedZone.type)}>
                  {getZoneTypeName(selectedZone.type)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Coordenadas:</span>
                <span className="font-mono text-sm">
                  {selectedZone.coords[0].toFixed(4)}, {selectedZone.coords[1].toFixed(4)}
                </span>
              </div>
              <div className="mt-4 p-3 rounded bg-muted/50">
                <h4 className="font-medium mb-2">Recomendaciones de seguridad:</h4>
                {selectedZone.type === 'hot' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Evitar transitar solo, especialmente en horas nocturnas</li>
                    <li>• Mantener objetos de valor ocultos</li>
                    <li>• Estar atento al entorno en todo momento</li>
                    <li>• Considerar rutas alternativas si es posible</li>
                  </ul>
                )}
                {selectedZone.type === 'intermediate' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Mantener precauciones normales de seguridad</li>
                    <li>• Evitar mostrar objetos de valor</li>
                    <li>• Preferir horarios diurnos para actividades</li>
                  </ul>
                )}
                {selectedZone.type === 'cold' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Zona relativamente segura</li>
                    <li>• Mantener precauciones básicas</li>
                    <li>• Actividades comerciales y turísticas regulares</li>
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded border border-destructive/20 bg-destructive/5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-destructive">Zona Caliente</div>
                <div className="text-xs text-muted-foreground">Alto riesgo de seguridad</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-orange-200 bg-orange-50">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-600">Zona Intermedia</div>
                <div className="text-xs text-muted-foreground">Riesgo moderado</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded border border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-600">Zona Fría</div>
                <div className="text-xs text-muted-foreground">Bajo riesgo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};