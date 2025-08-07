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
      <div ref={ref} className="print-document">
        {/* Print Header */}
        <div className="print-document-header">
          <div className="flex flex-col items-center mb-8">
            <img 
              src={srcLogo} 
              alt="SRC Logo" 
              className="w-20 h-20 mb-4"
            />
            <h1 className="text-2xl font-bold font-poppins text-center leading-tight" style={{ color: "hsl(var(--title-dark))" }}>
              CONTROL DE ACCESO DIARIO EN PUESTO<br />
              RESIDENCIA DE FRANCIA
            </h1>
            <div className="mt-4 text-base text-center space-y-1">
              <p><strong>Fecha de Impresión:</strong> {fechaFormateada}</p>
              {formatearRangoFecha() && (
                <p><strong>Período:</strong> {formatearRangoFecha()}</p>
              )}
              {filtroNombre && (
                <p><strong>Filtro aplicado:</strong> {filtroNombre}</p>
              )}
              <p><strong>Total de registros:</strong> {registros.length}</p>
            </div>
          </div>
        </div>

        {/* Print Table */}
        <div className="print-data-table">
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className="print-blue-header">
                <TableHead className="print-blue-th">Agente de Seguridad</TableHead>
                <TableHead className="print-blue-th">Puesta de Servicio</TableHead>
                <TableHead className="print-blue-th">Fin de Servicio</TableHead>
                <TableHead className="print-blue-th">Nombre</TableHead>
                <TableHead className="print-blue-th">Apellido</TableHead>
                <TableHead className="print-blue-th">Función</TableHead>
                <TableHead className="print-blue-th">Cédula/Pasaporte</TableHead>
                <TableHead className="print-blue-th">Matrícula</TableHead>
                <TableHead className="print-blue-th">Fecha</TableHead>
                <TableHead className="print-blue-th">Hora</TableHead>
                <TableHead className="print-blue-th">Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro, index) => (
                <TableRow 
                  key={registro.id} 
                  className={index % 2 === 0 ? "print-data-row-even" : "print-data-row-odd"}
                >
                  <TableCell className="print-data-cell">{registro.seguridad}</TableCell>
                  <TableCell className="print-data-cell">{formatearHoraSimple(registro.servicio)}</TableCell>
                  <TableCell className="print-data-cell">{formatearHoraSimple(registro.fin_servicio)}</TableCell>
                  <TableCell className="print-data-cell">{registro.nombre}</TableCell>
                  <TableCell className="print-data-cell">{registro.apellido}</TableCell>
                  <TableCell className="print-data-cell">{registro.funcion}</TableCell>
                  <TableCell className="print-data-cell">{registro.cedula}</TableCell>
                  <TableCell className="print-data-cell">{registro.matricula}</TableCell>
                  <TableCell className="print-data-cell">{formatearFecha(registro.fecha)}</TableCell>
                  <TableCell className="print-data-cell">{formatearHora(registro.hora)}</TableCell>
                  <TableCell className="print-data-cell">{registro.tipo}</TableCell>
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