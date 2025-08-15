import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AnimatedMenuButton } from '@/components/AnimatedMenuButton';
import { 
  Home, 
  FileText, 
  Search, 
  Users, 
  UserCheck,
  Edit,
  UserMinus,
  BarChart3,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MobileNavigationProps {
  onNavigate: (section: string) => void;
  currentSection: string;
  isClient?: boolean;
}

export const MobileNavigation = ({ onNavigate, currentSection, isClient }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, user } = useAuth();
  
  // Check if user is admin based on role or type
  const isAdmin = user?.role === 'admin' || user?.type === 'admin';
  const { toast } = useToast();

  const handleSwipeRight = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handlers = useSwipeable({
    onSwipedRight: handleSwipeRight,
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50
  });

  const handleNavigation = (section: string) => {
    onNavigate(section);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cerrar sesión",
        variant: "destructive"
      });
    }
  };

  const clientItems = [
    { label: "Registro", section: "registros", icon: FileText },
    { label: "Consultar Horas", section: "consulta", icon: Search },
    { label: "Mapa de Calor", section: "mapa-calor", icon: BarChart3 }
  ];

  const basicItems = [
    { label: "Registro", section: "registros", icon: FileText },
    { label: "Consultar Horas", section: "consulta", icon: Search },
    { label: "Empleados", section: "empleados", icon: Users }
  ];

  const adminItems = [
    { label: "Registro", section: "registros", icon: FileText },
    { label: "Consultar Horas", section: "consulta", icon: Search },
    { label: "Empleados", section: "empleados", icon: Users },
    { label: "Usuarios", section: "usuarios", icon: UserCheck },
    { label: "Editar Registros", section: "editar-registros", icon: Edit },
    { label: "Eliminar Empleados", section: "eliminar-empleados", icon: UserMinus },
    { label: "Mapa de Calor", section: "mapa-calor", icon: BarChart3 }
  ];

  const menuItems = isClient 
    ? clientItems 
    : isAdmin 
      ? adminItems 
      : basicItems;

  return (
    <>
      {/* Swipe detection area */}
      <div 
        {...handlers}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      />
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <div className="fixed top-4 left-4 z-50">
            <AnimatedMenuButton 
              onClick={() => setIsOpen(true)} 
              isOpen={isOpen}
            />
          </div>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header with SRC Logo */}
            <div className="p-6 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-3">
                <img 
                  src="/src/assets/src-logo.png" 
                  alt="SRC Logo" 
                  className="h-8 w-8 object-contain"
                />
                <h2 className="text-lg font-semibold">SRC</h2>
              </div>
            </div>
            
            {/* Navigation Items */}
            <div className="flex-1 p-4 space-y-2">
              <Button
                variant={currentSection === 'home' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handleNavigation('home')}
              >
                <Home className="mr-3 h-4 w-4" />
                Inicio
              </Button>
              
              {menuItems.map((item) => (
                <Button
                  key={item.section}
                  variant={currentSection === item.section ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.section)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
            
            {/* Footer with Logout only */}
            <div className="border-t p-4 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};