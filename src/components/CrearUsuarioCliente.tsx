import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useToast } from '@/hooks/use-toast';

export const CrearUsuarioCliente = () => {
  const { createUserProfile, loading } = useUserProfiles();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string>('');

  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !username) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    const result = await createUserProfile(email, '', username, 'cliente');
    
    if (result.success) {
      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
        setShowPassword(true);
      }
      
      // Reset form
      setEmail('');
      setUsername('');
      setIsModalOpen(false);
      
      toast({
        title: "Usuario cliente creado",
        description: `Cliente ${username} creado exitosamente con acceso al mapa de calor`
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Usuario Cliente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Los usuarios cliente tendrán acceso únicamente al mapa de calor para visualizar datos de cumplimiento.
          </p>
        </CardHeader>
        <CardContent>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Usuario Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@empresa.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Cliente_Empresa"
                    required
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> El cliente será creado con la contraseña por defecto: <code>SRC_Cliente2025</code>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Se le pedirá cambiar la contraseña en su primer inicio de sesión.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creando...' : 'Crear Cliente'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información sobre Usuarios Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">Acceso Limitado</h4>
              <p className="text-sm text-muted-foreground">
                Los clientes solo pueden acceder al mapa de calor para visualizar datos de cumplimiento de turnos.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">Contraseña por Defecto</h4>
              <p className="text-sm text-muted-foreground">
                Todos los clientes son creados con la contraseña <code className="bg-gray-100 px-1 rounded">SRC_Cliente2025</code> y deben cambiarla en el primer acceso.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium">URL de Acceso</h4>
              <p className="text-sm text-muted-foreground">
                Los clientes pueden acceder directamente a través de la página de login con sus credenciales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para mostrar contraseña temporal */}
      {temporaryPassword && (
        <Dialog open={showPassword} onOpenChange={setShowPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cliente Creado Exitosamente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Credenciales del Cliente:</h4>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Email:</strong> {email}</p>
                  <p className="text-sm"><strong>Usuario:</strong> {username}</p>
                  <p className="text-sm"><strong>Contraseña temporal:</strong> 
                    <code className="bg-green-100 px-2 py-1 rounded ml-2">{temporaryPassword}</code>
                  </p>
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>¡Importante!</strong> Comparte estas credenciales de forma segura con el cliente. 
                  Deberá cambiar la contraseña en su primer acceso.
                </p>
              </div>
              
              <Button onClick={() => setShowPassword(false)} className="w-full">
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};