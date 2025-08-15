import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LanguageToggle } from '@/components/LanguageToggle';
import { SettingsMenu } from '@/components/SettingsMenu';
import { Menu, Home, Info, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const LandingSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  const handleNavigation = (path: string, hash?: string) => {
    setIsOpen(false);
    if (hash) {
      navigate(path);
      setTimeout(() => {
        const element = document.getElementById(hash);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      {/* Swipe detection area */}
      <div 
        {...handlers}
        className="fixed inset-0 z-0 pointer-events-none md:hidden"
        style={{ pointerEvents: isOpen ? 'none' : 'auto' }}
      />
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header with Logo */}
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
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/', 'inicio')}
              >
                <Home className="mr-3 h-4 w-4" />
                {t('nav.home')}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/', 'nosotros')}
              >
                <Info className="mr-3 h-4 w-4" />
                {t('nav.about')}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/', 'clientes')}
              >
                <Users className="mr-3 h-4 w-4" />
                {t('nav.customers')}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/', 'servicios')}
              >
                 <Info className="mr-3 h-4 w-4" />
                {t('nav.services')}
              </Button>
            </div>
            
            {/* Footer with Settings */}
            <div className="border-t p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate('/auth')}
              >
                <Settings className="mr-3 h-4 w-4" />
                Control de Acceso
              </Button>
              
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium">Configuración</span>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <SettingsMenu />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};