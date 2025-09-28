import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

interface PatternAlertProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  mensaje: string;
}

export const PatternAlert = ({ show, onConfirm, onCancel, mensaje }: PatternAlertProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-red-600 text-white rounded-lg shadow-xl max-w-md w-full p-6 animate-pulse border-4 border-red-400">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-300" />
          <h2 className="text-xl font-bold">⚠️ PATRÓN IRREGULAR DETECTADO</h2>
        </div>
        
        <Alert className="mb-4 bg-red-700 border-red-500 text-white">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-white">
            {mensaje}
          </AlertDescription>
        </Alert>

        <div className="bg-red-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="font-semibold text-sm">Recomendación:</span>
          </div>
          <p className="text-sm">
            A continuacion se registrara la salida
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Registrar salida pendiente
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