import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const FeatureGraphic = () => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/lovable-uploads/play-store-feature-graphic.png';
    link.download = 'play-store-feature-graphic.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de Funciones para Google Play Store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                Dimensiones: 1024 x 512 px (Formato requerido por Google Play Store)
              </p>
              <img 
                src="/lovable-uploads/play-store-feature-graphic.png" 
                alt="Feature Graphic - Sistema de Control de Turnos"
                className="w-full rounded-lg shadow-lg border"
              />
            </div>
            
            <div className="flex justify-center">
              <Button onClick={handleDownload} size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Descargar Gráfico
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Características principales mostradas:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Autenticación Biométrica - Seguridad con huella digital</li>
                <li>Registro con GPS - Verificación de ubicación en tiempo real</li>
                <li>Análisis en Tiempo Real - Dashboard con métricas y reportes</li>
                <li>Gestión de Equipos - Control completo de empleados y turnos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
