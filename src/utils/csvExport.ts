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

export const exportToCSV = (
  registros: Registro[], 
  formatoHora: string,
  filtroNombre?: string,
  fechaInicio?: string,
  fechaFin?: string
) => {
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

  // Headers del CSV
  const headers = [
    'Agente de Seguridad',
    'Puesta de Servicio', 
    'Fin de Servicio',
    'Nombre',
    'Apellido',
    'Función',
    'Cédula/Pasaporte',
    'Matrícula',
    'Fecha',
    'Hora',
    'Tipo'
  ];

  // Convertir registros a filas CSV
  const rows = registros.map(registro => [
    registro.seguridad,
    formatearHoraSimple(registro.servicio),
    formatearHoraSimple(registro.fin_servicio),
    registro.nombre,
    registro.apellido,
    registro.funcion,
    registro.cedula,
    registro.matricula,
    formatearFecha(registro.fecha),
    formatearHora(registro.hora),
    registro.tipo
  ]);

  // Combinar headers y rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => {
      // Escapar comillas y envolver en comillas si contiene comas
      const escaped = String(field || '').replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
        ? `"${escaped}"` 
        : escaped;
    }).join(','))
    .join('\n');

  // Crear y descargar archivo
  const fechaActual = new Date();
  const timestamp = fechaActual.toISOString().split('T')[0]; // YYYY-MM-DD
  
  let filename = `control_acceso_${timestamp}`;
  
  if (filtroNombre) {
    filename += `_filtro_${filtroNombre.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  
  if (fechaInicio && fechaFin) {
    filename += `_${fechaInicio}_${fechaFin}`;
  }
  
  filename += '.csv';

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};