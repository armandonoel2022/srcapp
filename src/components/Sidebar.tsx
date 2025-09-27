import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Users, FileText, Plus, LogOut, Settings as SettingsIcon, UserPlus, Edit, Trash, Search, Home, MapPin, CheckCircle, BarChart3, Camera, UserCheck, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useNavigate } from 'react-router-dom';
import { SettingsMenu } from '@/components/SettingsMenu';

interface SidebarProps {
  onNavigate: (section: string) => void;
  currentSection: string;
  isClient?: boolean;
}

export const Sidebar = ({ onNavigate, currentSection, isClient = false }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, isAdmin: authIsAdmin } = useAuth();
  const navigate = useNavigate();
  
  

  const handleNavigation = (section: string) => {
    onNavigate(section);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const clientItems = [
    { id: 'mapa-calor', label: 'Mapa de Calor', icon: MapPin }
  ];

  // Control de Acceso Diario - Puesto Francia
  const controlAccesoItems = [
    { id: 'registros', label: 'Registro de Acceso', icon: FileText },
    { id: 'consulta', label: 'Consultar Registros', icon: Search },
    { id: 'empleados', label: 'Gestión de Empleados', icon: Users },
    { id: 'editar-registros', label: 'Editar Entradas y Salidas', icon: Edit },
    { id: 'eliminar-empleados', label: 'Eliminar Empleados', icon: Trash }
  ];

  // Sistema de Turnos
  const turnosItems = [
    { id: 'turnos', label: 'Consulta Administrativa de Turnos', icon: CheckCircle },
    { id: 'dashboard-turnos', label: 'Dashboard Turnos', icon: BarChart3 }
  ];

  // Funciones Administrativas
  const adminItems = [
    { id: 'crear-usuario-cliente', label: 'Crear Usuario Cliente', icon: UserPlus },
    { id: 'ubicaciones', label: 'Mapa de Ubicaciones', icon: MapPin },
    { id: 'revisar-fotos', label: 'Revisar Fotos Turnos', icon: Camera }
  ];

  const menuItems = isClient ? clientItems : (authIsAdmin ? [...controlAccesoItems, ...turnosItems, ...adminItems] : [...controlAccesoItems, ...turnosItems]);
  

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isClient ? 'Menú Cliente' : 'Menú de Administración'}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2 mt-6 pb-20">
          {/* Home button */}
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => navigate('/')}
          >
            <Home className="mr-2 h-4 w-4" />
            Ir al Inicio
          </Button>
          
          {/* Menu items based on user role */}
          {isClient ? (
            // Client users only see heat map
            clientItems.map((item) => (
              <Button
                key={item.id}
                variant={currentSection === item.id ? "default" : "ghost"}
                className="justify-start"
                onClick={() => handleNavigation(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))
          ) : (
            <>
              {/* Control de Acceso Diario - Puesto Francia */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Control de Acceso - Residencia Francia</h3>
                {controlAccesoItems.map((item) => (
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
              
              {/* Sistema de Turnos */}
              <div className="pt-4 border-t space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Sistema de Turnos</h3>
                {turnosItems.map((item) => (
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
              
              {/* Funciones Administrativas */}
              {authIsAdmin && (
                <div className="pt-4 border-t space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Funciones Administrativas</h3>
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
              )}
            </>
          )}
          
          {/* Configuration section is now handled in SettingsMenu */}
           
          <div className="pt-4 border-t space-y-2 sticky bottom-0 bg-background">
            <div className="px-2">
              <SettingsMenu />
            </div>
            <Button
              variant="ghost"
              className="justify-start text-destructive hover:text-destructive w-full"
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