import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Navigation, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Datos del mapa de calor del Distrito Nacional - Coordenadas precisas por geocoding
const heatMapZones = [
  { name: "24 de Abril", type: "hot", color: "red", coords: [18.497878, -69.883417] },
  { name: "Cristo Rey", type: "hot", color: "red", coords: [18.488505, -69.895349] },
  { name: "Domingo Savio", type: "hot", color: "red", coords: [18.495288, -69.888075] },
  { name: "Ensanche Capotillo", type: "hot", color: "red", coords: [18.507381, -69.901876] },
  { name: "Gualey", type: "hot", color: "red", coords: [18.499763, -69.891837] },
  { name: "La Zurza", type: "hot", color: "red", coords: [18.505435, -69.886834] },
  { name: "Los Jardines", type: "hot", color: "red", coords: [18.490207, -69.889397] },
  { name: "Los Restauradores", type: "hot", color: "red", coords: [18.473739, -69.909137] },
  { name: "Nuevo Arroyo Hondo", type: "hot", color: "red", coords: [18.502733, -69.890475] },
  { name: "Nuestra Señora de la Paz", type: "hot", color: "red", coords: [18.443993, -69.906206] },
  { name: "Palma Real", type: "hot", color: "red", coords: [18.492512, -69.884084] },
  { name: "Simón Bolívar", type: "hot", color: "red", coords: [18.487237, -69.903833] },
  { name: "Villa Consuelo", type: "hot", color: "red", coords: [18.499863, -69.898137] },
  { name: "Villa Francisca", type: "hot", color: "red", coords: [18.501873, -69.899408] },
  { name: "Villa Juana", type: "hot", color: "red", coords: [18.495766, -69.897355] },
  
  // Zonas Amarillas (Intermedias) - Riesgo moderado
  { name: "Altos de Arroyo Hondo", type: "intermediate", color: "yellow", coords: [18.488585, -69.883337] },
  { name: "Buenos Aires", type: "intermediate", color: "yellow", coords: [18.478221, -69.903802] },
  { name: "Ensanche Espaillat", type: "intermediate", color: "yellow", coords: [18.471756, -69.890189] },
  { name: "Ensanche La Fe", type: "intermediate", color: "yellow", coords: [18.453579, -69.883194] },
  { name: "Ensanche Luperón", type: "intermediate", color: "yellow", coords: [18.509765, -69.892776] },
  { name: "Ensanche Quisqueya", type: "intermediate", color: "yellow", coords: [18.499598, -69.898422] },
  { name: "Honduras del Norte", type: "intermediate", color: "yellow", coords: [18.508700, -69.891990] },
  { name: "30 de Mayo", type: "intermediate", color: "yellow", coords: [18.504925, -69.894532] },
  
  // Zonas Verdes (Frías) - Bajo riesgo
  { name: "Ciudad Colonial", type: "cold", color: "green", coords: [18.470559, -69.886930] },
  { name: "Gascue", type: "cold", color: "green", coords: [18.447708, -69.904161] },
  { name: "Zona Universitaria", type: "cold", color: "green", coords: [18.473095, -69.903901] },
  { name: "Bella Vista", type: "cold", color: "green", coords: [18.441362, -69.888175] },
  { name: "Ensanche Naco", type: "cold", color: "green", coords: [18.495130, -69.884036] },
  { name: "Piantini", type: "cold", color: "green", coords: [18.474850, -69.887869] },
  { name: "Paraíso", type: "cold", color: "green", coords: [18.443605, -69.887395] },
  { name: "La Esperilla", type: "cold", color: "green", coords: [18.477404, -69.905623] },
  { name: "Los Cacicazgos", type: "cold", color: "green", coords: [18.464052, -69.880419] },
  { name: "San Juan Bosco", type: "cold", color: "green", coords: [18.477594, -69.901184] }
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