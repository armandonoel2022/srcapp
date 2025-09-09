import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Users, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmpleadoImport {
  cedula: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  fecha_nacimiento?: string;
  direccion?: string;
  telefonos?: string;
  fecha_ingreso?: string;
  sexo?: string;
  lugar_designado?: string;
  hora_entrada_programada?: string;
  hora_salida_programada?: string;
}

export const ImportacionMasivaEmpleados = () => {
  const [loading, setLoading] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [datosPreview, setDatosPreview] = useState<EmpleadoImport[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plantilla CSV para descargar
  const descargarPlantilla = () => {
    const headers = [
      'cedula',
      'nombres', 
      'apellidos',
      'funcion',
      'fecha_nacimiento',
      'sexo',
      'direccion',
      'telefonos',
      'fecha_ingreso',
      'lugar_designado',
      'hora_entrada_programada',
      'hora_salida_programada'
    ];

    const ejemploData = [
      [
        '001-1234567-8',
        'Juan Carlos',
        'Pérez Rodríguez', 
        'Oficial de Seguridad',
        '1985-03-15',
        'M',
        'Calle Principal No. 123, Santo Domingo',
        '809-123-4567',
        '2024-01-15',
        'Entrada Principal',
        '08:00',
        '17:00'
      ]
    ];

    const csvContent = [headers, ...ejemploData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_empleados_turnos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Plantilla descargada",
      description: "La plantilla CSV ha sido descargada. Completa los datos y súbela para importar.",
    });
  };

  // Procesar archivo CSV
  const procesarArchivo = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({
            title: "Error en el archivo",
            description: "El archivo debe contener al menos una fila de encabezados y una de datos.",
            variant: "destructive"
          });
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const empleados: EmpleadoImport[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          
          if (values.length >= 4 && values[0] && values[1] && values[2] && values[3]) {
            const empleado: EmpleadoImport = {
              cedula: values[0],
              nombres: values[1],
              apellidos: values[2],
              funcion: values[3],
              fecha_nacimiento: values[4] || undefined,
              sexo: values[5] || undefined,
              direccion: values[6] || undefined,
              telefonos: values[7] || undefined,
              fecha_ingreso: values[8] || undefined,
              lugar_designado: values[9] || undefined,
              hora_entrada_programada: values[10] || undefined,
              hora_salida_programada: values[11] || undefined,
            };
            empleados.push(empleado);
          }
        }

        if (empleados.length === 0) {
          toast({
            title: "No se encontraron datos válidos",
            description: "Verifica que el archivo tenga el formato correcto con cédula, nombres, apellidos y función.",
            variant: "destructive"
          });
          return;
        }

        setDatosPreview(empleados);
        toast({
          title: "Archivo procesado",
          description: `${empleados.length} empleados encontrados. Revisa la vista previa y confirma la importación.`,
        });

      } catch (error) {
        toast({
          title: "Error procesando archivo",
          description: "No se pudo procesar el archivo CSV. Verifica el formato.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
  };

  const manejarSeleccionArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Formato no válido",
          description: "Por favor selecciona un archivo CSV.",
          variant: "destructive"
        });
        return;
      }
      
      setArchivoSeleccionado(file);
      procesarArchivo(file);
    }
  };

  const importarEmpleados = async () => {
    if (datosPreview.length === 0) {
      toast({
        title: "No hay datos para importar",
        description: "Primero selecciona un archivo CSV válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let exitosos = 0;
      let errores = 0;
      let duplicados = 0;
      
      for (const empleado of datosPreview) {
        try {
          // Verificar si ya existe por cédula
          const { data: existente } = await supabase
            .from('empleados_turnos')
            .select('id, nombres, apellidos')
            .eq('cedula', empleado.cedula)
            .maybeSingle();

          if (existente) {
            console.log(`Empleado con cédula ${empleado.cedula} ya existe: ${existente.nombres} ${existente.apellidos}`);
            duplicados++;
            continue;
          }

          // Insertar nuevo empleado
          const { error } = await supabase
            .from('empleados_turnos')
            .insert({
              nombres: empleado.nombres.trim(),
              apellidos: empleado.apellidos.trim(),
              funcion: empleado.funcion.trim(),
              cedula: empleado.cedula.trim(),
              fecha_nacimiento: empleado.fecha_nacimiento || null,
              sexo: empleado.sexo || null,
              lugar_designado: empleado.lugar_designado || null,
              hora_entrada_programada: empleado.hora_entrada_programada || 
                (empleado.funcion.toLowerCase().includes('seguridad') ? '08:00' : '09:00'),
              hora_salida_programada: empleado.hora_salida_programada ||
                (empleado.funcion.toLowerCase().includes('seguridad') ? '17:00' : '17:30')
            });

          if (error) {
            console.error(`Error insertando ${empleado.nombres}:`, error);
            errores++;
          } else {
            exitosos++;
          }
        } catch (err) {
          console.error(`Error procesando ${empleado.nombres}:`, err);
          errores++;
        }
      }

      // Limpiar después de importar
      setArchivoSeleccionado(null);
      setDatosPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Importación completada",
        description: `✅ ${exitosos} empleados agregados, ⚠️ ${duplicados} duplicados omitidos, ❌ ${errores} errores.`,
        variant: exitosos > 0 ? "default" : "destructive"
      });

    } catch (error: any) {
      toast({
        title: "Error en la importación",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarSeleccion = () => {
    setArchivoSeleccionado(null);
    setDatosPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importación Masiva de Empleados
        </CardTitle>
        <CardDescription>
          Descarga la plantilla, completa los datos de los empleados y súbela para importar al sistema de turnos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Paso 1: Descargar plantilla */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            1. Descargar Plantilla
          </h3>
          <p className="text-sm text-muted-foreground">
            Descarga la plantilla CSV, ábrela en Excel o similar, completa los datos y guárdala como CSV.
          </p>
          <Button onClick={descargarPlantilla} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla CSV
          </Button>
        </div>

        {/* Paso 2: Subir archivo */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            2. Subir Archivo Completado
          </h3>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center space-y-2">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecciona tu archivo CSV completado
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={manejarSeleccionArchivo}
                className="hidden"
                id="csv-upload"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar Archivo CSV
              </Button>
            </div>
          </div>

          {archivoSeleccionado && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Archivo seleccionado:</strong> {archivoSeleccionado.name}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Vista previa de datos */}
        {datosPreview.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              3. Vista Previa
            </h3>
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm mb-2">
                <strong>{datosPreview.length} empleados</strong> listos para importar:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {datosPreview.slice(0, 5).map((emp, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {emp.cedula} - {emp.nombres} {emp.apellidos} ({emp.funcion})
                  </div>
                ))}
                {datosPreview.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ... y {datosPreview.length - 5} más
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={importarEmpleados}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {datosPreview.length} Empleados
                  </>
                )}
              </Button>
              <Button onClick={limpiarSeleccion} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Las cédulas deben ser únicas. Los empleados con cédulas duplicadas serán omitidos automáticamente.
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
};