import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileArchive, Smartphone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export const DescargaArchivosAndroid = () => {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const androidFiles = [
    // Drawable files
    { path: 'android/app/src/main/res/drawable/ic_launcher_background.xml', type: 'xml' },
    { path: 'android/app/src/main/res/drawable/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', type: 'xml' },
    
    // Drawable landscape variations
    { path: 'android/app/src/main/res/drawable-land-hdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-land-mdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-land-xhdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-land-xxhdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-land-xxxhdpi/splash.png', type: 'image' },
    
    // Drawable portrait variations
    { path: 'android/app/src/main/res/drawable-port-hdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-port-mdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-port-xhdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-port-xxhdpi/splash.png', type: 'image' },
    { path: 'android/app/src/main/res/drawable-port-xxxhdpi/splash.png', type: 'image' },
    
    // Mipmap files
    { path: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', type: 'xml' },
    { path: 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', type: 'xml' },
    
    // Mipmap hdpi
    { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', type: 'image' },
    
    // Mipmap mdpi
    { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', type: 'image' },
    
    // Mipmap xhdpi
    { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', type: 'image' },
    
    // Mipmap xxhdpi
    { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', type: 'image' },
    
    // Mipmap xxxhdpi
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', type: 'image' },
    { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', type: 'image' },
    
    // Values
    { path: 'android/app/src/main/res/values/ic_launcher_background.xml', type: 'xml' },
    { path: 'android/app/src/main/res/values/strings.xml', type: 'xml' },
    { path: 'android/app/src/main/res/values/styles.xml', type: 'xml' },
    { path: 'android/app/src/main/res/values/colors.xml', type: 'xml' },
    
    // XML config
    { path: 'android/app/src/main/res/xml/config.xml', type: 'xml' },
    { path: 'android/app/src/main/res/xml/file_paths.xml', type: 'xml' },
    
    // Layout
    { path: 'android/app/src/main/res/layout/activity_main.xml', type: 'xml' }
  ];

  const downloadAsZip = async () => {
    setDownloading(true);
    
    try {
      // Crear un archivo ZIP usando JSZip
      const zip = new JSZip();
      
      for (const file of androidFiles) {
        try {
          const response = await fetch(file.path);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(file.path.replace('android/', ''), blob);
          }
        } catch (error) {
          console.log(`Error descargando ${file.path}:`, error);
        }
      }
      
      // Generar y descargar el ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'android-files-srcapp.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga completada",
        description: "Los archivos Android se han descargado correctamente.",
      });
    } catch (error) {
      console.error('Error al descargar archivos:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudieron descargar todos los archivos. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const downloadIndividual = (filePath: string) => {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.split('/').pop() || 'archivo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archivos Android</h1>
          <p className="text-muted-foreground">
            Descarga todos los archivos necesarios para la aplicación Android
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              Descarga Completa
            </CardTitle>
            <CardDescription>
              Descarga todos los archivos Android en un archivo ZIP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={downloadAsZip} 
              disabled={downloading}
              className="w-full"
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparando descarga...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar ZIP ({androidFiles.length} archivos)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de Archivos</CardTitle>
            <CardDescription>
              Estructura de carpetas Android generada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Drawable (landscape/portrait):</span>
                <span>11 archivos</span>
              </div>
              <div className="flex justify-between">
                <span>Mipmap (todos los DPI):</span>
                <span>17 archivos</span>
              </div>
              <div className="flex justify-between">
                <span>Values (strings, colors, etc):</span>
                <span>4 archivos</span>
              </div>
              <div className="flex justify-between">
                <span>XML y Layout:</span>
                <span>3 archivos</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total:</span>
                <span>{androidFiles.length} archivos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archivos Incluidos</CardTitle>
          <CardDescription>
            Lista completa de archivos Android disponibles para descarga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {androidFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                <span className="text-sm font-mono">{file.path.replace('android/', '')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadIndividual(file.path)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Descarga el archivo ZIP con todos los recursos Android</li>
            <li>Extrae el contenido en la carpeta <code className="bg-amber-100 px-1 rounded">android/app/src/main/res/</code> de tu proyecto</li>
            <li>Ejecuta <code className="bg-amber-100 px-1 rounded">npx cap sync</code> para sincronizar los cambios</li>
            <li>Compila tu aplicación Android con <code className="bg-amber-100 px-1 rounded">npx cap run android</code></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};