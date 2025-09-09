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
      cedula: "001-1771752-0",
      nombres: "Andres",
      apellidos: "Bertran",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1951-04-27",
      direccion: "N/A",
      telefonos: "N/A",
      fecha_ingreso: "2018-06-07"
    },
    {
      cedula: "001-1814327-0",
      nombres: "Jissell",
      apellidos: "Daleymi",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1987-04-11",
      direccion: "N/A",
      telefonos: "N/A",
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
    },
    {
      cedula: "020-0017730-9",
      nombres: "Carmen Elizabeth",
      apellidos: "Perez Perez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1990-01-06",
      direccion: "Calle Francisco Febrillet 27, Villa Faro Santo Domingo Este R.D",
      telefonos: "809-461-6931",
      fecha_ingreso: "2022-04-21"
    },
    {
      cedula: "099-0004449-7",
      nombres: "Sonyer Pascual",
      apellidos: "Montero Ramirez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1989-12-25",
      direccion: "Calle Gioconda, Los Trinitarios no. 38, Villa Mella Santo Domingo Norte R.D",
      telefonos: "829-682-1600",
      fecha_ingreso: "2022-08-11"
    },
    {
      cedula: "001-1213173-5",
      nombres: "Teofilo",
      apellidos: "Diaz Perez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1972-03-05",
      direccion: "Calle 5, No. 05 La Paz Punta de Villa Mella, Sto Dgo Norte.",
      telefonos: "809-973-0053",
      fecha_ingreso: "2022-08-30"
    },
    {
      cedula: "001-1103297-5",
      nombres: "Maria Ysabel",
      apellidos: "Betance Ramos",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1973-09-14",
      direccion: "Calle Duarte no. 61 Brisa del Este, Santo Domingo Este R.D",
      telefonos: "809-769-6328",
      fecha_ingreso: "2023-01-16"
    },
    {
      cedula: "001-0515753-1",
      nombres: "Antonio",
      apellidos: "Cross Agramonte",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1965-04-01",
      direccion: "Calle Simon Bolivar no. 54, Sector Simon Bolivar Santo Domingo Norte RD",
      telefonos: "829-447-8789",
      fecha_ingreso: "2023-02-03"
    },
    {
      cedula: "001-1584780-8",
      nombres: "Elvis",
      apellidos: "Dominguez Contreras",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1978-09-21",
      direccion: "Calle Rosa Duarte no. 02, Sector Los Tres Brazos Sto Dgo Este R.D",
      telefonos: "829-464-0231",
      fecha_ingreso: "2023-09-02"
    },
    {
      cedula: "402-2800286-7",
      nombres: "Joma Antonio",
      apellidos: "Perez Montero",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1995-09-03",
      direccion: "Calle Orlando Martinez no. 113, Los Tres Brazos Santo Domingo Este R.D",
      telefonos: "849-330-9001",
      fecha_ingreso: "2023-09-02"
    },
    {
      cedula: "001-0547477-9",
      nombres: "Juan Antonio",
      apellidos: "Reyes Santana",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1965-06-01",
      direccion: "Calle peatonal 6 no. 15, 3ra planta, Los Praditos Sto. Dgo.",
      telefonos: "829-920-9304",
      fecha_ingreso: "2023-09-15"
    },
    {
      cedula: "225-0087221-7",
      nombres: "Francisco Antonio",
      apellidos: "Feliz",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1991-12-07",
      direccion: "Calle, la gioconda callejon C, Villa Mella Santo Domingo Norte R.D",
      telefonos: "809-304-8138",
      fecha_ingreso: "2024-03-01"
    },
    {
      cedula: "001-1757080-4",
      nombres: "Renol",
      apellidos: "Madis Hernandez",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1983-09-02",
      direccion: "calle, el Almendro, San Felipe Villa mella, Santo Domingo Norte.",
      telefonos: "809-702-3871",
      fecha_ingreso: "2024-04-11"
    },
    {
      cedula: "001-1133720-0",
      nombres: "Pedro",
      apellidos: "Torres Marte",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1966-10-10",
      direccion: "Calle: Francisco del Rosario, no. Barrio san pedro, La Victoria, Santo Domingo Norte R.D",
      telefonos: "829-319-0238",
      fecha_ingreso: "2024-07-05"
    },
    {
      cedula: "082-0025230-5",
      nombres: "Francis Nathanael",
      apellidos: "Vallejo Rodriguez",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1987-02-02",
      direccion: "Calle: Libertad, Sector el callejon, Yaguate, S,C, R.D",
      telefonos: "849-249-0212",
      fecha_ingreso: "2024-11-23"
    },
    {
      cedula: "027-0044619-4",
      nombres: "Reyes",
      apellidos: "Silvestre Muñoz",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1989-05-05",
      direccion: "Calle: La Gioconda No.02 Villa Mella, Santo Domingo R.D",
      telefonos: "809-839-0594",
      fecha_ingreso: "2024-12-02"
    },
    {
      cedula: "001-1188824-4",
      nombres: "Tony",
      apellidos: "Santana",
      funcion: "Operador de control y asistencia",
      fecha_nacimiento: "1970-07-25",
      direccion: "Calle: Central esquina duarte 31, el Tamarindo Santo Domingo Este",
      telefonos: "829-846-8982",
      fecha_ingreso: "2024-12-03"
    },
    {
      cedula: "001-1761652-4",
      nombres: "Carlos Guarionex",
      apellidos: "Garcia Gonzalez",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1984-05-18",
      direccion: "Calle Primera los coquitos No. 24 Villa mella, Santo Domingo Norte",
      telefonos: "849-220-9148",
      fecha_ingreso: "2024-12-07"
    },
    {
      cedula: "402-0253510-6",
      nombres: "Genny Naomi",
      apellidos: "de Peña Flores",
      funcion: "Recepcionista",
      fecha_nacimiento: "2006-01-12",
      direccion: "Calle: Las Enfermeras No. 1, Los mina, Santo Domingo Este",
      telefonos: "829-357-2741",
      fecha_ingreso: "2024-12-09"
    },
    {
      cedula: "012-0019607-7",
      nombres: "Francisco",
      apellidos: "Turbi Presinal",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1973-12-13",
      direccion: "Calle: las Damas no. 7, los tres brazos Santo Domingo Este",
      telefonos: "829-794-2907",
      fecha_ingreso: "2025-01-08"
    },
    {
      cedula: "001-1598928-7",
      nombres: "Roberto",
      apellidos: "Jimenez Frias",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1967-05-15",
      direccion: "Calle: Anacaona 1era Barrio punta de Villa mella, Santo Domingo Norte",
      telefonos: "809994-6119",
      fecha_ingreso: "2025-01-01"
    },
    {
      cedula: "402-5182505-1",
      nombres: "Ezequiel",
      apellidos: "de los Santos Rene",
      funcion: "Operador CCTV",
      fecha_nacimiento: "2002-08-08",
      direccion: "Calle: Santo Domingo Norte, los Arquianos de Villa Mella",
      telefonos: "829-426-3636",
      fecha_ingreso: "2025-01-16"
    },
    {
      cedula: "225-0089297-5",
      nombres: "Eliadis Antonio",
      apellidos: "Marine Mañon",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1995-07-19",
      direccion: "Calle: Progreso no. 14 Sabana Perdida Santo Domingo Norte",
      telefonos: "849-506-4140",
      fecha_ingreso: "2025-01-16"
    },
    {
      cedula: "001-0646145-2",
      nombres: "Juan",
      apellidos: "Duran Ferreras",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1960-01-28",
      direccion: "Calle: Peatonal, no. 17 a. Villa Liberacion Santo Domingo Norte",
      telefonos: "809-417-2566",
      fecha_ingreso: "2025-01-23"
    },
    {
      cedula: "001-1090007-3",
      nombres: "Robert",
      apellidos: "Ventura Ramirez",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1974-06-21",
      direccion: "Calle: Respaldo 9, Casa no. 40, sector Villa Mella, Santo Domingo Norte",
      telefonos: "849-436-2174",
      fecha_ingreso: "2025-02-17"
    },
    {
      cedula: "090-0015738-9",
      nombres: "Juan",
      apellidos: "Valoy Pierre",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1976-12-30",
      direccion: "Calle: C/ 28 sector la amet, Villa mella, Santo Domingo Norte.",
      telefonos: "849-629-8818",
      fecha_ingreso: "2025-03-26"
    },
    {
      cedula: "002-0165768-1",
      nombres: "Jahrol Deybi",
      apellidos: "Rafael Aguasviva",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1988-08-25",
      direccion: "Calle: Barrio invi os mina, no.54 parte atrás",
      telefonos: "809-449-0931",
      fecha_ingreso: "2025-04-10"
    },
    {
      cedula: "223-0171125-9",
      nombres: "Jennifer",
      apellidos: "Victoriano",
      funcion: "Oficial de Seguridad",
      fecha_nacimiento: "1994-11-03",
      direccion: "Calle; 41 sector los mina casa No. 44",
      telefonos: "",
      fecha_ingreso: "2025-04-16"
    },
    {
      cedula: "010-0059020-6",
      nombres: "Bienvenido",
      apellidos: "Ramirez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1971-01-26",
      direccion: "Calle; la fuente casa No. 46 sector los tres brazos",
      telefonos: "",
      fecha_ingreso: "2025-04-23"
    },
    {
      cedula: "001-0141314-4",
      nombres: "Rafael",
      apellidos: "Santana Rodriguez",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1982-05-25",
      direccion: "Calle: rogelio roselle apto. 303 nayona santo domigo oeste",
      telefonos: "",
      fecha_ingreso: "2025-05-22"
    },
    {
      cedula: "023-0141904-6",
      nombres: "Francisco",
      apellidos: "Viola",
      funcion: "Oficial De Seguridad",
      fecha_nacimiento: "1974-12-27",
      direccion: "Calle: ceiba sector de los creto de villa mella",
      telefonos: "",
      fecha_ingreso: "2025-05-29"
    },
    {
      cedula: "220-0019406-7",
      nombres: "Raisa",
      apellidos: "Nuñez Acevedo",
      funcion: "OFICIAL DE SEGURIDAD",
      fecha_nacimiento: "1981-03-31",
      direccion: "vista vella calle no. 29 villa mella",
      telefonos: "",
      fecha_ingreso: "2025-07-16"
    },
    {
      cedula: "001-1655502-0",
      nombres: "Gregory",
      apellidos: "Argelis Casilla",
      funcion: "OFICIAL DE SEGURIDAD",
      fecha_nacimiento: "1978-09-18",
      direccion: "Callle ensache espanal herrera",
      telefonos: "",
      fecha_ingreso: "2025-07-02"
    },
    {
      cedula: "402-0970435-8",
      nombres: "Angel",
      apellidos: "Matos Estevez",
      funcion: "OFICIAL DE SEGURIDAD",
      fecha_nacimiento: "2002-05-29",
      direccion: "Calle: sanchez ramirez no. 40 sector villa mella",
      telefonos: "",
      fecha_ingreso: "2025-08-07"
    },
    {
      cedula: "402-3530391-0",
      nombres: "Natanael",
      apellidos: "Heredia Guzman",
      funcion: "OFICIAL DE SEGURIDAD",
      fecha_nacimiento: "1997-12-04",
      direccion: "Calle: juan sanchez ramirez no. 40 sector villa mella",
      telefonos: "",
      fecha_ingreso: "2025-08-12"
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