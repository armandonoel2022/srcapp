import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Users, FileText, Plus, LogOut, Settings, UserPlus, Edit, Trash, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';

interface SidebarProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

export const Sidebar = ({ onNavigate, currentSection }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, isAdmin: authIsAdmin } = useAuth();
  
  console.log('Sidebar Debug - authIsAdmin from useAuth:', authIsAdmin);

  const handleNavigation = (section: string) => {
    onNavigate(section);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const basicItems = [
    { id: 'registros', label: 'Registro de Acceso', icon: FileText },
    { id: 'consulta', label: 'Consultar Registros', icon: Search },
    { id: 'empleados', label: 'Gestión de Empleados', icon: Users }
  ];

  const adminItems = [
    { id: 'usuarios', label: 'Gestionar Usuarios', icon: UserPlus },
    { id: 'editar-registros', label: 'Editar Entradas y Salidas', icon: Edit },
    { id: 'eliminar-empleados', label: 'Eliminar Empleados', icon: Trash }
  ];

  const menuItems = authIsAdmin ? [...basicItems, ...adminItems] : basicItems;
  
  console.log('Sidebar Debug - menuItems length:', menuItems.length);
  console.log('Sidebar Debug - showing admin items:', authIsAdmin);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Menú de Administración</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2 mt-6">
          {/* Basic functionality */}
          {basicItems.map((item) => (
            <Button
              key={item.id}
              variant={currentSection === item.id ? "default" : "ghost"}
              className="justify-start"
              onClick={() => handleNavigation(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
          
          {/* Admin functionality */}
          {authIsAdmin && (
            <>
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Funciones Administrativas</h3>
                {adminItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={currentSection === item.id ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleNavigation(item.id)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </>
          )}
          
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};