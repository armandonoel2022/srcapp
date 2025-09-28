import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

interface PatternAlertProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  mensaje: string;
  pendingEntryInfo?: {
    foto_entrada?: string;
    fechaFormateada?: string;
    horaEntrada?: string;
  };
}

export const PatternAlert = ({ show, onConfirm, onCancel, mensaje, pendingEntryInfo }: PatternAlertProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-red-600 text-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-pulse border-4 border-red-400">
        
        {/* Foto de entrada anterior */}
        {pendingEntryInfo?.foto_entrada && (
          <div className="mb-4 text-center">
            <img 
              src={pendingEntryInfo.foto_entrada} 
              alt="Foto de entrada anterior" 
              className="w-24 h-24 rounded-full mx-auto mb-2 border-4 border-yellow-300"
            />
            <p className="text-sm text-yellow-200">
              Esta es la imagen de tu registro anterior
            </p>
            <p className="text-xs text-yellow-100">
              Entrada: {pendingEntryInfo.fechaFormateada} a las {pendingEntryInfo.horaEntrada}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-300" />
          <h2 className="text-xl font-bold">⚠️ PATRÓN IRREGULAR DETECTADO</h2>
        </div>
        
        <Alert className="mb-4 bg-red-700 border-red-500 text-white">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            <strong>DETECTADO:</strong> {mensaje}
          </AlertDescription>
        </Alert>

        <div className="bg-red-700 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold mb-2">
            Presiona Continuar Registro para registrar la Salida.
          </p>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="font-semibold text-sm">RECOMENDACIÓN:</span>
          </div>
          <p className="text-sm">
            Vuelve a punchar para que se registre tu entrada de hoy.
          </p>
          <p className="text-sm font-bold mt-2 text-yellow-200">
            SE REGISTRARÁ LA SALIDA
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Continuar Registro
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-red-200">
            💡 Tip: Revisa tus registros anteriores en el dashboard para confirmar patrones
          </p>
        </div>
      </div>
    </div>
  );
};