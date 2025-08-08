import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit } from 'lucide-react';
import { useUserProfiles, UserRole } from '@/hooks/useUserProfiles';

export const GestionUsuarios = () => {
  const { profiles, loading, loadUserProfiles, createUserProfile, updateUserRole, toggleUserActive } = useUserProfiles();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('agente_seguridad');

  // Form state for creating users
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('agente_seguridad');
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    loadUserProfiles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username) return;

    setSubmitting(true);
    const result = await createUserProfile(email, password, username, role);
    setSubmitting(false);

    if (result.success) {
      setEmail('');
      setPassword('');
      setUsername('');
      setRole('agente_seguridad');
      setIsCreateModalOpen(false);
      
      if (result.temporaryPassword) {
        setTempPassword(result.temporaryPassword);
      }
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRole) return;

    const result = await updateUserRole(selectedUser, selectedRole);
    if (result.success) {
      setIsEditModalOpen(false);
      setSelectedUser('');
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'agente_seguridad':
        return 'Agente de Seguridad';
      case 'cliente':
        return 'Cliente';
      default:
        return role;
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    await toggleUserActive(userId, !currentActive);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <CardTitle>Gestión de Usuarios</CardTitle>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email:</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="username">Nombre de Usuario:</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                {role === 'administrador' && (
                  <div>
                    <Label htmlFor="password">Contraseña:</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="role">Rol:</Label>
                  <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="agente_seguridad">Agente de Seguridad</SelectItem>
                          <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {tempPassword && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800">Contraseña Temporal Generada</h4>
              <p className="text-yellow-700">
                Contraseña: <span className="font-mono font-bold">{tempPassword}</span>
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setTempPassword('')}
                className="mt-2"
              >
                Cerrar
              </Button>
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Cambio de Contraseña</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.username}</TableCell>
                      <TableCell>{getRoleName(profile.role)}</TableCell>
                      <TableCell>
                        {profile.active ? (
                          <span className="text-green-600">Activo</span>
                        ) : (
                          <span className="text-red-600">Inactivo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {profile.requires_password_change ? (
                          <span className="text-yellow-600">Requerido</span>
                        ) : (
                          <span className="text-green-600">No requerido</span>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(profile.user_id);
                                setSelectedRole(profile.role);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>Usuario: {profile.username}</Label>
                              </div>
                              
                              <div>
                                <Label htmlFor="new-role">Nuevo Rol:</Label>
                                <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="administrador">Administrador</SelectItem>
                                    <SelectItem value="agente_seguridad">Agente de Seguridad</SelectItem>
                                    <SelectItem value="cliente">Cliente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsEditModalOpen(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button onClick={handleUpdateRole}>
                                  Actualizar Rol
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant={profile.active ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => handleToggleActive(profile.user_id, profile.active)}
                        >
                          {profile.active ? "Deshabilitar" : "Habilitar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};