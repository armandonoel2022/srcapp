import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateLocationForWork, type LocationCoordinates } from '@/utils/locationValidation';

interface TurnoData {
  empleado_id: string;
  fecha: string;
  hora_entrada?: string;
  hora_salida?: string;
  ubicacion_entrada?: { lat: number; lng: number };
  ubicacion_salida?: { lat: number; lng: number };
}

interface EstadoTurno {
  estado: 'sin_entrada' | 'entrada_registrada' | 'completo' | 'error';
  turno: any;
}

export const useTurnos = () => {
  const [loading, setLoading] = useState(false);
  const [showPatternAlert, setShowPatternAlert] = useState(false);
  const [patternMessage, setPatternMessage] = useState('');
  const [pendingRegistro, setPendingRegistro] = useState<TurnoData | null>(null);
  const [pendingEntryInfo, setPendingEntryInfo] = useState<any>(null);
  const [processingPattern, setProcessingPattern] = useState(false);
  const { toast } = useToast();

  const verificarPatronRegistros = async (empleadoId: string, fecha: string): Promise<{
    necesitaAlerta: boolean;
    mensaje?: string;
    tipo?: 'entrada_faltante' | 'salida_faltante' | 'normal';
  }> => {
    try {
      // Obtener fecha anterior
      const fechaAnterior = new Date(fecha);
      fechaAnterior.setDate(fechaAnterior.getDate() - 1);
      const fechaAnteriorStr = fechaAnterior.toISOString().split('T')[0];

      // Verificar registros del día anterior
      const { data: registrosAyer, error: errorAyer } = await supabase
        .from('turnos_empleados')
        .select('hora_entrada, hora_salida, created_at')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fechaAnteriorStr)
        .order('created_at', { ascending: false });

      if (errorAyer) throw errorAyer;

      // Verificar registros de hoy
      const { data: registrosHoy, error: errorHoy } = await supabase
        .from('turnos_empleados')
        .select('hora_entrada, hora_salida, created_at')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha)
        .order('created_at', { ascending: false });

      if (errorHoy) throw errorHoy;

      // Si hay registros de ayer, verificar si tiene salidas pendientes
      if (registrosAyer && registrosAyer.length > 0) {
        const entradasSinSalida = registrosAyer.filter(r => r.hora_entrada && !r.hora_salida);
        
        if (entradasSinSalida.length > 0 && (!registrosHoy || registrosHoy.length === 0)) {
          // Hay entradas sin salida de ayer y es el primer registro de hoy
          return {
            necesitaAlerta: true,
            tipo: 'salida_faltante',
            mensaje: `A continuacion se registrara la salida`
          };
        }
      }

      return { necesitaAlerta: false, tipo: 'normal' };
    } catch (error: any) {
      console.error('Error verificando patrón de registros:', error);
      return { necesitaAlerta: false, tipo: 'normal' };
    }
  };

  const registrarTurno = async (data: TurnoData): Promise<{ success: boolean; message?: string; turnoId?: string }> => {
    setLoading(true);
    try {
      // Obtener información del empleado para validar ubicación
      const { data: empleadoData, error: empleadoError } = await supabase
        .from('empleados_turnos')
        .select('lugar_designado')
        .eq('id', data.empleado_id)
        .single();

      if (empleadoError) {
        throw new Error('No se pudo obtener la información del empleado');
      }

      // VALIDACIÓN REAL DE UBICACIÓN - MODO PRODUCCIÓN
      if ((data.ubicacion_entrada || data.ubicacion_salida) && empleadoData.lugar_designado) {
        const currentLocation: LocationCoordinates = data.ubicacion_entrada || data.ubicacion_salida!;
        const validationResult = await validateLocationForWork(currentLocation, data.empleado_id);
        
        if (!validationResult.isValid) {
          // BLOQUEAR registro si no está en ubicación válida
          throw new Error(`UBICACIÓN INVÁLIDA: ${validationResult.message}`);
        } else {
          toast({
            title: "Ubicación Verificada",
            description: validationResult.message,
          });
        }
        
        console.log(`Validación de ubicación: ${validationResult.message}`);
      } else if (!empleadoData.lugar_designado) {
        // Si el empleado no tiene lugar designado, no puede hacer punch
        throw new Error('No tienes una ubicación designada asignada. Contacta al administrador para configurar tu lugar de trabajo.');
      }

      // Determinar si existe una ENTRADA sin SALIDA de días anteriores (no del mismo día)
      const { data: entradaPendiente, error: searchError } = await supabase
        .from('turnos_empleados')
        .select('id, fecha, created_at, hora_entrada, foto_entrada')
        .eq('empleado_id', data.empleado_id)
        .is('hora_salida', null)
        .lt('fecha', data.fecha) // Solo considerar fechas anteriores al día actual
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (searchError) throw searchError;

      if (entradaPendiente) {
        // Formatear fecha y hora para mostrar
        const fechaEntrada = new Date(entradaPendiente.fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const horaEntrada = entradaPendiente.hora_entrada;
        
        // Mostrar overlay indicando que se registrará la SALIDA pendiente
        setPatternMessage(`Tienes 1 entrada del día anterior sin registrar salida. Si estás llegando hoy, esto debería ser una ENTRADA del nuevo día.`);
        setPendingEntryInfo({
          ...entradaPendiente,
          fechaFormateada: fechaEntrada,
          horaEntrada: horaEntrada
        });
        setPendingRegistro(data);
        setShowPatternAlert(true);
        return { success: false, message: 'Salida pendiente detectada. Confirma para continuar.' };
      }

      // Si no hay pendiente global, continuar como ENTRADA nueva
      const patron = await verificarPatronRegistros(data.empleado_id, data.fecha);
      
      let tipoRegistroDetectado: 'entrada' | 'salida' = 'entrada';
      
      // Procesar registro directamente
      return await procesarRegistroInterno(data, tipoRegistroDetectado, undefined);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al registrar turno: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const procesarRegistroInterno = async (data: TurnoData, tipoRegistro: 'entrada' | 'salida', entradaSinSalida?: any) => {
    try {
      if (tipoRegistro === 'entrada') {
        // SALVAGUARDA: si existe una ENTRADA pendiente, registrar SALIDA en su lugar
        const { data: pendiente } = await supabase
          .from('turnos_empleados')
          .select('id, fecha, created_at')
          .eq('empleado_id', data.empleado_id)
          .is('hora_salida', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendiente) {
          const { error: updError } = await supabase
            .from('turnos_empleados')
            .update({
              hora_salida: data.hora_salida,
              ubicacion_salida: data.ubicacion_salida ? 
                `(${data.ubicacion_salida.lat},${data.ubicacion_salida.lng})` : null
            })
            .eq('id', pendiente.id);

          if (updError) throw updError;

          toast({
            title: "Salida registrada",
            description: "Se registró tu salida correctamente",
            variant: "default"
          });

          return { success: true, turnoId: pendiente.id };
        }

        // REGISTRAR ENTRADA (no hay pendiente)
        const { data: turnoData, error } = await supabase
          .from('turnos_empleados')
          .insert({
            empleado_id: data.empleado_id,
            fecha: data.fecha,
            hora_entrada: data.hora_entrada,
            ubicacion_entrada: data.ubicacion_entrada ? 
              `(${data.ubicacion_entrada.lat},${data.ubicacion_entrada.lng})` : null,
            tipo_registro: 'entrada'
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Entrada registrada",
          description: "Se registró tu entrada correctamente",
          variant: "default"
        });

        return { success: true, turnoId: turnoData.id };

      } else {
        // REGISTRAR SALIDA - Actualizar el registro de entrada existente
        const { error } = await supabase
          .from('turnos_empleados')
          .update({
            hora_salida: data.hora_salida,
            ubicacion_salida: data.ubicacion_salida ? 
              `(${data.ubicacion_salida.lat},${data.ubicacion_salida.lng})` : null
          })
          .eq('id', entradaSinSalida!.id);

        if (error) throw error;

        toast({
          title: "Salida registrada",
          description: "Se registró tu salida correctamente",
          variant: "default"
        });

        return { success: true, turnoId: entradaSinSalida!.id };
      }
    } catch (error: any) {
      throw error;
    }
  };

  const confirmarPatronRegistro = async () => {
    if (!pendingRegistro || processingPattern) return { success: false, message: 'No hay registro pendiente o ya se está procesando' };
    
    setProcessingPattern(true);
    
    try {
      const data = pendingRegistro;
      
      // Buscar entrada sin salida de CUALQUIER día (no solo hoy)
      const { data: entradaSinSalida } = await supabase
        .from('turnos_empleados')
        .select('id, fecha, created_at')
        .eq('empleado_id', data.empleado_id)
        .is('hora_salida', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const tipoRegistro = !entradaSinSalida ? 'entrada' : 'salida';
      const result = await procesarRegistroInterno(data, tipoRegistro, entradaSinSalida);
      
      // Solo cerrar el overlay si el procesamiento fue exitoso
      if (result.success) {
        setShowPatternAlert(false);
        setPendingRegistro(null);
        setPendingEntryInfo(null);
      }
      
      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al procesar registro: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, message: error.message };
    } finally {
      setProcessingPattern(false);
    }
  };

  const cancelarPatronRegistro = () => {
    setShowPatternAlert(false);
    setPendingRegistro(null);
    setPendingEntryInfo(null);
    setProcessingPattern(false);
  };

  const obtenerTurnos = async (fecha?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('turnos_empleados')
        .select(`
          *,
          empleados_turnos!turnos_empleados_empleado_id_fkey (
            nombres,
            apellidos,
            funcion,
            lugar_designado
          )
        `)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });

      if (fecha) {
        query = query.eq('fecha', fecha);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al obtener turnos: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const verificarEstadoTurno = async (empleadoId: string, fecha: string): Promise<EstadoTurno> => {
    try {
      // Obtener todos los registros del empleado para esta fecha
      const { data: turnos, error } = await supabase
        .from('turnos_empleados')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!turnos || turnos.length === 0) {
        return { estado: 'sin_entrada', turno: null };
      }

      // Verificar si hay alguna entrada sin salida
      const entradaSinSalida = turnos.find(turno => turno.hora_entrada && !turno.hora_salida);
      
      if (entradaSinSalida) {
        return { estado: 'entrada_registrada', turno: entradaSinSalida };
      }

      // Si todos los turnos tienen entrada y salida, está completo
      const turnoCompleto = turnos.find(turno => turno.hora_entrada && turno.hora_salida);
      if (turnoCompleto) {
        return { estado: 'completo', turno: turnos }; // Retornamos todos los turnos
      }

      return { estado: 'sin_entrada', turno: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al verificar estado: ${error.message}`,
        variant: "destructive"
      });
      return { estado: 'error', turno: null };
    }
  };

  const eliminarTurnosPrueba = async (empleadoId: string, fecha: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('turnos_empleados')
        .delete()
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha);

      if (error) throw error;

      toast({
        title: "Registros eliminados",
        description: "Los registros de prueba han sido eliminados. Puedes hacer nuevos punches.",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar registros: ${error.message}`,
        variant: "destructive"
      });
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    registrarTurno,
    obtenerTurnos,
    verificarEstadoTurno,
    eliminarTurnosPrueba,
    loading,
    showPatternAlert,
    patternMessage,
    pendingEntryInfo,
    processingPattern,
    confirmarPatronRegistro,
    cancelarPatronRegistro
  };
};