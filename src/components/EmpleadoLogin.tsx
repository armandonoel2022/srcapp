import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEmpleadoAuth } from '@/hooks/useEmpleadoAuth';
import { Eye, EyeOff, LogIn, Lock, KeyRound } from 'lucide-react';

interface EmpleadoLoginProps {
  onSuccess: () => void;
}

export const EmpleadoLogin = ({ onSuccess }: EmpleadoLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetCedula, setResetCedula] = useState('');
  const { loginEmpleado, resetPassword, loading } = useEmpleadoAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) return;

    const result = await loginEmpleado(username, password);
    if (result.success) {
      onSuccess();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetUsername || !resetCedula) return;

    const result = await resetPassword(resetUsername, resetCedula);
    if (result.success) {
      setShowResetDialog(false);
      setResetUsername('');
      setResetCedula('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Lock className="h-6 w-6" />
            Acceso Empleados
          </CardTitle>
          <p className="text-muted-foreground">
            Ingrese sus credenciales para registrar turnos
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !username || !password}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <Button
            variant="link"
            className="w-full mt-2"
            onClick={() => setShowResetDialog(true)}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            ¿Olvidaste tu contraseña?
          </Button>
          
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-center">
            <p className="font-medium">Credenciales por defecto:</p>
            <p>Contraseña temporal: <code>SRC_Agente2025</code></p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recuperar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu usuario y cédula para restablecer tu contraseña
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-username">Usuario</Label>
              <Input
                id="reset-username"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                placeholder="Tu nombre de usuario"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="reset-cedula">Cédula</Label>
              <Input
                id="reset-cedula"
                value={resetCedula}
                onChange={(e) => setResetCedula(e.target.value)}
                placeholder="Tu número de cédula"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetUsername('');
                  setResetCedula('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading || !resetUsername || !resetCedula}
              >
                Restablecer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};