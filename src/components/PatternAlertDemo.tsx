import React, { useState } from 'react';
import { PatternAlert } from '@/components/PatternAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const PatternAlertDemo = () => {
  const [showAlert, setShowAlert] = useState(false);

  const mensajeDemo = "⚠️ DETECTADO: Tienes 2 entrada(s) del día anterior sin registrar salida. Si estás llegando HOY, esto debería ser una ENTRADA del nuevo día.";

  const handleConfirm = () => {
    setShowAlert(false);
    alert('Usuario confirmó continuar con el registro');
  };

  const handleCancel = () => {
    setShowAlert(false);
    alert('Usuario canceló el registro');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Demostración del Overlay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Este es el overlay rojo que aparece cuando se detecta un patrón irregular en los registros.
          </p>
          
          <Button 
            onClick={() => setShowAlert(true)}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Mostrar Overlay de Alerta
          </Button>
          
          <div className="mt-4 text-xs text-gray-600">
            <p><strong>Cuándo aparece:</strong></p>
            <ul className="list-disc list-inside mt-1">
              <li>Usuario intenta hacer SALIDA en nuevo día</li>
              <li>Hay entradas sin salida del día anterior</li>
              <li>Es el primer registro del nuevo día</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* El overlay */}
      <PatternAlert
        show={showAlert}
        mensaje={mensajeDemo}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};