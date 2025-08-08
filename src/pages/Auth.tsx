import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/ui/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUp 
        ? await signUp(username, password)
        : await signIn(username, password);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Éxito",
          description: isSignUp 
            ? "Usuario registrado exitosamente" 
            : "Inicio de sesión exitoso"
        });
        navigate('/');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createInitialUsers = async () => {
    setCreatingUsers(true);
    try {
      const response = await supabase.functions.invoke('create-admin-users');
      
      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Usuarios creados",
        description: "Los usuarios administrador y agente han sido creados exitosamente. Ya puedes iniciar sesión."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al crear usuarios: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setCreatingUsers(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ background: "var(--gradient-blue-form)" }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6"
             style={{ boxShadow: "var(--shadow-form)" }}>
          
          {/* Logo SRC */}
          <div className="text-center space-y-4">
            <img 
              src="/src/assets/src-logo.png" 
              alt="SRC Logo" 
              className="w-10 h-10 mx-auto"
            />
            <h1 className="text-2xl font-bold text-[hsl(var(--title-dark))]">
              {isSignUp ? "Registrarse" : "Iniciar Sesión"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario:</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña:</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              style={{ 
                background: "var(--gradient-blue-form)",
                transition: "var(--transition-smooth)"
              }}
              disabled={loading}
            >
              {loading ? "Cargando..." : (isSignUp ? "Registrarse" : "Iniciar Sesión")}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "¿Ya tienes cuenta? Iniciar Sesión" : "¿No tienes cuenta? Registrarse"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};