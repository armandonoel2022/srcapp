import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmpleadoAuth } from '@/hooks/useEmpleadoAuth';
import { Eye, EyeOff, Save } from 'lucide-react';

interface EmpleadoPasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
}

export const EmpleadoPasswordChangeModal = ({ isOpen, onClose, isRequired = false }: EmpleadoPasswordChangeModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { changePassword, loading } = useEmpleadoAuth();

  const handlePasswordChange = async () => {
    console.log('🚀 BOTÓN CLICKEADO - handlePasswordChange ejecutado');
    
    if (newPassword !== confirmPassword) {
      console.log('❌ Contraseñas no coinciden');
      alert('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      console.log('❌ Contraseña muy corta');
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    console.log('✅ Validaciones pasadas, llamando changePassword...');
    try {
      const result = await changePassword(newPassword);
      console.log('📤 Resultado:', result);
      
      if (result && result.success) {
        console.log('✅ Contraseña cambiada exitosamente');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        console.log('❌ Error al cambiar contraseña');
        alert('Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('💥 Error:', error);
      alert('Error inesperado: ' + error);
    }
  };

  const handleClose = () => {
    if (isRequired) return;
    onClose();
  };

  const isFormValid = newPassword === confirmPassword && newPassword.length >= 6;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            {isRequired ? 'Cambio de Contraseña Requerido' : 'Cambiar Contraseña'}
          </h2>
        </div>
        
        {isRequired && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              Debe cambiar su contraseña temporal antes de continuar.
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
          )}

          <div className="flex gap-2 mt-6">
            {!isRequired && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="button"
              disabled={!isFormValid || loading}
              className={`${isRequired ? "w-full" : "flex-1"} bg-blue-600 hover:bg-blue-700 text-white`}
              onClick={handlePasswordChange}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};