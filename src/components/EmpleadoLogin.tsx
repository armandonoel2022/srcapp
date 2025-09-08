import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEmpleadoAuth } from '@/hooks/useEmpleadoAuth';
import { Eye, EyeOff, LogIn, Lock } from 'lucide-react';

interface EmpleadoLoginProps {
  onSuccess: () => void;
}

export const EmpleadoLogin = ({ onSuccess }: EmpleadoLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { loginEmpleado, loading } = useEmpleadoAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) return;

    const result = await loginEmpleado(username, password);
    if (result.success) {
      onSuccess();
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
          
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-center">
            <p className="font-medium">Credenciales por defecto:</p>
            <p>Contraseña temporal: <code>SRC_Agente2025</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};