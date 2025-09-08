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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted', { newPassword, confirmPassword });
    
    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      console.log('Password too short');
      return;
    }

    console.log('Attempting to change password...');
    const result = await changePassword(newPassword);
    console.log('Change password result:', result);
    
    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  const handleClose = () => {
    if (isRequired) return; // No permitir cerrar si es requerido
    onClose();
  };

  const isFormValid = newPassword === confirmPassword && newPassword.length >= 6;
  console.log('Form validation:', { newPassword, confirmPassword, isFormValid, passwordsMatch: newPassword === confirmPassword, minLength: newPassword.length >= 6 });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRequired ? 'Cambio de Contraseña Requerido' : 'Cambiar Contraseña'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRequired && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Debe cambiar su contraseña temporal antes de continuar.
              </p>
            </div>
          )}
          
          <div>
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
          )}

          <div className="flex gap-2">
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
              className={isRequired ? "w-full" : "flex-1"}
              onClick={async () => {
                console.log('Button clicked directly');
                
                if (newPassword !== confirmPassword) {
                  console.log('Passwords do not match');
                  return;
                }

                if (newPassword.length < 6) {
                  console.log('Password too short');
                  return;
                }

                console.log('Attempting to change password...');
                const result = await changePassword(newPassword);
                console.log('Change password result:', result);
                
                if (result.success) {
                  setNewPassword('');
                  setConfirmPassword('');
                  onClose();
                }
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};