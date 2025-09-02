import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, ArrowLeft, LogOut } from 'lucide-react';
import { PrintLayout } from './PrintLayout';
import { exportToCSV } from '@/utils/csvExport';
import { useRegistros } from '@/hooks/useRegistros';


interface ConsultaRegistrosProps {
  onNavigateToForm?: () => void;
}

interface Registro {
  id: string;
  fecha: string;
  hora: string;
  seguridad: string;
  agente: string;
  servicio: string;
  fin_servicio: string;
  nombre: string;
  apellido: string;
  funcion: string;
  cedula: string;
  matricula: string;
  tipo: string;
  tipo_persona: string;
}

export const ConsultaRegistros = ({ onNavigateToForm }: ConsultaRegistrosProps) => {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [formatoHora, setFormatoHora] = useState('12h');
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { guardarRegistro, obtenerUltimoAgente } = useRegistros();

  const cargarRegistros = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registros')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      // Aplicar filtros
      if (filtroNombre) {
        query = query.or(`nombre.ilike.%${filtroNombre}%,cedula.ilike.%${filtroNombre}%,matricula.ilike.%${filtroNombre}%`);
      }

      if (fechaInicio && fechaFin) {
        query = query.gte('fecha', fechaInicio).lte('fecha', fechaFin);
      } else if (fechaInicio) {
        query = query.gte('fecha', fechaInicio);
      } else if (fechaFin) {
        query = query.lte('fecha', fechaFin);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRegistros(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cargar registros: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const formatearHora = (hora: string) => {
    if (!hora) return '';
    
    if (formatoHora === '24h') {
      return hora;
    } else {
      const date = new Date(`2000-01-01T${hora}`);
      return date.toLocaleTimeString('es-ES', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  };

  const formatearHoraSimple = (hora: string) => {
    if (!hora) return '';
    
    if (formatoHora === '24h') {
      return hora.substring(0, 5); // HH:MM
    } else {
      const date = new Date(`2000-01-01T${hora}`);
      return date.toLocaleTimeString('es-ES', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatearFecha = (fecha: string) => {
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", 
                   "jul", "ago", "sep", "oct", "nov", "dic"];
    const date = new Date(fecha);
    return `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
  };

  const limpiarFiltros = () => {
    setFiltroNombre('');
    setFechaInicio('');
    setFechaFin('');
    setFormatoHora('12h');
    cargarRegistros();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportToCSV(registros, formatoHora, filtroNombre, fechaInicio, fechaFin);
    toast({
      title: "Exportación exitosa",
      description: "El archivo CSV se ha descargado correctamente",
    });
  };

  const handleRegistrarSalida = async (registro: Registro) => {
    try {
      // Obtener el último agente de seguridad
      const ultimoAgente = await obtenerUltimoAgente();
      
      if (!ultimoAgente) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del agente de seguridad",
          variant: "destructive"
        });
        return;
      }

      const datosSalida = {
        seguridad: ultimoAgente.seguridad,
        agente: ultimoAgente.agente,
        servicio: ultimoAgente.servicio,
        fin_servicio: ultimoAgente.fin_servicio,
        fecha: ultimoAgente.fecha,
        tipo_persona: registro.tipo_persona as "empleado" | "visitante",
        persona: {
          nombre: registro.nombre,
          apellido: registro.apellido,
          cedula: registro.cedula,
          matricula: registro.matricula,
          funcion: registro.funcion,
          tipo: registro.tipo_persona
        }
      };

      const resultado = await guardarRegistro(datosSalida);
      
      if (resultado.success) {
        toast({
          title: "Salida registrada",
          description: `${resultado.tipo} registrada exitosamente para ${registro.nombre} ${registro.apellido}`,
        });
        
        // Recargar los registros para mostrar la nueva salida
        cargarRegistros();
      } else {
        toast({
          title: "Error",
          description: resultado.error || "Error al registrar la salida",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al registrar salida: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const fechaActual = new Date();
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", 
                 "jul", "ago", "sep", "oct", "nov", "dic"];
  const fechaFormateada = `${fechaActual.getDate()} ${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header with Navigation */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-center flex-1 space-y-4">
          <img 
            src="/lovable-uploads/6f1746d0-0b44-447b-a333-82019dfecd73.png" 
            alt="SRC Logo" 
            className="w-24 h-24 mx-auto object-contain"
          />
          <h1 className="text-2xl font-bold">
            CONTROL DE ACCESO DIARIO EN PUESTO RESIDENCIA DE FRANCIA
          </h1>
          <p className="text-lg text-muted-foreground">
            Fecha: {fechaFormateada}
          </p>
        </div>
        
        {onNavigateToForm && (
          <Button 
            onClick={onNavigateToForm}
            variant="outline" 
            className="flex items-center gap-2 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Formulario
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="filtroNombre">Filtrar por Persona:</Label>
              <Input
                id="filtroNombre"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                placeholder="Nombre, cédula o matrícula"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha de Inicio:</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha de Fin:</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="formatoHora">Formato de Hora:</Label>
              <Select value={formatoHora} onValueChange={setFormatoHora}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Horas</SelectItem>
                  <SelectItem value="24h">24 Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={cargarRegistros} disabled={loading}>
                {loading ? "Filtrando..." : "Filtrar"}
              </Button>
              <Button variant="outline" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Registros */}
      <Card className="no-print">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-600 text-white">
                <TableRow>
                  <TableHead className="text-white">Agente de Seguridad</TableHead>
                  <TableHead className="text-white">Puesta de Servicio</TableHead>
                  <TableHead className="text-white">Fin de Servicio</TableHead>
                  <TableHead className="text-white">Nombre</TableHead>
                  <TableHead className="text-white">Apellido</TableHead>
                  <TableHead className="text-white">Función</TableHead>
                  <TableHead className="text-white">Cédula/Pasaporte</TableHead>
                  <TableHead className="text-white">Matrícula</TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white">Hora</TableHead>
                  <TableHead className="text-white">Tipo</TableHead>
                  <TableHead className="text-white">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro, index) => (
                  <TableRow 
                    key={registro.id} 
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <TableCell>{registro.seguridad}</TableCell>
                    <TableCell>{formatearHoraSimple(registro.servicio)}</TableCell>
                    <TableCell>{formatearHoraSimple(registro.fin_servicio)}</TableCell>
                    <TableCell>{registro.nombre}</TableCell>
                    <TableCell>{registro.apellido}</TableCell>
                    <TableCell>{registro.funcion}</TableCell>
                    <TableCell>{registro.cedula}</TableCell>
                    <TableCell>{registro.matricula}</TableCell>
                    <TableCell>{formatearFecha(registro.fecha)}</TableCell>
                    <TableCell>{formatearHora(registro.hora)}</TableCell>
                    <TableCell>{registro.tipo}</TableCell>
                    <TableCell>
                      {registro.tipo === 'entrada' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegistrarSalida(registro)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <LogOut className="w-3 h-3" />
                          Registrar Salida
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {registros.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Layout - Hidden on screen but visible when printing */}
      <div className="print-only">
        <PrintLayout 
          ref={printRef}
          registros={registros}
          formatoHora={formatoHora}
          filtroNombre={filtroNombre}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
        />
      </div>

      <div className="flex justify-center space-x-4 no-print">
        <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
};