import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Users } from 'lucide-react';

interface EmpleadoImport {
  cedula: string;
  nombres: string;
  apellidos: string;
  funcion: string;
  fecha_nacimiento?: string;
  direccion?: string;
  telefonos?: string;
  fecha_ingreso?: string;
}

export const ImportacionMasivaEmpleados = () => {
  const [loading, setLoading] = useState(false);
  const [empleadosData, setEmpleadosData] = useState('');
  const { toast } = useToast();

  const empleadosListaCompleta: EmpleadoImport[] = [
    {
      cedula: "005-0030356-5",
      nombres: "Nelson",
      apellidos: "Laureano",
      funcion: "Gerente General",
      fecha_nacimiento: "1977-04-11",
      direccion: "C/Resp.8 no.11 Ens. Espaillat, Santo Dgo.",
      telefonos: "809-280-6704",
      fecha_ingreso: "2011-03-23"
    },
    {
      cedula: "076-0001016-4",
      nombres: "Manuel Antonio",
      apellidos: "Santana",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1954-04-15",
      direccion: "C/ 27 de Febrero No. 15 Pantoja, Santo Domingo",
      telefonos: "809-984-7041",
      fecha_ingreso: "2011-04-25"
    },
    {
      cedula: "001-0954223-3",
      nombres: "Fanny",
      apellidos: "Mendez Valdez",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1973-11-21",
      direccion: "C/ 3ra no. 29., Santa Cruz ,Villa Mella ,Santo Domingo Norte",
      telefonos: "829-388-5828",
      fecha_ingreso: "2016-01-29"
    },
    {
      cedula: "001-1588967-7",
      nombres: "William Enmanuel",
      apellidos: "de la Cruz Garcia",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1982-03-20",
      direccion: "C/ Jose Fabrea Esq. Rabelo No. 302 apart. 3 , Sector Villa Francisca",
      telefonos: "809-905-3695",
      fecha_ingreso: "2013-07-31"
    },
    {
      cedula: "001-0421990-2",
      nombres: "Elias",
      apellidos: "Beriguete Sanchez",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1965-01-03",
      direccion: "C/Paseo del Viento No.221, Los Rios Barrio la 800 Santo Domingo.",
      telefonos: "809-702-4079",
      fecha_ingreso: "2012-10-11"
    },
    {
      cedula: "001-1047441-8",
      nombres: "Antonio",
      apellidos: "Lorenzo",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1966-04-25",
      direccion: "C/ Sagrario Diaz No.68,parte atrás Bella Vista Barrio Semillero,de esta ciudad de Santo Dgo.",
      telefonos: "829-728-2038",
      fecha_ingreso: "2013-04-15"
    },
    {
      cedula: "012-0088563-8",
      nombres: "Paula",
      apellidos: "Mateo Turbi",
      funcion: "Conserje",
      fecha_nacimiento: "1979-04-30",
      direccion: "C/Principal No. 17 Manoguayabo",
      telefonos: "829-857-7417",
      fecha_ingreso: "2021-04-30"
    },
    {
      cedula: "223-0080908-8",
      nombres: "Yinett Patricia",
      apellidos: "Toribio Flores",
      funcion: "Aux. de Contabilidad",
      fecha_nacimiento: "1988-05-02",
      direccion: "Man. S Edif. 13 Apart.1 Piso 1, Los minas Sto. Dgo Este",
      telefonos: "809-513-0265",
      fecha_ingreso: "2016-02-22"
    },
    {
      cedula: "001-1025624-5",
      nombres: "Ramon Antonio",
      apellidos: "Sanchez Tejeda",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1959-11-14",
      direccion: "C /Resp. Yolanda Guzman No.7 Ens. Capotillo ,Santo Domingo",
      telefonos: "809-819-7731",
      fecha_ingreso: "2014-07-29"
    },
    {
      cedula: "001-1403536-3",
      nombres: "Cristian Antonio",
      apellidos: "Castillo Cambero",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1980-06-05",
      direccion: "C/ 1ra No. 41 Residencial Urb. Villa Laura,Villa Mella Santo Domingo Norte",
      telefonos: "829-750-5494",
      fecha_ingreso: "2018-03-03"
    },
    {
      cedula: "001-1813375-0",
      nombres: "Starlin",
      apellidos: "Rodriguez Duran",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1986-11-06",
      direccion: "C/ # 18 Jose Tapia Brea No. 210, Ensanche Quisqueya, Santo Domingo D:N RD",
      telefonos: "809-840-6428",
      fecha_ingreso: "2018-06-07"
    },
    {
      cedula: "017-0020056-9",
      nombres: "Domingo",
      apellidos: "Arias Guzman",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1974-04-21",
      direccion: "C/ Teo Cruz, No. 37 Los Frailes II, Las Americas Santo Domingo Este",
      telefonos: "809-395-0802",
      fecha_ingreso: "2019-12-09"
    },
    {
      cedula: "226-0005999-6",
      nombres: "Willian Heriberto",
      apellidos: "Guzman Nuñez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1987-11-17",
      direccion: "C/ Los Unidos, La Caleta Boca Chica No. 03 Santo Domingo Este",
      telefonos: "829-276-0598",
      fecha_ingreso: "2020-01-17"
    },
    {
      cedula: "001-1660247-5",
      nombres: "Carlos Natanael",
      apellidos: "Perez Montero",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1982-08-19",
      direccion: "Calle Miguel Perez No. 04, El Cafe De Herrera Santo Domingo Oeste R.D",
      telefonos: "809-667-4147",
      fecha_ingreso: "2020-08-08"
    },
    {
      cedula: "001-1909649-3",
      nombres: "Silvia Eugenia",
      apellidos: "Montero Montero",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1990-01-01",
      direccion: "C/ Respaldo Orlando Martinez No. 52, Rivera del Ozama, Los Tres Brazos Santo Domingo Este R.D",
      telefonos: "809-453-9931",
      fecha_ingreso: "2021-02-11"
    },
    {
      cedula: "001-1632362-7",
      nombres: "Francisco Alberto",
      apellidos: "Gonzalez Guzman",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1982-09-30",
      direccion: "Calle Respaldo 42 No. 79 El Capotillo",
      telefonos: "829-396-1940",
      fecha_ingreso: "2021-04-28"
    },
    {
      cedula: "005-0010823-8",
      nombres: "Bienvenido",
      apellidos: "Hernandez Jorge",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1952-11-20",
      direccion: "Calle Los Morenos, Esquina Primera, No. 10 Barrio Nuevo Amanecer Villa Mella Sto Dgo Norte",
      telefonos: "809-717-5274",
      fecha_ingreso: "2021-12-03"
    },
    {
      cedula: "402-2313951-6",
      nombres: "Cristian Leonid",
      apellidos: "Adams Jimenez",
      funcion: "Técnico en informática",
      fecha_nacimiento: "1993-04-24",
      direccion: "Autopista Duarte km 18, residencial Pablo Mella Morales, Manzana B Edif. 25, No. 101",
      telefonos: "809-270-2268",
      fecha_ingreso: "2021-12-29"
    },
    {
      cedula: "001-0911918-0",
      nombres: "Miguel Angel",
      apellidos: "Peña Victorino",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1969-12-22",
      direccion: "Respaldo 18 casa 15 Savica, Los Alcarrizos Santo Domingo Oeste R.D",
      telefonos: "829-564-0392",
      fecha_ingreso: "2022-02-02"
    },
    {
      cedula: "068-0028566-7",
      nombres: "Andres",
      apellidos: "Paulino Rodriguez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1962-11-17",
      direccion: "Calle Gioconda no. 03, Villa Mella Sto Dgo Norte.",
      telefonos: "829-922-3190",
      fecha_ingreso: "2022-04-05"
    }
  ];

  const importarEmpleadosMasivo = async () => {
    setLoading(true);
    try {
      let exitosos = 0;
      let errores = 0;
      
      for (const empleado of empleadosListaCompleta) {
        try {
          // Verificar si ya existe
          const { data: existente } = await supabase
            .from('empleados_turnos')
            .select('id')
            .eq('cedula', empleado.cedula)
            .single();

          if (existente) {
            console.log(`Empleado ${empleado.nombres} ${empleado.apellidos} ya existe`);
            continue;
          }

          // Separar nombres y apellidos si vienen juntos
          const nombresCompletos = empleado.nombres.trim();
          const apellidosCompletos = empleado.apellidos.trim();

          const { error } = await supabase
            .from('empleados_turnos')
            .insert({
              nombres: nombresCompletos,
              apellidos: apellidosCompletos,
              funcion: empleado.funcion,
              cedula: empleado.cedula,
              fecha_nacimiento: empleado.fecha_nacimiento || null,
              // Asignar horarios estándar por defecto
              hora_entrada_programada: empleado.funcion.includes('Seguridad') ? '08:00' : '09:00',
              hora_salida_programada: empleado.funcion.includes('Seguridad') ? '17:00' : '17:30'
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

      toast({
        title: "Importación completada",
        description: `${exitosos} empleados agregados exitosamente. ${errores} errores.`,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importación Masiva de Empleados
        </CardTitle>
        <CardDescription>
          Importar los empleados de la lista suministrada al sistema de turnos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-sm">
            <strong>{empleadosListaCompleta.length} empleados</strong> listos para importar
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Esta acción agregará todos los empleados de la lista al sistema de turnos con:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
            <li>Horarios programados por defecto (Seguridad: 8:00-17:00, Otros: 9:00-17:30)</li>
            <li>Los empleados existentes serán omitidos</li>
            <li>Se incluirán todos los datos disponibles (cédula, nombres, función, etc.)</li>
          </ul>
        </div>

        <Button 
          onClick={importarEmpleadosMasivo}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importando empleados...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importar {empleadosListaCompleta.length} Empleados
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};