import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Users, FileText, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

export const Sidebar = ({ onNavigate, currentSection }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();

  const handleNavigation = (section: string) => {
    onNavigate(section);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const menuItems = [
    { id: 'registros', label: 'Control de Acceso', icon: FileText },
    { id: 'consulta', label: 'Consultar Registros', icon: FileText },
    { id: 'empleados', label: 'Gestionar Empleados', icon: Users },
    { id: 'agregar-empleado', label: 'Agregar Empleado', icon: Plus }
  ];

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
          {menuItems.map((item) => (
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