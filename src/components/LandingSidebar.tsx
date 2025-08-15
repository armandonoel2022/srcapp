import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, User, Users2, Briefcase, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const LandingSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navigationItems = [
    { id: 'inicio', label: t('nav.home'), icon: Home, href: '#inicio' },
    { id: 'nosotros', label: t('nav.about'), icon: User, href: '#nosotros' },
    { id: 'clientes', label: t('nav.customers'), icon: Users2, href: '#clientes' },
    { id: 'servicios', label: t('nav.services'), icon: Briefcase, href: '#servicios' },
  ];

  const handleNavigation = (href: string) => {
    if (href.startsWith('#')) {
      // First navigate to home page if not already there
      if (window.location.pathname !== '/') {
        navigate('/');
        // Wait a bit for navigation then scroll
        setTimeout(() => {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    setIsOpen(false);
  };

  const handleAccessControl = () => {
    navigate('/auth');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-primary-foreground">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>{t('nav.navigation')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2 mt-6">
          {/* Navigation items */}
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="justify-start"
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
          
          <div className="pt-4 border-t">
            <Button
              variant="default"
              className="justify-start w-full"
              onClick={handleAccessControl}
            >
              <Shield className="mr-2 h-4 w-4" />
              {t('header.accessControl')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};