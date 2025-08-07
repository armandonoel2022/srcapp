import { forwardRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import srcLogo from '@/assets/src-logo.png';

interface Registro {
  id: string;
  fecha: string;
  hora: string;
  seguridad: string;
  servicio: string;
  fin_servicio: string;
  nombre: string;
  apellido: string;
  funcion: string;
  cedula: string;
  matricula: string;
  tipo: string;
}

interface PrintLayoutProps {
  registros: Registro[];
  formatoHora: string;
  filtroNombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export const PrintLayout = forwardRef<HTMLDivElement, PrintLayoutProps>(
  ({ registros, formatoHora, filtroNombre, fechaInicio, fechaFin }, ref) => {
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

    const fechaActual = new Date();
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", 
                   "jul", "ago", "sep", "oct", "nov", "dic"];
    const fechaFormateada = `${fechaActual.getDate()} ${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;

    const formatearRangoFecha = () => {
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return `${inicio.getDate()} ${meses[inicio.getMonth()]} ${inicio.getFullYear()} - ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
      } else if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        return `Desde ${inicio.getDate()} ${meses[inicio.getMonth()]} ${inicio.getFullYear()}`;
      } else if (fechaFin) {
        const fin = new Date(fechaFin);
        return `Hasta ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
      }
      return null;
    };

    return (
      <div ref={ref} className="print-layout">
        {/* Print Header */}
        <div className="print-header">
          <div className="flex flex-col items-center mb-6">
            <img 
              src={srcLogo} 
              alt="SRC Logo" 
              className="w-16 h-16 mb-3"
            />
            <h1 className="text-xl font-bold font-poppins text-center leading-tight" style={{ color: "hsl(var(--title-dark))" }}>
              CONTROL DE ACCESO DIARIO EN PUESTO<br />
              RESIDENCIA DE FRANCIA
            </h1>
            <div className="mt-3 text-sm">
              <p className="font-semibold">Fecha de Impresión: {fechaFormateada}</p>
              {formatearRangoFecha() && (
                <p className="font-semibold">Período: {formatearRangoFecha()}</p>
              )}
              {filtroNombre && (
                <p className="font-semibold">Filtro aplicado: {filtroNombre}</p>
              )}
              <p className="font-semibold">Total de registros: {registros.length}</p>
            </div>
          </div>
        </div>

        {/* Print Table */}
        <div className="print-table">
          <Table>
            <TableHeader>
              <TableRow className="print-table-header">
                <TableHead className="print-th">Agente</TableHead>
                <TableHead className="print-th">Inicio</TableHead>
                <TableHead className="print-th">Fin</TableHead>
                <TableHead className="print-th">Nombre</TableHead>
                <TableHead className="print-th">Apellido</TableHead>
                <TableHead className="print-th">Función</TableHead>
                <TableHead className="print-th">Cédula</TableHead>
                <TableHead className="print-th">Matrícula</TableHead>
                <TableHead className="print-th">Fecha</TableHead>
                <TableHead className="print-th">Hora</TableHead>
                <TableHead className="print-th">Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro, index) => (
                <TableRow 
                  key={registro.id} 
                  className={index % 2 === 0 ? "print-row-even" : "print-row-odd"}
                >
                  <TableCell className="print-td">{registro.seguridad}</TableCell>
                  <TableCell className="print-td">{formatearHoraSimple(registro.servicio)}</TableCell>
                  <TableCell className="print-td">{formatearHoraSimple(registro.fin_servicio)}</TableCell>
                  <TableCell className="print-td">{registro.nombre}</TableCell>
                  <TableCell className="print-td">{registro.apellido}</TableCell>
                  <TableCell className="print-td">{registro.funcion}</TableCell>
                  <TableCell className="print-td">{registro.cedula}</TableCell>
                  <TableCell className="print-td">{registro.matricula}</TableCell>
                  <TableCell className="print-td">{formatearFecha(registro.fecha)}</TableCell>
                  <TableCell className="print-td">{formatearHora(registro.hora)}</TableCell>
                  <TableCell className="print-td">{registro.tipo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {registros.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            No hay registros para mostrar
          </div>
        )}
      </div>
    );
  }
);

PrintLayout.displayName = 'PrintLayout';