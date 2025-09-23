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
    { path: 'android/app/src/main/res/drawable/ic_launcher_foreground.png', type: 'image' },
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
      const zip = new JSZip();
      let filesAdded = 0;
      
      // Agregar archivos XML manualmente
      const xmlFiles = {
        'app/src/main/res/drawable/ic_launcher_background.xml': `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path android:fillColor="#26A69A" android:pathData="M0,0h108v108h-108z" />
    <path android:fillColor="#00000000" android:pathData="M9,0L9,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,0L19,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M29,0L29,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M39,0L39,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M49,0L49,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M59,0L59,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M69,0L69,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M79,0L79,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M89,0L89,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M99,0L99,108" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,9L108,9" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,19L108,19" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,29L108,29" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,39L108,39" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,49L108,49" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,59L108,59" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,69L108,69" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,79L108,79" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,89L108,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M0,99L108,99" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,29L89,29" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,39L89,39" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,49L89,49" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,59L89,59" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,69L89,69" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M19,79L89,79" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M29,19L29,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M39,19L39,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M49,19L49,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M59,19L59,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M69,19L69,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
    <path android:fillColor="#00000000" android:pathData="M79,19L79,89" android:strokeColor="#33FFFFFF" android:strokeWidth="0.8" />
</vector>`,
        'app/src/main/res/drawable-v24/ic_launcher_foreground.xml': `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path android:fillColor="#3DDC84"
          android:pathData="M0,0h108v108h-108z"/>
    <path android:fillColor="#00000000"
          android:pathData="M54,54m-54,0a54,54 0,1 1,108 0a54,54 0,1 1,-108 0"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M54,44L54,64L64,54Z"/>
</vector>`,
        'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml': `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`,
        'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml': `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`,
        'app/src/main/res/values/ic_launcher_background.xml': `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>`,
        'app/src/main/res/values/strings.xml': `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">SRC App</string>
    <string name="title_activity_main">SRC App</string>
    <string name="package_name">do.com.src.app</string>
    <string name="custom_url_scheme">do.com.src.app</string>
</resources>`,
        'app/src/main/res/values/styles.xml': `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
    </style>
</resources>`,
        'app/src/main/res/values/colors.xml': `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#26A69A</color>
    <color name="colorPrimaryDark">#00695C</color>
    <color name="colorAccent">#FF4081</color>
</resources>`,
        'app/src/main/res/xml/config.xml': `<?xml version='1.0' encoding='utf-8'?>
<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <access origin="*" />
</widget>`,
        'app/src/main/res/xml/file_paths.xml': `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <cache-path name="my_cache_images" path="." />
</paths>`,
        'app/src/main/res/layout/activity_main.xml': `<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res/auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.coordinatorlayout.widget.CoordinatorLayout>`
      };

      // Agregar archivos XML al ZIP
      Object.entries(xmlFiles).forEach(([path, content]) => {
        zip.file(path, content);
        filesAdded++;
      });

      // Intentar obtener imágenes desde las rutas relativas
      for (const file of androidFiles) {
        if (file.type === 'image') {
          try {
            const response = await fetch(`/${file.path}`);
            if (response.ok) {
              const blob = await response.blob();
              zip.file(file.path.replace('android/', ''), blob);
              filesAdded++;
            } else {
              // Si no se puede obtener la imagen, crear un placeholder
              console.log(`No se pudo cargar ${file.path}, creando placeholder`);
            }
          } catch (error) {
            console.log(`Error descargando ${file.path}:`, error);
          }
        }
      }
      
      if (filesAdded === 0) {
        throw new Error('No se pudieron agregar archivos al ZIP');
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
        description: `ZIP creado con ${filesAdded} archivos. Descarga iniciada.`,
      });
    } catch (error) {
      console.error('Error al descargar archivos:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudieron descargar los archivos. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const downloadIndividual = async (file: { path: string; type: string }) => {
    try {
      if (file.type === 'xml') {
        // Crear contenido XML basado en el archivo
        let content = '';
        const fileName = file.path.split('/').pop();
        
        if (fileName === 'ic_launcher_background.xml' && file.path.includes('drawable')) {
          content = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path android:fillColor="#26A69A" android:pathData="M0,0h108v108h-108z" />
</vector>`;
        } else if (fileName === 'ic_launcher_background.xml' && file.path.includes('values')) {
          content = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>`;
        } else if (fileName === 'strings.xml') {
          content = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">SRC App</string>
    <string name="title_activity_main">SRC App</string>
    <string name="package_name">do.com.src.app</string>
    <string name="custom_url_scheme">do.com.src.app</string>
</resources>`;
        } else if (fileName === 'styles.xml') {
          content = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
</resources>`;
        } else if (fileName === 'colors.xml') {
          content = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#26A69A</color>
    <color name="colorPrimaryDark">#00695C</color>
    <color name="colorAccent">#FF4081</color>
</resources>`;
        } else {
          // Archivo XML genérico
          content = `<?xml version="1.0" encoding="utf-8"?>
<resources>
</resources>`;
        }
        
        const blob = new Blob([content], { type: 'text/xml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'archivo.xml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Intentar descargar imagen
        try {
          const response = await fetch(`/${file.path}`);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.path.split('/').pop() || 'imagen.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            throw new Error('Archivo no encontrado');
          }
        } catch (error) {
          toast({
            title: "Archivo no disponible",
            description: `La imagen ${file.path.split('/').pop()} no está disponible para descarga individual.`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el archivo.",
        variant: "destructive"
      });
    }
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
                  onClick={() => downloadIndividual(file)}
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